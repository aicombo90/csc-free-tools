// 3D ফুটবল — অফলাইন খেলার জন্য ক্যাশ
const CACHE = 'football3d-v1';
const FILES = [
  '/dafadar-online-seva/games/football-3d/',
  '/dafadar-online-seva/games/football-3d/index.html',
  '/dafadar-online-seva/games/football-3d/manifest.json',
  '/dafadar-online-seva/games/football-3d/icon-192.png',
  '/dafadar-online-seva/games/football-3d/icon-512.png',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('/dafadar-online-seva/games/football-3d/index.html')))
  );
});
