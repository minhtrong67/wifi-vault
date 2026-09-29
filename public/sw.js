// Service worker đơn giản: cache app shell để mở nhanh và chạy được khi mạng yếu.
const CACHE = 'wifi-vault-v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/favicon.svg'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  // Chỉ cache tài nguyên cùng origin, không đụng vào Firebase/Google
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(request)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); return res; })
      .catch(() => caches.match(request).then((r) => r || caches.match('/')))
  );
});
