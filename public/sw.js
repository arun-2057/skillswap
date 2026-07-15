/**
 * Service Worker for PWA with optimized caching strategies
 * Split: Cache First for static assets, Network First for dynamic data, No-Cache for realtime
 */

const STATIC_CACHE = 'skill-swap-static-v1';
const DYNAMIC_CACHE = 'skill-swap-dynamic-v1';

// Cache essential static assets on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch with split caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // 1. Static assets: Cache First
  if (/\.(?:js|css|woff2|png|svg|jpg|jpeg|webp|ico)$/i.test(pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, responseToCache));
          return response;
        })
      )
    );
    return;
  }

  // 2. Next.js data/Server Components: Network First with fallback
  if (/_next\/data\/.+\/.+\.json$/i.test(pathname) || pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, responseToCache));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Supabase Realtime & WebSocket connections: No-Cache (bypass entirely)
  if (pathname.includes('/realtime') || pathname.includes('/websocket') || url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 4. Navigation requests: Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const notificationTitle = data.title || 'Skill Swap';
  const notificationOptions = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let urlToOpen = '/';

  if (event.notification.data?.type === 'message') {
    urlToOpen = `/messages?conversation=${event.notification.data.conversationId}`;
  } else if (event.notification.data?.type === 'video-call') {
    urlToOpen = `/session?sessionId=${event.notification.data.sessionId}`;
  } else if (event.notification.data?.type === 'session-completed') {
    urlToOpen = '/sessions';
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window' });

      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-offline-messages') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open('offline-messages');
          const requests = await cache.keys();
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              await fetch(request, { method: 'POST', body: await response.clone().blob() });
              await cache.delete(request);
            }
          }
        } catch (err) {
          console.error('Background sync failed:', err);
        }
      })()
    );
  }
});