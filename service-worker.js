self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('my-cache').then((cache) => {
            return cache.addAll([
                '/', 
                './to-do-list_front_back/client/index.html',
                './to-do-list_front_back/client/style.css', 
                './to-do-list_front_back/client/index.js', 
                './to-do-list_front_back/client/registro.html',
                './to-do-list_front_back/client/registro.js',
                './to-do-list_front_back/client/todolist.html',
                './to-do-list_front_back/client/todolist.js',
                './to-do-list_front_back/server.js',
                './images/icon-192x192.png', 
                './images/icon-512x512.png'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['my-cache'];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
