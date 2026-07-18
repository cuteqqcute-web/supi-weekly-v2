// Service Worker for 酥皮週計畫 - offline support
const CACHE_NAME = 'supi-weekly-v3';

const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'icon-192.svg',
  'icon-512.svg'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('SW install: some assets failed to cache', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first strategy (always try fresh, fall back to cache for offline)
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Don't cache opaque responses or errors
      if (!response || response.status !== 200 || response.type === 'opaque') {
        return response;
      }
      // Clone and cache for offline
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, clone);
      });
      return response;
    }).catch(() => {
      // Network failed, fall back to cache
      return caches.match(event.request);
    })
  );
});
