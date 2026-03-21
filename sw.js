// ── Service Worker for Sudoku PWA ─────────────────────────────────────────────
const CACHE_NAME = 'sudoku-v1';

// All assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/static/app.js',
    '/static/style.css',
    '/static/icon-192x192.png',
    '/static/icon-512x512.png',
    '/static/manifest.json',
    'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// ── Install: cache all static assets ─────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())   // activate immediately
    );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())  // take control of all tabs
    );
});

// ── Fetch: cache-first for static assets, network-first for API ───────────────
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Always go to network for API calls (Render backend) — never cache these
    if (url.hostname.includes('onrender.com') ||
        url.pathname === '/solve' ||
        url.pathname === '/generate' ||
        url.pathname === '/health') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache-first strategy for everything else (static assets, HTML, fonts)
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;

                return fetch(event.request)
                    .then(response => {
                        // Only cache valid responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }
                        const toCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback — serve cached index for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/');
                        }
                    });
            })
    );
});