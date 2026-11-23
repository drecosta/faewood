const CACHE = 'faewood-v6';
const FILES = [
  "./",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon.svg",
  "./assets/models/buildings/bridges/balcony.glb",
  "./assets/models/buildings/bridges/bridge.glb",
  "./assets/models/buildings/bridges/door.glb",
  "./assets/models/buildings/bridges/ladder.glb",
  "./assets/models/buildings/bridges/stairs.glb",
  "./assets/models/buildings/furniture/bed.glb",
  "./assets/models/buildings/furniture/chair.glb",
  "./assets/models/buildings/furniture/crystalLamp.glb",
  "./assets/models/buildings/furniture/flowerBox.glb",
  "./assets/models/buildings/furniture/lanternPost.glb",
  "./assets/models/buildings/furniture/mushroomSeat.glb",
  "./assets/models/buildings/furniture/plantPot.glb",
  "./assets/models/buildings/furniture/shelf.glb",
  "./assets/models/buildings/furniture/sign.glb",
  "./assets/models/buildings/furniture/table.glb",
  "./assets/models/buildings/furniture/wardrobe.glb",
  "./assets/models/buildings/furniture/windChime.glb",
  "./assets/models/buildings/platforms/floor.glb",
  "./assets/models/buildings/platforms/floorGlass.glb",
  "./assets/models/buildings/platforms/floorRound.glb",
  "./assets/models/buildings/platforms/rug.glb",
  "./assets/models/buildings/roofs/roof.glb",
  "./assets/models/buildings/roofs/roofCone.glb",
  "./assets/models/buildings/roofs/roofMoss.glb",
  "./assets/models/buildings/walls/halfWall.glb",
  "./assets/models/buildings/walls/pillar.glb",
  "./assets/models/buildings/walls/wall.glb",
  "./assets/models/buildings/walls/wallWindow.glb",
  "./assets/models/characters/fairy/fairy.glb",
  "./assets/models/environment/crystals/shard.glb",
  "./assets/models/environment/mushrooms/cap.glb",
  "./assets/models/environment/mushrooms/stem.glb",
  "./assets/models/environment/plants/bush.glb",
  "./assets/models/environment/plants/flower-head.glb",
  "./assets/models/environment/plants/flower-stem.glb",
  "./assets/models/environment/plants/grass.glb",
  "./assets/models/environment/rocks/cave.glb",
  "./assets/models/environment/rocks/rock.glb",
  "./assets/models/environment/trees/ancient-tree.glb",
  "./assets/models/environment/trees/tree-crown-cone.glb",
  "./assets/models/environment/trees/tree-crown.glb",
  "./assets/models/environment/trees/tree-trunk.glb",
  "./assets/models/model-manifest.json",
  "./assets/models/resources/crystals.glb",
  "./assets/models/resources/dew.glb",
  "./assets/models/resources/dust.glb",
  "./assets/models/resources/flowers.glb",
  "./assets/models/resources/leaves.glb",
  "./assets/models/resources/mushrooms.glb",
  "./assets/models/resources/seeds.glb",
  "./assets/models/resources/stones.glb",
  "./assets/models/resources/wood.glb",
  "./index.html",
  "./manifest.webmanifest",
  "./src/assets/model-library.js",
  "./src/assets/model-registry.js",
  "./src/assets/shader-materials.js",
  "./src/core/audio.js",
  "./src/core/engine.js",
  "./src/core/input.js",
  "./src/core/save.js",
  "./src/core/utils.js",
  "./src/main.js",
  "./src/player/controller.js",
  "./src/player/fairy.js",
  "./src/systems/building.js",
  "./src/systems/collision.js",
  "./src/systems/harvest.js",
  "./src/systems/inventory.js",
  "./src/systems/items.js",
  "./src/ui/hud.js",
  "./src/world/bubble.js",
  "./src/world/heightfield.js",
  "./src/world/terrain.js",
  "./src/world/vegetation.js",
  "./src/world/world.js",
  "./style.css",
  "./vendor/gltf/BufferGeometryUtils.js",
  "./vendor/gltf/GLTFLoader.js",
  "./vendor/gltf/SkeletonUtils.js",
  "./vendor/three.core.js",
  "./vendor/three.module.js"
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
