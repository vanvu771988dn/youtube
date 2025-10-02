// Service Worker for Caching the App Shell
const CACHE_NAME = 'trendhub-v1-app-shell';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  // In a real app with a build step, we'd add JS/CSS bundles.
  // Here, we cache the main entry points. The browser will handle caching CDN assets.
];

/**
 * On install, caches the static assets that make up the app shell.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/**
 * On activate, cleans up any old caches to ensure the user gets the latest version.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * On fetch, serves the app shell from the cache first for navigation requests,
 * providing a fast, offline-first loading experience.
 */
self.addEventListener('fetch', (event) => {
  // We only intercept navigation requests for the app shell.
  // API calls and other assets are handled by the browser's cache or network.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
