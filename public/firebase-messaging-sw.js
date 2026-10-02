// Variety Momo — Unified PWA & Firebase Cloud Messaging Service Worker
// Provides:
// 1. Offline caching & PWA installability
// 2. Firebase Cloud Messaging (FCM) push notifications for Owner & Customer
// 3. Reliable notification click routing to orders / tracking pages

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE_NAME = 'variety-momo-v6';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/variety-momo-logo.jpg',
  '/variety-momo-logo.png',
  '/favicon.ico',
  '/favicon-96x96.png',
  '/favicon-128x128.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Public Firebase Web Configuration (Client worker safe)
const firebaseConfig = {
  apiKey: "AIzaSyDdTxJAq77F3At4WkSVsMQ2q67RcHKjKCM",
  authDomain: "variety-momo.firebaseapp.com",
  projectId: "variety-momo",
  storageBucket: "variety-momo.firebasestorage.app",
  messagingSenderId: "1017043259551",
  appId: "1:1017043259551:web:9c59d7ae4c5630442e52aa",
  measurementId: "G-F1NW7HZMGF"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (e) {
  // App might already be initialized
}

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (err) {
  console.warn('[FCM-SW] Firebase messaging unsupported in this context:', err);
}

if (messaging) {
  // Handle background notifications when app tab is closed or backgrounded
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] Received background message:', payload);

    // If payload.notification is provided, FCM Web SDK & browser automatically displays it.
    // Calling showNotification here would cause duplicate notifications.
    if (payload.notification && payload.notification.title) {
      console.log('[FCM-SW] Notification payload handled by Firebase SDK.');
      return;
    }

    // Display manually if this was a data-only FCM push message or missing notification title
    const title = payload.data?.title || payload.notification?.title || 'Variety Momo';
    const body = payload.data?.body || payload.notification?.body || 'You have an update on your order.';
    const clickAction =
      payload.data?.click_action ||
      payload.data?.url ||
      payload.data?.link ||
      '/';
    const orderNumber = payload.data?.order_number || '';
    const notifTag = orderNumber ? `order-${orderNumber}` : (payload.data?.notification_id ? `notif-${payload.data.notification_id}` : 'variety-momo-alert');

    const origin = self.location.origin;
    const notificationOptions = {
      body,
      icon: `${origin}/pwa-192x192.png`,
      badge: `${origin}/favicon-96x96.png`,
      tag: notifTag,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: {
        click_action: clickAction,
        url: clickAction,
        order_number: orderNumber,
        order_id: payload.data?.order_id
      },
      actions: [
        {
          action: 'open_order',
          title: 'View Details'
        }
      ]
    };

    return self.registration.showNotification(title, notificationOptions);
  });
}

// Notification Click Event Handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl =
    data.click_action ||
    data.url ||
    data.link ||
    data.FCM_MSG?.data?.click_action ||
    data.FCM_MSG?.data?.url ||
    data.fcmOptions?.link ||
    '/';

  // Ensure absolute URL
  if (targetUrl.startsWith('/')) {
    targetUrl = self.location.origin + targetUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open on this origin, focus it, post navigation message, and navigate
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('postMessage' in client) {
            client.postMessage({ type: 'FCM_NAVIGATE', url: targetUrl });
          }
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Service Worker Install & Precaching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activate & Cache Clean-Up
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// Fetch event handler with offline fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API calls (Supabase, Firebase, Google APIs)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Skip dev server dynamic modules
  if (url.pathname.startsWith('/@') || url.pathname.includes('/node_modules/')) {
    return;
  }

  // HTML Navigation: Network-first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Static Assets: Cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
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
        // Fallback for missing images
        if (event.request.destination === 'image') {
          return caches.match('/variety-momo-logo.jpg');
        }
      });
    })
  );
});
