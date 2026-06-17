// Serviceworker for push notifications and other pwa stuff

// Name of the cache – bump the version to force a full refresh
const CACHE_NAME = 'pwa-cache-v1';

// List of static assets your app needs to work offline
// Add paths relative to the root of your site
const STATIC_ASSETS = [
    '/',
    '/assets',
    '/icon.png'
];

// --- INSTALL ---
// Cache all static assets when the service worker is installed
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Force the waiting service worker to become active
                self.skipWaiting();
            })
    );
});

// --- ACTIVATE ---
// Clean up old caches and take control of all clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
            .then(() => {
                // Claim all open clients so they use the new service worker
                return self.clients.claim();
            })
    );
});

// --- FETCH ---
// Serve from cache first, fall back to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // If not in cache, try network (and optionally cache the result)
                return fetch(event.request).catch(() => {
                    // Optionally return a fallback offline page
                });
            })
    );
});

// --- PUSH NOTIFICATIONS (placeholder) ---
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'New update';
    const options = {
        body: data.body || 'Something new is available.',
        icon: '/icon.png', // adjust to your icon
        badge: '/icon.png', // adjust to your badge
        data: {
            url: data.url || '/', // where to navigate when clicked
        },
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// --- NOTIFICATION CLICK ---
// When the user clicks the notification, focus or open the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // If a window is already open, focus it; otherwise open a new one
                for (const client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(urlToOpen);
            })
    );
});