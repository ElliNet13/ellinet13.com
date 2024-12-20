const CACHE_NAME = 'offline-cache-v1';
const OFFLINE_PAGE = '/offline';
const OFFLINE_FAVICON = '/favicon.ico';

const USERWAY = [
    "https://cdn.userway.org/widget.js",
    "https://cdn.userway.org/widgetapp/2024-12-17-16-42-30/widget_app_1734453750984.js",
    "https://cdn.userway.org/styles/2024-12-17-16-42-30/widget_lazy.css?v=1734453750984",
    "https://cdn.userway.org/widgetapp/images/body_wh.svg",
    "https://cdn.userway.org/widgetapp/images/spin_wh.svg",
    "https://cdn.userway.org/widgetapp/images/check_on.svg"
];

const FILES = [
    OFFLINE_PAGE,
    OFFLINE_FAVICON,
    ...USERWAY
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
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                        return preloadResponse;
                    }

                    const networkResponse = await fetch(event.request);
                    return networkResponse;
                } catch (error) {
                    console.log('[Service Worker] Network request failed. Serving offline page.', error);
                    const cache = await caches.open(CACHE_NAME);
                    return cache.match(OFFLINE_PAGE);
                }
            })()
        );
    } else {
        event.respondWith(
            (async () => {
                const url = new URL(event.request.url);

                // Check if the requested pathname is in the FILES array
                if (FILES.includes(url.pathname)) {
                    return caches.match(url.pathname) || fetch(event.request);
                }

                // Default behavior for other requests
                return fetch(event.request).catch(() => {
                    console.log('[Service Worker] Fallback to offline page for failed request.');
                    return caches.match(OFFLINE_PAGE);
                });
            })()
        );
    }
});