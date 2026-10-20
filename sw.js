// Offline-Cache: Die Seite selbst kommt immer frisch aus dem Netz (damit Updates sofort sichtbar sind),
// der Cache springt nur ein, wenn kein Internet da ist. Bilder und Skripte kommen zuerst aus dem Cache.
const CACHE = 'haushaltsbuch-v4';
const CORE = ['./haushaltsbuch.html', './manifest.webmanifest', './app-icons/icon-180.png', './app-icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate' || /\.(html|webmanifest)$/.test(new URL(req.url).pathname);
  if (isPage) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
