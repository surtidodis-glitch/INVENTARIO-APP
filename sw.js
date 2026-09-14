const CACHE_NAME = 'contenedor-inventario-v2';

const APP_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// ============================================================
// INSTALACIÓN
// ============================================================

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ============================================================
// ACTIVACIÓN
// ============================================================

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }

                        return Promise.resolve();
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ============================================================
// FETCH
// ============================================================

self.addEventListener('fetch', event => {

    const request = event.request;

    // Solo manejar solicitudes GET
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // --------------------------------------------------------
    // INDEX.HTML
    // SIEMPRE intentar obtener la versión actual de RED
    // --------------------------------------------------------

    if (
        url.pathname.endsWith('/index.html') ||
        url.pathname.endsWith('/')
    ) {
        event.respondWith(
            fetch(request, {
                cache: 'no-cache'
            })
            .then(networkResponse => {

                if (
                    networkResponse &&
                    networkResponse.ok
                ) {
                    const responseClone =
                        networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(
                                request,
                                responseClone
                            );
                        });
                }

                return networkResponse;
            })
            .catch(() => {
                return caches.match(request);
            })
        );

        return;
    }

    // --------------------------------------------------------
    // OTROS RECURSOS
    // Cache First + Red como respaldo
    // --------------------------------------------------------

    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then(networkResponse => {

                        if (
                            networkResponse &&
                            networkResponse.ok
                        ) {

                            const responseClone =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        request,
                                        responseClone
                                    );

                                });

                        }

                        return networkResponse;

                    });

            })
    );

});
