const CACHE_NAME = 'pro-pos-v42';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Use Network-First for index.html (the main app shell)
    if (url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                return caches.match(event.request);
            })
        );
        return;
    }

    // Default Cache-First for other assets
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !event.request.url.includes('google') && !event.request.url.includes('unpkg') && !event.request.url.includes('jsdelivr')) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            });
        })
    );
});
