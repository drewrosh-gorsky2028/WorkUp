// Offline cache: serve the app shell from cache, refresh it in the background.
var CACHE = 'workup-v20';
var FILES = ['./', 'index.html', 'manifest.json', 'icon-levelup-180.png', 'icon-levelup-192.png', 'icon-levelup-512.png', 'quicksand.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, res.clone());
        return res;
      }).catch(function () { return hit; });
      // The page itself comes fresh from the network so updates show up on the next open; offline, the cached copy
      if (e.request.mode === 'navigate') return net.then(function (res) { return res || hit; });
      return hit || net;
    });
  }));
});
