// ThaiTide Service Worker for PWA functionality
const CACHE_NAME = 'thaitide-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Some assets might not exist, which is ok
        console.log('Some assets could not be cached');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
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

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip auth-related routes entirely - don't cache or intercept these
  // This prevents redirect loop issues in Safari
  const authRoutes = [
    '/auth-redirect',
    '/sign-in',
    '/sign-up',
    '/api/auth',
    '/_next/static',
    '/clerk',
  ];
  
  if (authRoutes.some(route => url.pathname.startsWith(route)) || 
      url.hostname.includes('clerk') ||
      url.pathname.includes('__clerk')) {
    return;
  }

  // Handle API requests differently (network first)
  if (request.url.includes('/api/') || request.url.includes('localhost:5000')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache non-2xx responses
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request);
        })
    );
  } else {
    // For assets, use cache first, fallback to network
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            return new Response('Offline', { status: 503 });
          });
      })
    );
  }
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
