// Offline support for the preparedness list. Generated into ../sw.js by build.py: do not edit sw.js.
// - The page, fonts and last headlines are stored on the first visit, so the page opens without network.
// - Headlines (wire.json): network first, last stored copy when offline.
// - Export libraries (vendor/): stored the first time someone downloads Excel or PDF.
const CACHE = /*VERSION*/;
const PRECACHE = /*PRECACHE*/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith("beredskap-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;  // other sites: browser default

  if (url.pathname.endsWith("/wire.json")) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put("wire.json", copy)); }
      return r;
    }).catch(() => caches.match("wire.json")));
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(caches.match("./").then(r => r || fetch(req)).catch(() => fetch(req)));
    return;
  }

  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
    if (r.ok && url.pathname.includes("/vendor/")) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
