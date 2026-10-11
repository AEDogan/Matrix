const CACHE_NAME = 'vetassist-cache-v4';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './icons.js',
  './i18n.js',
  './parameters.js',
  './stock.js',
  './logs.js',
  './receipt.js',
  './its.js',
  './html5-qrcode.min.js',
  './app.js',
  './manifest.json',
  './sample_data.csv'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests from the same origin that are not API calls
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin) || event.request.url.includes('/api/')) {
    return;
  }

  // Stale-while-revalidate / Cache first for offline capability
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Arka planda güncelle
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
