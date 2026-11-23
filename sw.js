const CACHE = 'faewood-v1';
const FILES = [
  './', './index.html', './style.css', './manifest.webmanifest',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png',
  './vendor/three.module.js', './vendor/three.core.js',
  './src/main.js', './src/core/engine.js', './src/core/input.js', './src/core/save.js', './src/core/audio.js', './src/core/utils.js',
  './src/world/world.js', './src/world/terrain.js', './src/world/vegetation.js', './src/world/bubble.js', './src/world/heightfield.js',
  './src/player/fairy.js', './src/player/controller.js',
  './src/systems/items.js', './src/systems/inventory.js', './src/systems/harvest.js', './src/systems/building.js',
  './src/ui/hud.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, clone));
    }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
