const CACHE_NAME = 'gyuuun-party-v2';
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
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for caching
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for offline images or routes
        if (event.request.destination === 'image') {
          return caches.match('/assets/input_file_0.png');
        }
      });
    })
  );
});

// Background Sync Logic
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  // This would interact with IndexedDB or a broadcast channel to the client
  // Since we're using Firebase with enableIndexedDbPersistence, 
  // Firebase already handles most background sync for Firestore.
  // However, for custom logic, we can post a message back to clients.
  const allClients = await self.clients.matchAll();
  allClients.forEach(client => {
    client.postMessage({ type: 'SYNC_RECONNECT' });
  });
}

