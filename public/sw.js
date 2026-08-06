const CACHE_NAME = 'gyuuun-party-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  'https://www.image2url.com/r2/default/images/1785981294992-d21b875d-6ee5-44ee-96a9-79b074044075.png',
  'https://www.image2url.com/r2/default/images/1785981347735-83d8d341-e7ca-49a6-9556-5321b0252fff.png',
  'https://www.image2url.com/r2/default/images/1785981379259-b9552a51-d5eb-4a71-a4a3-386e2bbf4a65.png',
  'https://api.dicebear.com/7.x/pixel-art/svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
