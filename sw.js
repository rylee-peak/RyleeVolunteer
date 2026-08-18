const CACHE_NAME = 'rylee-vol-v1';
const STATIC_ASSETS = [
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@phosphor-icons/web',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install: Cache basic offline shell (HTML + CSS libraries)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});

// Fetch: Network first for API, Cache-first for static.
// CRITICAL SECURITY: Never cache Firestore API calls containing sensitive user credentials.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Bypass caching for Firebase API/Firestore completely to ensure security and live data
    if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebase')) {
        return; // Let the browser handle it directly via network
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                // If offline and requesting a page, return the index shell
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});