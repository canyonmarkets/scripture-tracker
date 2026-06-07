import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Cache scripture JSON files from GitHub CDN
registerRoute(
  ({ url }) => url.hostname === 'raw.githubusercontent.com',
  new CacheFirst({
    cacheName: 'scripture-text',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 90 }),
    ],
  })
);

// Server-sent push notifications (via Netlify scheduled function)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Scripture Tracker', {
      body: data.body || "Time for your daily scripture reading!",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'scripture-reminder',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
