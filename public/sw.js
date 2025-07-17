
// This is a basic service worker file for PWA installation.
// It can be expanded to include caching strategies for offline functionality.

self.addEventListener('install', (event) => {
  // console.log('Service worker installed');
  // Skip waiting to activate the new service worker immediately.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // console.log('Service worker activated');
  // Take control of all clients as soon as the service worker is activated.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple pass-through fetch handler for now.
  // This is required for the PWA install prompt to appear on some browsers.
  event.respondWith(fetch(event.request));
});
