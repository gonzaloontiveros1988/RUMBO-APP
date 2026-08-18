/* Service worker de ONTIS — cachea la app entera (es un solo archivo) para que abra al instante
   y funcione sin conexión, incluso recién instalada desde el icono de pantalla de inicio.
   Estrategia: "stale-while-revalidate" — sirve la copia en caché al momento, y en paralelo
   pide la versión nueva por red para tenerla lista la próxima vez que se abra.
   Si cambias algo importante en index.html y quieres forzar que los dispositivos cojan la
   versión nueva más rápido, sube el número de CACHE_NAME (v1 -> v2, etc). */
const CACHE_NAME = 'ontis-cache-v24';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
