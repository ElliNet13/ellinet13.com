const CACHE_NAME = 'offline-cache-v1';
const OFFLINE_PAGE = '/offline';
const OFFLINE_FAVICON = '/favicon.ico';

// Map external URLs to custom cache paths
const REWRITES = {
    "https://cdn.userway.org/styles/2024-12-17-16-42-30/widget_lazy.css": "/offline_saves/userway_widget_lazy.css"
};

// Define the list of files to cache
const USERWAY = [
    "https://cdn.userway.org/widget.js",
    "https://cdn.userway.org/widgetapp/2024-12-17-16-42-30/widget_app_1734453750984.js",
    "https://cdn.userway.org/widgetapp/images/body_wh.svg",
    "https://cdn.userway.org/widgetapp/images/spin_wh.svg",
    "https://cdn.userway.org/widgetapp/images/check_on.svg"
];

// Combine the offline page, favicon, and UserWay assets into one array
const FILES = [
    OFFLINE_PAGE,
    OFFLINE_FAVICON,
    ...USERWAY,
    ...Object.values(REWRITES) // Include the custom paths for cached files
];

self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Caching offline page and assets.');
            return cache.addAll(FILES);
        }).then(() => {
            self.skipWaiting();
        })
    );
});

self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            if ('navigationPreload' in self.registration) {
                return self.registration.navigationPreload.enable();
            }
        })
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Check if this request URL has a custom rewrite in REWRITES
    const rewrittenUrl = REWRITES[url.href];

    if (rewrittenUrl) {
        // If a rewrite is defined, serve the cached file or fetch and cache it
        event.respondWith(
            caches.match(rewrittenUrl).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse; // Return cached response if available
                }
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(rewrittenUrl, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                });
            })
        );
    } else {
        // If no rewrite, handle the request normally
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse; // Return cached response if available
                }
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // If the network fails, return offline page
                    return caches.match(OFFLINE_PAGE);
                });
            })
        );
    }
});