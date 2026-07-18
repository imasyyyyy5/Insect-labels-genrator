// Insect Label Generator — service worker
// Caches the app shell (the HTML, manifest, and icons) so the app opens
// instantly and works offline once installed. Saved label sheets live in
// localStorage (not here), which the browser already persists indefinitely
// on its own — this worker just makes sure the app itself is always
// reachable to read that history back, even with no connection.

const CACHE_NAME = 'ilg-shell-v1';
const PRECACHE_URLS = [
  './app.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for the app shell (so a redeploy is picked up immediately
// when online), falling back to the cached copy — including on navigation
// requests — when offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./app.html'))
      )
  );
});
