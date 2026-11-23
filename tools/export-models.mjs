import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from './vendor/GLTFExporter.js';
import { GLTFLoader } from '../vendor/gltf/GLTFLoader.js';
import { MODEL_REGISTRY, MODEL_IDS } from '../src/assets/model-registry.js';
import { BUILD_PIECES } from '../src/systems/items.js';
import { makeProceduralPiece } from '../src/systems/building.js';
import { prepareHarvestAssets, makeProceduralNodeMesh } from '../src/systems/harvest.js';
import { vegetationPrototypes, createAncientTree, createCave } from '../src/world/vegetation.js';
import { Fairy } from '../src/player/fairy.js';
import { mulberry32 } from '../src/core/utils.js';

class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    }).catch((error) => this.onerror?.(error));
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onloadend?.();
    }).catch((error) => this.onerror?.(error));
  }
}
globalThis.FileReader ||= NodeFileReader;

const root = process.cwd();
const exporter = new GLTFExporter();
const loader = new GLTFLoader();
const entries = [];

function standardMaterial(material) {
  if (material.isShaderMaterial) {
    const color = material.uniforms?.uColor?.value?.clone() || new THREE.Color('#a9f5df');
    return new THREE.MeshStandardMaterial({
      name: 'WingGlow', color, emissive: color.clone().multiplyScalar(0.35),
      emissiveIntensity: 1, roughness: 0.4, metalness: 0,
      transparent: true, opacity: 0.45, side: material.side, depthWrite: false,
    });
  }
  if (material.isMeshBasicMaterial) {
    return new THREE.MeshBasicMaterial({
      name: material.name || 'Unlit', color: material.color.clone(),
      transparent: material.transparent, opacity: material.opacity,
      side: material.side, depthWrite: material.depthWrite,
    });
  }
  return new THREE.MeshStandardMaterial({
    name: material.name || 'Material',
    color: material.color?.clone() || new THREE.Color('#ffffff'),
    emissive: material.emissive?.clone() || new THREE.Color('#000000'),
    emissiveIntensity: material.emissiveIntensity ?? 1,
    roughness: material.roughness ?? 0.85,
    metalness: material.metalness ?? 0,
    transparent: material.transparent ?? false,
    opacity: material.opacity ?? 1,
    side: material.side ?? THREE.FrontSide,
    flatShading: material.flatShading ?? false,
    depthWrite: material.depthWrite ?? true,
  });
}

function normalizeForExport(object) {
  const converted = new Map();
  const convert = (material) => {
    if (!material) return material;
    if (!converted.has(material.uuid)) converted.set(material.uuid, standardMaterial(material));
    return converted.get(material.uuid);
  };
  object.traverse((node) => {
    if (!node.isMesh) return;
    node.material = Array.isArray(node.material) ? node.material.map(convert) : convert(node.material);
    node.castShadow = true;
    node.receiveShadow = true;
  });
  const lights = [];
  object.traverse((node) => { if (node.isLight) lights.push(node); });
  lights.forEach((light) => light.parent?.remove(light));
  return object;
}

async function exportGLB(id, object) {
  const config = MODEL_REGISTRY[id];
  const wrapper = new THREE.Group();
  wrapper.name = 'Scene';
  wrapper.add(object);
  normalizeForExport(wrapper);
  wrapper.updateMatrixWorld(true);
  const buffer = await exporter.parseAsync(wrapper, { binary: true, trs: true, onlyVisible: true });
  const relative = config.path.replace(/^\.\//, '');
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(buffer));
  const entry = { id, path: config.path, node: config.node, bytes: buffer.byteLength };
  entries.push(entry);
  console.log(`✓ ${id.padEnd(34)} ${(buffer.byteLength / 1024).toFixed(1)} KB`);
  return entry;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const relative = path.join(dir, item.name).split(path.sep).join('/');
    if (item.isDirectory()) return walk(relative);
    if (!/\.(js|css|html|json|webmanifest|png|svg|glb)$/.test(item.name)) return [];
    return ['./' + relative];
  });
}

function writeModelMap() {
  const cell = (value) => String(value ?? '').replace(/\|/g, '\\|');
  const rows = Object.entries(MODEL_REGISTRY).map(([id, config]) => {
    const file = config.path.replace(/^\.\/assets\/models\//, '');
    return `| \`${cell(id)}\` | ${cell(config.label)} | \`${cell(config.gameObject)}\` | \`${cell(file)}\` | \`${cell(config.node)}\` | ${cell(config.fallback)} |`;
  });
  const markdown = `# Faewood model map

Generated from \`src/assets/model-registry.js\` by \`npm run models\`. The registry is the single source of truth; this table is a readable snapshot.

| Asset ID | Label | Game object | Model file | Node | Fallback |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

Animation rules: \`characters.fairy\` swaps wing materials to the runtime shimmer shader; \`environment.trees.ancient\` applies wind to nodes matching \`Canopy\`.
`;
  fs.writeFileSync(path.join(root, 'assets/models/MODEL_MAP.md'), markdown);
}

function writeServiceWorker() {
  const current = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const match = current.match(/faewood-v(\d+)/);
  const version = match ? Number(match[1]) + 1 : 3;
  const files = [...new Set([
    './', './index.html', './style.css', './manifest.webmanifest',
    './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png',
    ...walk('src'), ...walk('vendor'),
    './assets/models/model-manifest.json',
    ...MODEL_IDS.map((id) => MODEL_REGISTRY[id].path),
  ])].sort();
  const sw = `const CACHE = 'faewood-v${version}';
const FILES = ${JSON.stringify(files, null, 2)};

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
`;
  fs.writeFileSync(path.join(root, 'sw.js'), sw);
  console.log(`✓ sw.js cache bumped to faewood-v${version} (${files.length} files)`);
}

async function verify() {
  const modelLoader = new GLTFLoader();
  for (const entry of entries) {
    const file = path.join(root, entry.path.replace(/^\.\//, ''));
    const data = fs.readFileSync(file);
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    await new Promise((resolve, reject) => modelLoader.parse(arrayBuffer, '', resolve, reject));
  }
  console.log(`✓ verified ${entries.length} GLB files load with GLTFLoader r187`);
}

async function main() {
  console.log('Exporting Faewood models from procedural sources…\n');

  const fairyScene = new THREE.Scene();
  const fairy = new Fairy(fairyScene, {});
  const fairyBody = fairy.body.clone(true);
  fairyBody.name = 'Body';
  await exportGLB('characters.fairy', fairyBody);

  for (const piece of BUILD_PIECES) {
    const model = makeProceduralPiece(piece.id);
    model.name = 'Root';
    await exportGLB('buildings.' + piece.id, model);
  }

  const { geos, mats } = prepareHarvestAssets();
  for (const id of ['wood', 'leaves', 'flowers', 'mushrooms', 'stones', 'crystals', 'seeds', 'dust', 'dew']) {
    const model = makeProceduralNodeMesh(id, mulberry32(901 + id.length), mats, geos);
    await exportGLB('resources.' + id, model);
  }

  const material = new THREE.MeshStandardMaterial({ name: 'Model', color: 0xffffff, roughness: 0.85 });
  for (const [id, [nodeName, geometry]] of vegetationPrototypes()) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = nodeName;
    await exportGLB(id, mesh);
  }
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), material);
  rock.name = 'Rock';
  await exportGLB('environment.rocks.rock', rock);

  await exportGLB('environment.trees.ancient', createAncientTree({ shadows: false }, { uTime: { value: 0 } }, mulberry32(77)).ancient);
  await exportGLB('environment.rocks.cave', createCave({ shadows: false }).cave);

  const manifest = {
    generator: 'tools/export-models.mjs',
    three: 'r187',
    count: entries.length,
    models: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
  };
  fs.writeFileSync(path.join(root, 'assets/models/model-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  writeModelMap();
  writeServiceWorker();
  if (process.argv.includes('--verify')) await verify();
  console.log(`\nDone: ${entries.length} models exported.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
