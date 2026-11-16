// Lazy cloud client: local features must start even when offline.
let client=null;
async function getClient(){
 if(client)return client;
 if(!navigator.onLine)throw new Error("Sin conexión: sincronización pendiente.");
 const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2.105.0");
 client=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return client;
}

const SUPABASE_URL = "https://nptghdnbdzvrvgdiaxzn.supabase.co";
const SUPABASE_KEY = "sb_publishable_FiZ3-rmiX4ofRALNlqv-sg_i90ss6j5";
const LOCAL_TIME_KEY = "rumbo_cloud_local_updated_at";
const DEVICE_KEY = "rumbo_cloud_device_id";
const STATE_TABLE = "rumbo_user_state";

const deviceId = (() => {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() || ("rumbo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2));
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
})();



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
  $("rumboCloudSignOut").addEventListener("click", signOut);
  $("rumboCloudPassword").addEventListener("keydown", (event) => {
    if (event.key === "Enter") signIn();
  });
}

function setAuthUI(signedIn) {
  const signInButton = $("rumboCloudSignIn"), signUpButton = $("rumboCloudSignUp");
  const signOutButton = $("rumboCloudSignOut"), emailInput = $("rumboCloudEmail");
  const passwordInput = $("rumboCloudPassword"), heading = $("rumboCloudHeading");
  const message = $("rumboCloudMessage");
  if (!signInButton || !signUpButton || !signOutButton || !emailInput || !passwordInput || !heading || !message) return;
  signInButton.hidden = signedIn;
  signUpButton.hidden = signedIn;
  signOutButton.hidden = !signedIn;
  emailInput.hidden = signedIn;
  passwordInput.hidden = signedIn;
  heading.textContent = signedIn ? "Cuenta conectada" : "Tus datos, en todos tus dispositivos";
  message.textContent = signedIn
    ? "Cuenta: " + (currentUser?.email || "sesión activa")
    : "Inicia sesión para sincronizar tu información de forma privada.";
}

async function signIn() {
  const email = $("rumboCloudEmail")?.value.trim() || "";
  const password = $("rumboCloudPassword")?.value || "";
  if (!email || !password) return setStatus("Introduce email y contraseña", "error");
  setStatus("Conectando…", "syncing");
  try {
    const { data, error } = await (await getClient()).auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    await synchronize();
  } catch (error) {
    setStatus(error?.message || "No se pudo iniciar sesión", "error");
  }
}
async function signOut() {
  clearTimeout(timer);
  try {
    const { error } = await (await getClient()).auth.signOut();
    if (error) throw error;
  } catch (error) {
    setStatus(error?.message || "No se pudo cerrar la sesión", "error");
    return;
  }
  currentUser = null;
  if (channel) await client?.removeChannel(channel);
  channel = null;
  lastRemoteUpdatedAt = 0;
  setStatus("Solo en este dispositivo", "local");
  setAuthUI(false);
}

async function signUp() {
  const email = $("rumboCloudEmail")?.value.trim() || "";
  const password = $("rumboCloudPassword")?.value || "";
  if (!email || password.length < 8) return setStatus("Usa un email y contraseña de 8 caracteres o más", "error");
  setStatus("Creando cuenta…", "syncing");
  try {
    const { data, error } = await (await getClient()).auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session) {
      setStatus("Revisa tu correo para confirmar la cuenta", "waiting");
      const message = $("rumboCloudMessage");
      if (message) message.textContent = "Te hemos enviado un enlace de confirmación. Después vuelve aquí e inicia sesión.";
      return;
    }
    currentUser = data.user;
    await synchronize();
  } catch (error) {
    setStatus(error?.message || "No se pudo crear la cuenta", "error");
  }
}

async function synchronize() {
  if (!currentUser || syncing) return;
  syncing = true;
  setStatus("Sincronizando…", "syncing");
  try {
    const { data: remote, error } = await (await getClient()).from(STATE_TABLE)
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
  timer = setTimeout(() => pushState(callbacks.getLocalState?.() || state || {}).catch((error) => {
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
      const localTime = Number(localStorage.getItem(LOCAL_TIME_KEY) || 0);
      if (row.device_id === deviceId || !row.state || remoteTime <= lastRemoteUpdatedAt) return;
      if (localTime > remoteTime) {
        schedule(callbacks.getLocalState?.() || {});
        return;
      }
      lastRemoteUpdatedAt = remoteTime;
      callbacks.onRemoteState?.(row.state, { updatedAt: row.updated_at });
      localStorage.setItem(LOCAL_TIME_KEY, String(remoteTime));
      setStatus("Actualizado desde otro dispositivo", "online");
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") setStatus("Sincronizado · " + (currentUser?.email || "cuenta"), "online");
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setStatus("Conexión en tiempo real interrumpida · reintentando", "waiting");
    });
}

export function initRumboCloudSync(options = {}) {
  callbacks = options;
  mountCloudUI();
  // Cloud authentication is optional for local-first startup.
  getClient().then(async c=>{
    const {data,error}=await c.auth.getSession();
    if(error)throw error;
    currentUser=data.session?.user||null;
    if(currentUser)await synchronize();else setStatus("Solo en este dispositivo","local");
    c.auth.onAuthStateChange((event,session)=>{
    currentUser = session?.user || null;
    if (currentUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) queueMicrotask(() => synchronize());
    else if (!currentUser && event === "SIGNED_OUT") {
      clearTimeout(timer);
      if (channel) client.removeChannel(channel);
      channel = null;
      lastRemoteUpdatedAt = 0;
      setStatus("Solo en este dispositivo", "local");
      setAuthUI(false);
    }
    });
  }).catch(error=>{
    console.info("RUMBO local-first; cloud sync unavailable:",error?.message||error);
    setStatus(navigator.onLine?"Solo en este dispositivo · nube no disponible":"Sin conexión · cambios guardados localmente","local");
    setAuthUI(false);
  });
  window.addEventListener("online",()=>{
    getClient().then(c=>c.auth.getSession()).then(({data})=>{
      currentUser=data.session?.user||null;
      if(currentUser)synchronize();else setStatus("Conexión recuperada · solo local","local");
    }).catch(()=>setStatus("Local · sincronización pendiente","waiting"));
  });
  window.addEventListener("offline", () => setStatus("Sin conexión · cambios locales pendientes", "waiting"));
  return {
    schedule,
    synchronize,
    getUser: () => currentUser,
    getAccessToken: async () => {
      const { data, error } = await (await getClient()).auth.getSession();
      if (error) throw error;
      return data.session?.access_token || null;
    }
  };
}
