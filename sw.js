/* RUMBO root cache migration: remove the legacy single-file shell and let the new app own its cache. */
const CACHE_NAME="rumbo-root-migration-v39";
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
 await self.registration.unregister();
 await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});