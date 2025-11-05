// =========================================================
// SERVICE WORKER - CACHE DE ARCHIVOS PARA MODO OFFLINE
// =========================================================

const CACHE_NAME = "tareas-lpa-v1";
const urlsToCache = [
  "index.html",
  "dashboard.html",
  "manifest.json",
  "assets/styles.css",
  "assets/icon.png",
  "assets/favicon.ico",
  "js/dashboard.js",
  "script.js"
];

// Instalar SW y cachear archivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  console.log("Service Worker instalado ✅");
});

// Activar SW
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Cache antigua eliminada 🧹");
            return caches.delete(cache);
          }
        })
      )
    )
  );
});

// Interceptar peticiones y servir desde cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si existe en cache → servirlo, sino → ir a la red
      return response || fetch(event.request);
    })
  );
});
