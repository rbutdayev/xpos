const CACHE_NAME = 'onyx-xpos-v4';
// Only cache essential static pages - no external redirects
const urlsToCache = [
  '/login',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Try to cache each URL individually to avoid one failure blocking all
        return Promise.allSettled(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.log(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline, network first for dynamic content
self.addEventListener('fetch', (event) => {
  // Skip caching for non-GET requests (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  const url = new URL(event.request.url);
  
  // Skip chrome-extension and other non-standard protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Don't cache API requests, dynamic data, or shop product pages
  // These should always fetch fresh data from the network
  const skipCache =
    url.pathname.includes('/api/') ||
    url.pathname.includes('/shop/') ||
    url.pathname.includes('/products/') ||
    url.pathname.includes('/dashboard') ||
    url.pathname.includes('/sales') ||
    url.pathname.includes('/inventory') ||
    url.pathname.includes('/reports') ||
    url.search.length > 0; // Skip caching URLs with query parameters

  if (skipCache) {
    // Network only - always fetch fresh data, no caching
    event.respondWith(fetch(event.request));
    return;
  }

  // For static assets (CSS, JS, images), use network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses from http/https protocols
        // Skip chrome-extension:// and other non-standard protocols
        if (response.status === 200 && 
            (url.protocol === 'http:' || url.protocol === 'https:')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache (offline fallback)
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Return a custom offline page if needed
            return new Response('Offline - please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
