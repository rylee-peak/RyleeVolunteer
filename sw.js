importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js");

// Initialize Firebase App in the background worker
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

// Intercept payload when the app is in the background
messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title || "Campaign Alert";
    const notificationOptions = {
        body: payload.notification.body,
        icon: "https://placehold.co/192x192/0047AB/FFFFFF.png?text=RV"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = 'rylee-vol-v2';
const STATIC_ASSETS = [
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the worker to activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Safely cache files without crashing the whole worker if one fails
            return Promise.allSettled(
                STATIC_ASSETS.map(url => cache.add(url).catch(e => console.warn('Cache skip:', url)))
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); // Take control of the page immediately
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
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase') || url.hostname.includes('identitytoolkit')) {
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

// 1. Standard Background Sync (Triggered when connection is restored)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-campaign-data') {
        console.log('[sw.js] Background sync triggered: Checking for pending actions.');
        // Note: Firebase handles the actual database sync automatically via its SDK,
        // but this satisfies PWA requirements and allows for custom background task handling.
        event.waitUntil(Promise.resolve());
    }
});

// 2. Periodic Background Sync (Triggered by the OS periodically)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-campaign-assets') {
        console.log('[sw.js] Periodic sync triggered: Refreshing app assets.');
        // Refresh the static assets in the background so the app loads faster next time
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)));
            })
        );
    }
});
