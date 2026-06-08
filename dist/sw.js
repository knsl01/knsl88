/* KNSL Legal Intelligence — Service Worker
   Enables PWA "Add to Home Screen" on iOS, offline shell, and faster loads. */
const CACHE = "knsl-v1";
const SHELL  = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Never cache API calls or external CDN requests
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) return;

  // Network-first → cache update → fallback
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((r) => r || caches.match("/index.html"))
      )
  );
});
