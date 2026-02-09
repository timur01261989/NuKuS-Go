const CACHE_NAME = 'nukus-go-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/AssetManifest.json',
  '/assets/fonts/yango-headline-multi.woff'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});