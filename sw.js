/* VOIDROLL : RENEWAL — 오프라인 지원 (네트워크 우선, 실패하면 캐시) */
const CACHE = 'voidroll-renewal-v4';
const CORE = ['./', 'index.html', 'style.css', 'js/data.js', 'js/classic-auras.js', 'js/classic-data.js', 'js/render.js', 'js/game.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => { })); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
