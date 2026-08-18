importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAdrSGBDl4xlQhTw-LaD3YZUJnM2UmBiaU",
    authDomain: "rylee-for-mayor-volunteers.firebaseapp.com",
    projectId: "rylee-for-mayor-volunteers",
    storageBucket: "rylee-for-mayor-volunteers.firebasestorage.app",
    messagingSenderId: "259311879856",
    appId: "1:259311879856:web:e856506872fe5591329d75",
    measurementId: "G-PS49HLL5XN"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title || "Campaign Alert";
    const notificationOptions = {
        body: payload.notification.body,
        icon: "https://placehold.co/192x192/0047AB/FFFFFF.png?text=RV"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = 'rylee-vol-v1';
const STATIC_ASSETS = [
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@phosphor-icons/web',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Bypass caching for Firebase API/Firestore completely to ensure security and live data
    if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebase') || url.hostname.includes('identitytoolkit')) {
        return; 
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
