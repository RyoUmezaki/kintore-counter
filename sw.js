const CACHE = "kintore-counter-v3";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Page itself: network first so updates arrive, cache when offline
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("./", copy)); return r; })
      .catch(() => caches.match("./").then(r => r || caches.match("index.html"))));
    return;
  }
  // Everything else (icons, Google Fonts): cache first, fill the cache as we go
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => hit)));
});
