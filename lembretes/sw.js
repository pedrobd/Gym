// Service worker: guarda a app para abrir sem rede e trata dos botões das notificações.
const CACHE = 'lembra-me-v1';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'parser.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// rede primeiro, cache se não houver rede
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const id = (e.notification.data || {}).id;
  const action = e.action || 'open';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = all[0];
    if (client) {
      client.postMessage({ action, id });
      if (action === 'open' && client.focus) await client.focus();
    } else {
      await self.clients.openWindow('./?action=' + encodeURIComponent(action) + '&id=' + encodeURIComponent(id || ''));
    }
  })());
});
