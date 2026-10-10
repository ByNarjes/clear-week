/* The top-level address is the free demo, which works without offline storage.
   This removes any older offline copy that was stored here. The full app has its own worker in its folder. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  for (const k of keys) { const c = await caches.open(k); for (const r of await c.keys()) { const p = new URL(r.url).pathname; if (!p.includes('/app-gwgl49vv5g/')) await c.delete(r); } }
  await self.registration.unregister();
  for (const c of await self.clients.matchAll()) c.navigate(c.url);
})()));
