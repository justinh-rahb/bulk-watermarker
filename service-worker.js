const CACHE_NAME = 'bulk-watermarker-cache-v2';
const assetsToCache = [
  '/?v=202410290934',
  '/index.html?v=202410290934',
  '/static/css/styles.css?v=202410290934',
  '/static/js/bulk-watermarker.js?v=202410290934',
  '/static/img/preview.pn?v=202410290934',
  '/static/img/bulk-watermarker.svg?v=202410290934',
  '/static/img/favicon-32x32.png?v=202410290934',
  '/static/img/favicon-192x192.png?v=202410290934',
  '/static/img/apple-touch-icon-120x120.png?v=202410290934',
  '/static/img/apple-touch-icon-152x152.png?v=202410290934',
  '/static/img/apple-touch-icon-167x167.png?v=202410290934',
  '/static/img/apple-touch-icon-180x180.png?v=202410290934',
  '/static/img/android-icon-48x48.png?v=202410290934',
  '/static/img/android-icon-72x72.png?v=202410290934',
  '/static/img/android-icon-96x96.png?v=202410290934',
  '/static/img/android-icon-144x144.png?v=202410290934',
  '/static/img/android-icon-192x192.png?v=202410290934',
  '/static/img/android-icon-512x512.png?v=202410290934',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// Install the service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
});

// Activate the service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch resources
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
