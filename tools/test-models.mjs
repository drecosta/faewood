import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { Models } from '../src/assets/model-library.js';
import { Fairy } from '../src/player/fairy.js';
import { makePiece } from '../src/systems/building.js';
import { makeNodeMesh, prepareHarvestAssets } from '../src/systems/harvest.js';
import { buildVegetation } from '../src/world/vegetation.js';
import { buildTerrain } from '../src/world/terrain.js';
import { CollisionWorld } from '../src/systems/collision.js';
import { mulberry32 } from '../src/core/utils.js';

const dom = new JSDOM('<canvas id="game"></canvas>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.self = dom.window;
globalThis.Request = class {
  constructor(url) { this.url = String(url); this.method = 'GET'; }
};
globalThis.fetch = async (input) => {
  const relative = String(input.url || input).replace(/^\.\//, '').split('?')[0];
  const file = path.join(process.cwd(), relative);
  if (!fs.existsSync(file)) return { ok: false, status: 404 };
  const data = fs.readFileSync(file);
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  };
};

const stats = await Models.preload();
assert.equal(stats.total, 51);
assert.equal(stats.loaded, 51);
assert.deepEqual(stats.failed, []);
console.log('✓ preloaded 51 GLB models');

const scene = new THREE.Scene();
const fairy = new Fairy(scene, {});
assert.equal(fairy.modelSource, 'glb');
assert.equal(fairy.body.name, 'Body');
assert.ok(fairy.group.children.some((child) => child.userData.modelId === 'characters.fairy'));
assert.equal(fairy.arms.length, 2);
assert.equal(fairy.legs.length, 2);
assert.equal(fairy.wings.length, 2);
assert.equal(fairy.wings[0].material.uniforms.uFlap.value, 0);
fairy.setPalette({ skin: 3, hair: 4, dress: 2, wings: 1 });
fairy.update(0.016, { flying: true, speed: 2 });
assert.equal(fairy.wings[0].material.uniforms.uFlap.value, 1);
console.log('✓ fairy loads from GLB, binds named nodes and animates');

const piece = makePiece('floorRound');
assert.equal(piece.userData.modelId, 'buildings.floorRound');
assert.ok(piece.children.length > 0);
console.log('✓ building pieces load from GLB');

const { geos, mats } = prepareHarvestAssets();
const node = makeNodeMesh('crystals', mulberry32(1), mats, geos);
assert.equal(node.userData.modelId, 'resources.crystals');
console.log('✓ harvest nodes load from GLB');

const quality = { shadows: false, vegetation: 0.05, fireflies: 20, waterSeg: 16 };
const terrain = buildTerrain(scene, quality);
const vegetation = buildVegetation(scene, quality);
assert.equal(vegetation.ancient.userData.modelId, 'environment.trees.ancient');
assert.ok(vegetation.ancient.userData.glow);
assert.ok(vegetation.group.children.some((o) => o.userData.modelId === 'environment.rocks.cave'));
assert.ok(terrain.colliders.length > 0 && vegetation.colliders.length > 0);
console.log('✓ terrain + vegetation consume GLB geometry and groups');

const collision = new CollisionWorld();
collision.addCircle(0, 0, 1, 0, 3);
const pos = new THREE.Vector3(0.4, 1, 0);
collision.resolve(pos, 0.5, 1, 1.4);
assert.ok(Math.hypot(pos.x, pos.z) >= 1.49);
console.log('✓ collision unchanged');

console.log('\nAll model regression checks passed.');
