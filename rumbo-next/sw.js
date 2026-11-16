const CACHE="rumbo-next-shell-v80";
const CORE=["./","./index.html","./app.css","./app.js","./roster-import.js","./qatar-pdf-import.js","./monthly-planner.js","./flight-intelligence.js","./wader-import.js","./reminders.js","./training-intelligence.js","./fitness-engine.js","./personal-fitness.js","./nutrition-engine.js","./health-import.js","./local-assistant.js","./crew-bidding.js","./cloud-sync.js","./flight-map.js","./life-intelligence.js","./city-scenes.js","./manifest.webmanifest"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(async cache=>{for(const path of CORE){try{await cache.add(new Request(path,{cache:"reload"}))}catch(error){console.warn("RUMBO cache skipped",path,error)}}}).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("rumbo-next-shell-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("message",event=>{if(event.data==="RUMBO_SKIP_WAITING")self.skipWaiting()});
async function cached(request){
 const exact=await caches.match(request);
 if(exact)return exact;
 return caches.match(request,{ignoreSearch:true});
}
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 const isAppAsset=/\.(?:html|js|css|webmanifest)$/.test(url.pathname);
 if(isAppAsset){
  event.respondWith(fetch(new Request(request,{cache:"no-store"})).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>cached(request).then(hit=>hit||cached("./index.html"))));
  return;
 }
 event.respondWith(cached(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response}).catch(()=>hit||cached("./index.html"))));
});
