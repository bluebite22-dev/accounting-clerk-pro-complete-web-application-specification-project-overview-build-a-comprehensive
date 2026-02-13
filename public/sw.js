// Service Worker for Accounting Clerk Pro
// Provides offline support, caching, and background sync

const CACHE_NAME = 'accounting-pro-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE && 
                     name !== API_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for CDN)
  if (url.origin !== location.origin && 
      !url.hostname.includes('cdn') &&
      !url.hostname.includes('googleapis')) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - cache first, network fallback
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Dynamic content - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Cache strategies
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone and cache successful responses
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed - try cache
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'You are offline. Data will sync when connection is restored.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch from network in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || new Response('Offline', { status: 503 }));
  
  // Return cached version immediately if available
  return cached || fetchPromise;
}

// Background Sync - sync data when back online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  } else if (event.tag === 'sync-invoices') {
    event.waitUntil(syncInvoices());
  } else if (event.tag === 'sync-bills') {
    event.waitUntil(syncBills());
  }
});

async function syncTransactions() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const pending = await cache.match('/pending/transactions');
    
    if (!pending) {
      return;
    }
    
    const transactions = await pending.json();
    
    for (const transaction of transactions) {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
    }
    
    // Clear pending after sync
    await cache.delete('/pending/transactions');
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Transactions synced successfully',
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function syncInvoices() {
  // Similar implementation for invoices
  console.log('[SW] Syncing invoices...');
}

async function syncBills() {
  // Similar implementation for bills
  console.log('[SW] Syncing bills...');
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Accounting Clerk Pro',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {},
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'default',
      data: data.data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  const url = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Message handler - receive messages from main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  return totalSize;
}

// Periodic background sync for fresh data
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/unread-count');
    const data = await response.json();
    
    // Update badge
    await self.registration.setAppBadge(data.count);
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}
