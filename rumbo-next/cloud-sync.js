import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.0";

const SUPABASE_URL = "https://nptghdnbdzvrvgdiaxzn.supabase.co";
const SUPABASE_KEY = "sb_publishable_FiZ3-rmiX4ofRALNlqv-sg_i90ss6j5";
const LOCAL_TIME_KEY = "rumbo_cloud_local_updated_at";
const DEVICE_KEY = "rumbo_cloud_device_id";
const STATE_TABLE = "rumbo_user_state";

const deviceId = (() => {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
})();

const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

let currentUser = null;
let timer = null;
let channel = null;
let callbacks = {};
let syncing = false;
let lastRemoteUpdatedAt = 0;

const $ = (id) => document.getElementById(id);
const setStatus = (message, mode = "local") => {
  const label = $("rumboCloudLabel");
  const dot = $("rumboCloudDot");
  if (label) label.textContent = message;
  if (dot) dot.dataset.mode = mode;
  callbacks.onStatus?.({ message, mode, user: currentUser });
};

function mountCloudUI() {
  if ($("rumboCloudControl")) return;
  const host = document.querySelector(".top-actions");
  if (!host) return;
  const control = document.createElement("div");
  control.id = "rumboCloudControl";
  control.className = "rumbo-cloud-control";
  control.innerHTML = `
    <button type="button" class="rumbo-cloud-trigger" id="rumboCloudTrigger" aria-expanded="false">
      <span class="rumbo-cloud-dot" id="rumboCloudDot" data-mode="local"></span>
      <span id="rumboCloudLabel">Solo en este dispositivo</span>
      <span aria-hidden="true">⌄</span>
    </button>
    <section class="rumbo-cloud-panel" id="rumboCloudPanel" hidden>
      <div class="kicker">RUMBO CLOUD SYNC</div>
      <strong id="rumboCloudHeading">Tus datos, en todos tus dispositivos</strong>
      <p id="rumboCloudMessage">Inicia sesión para sincronizar tu información de forma privada.</p>
      <label>Email<input id="rumboCloudEmail" type="email" autocomplete="email" placeholder="tu@email.com"></label>
      <label>Contraseña<input id="rumboCloudPassword" type="password" autocomplete="current-password" minlength="8" placeholder="Mínimo 8 caracteres"></label>
      <div class="rumbo-cloud-actions">
        <button class="btn primary" id="rumboCloudSignIn" type="button">Iniciar sesión</button>
        <button class="btn ghost" id="rumboCloudSignUp" type="button">Crear cuenta</button>
      </div>
      <button class="btn ghost" id="rumboCloudSignOut" type="button" hidden>Cerrar sesión</button>
      <small id="rumboCloudFootnote">Los datos locales no se borran al cerrar sesión.</small>
    </section>`;
  host.append(control);
  $("rumboCloudTrigger").addEventListener("click", () => {
    const panel = $("rumboCloudPanel");
    panel.hidden = !panel.hidden;
    $("rumboCloudTrigger").setAttribute("aria-expanded", String(!panel.hidden));
  });
  $("rumboCloudSignIn").addEventListener("click", signIn);
  $("rumboCloudSignUp").addEventListener("click", signUp);
  $("rumboCloudSignOut").addEventListener("click", async () => {
    await client.auth.signOut();
    currentUser = null;
    if (channel) await client.removeChannel(channel);
    channel = null;
    setStatus("Solo en este dispositivo", "local");
    setAuthUI(false);
  });
  $("rumboCloudPassword").addEventListener("keydown", (event) => {
    if (event.key === "Enter") signIn();
  });
}

function setAuthUI(signedIn) {
  $("rumboCloudSignIn").hidden = signedIn;
  $("rumboCloudSignUp").hidden = signedIn;
  $("rumboCloudSignOut").hidden = !signedIn;
  $("rumboCloudEmail").hidden = signedIn;
  $("rumboCloudPassword").hidden = signedIn;
  $("rumboCloudHeading").textContent = signedIn ? "Cuenta conectada" : "Tus datos, en todos tus dispositivos";
  $("rumboCloudMessage").textContent = signedIn
    ? "Cuenta: " + (currentUser?.email || "sesión activa")
    : "Inicia sesión para sincronizar tu información de forma privada.";
}

async function signIn() {
  const email = $("rumboCloudEmail").value.trim();
  const password = $("rumboCloudPassword").value;
  if (!email || !password) return setStatus("Introduce email y contraseña", "error");
  setStatus("Conectando…", "syncing");
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return setStatus(error.message, "error");
  currentUser = data.user;
  await synchronize();
}

async function signUp() {
  const email = $("rumboCloudEmail").value.trim();
  const password = $("rumboCloudPassword").value;
  if (!email || password.length < 8) return setStatus("Usa un email y contraseña de 8 caracteres o más", "error");
  setStatus("Creando cuenta…", "syncing");
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) return setStatus(error.message, "error");
  if (!data.session) {
    setStatus("Revisa tu correo para confirmar la cuenta", "waiting");
    $("rumboCloudMessage").textContent = "Te hemos enviado un enlace de confirmación. Después vuelve aquí e inicia sesión.";
    return;
  }
  currentUser = data.user;
  await synchronize();
}

async function synchronize() {
  if (!currentUser || syncing) return;
  syncing = true;
  setStatus("Sincronizando…", "syncing");
  try {
    const { data: remote, error } = await client.from(STATE_TABLE)
      .select("state, updated_at, device_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (error) throw error;

    let localTime = Number(localStorage.getItem(LOCAL_TIME_KEY) || 0);
    const localState = callbacks.getLocalState?.() || {};
    const hasLocalContent = callbacks.hasLocalContent?.() ??
      Object.values(localState).some(value => Array.isArray(value) ? value.length > 0 : value && typeof value === "object" ? Object.keys(value).length > 0 : false);
    if (!localTime && hasLocalContent) {
      localTime = Date.now();
      localStorage.setItem(LOCAL_TIME_KEY, String(localTime));
    }
    const remoteTime = remote?.updated_at ? Date.parse(remote.updated_at) : 0;
    lastRemoteUpdatedAt = remoteTime;

    if (remote?.state && remoteTime > localTime) {
      callbacks.onRemoteState?.(remote.state, { updatedAt: remote.updated_at });
      localStorage.setItem(LOCAL_TIME_KEY, String(remoteTime));
    } else {
      await pushState(callbacks.getLocalState?.() || {});
    }

    setAuthUI(true);
    setStatus("Sincronizado · " + (currentUser.email || "cuenta"), "online");
    subscribe();
  } catch (error) {
    console.error("RUMBO cloud sync:", error);
    setStatus("Error de sincronización: " + (error.message || "inténtalo de nuevo"), "error");
  } finally {
    syncing = false;
  }
}

async function pushState(state) {
  if (!currentUser) return;
  const updatedAt = new Date().toISOString();
  const { error } = await client.from(STATE_TABLE).upsert({
    user_id: currentUser.id,
    state,
    schema_version: 1,
    device_id: deviceId,
    updated_at: updatedAt
  }, { onConflict: "user_id" });
  if (error) throw error;
  const timestamp = Date.parse(updatedAt);
  localStorage.setItem(LOCAL_TIME_KEY, String(timestamp));
  lastRemoteUpdatedAt = timestamp;
  setStatus("Sincronizado · " + (currentUser.email || "cuenta"), "online");
}

function schedule(state) {
  if (!currentUser) return;
  localStorage.setItem(LOCAL_TIME_KEY, String(Date.now()));
  clearTimeout(timer);
  timer = setTimeout(() => pushState(state).catch((error) => {
    console.error("RUMBO cloud save:", error);
    setStatus("No se pudo guardar en la nube", "error");
  }), 900);
}

function subscribe() {
  if (!currentUser) return;
  if (channel) client.removeChannel(channel);
  channel = client.channel("rumbo-state-" + currentUser.id)
    .on("postgres_changes", {
      event: "*", schema: "public", table: STATE_TABLE,
      filter: "user_id=eq." + currentUser.id
    }, (payload) => {
      const row = payload.new;
      const remoteTime = Date.parse(row.updated_at || "");
      if (row.device_id === deviceId || !row.state || remoteTime <= lastRemoteUpdatedAt) return;
      lastRemoteUpdatedAt = remoteTime;
      callbacks.onRemoteState?.(row.state, { updatedAt: row.updated_at });
      localStorage.setItem(LOCAL_TIME_KEY, String(remoteTime));
      setStatus("Actualizado desde otro dispositivo", "online");
    })
    .subscribe();
}

export function initRumboCloudSync(options = {}) {
  callbacks = options;
  mountCloudUI();
  client.auth.getSession().then(({ data, error }) => {
    if (error) return setStatus("No se pudo recuperar la sesión", "error");
    currentUser = data.session?.user || null;
    if (currentUser) synchronize();
    else setStatus("Solo en este dispositivo", "local");
  });
  client.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    if (currentUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) queueMicrotask(() => synchronize());
    else if (!currentUser && event === "SIGNED_OUT") setStatus("Solo en este dispositivo", "local");
  });
  window.addEventListener("online", () => {
    if (currentUser) synchronize();
    else setStatus("Conexión recuperada · solo local", "local");
  });
  window.addEventListener("offline", () => setStatus("Sin conexión · cambios locales pendientes", "waiting"));
  return { schedule, synchronize, getUser: () => currentUser };
}
