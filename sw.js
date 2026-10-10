/* Clear Week offline cache. Bump VERSION on every release. */
const VERSION = 'cw-1.0.0';
const FILES = ['./', 'index.html', 'app.css', 'engine.js', 'app.js', 'manifest.webmanifest',
  'bricolage-grotesque-latin-wght-normal.woff2', 'hanken-grotesk-latin-wght-normal.woff2',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(r, copy)); } return res; }).catch(() => hit || caches.match('index.html'));
    return hit || net;
  }));
});
