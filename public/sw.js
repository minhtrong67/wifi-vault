// Service worker đơn giản: cache app shell để mở nhanh và chạy được khi mạng yếu.
const CACHE = 'wifi-vault-v2';
const SHELL = ['/', '/favicon.svg', '/icon-192.png', '/manifest.webmanifest'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
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
  // Mạng trước, cache sau (luôn lấy bản mới nhất khi online); chỉ lưu phản hồi hợp lệ
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || (request.mode === 'navigate' ? caches.match('/') : Response.error())))
  );
});
