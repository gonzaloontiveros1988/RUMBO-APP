/* RUMBO HealthKit web bridge. Active only inside the signed iOS container. */
(function(){
  const CHANNEL="rumboHealthKit";
  const pending=new Map();
  let seq=0;
  function nativeAvailable(){return !!(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers[CHANNEL]);}
  function send(action,payload={}){
    if(!nativeAvailable()) return Promise.reject(new Error("HealthKit requiere la versión iOS nativa de RUMBO."));
    const id="hk-"+(++seq);
    return new Promise((resolve,reject)=>{
      pending.set(id,{resolve,reject});
      window.webkit.messageHandlers[CHANNEL].postMessage({id,action,...payload});
      setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error("La operación de Salud ha superado el tiempo de espera."));}},30000);
    });
  }
  window.RumboHealthKit={
    isAvailable: nativeAvailable,
    requestAuthorization: ()=>send("requestAuthorization"),
    readDailySummary: (days=7)=>send("readDailySummary",{days}),
    handleResponse: result=>{
      const item=pending.get(result&&result.id); if(!item)return;
      pending.delete(result.id);
      result.error?item.reject(new Error(result.error)):item.resolve(result.data);
    }
  };
  function mount(){
    const view=document.getElementById("view");
    if(!view)return;
    const callout=[...view.querySelectorAll(".callout")].find(el=>el.textContent.includes("Apple Health"));
    if(!callout||callout.dataset.healthkitMounted)return;
    callout.dataset.healthkitMounted="true";
    callout.innerHTML='<b>APPLE HEALTH · HEALTHKIT</b><p id="rumboHealthStatus">La conexión nativa todavía no está instalada en este dispositivo.</p><div class="form"><button class="btn primary" id="rumboHealthConnect" type="button">Connect Apple Health</button><button class="btn ghost" id="rumboHealthRefresh" type="button">Refresh data</button></div><div id="rumboHealthSummary" class="muted" aria-live="polite"></div><p class="muted">Solo se leerán los datos que autorices en iOS. Los datos se mostrarán en RUMBO; no se enviarán a la nube en esta fase.</p>';
    const status=document.getElementById("rumboHealthStatus"),summary=document.getElementById("rumboHealthSummary");
    async function run(action){
      try{
        if(!nativeAvailable()){status.textContent="RUMBO está abierto como web/PWA. Para HealthKit necesitaremos instalar la versión iOS nativa.";return;}
        status.textContent=action==="connect"?"Solicitando permisos de Apple…":"Leyendo datos autorizados…";
        if(action==="connect") await window.RumboHealthKit.requestAuthorization();
        const data=await window.RumboHealthKit.readDailySummary(7);
        status.textContent="Conectado · última lectura "+new Date().toLocaleString();
        summary.innerHTML=(data||[]).map(d=>'<div class="row"><span><b>'+d.date+'</b><small>Steps · '+(d.steps??"—")+' · Sleep · '+(d.sleepHours??"—")+' h</small></span><b>'+(d.activeEnergyKcal??"—")+' kcal</b></div>').join("")||"No hay muestras disponibles para el periodo seleccionado.";
      }catch(error){status.textContent=error.message||"No se pudo leer Apple Health.";}
    }
    document.getElementById("rumboHealthConnect").addEventListener("click",()=>run("connect"));
    document.getElementById("rumboHealthRefresh").addEventListener("click",()=>run("refresh"));
  }
  const observer=new MutationObserver(mount);
  document.addEventListener("DOMContentLoaded",()=>{const view=document.getElementById("view");if(view)observer.observe(view,{childList:true,subtree:true});mount();});
  mount();
})();