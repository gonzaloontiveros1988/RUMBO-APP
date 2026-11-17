/* RUMBO HealthKit bridge + Lifestyle dashboard.
   Health records stay on this device; no network upload is performed here. */
(function(){
  const CHANNEL="rumboHealthKit";
  const CACHE_KEY="rumbo_healthkit_daily_v1";
  const pending=new Map();
  let seq=0;

  function nativeAvailable(){
    return !!(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers[CHANNEL]);
  }
  function send(action,payload={}){
    if(!nativeAvailable()) return Promise.reject(new Error("Apple Health solo está disponible en la aplicación iOS nativa de RUMBO."));
    const id="hk-"+(++seq);
    return new Promise((resolve,reject)=>{
      pending.set(id,{resolve,reject});
      window.webkit.messageHandlers[CHANNEL].postMessage({id,action,...payload});
      setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error("Apple Health ha tardado demasiado en responder. Inténtalo de nuevo."));}},30000);
    });
  }
  window.RumboHealthKit={
    isAvailable:nativeAvailable,
    requestAuthorization:()=>send("requestAuthorization"),
    readDailySummary:(days=7)=>send("readDailySummary",{days}),
    handleResponse:result=>{
      const item=pending.get(result&&result.id);if(!item)return;
      pending.delete(result.id);
      result.error?item.reject(new Error(result.error)):item.resolve(result.data);
    }
  };

  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const number=(value,digits=0)=>Number.isFinite(Number(value))?Number(value).toLocaleString(undefined,{maximumFractionDigits:digits}):"—";
  const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
  function loadCache(){try{const v=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");return Array.isArray(v)?v:[]}catch{return[]}}
  function saveCache(rows){try{localStorage.setItem(CACHE_KEY,JSON.stringify(rows))}catch{}}
  function rowMarkup(d){
    const label=esc(d.date||"");
    return '<div class="row"><span><b>'+label+'</b><small>Steps · '+number(d.steps)+' · Distance · '+(d.distanceMeters==null?"—":number(d.distanceMeters/1000,2)+" km")+'</small></span><b>'+number(d.activeEnergyKcal)+' kcal</b></div>';
  }
  function dashboardMarkup(rows){
    const current=rows.find(x=>x.date===today())||{};
    const last=rows.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,7);
    return '<div class="grid three" style="margin:10px 0">'+
      '<div class="stat-card"><div class="stat-label">STEPS TODAY</div><div class="stat">'+number(current.steps)+'</div></div>'+
      '<div class="stat-card"><div class="stat-label">ACTIVE ENERGY</div><div class="stat">'+number(current.activeEnergyKcal)+' <small>kcal</small></div></div>'+
      '<div class="stat-card"><div class="stat-label">WALK / RUN</div><div class="stat">'+(current.distanceMeters==null?"—":number(current.distanceMeters/1000,2))+' <small>km</small></div></div></div>'+
      '<div class="kicker" style="margin:12px 0 6px">LAST 7 DAYS · APPLE HEALTH</div>'+
      (last.length?last.map(rowMarkup).join(""):'<div class="empty">No hay muestras disponibles. Conecta Apple Health y vuelve a actualizar.</div>')+
      '<p class="muted" style="margin-top:8px">Datos leídos de Apple Health en este dispositivo. La ausencia de una cifra no demuestra que hayas denegado el permiso: iOS no revela el estado del permiso de lectura.</p>';
  }
  function mount(){
    const view=document.getElementById("view");if(!view)return;
    const panel=document.getElementById("rumboAppleHealthPanel")||
      [...view.querySelectorAll(".callout")].find(el=>el.textContent.includes("APPLE HEALTH"));
    if(!panel||panel.dataset.healthkitMounted)return;
    panel.dataset.healthkitMounted="true";
    panel.innerHTML='<b>APPLE HEALTH · HEALTHKIT</b>'+
      '<p id="rumboHealthStatus">Comprobando disponibilidad de la conexión nativa…</p>'+
      '<div class="form"><button class="btn primary" id="rumboHealthConnect" type="button">Connect Apple Health</button>'+
      '<button class="btn ghost" id="rumboHealthRefresh" type="button">Refresh data</button></div>'+
      '<div id="rumboHealthSummary" aria-live="polite"></div>'+
      '<p class="muted">Los registros se conservan localmente en este dispositivo. No se envían a Supabase ni a servicios de IA.</p>';
    const status=document.getElementById("rumboHealthStatus");
    const summary=document.getElementById("rumboHealthSummary");
    const connect=document.getElementById("rumboHealthConnect");
    const refresh=document.getElementById("rumboHealthRefresh");
    const cached=loadCache();
    if(cached.length)summary.innerHTML=dashboardMarkup(cached);
    if(!nativeAvailable()){
      status.textContent="Modo web/PWA: puedes consultar el panel, pero la lectura de Apple Health requiere abrir RUMBO como aplicación iOS nativa.";
      connect.disabled=true;refresh.disabled=true;
      return;
    }
    status.textContent=cached.length?"Última lectura guardada en este dispositivo.":"Aplicación iOS lista. Conecta Apple Health para solicitar permisos.";
    async function run(action){
      connect.disabled=true;refresh.disabled=true;
      try{
        if(action==="connect"){
          status.textContent="Solicitando autorización de Apple Health…";
          await window.RumboHealthKit.requestAuthorization();
        }
        status.textContent="Leyendo actividad autorizada…";
        const rows=await window.RumboHealthKit.readDailySummary(7);
        const safeRows=Array.isArray(rows)?rows.filter(x=>x&&/^\\d{4}-\\d{2}-\\d{2}$/.test(String(x.date||""))):[];
        saveCache(safeRows);
        summary.innerHTML=dashboardMarkup(safeRows);
        status.textContent="Lectura completada · "+new Date().toLocaleString()+". iOS no informa si se ha concedido acceso de lectura; solo se muestran muestras disponibles.";
      }catch(error){
        status.textContent=error.message||"No se pudieron leer los datos de Apple Health.";
      }finally{
        connect.disabled=false;refresh.disabled=false;
      }
    }
    connect.addEventListener("click",()=>run("connect"));
    refresh.addEventListener("click",()=>run("refresh"));
  }
  function observe(){
    const view=document.getElementById("view");
    if(view&&!view.dataset.healthkitObserver){
      view.dataset.healthkitObserver="true";
      new MutationObserver(mount).observe(view,{childList:true,subtree:true});
    }
    mount();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});
  else observe();
})();
