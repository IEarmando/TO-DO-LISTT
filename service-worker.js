const CACHE_NAME = 'task-app-cache-v1';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/to-do-list_front_back/public/index.html',
    '/to-do-list_front_back/public/index.js',
    '/to-do-list_front_back/public/registro.html',
    '/to-do-list_front_back/public/registro.js',
    '/to-do-list_front_back/public/todolist.html',
    '/to-do-list_front_back/public/todolist.js',
    '/to-do-list_front_back/public/style.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
});
