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
    const sleep=d.sleepHours==null?"—":number(d.sleepHours,1)+" h";
    const heart=d.heartRateBpm==null?"—":number(d.heartRateBpm)+" bpm";
    const hrv=d.hrvSdnnMs==null?"—":number(d.hrvSdnnMs)+" ms";
    return '<div class="row"><span><b>'+esc(d.date||"")+'</b><small>Steps '+number(d.steps)+' · '+(d.distanceMeters==null?"—":number(d.distanceMeters/1000,2)+" km")+' · Sleep '+sleep+'</small></span><span><b>'+number(d.activeEnergyKcal)+' kcal</b><small>HR '+heart+' · HRV '+hrv+'</small></span></div>';
  }
  function recoveryEstimate(rows){
    const valid=rows.filter(x=>Number.isFinite(x.sleepHours)&&Number.isFinite(x.hrvSdnnMs)&&Number.isFinite(x.restingHeartRateBpm));
    if(valid.length<14)return {score:null,reason:"Necesitamos al menos 14 días con sueño, HRV y pulso en reposo para establecer una referencia personal."};
    const sorted=valid.slice().sort((a,b)=>a.date.localeCompare(b.date));
    const latest=sorted[sorted.length-1],baseline=sorted.slice(-14,-1);
    const avg=key=>baseline.reduce((sum,x)=>sum+x[key],0)/baseline.length;
    const sleepScore=Math.max(0,Math.min(100,(latest.sleepHours/8)*100));
    const hrvScore=Math.max(0,Math.min(100,100+(latest.hrvSdnnMs/Math.max(1,avg("hrvSdnnMs"))-1)*100));
    const rhrScore=Math.max(0,Math.min(100,100-(latest.restingHeartRateBpm-avg("restingHeartRateBpm"))*8));
    return {score:Math.round(sleepScore*.4+hrvScore*.3+rhrScore*.3),reason:"Estimación orientativa: sueño 40%, HRV 30% y pulso en reposo 30%, comparados con tu referencia. No es una medida médica."};
  }
  function dashboardMarkup(rows,workouts=[]){
    const current=rows.find(x=>x.date===today())||{};
    const last=rows.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,7);
    const metric=(label,value)=>'<section class="panel"><div class="stat-label">'+label+'</div><div class="stat">'+value+'</div></section>';
    const sleep=current.sleepHours==null?"—":number(current.sleepHours,1)+" h";
    const heart=current.heartRateBpm==null?"—":number(current.heartRateBpm)+" bpm";
    const resting=current.restingHeartRateBpm==null?"—":number(current.restingHeartRateBpm)+" bpm";
    const hrv=current.hrvSdnnMs==null?"—":number(current.hrvSdnnMs)+" ms";
    const recovery=recoveryEstimate(rows);
    const workoutRows=workouts.slice(0,8).map(w=>'<div class="row"><span><b>'+esc(w.activity||"Workout")+'</b><small>'+esc(w.date||"")+' · '+number(w.durationMinutes)+' min · '+esc(w.source||"")+'</small></span><b>'+(w.activeEnergyKcal==null?"—":number(w.activeEnergyKcal)+" kcal")+'</b></div>').join("");
    return '<div class="grid three" style="margin:10px 0">'+
      metric("STEPS TODAY",number(current.steps))+metric("ACTIVE ENERGY",number(current.activeEnergyKcal)+" kcal")+
      metric("WALK / RUN",current.distanceMeters==null?"—":number(current.distanceMeters/1000,2)+" km")+
      metric("SLEEP",sleep)+metric("AVERAGE HEART RATE",heart)+metric("RESTING HEART RATE",resting)+'</div>'+
      '<div class="grid two">'+metric("HRV · SDNN",hrv)+metric("WORKOUTS · 30 DAYS",workouts.length)+'</div>'+
      '<section class="panel" style="margin-top:10px"><div class="stat-label">RECOVERY TREND · EXPERIMENTAL</div><div class="stat">'+(recovery.score==null?"Building baseline":recovery.score+"/100")+'</div><p class="muted">'+esc(recovery.reason)+'</p></section>'+
      '<div class="kicker" style="margin:12px 0 6px">LAST 7 DAYS · APPLE HEALTH</div>'+
      (last.length?last.map(rowMarkup).join(""):'<div class="empty">No hay muestras disponibles. Conecta Apple Health y vuelve a actualizar.</div>')+
      '<div class="kicker" style="margin:16px 0 6px">RECENT WORKOUTS</div>'+
      (workoutRows||'<div class="empty">No hay entrenamientos registrados en Apple Health en este periodo.</div>')+
      '<p class="muted" style="margin-top:8px">Son resúmenes de muestras disponibles, no diagnósticos ni puntuaciones médicas. iOS no revela el estado del permiso de lectura.</p>';
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
    if(cached.length){let cachedWorkouts=[];try{cachedWorkouts=JSON.parse(localStorage.getItem(CACHE_KEY+"_workouts")||"[]")}catch{}summary.innerHTML=dashboardMarkup(cached,cachedWorkouts)}
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
        const result=await window.RumboHealthKit.readDailySummary(30);
        const safeRows=Array.isArray(result?.days)?result.days.filter(x=>x&&/^\\d{4}-\\d{2}-\\d{2}$/.test(String(x.date||""))):[];
        const workouts=Array.isArray(result?.workouts)?result.workouts:[];
        saveCache(safeRows);
        try{localStorage.setItem(CACHE_KEY+"_workouts",JSON.stringify(workouts))}catch{}
        summary.innerHTML=dashboardMarkup(safeRows,workouts);
        status.textContent="Lectura completada · "+new Date().toLocaleString()+". iOS no informa si se ha concedido acceso de lectura; solo se muestran muestras disponibles.";
      }catch(error){
        status.textContent=error.message||"No se pudieron leer los datos de Apple Health.";
      }finally{
        connect.disabled=false;refresh.disabled=false;
      }
    }
    connect.addEventListener("click",()=>run("connect"));
    refresh.addEventListener("click",()=>run("refresh"));
    window.addEventListener("rumbo-healthkit-updated",()=>run("refresh"));
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
