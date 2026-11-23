import * as THREE from 'three';
import { heightAt, WATER_LEVEL, streamDistance, spots } from '../world/heightfield.js';
import { mulberry32, TAU } from '../core/utils.js';
import { Models } from '../assets/model-library.js';

const TYPES = {
  wood:      { color: 0xffc98a, base: 'wood',      amount: [2, 3], name: 'Woodpile' },
  leaves:    { color: 0x9fff9a, base: 'leaves',    amount: [2, 4], name: 'Leaf Bush' },
  flowers:   { color: 0xffa9d4, base: 'flowers',   amount: [2, 4], name: 'Flower Patch' },
  mushrooms: { color: 0xff9a9a, base: 'mushrooms', amount: [2, 3], name: 'Mushroom Ring' },
  stones:    { color: 0xd9e6e2, base: 'stones',    amount: [2, 4], name: 'Pebble Pile' },
  crystals:  { color: 0x9ddcff, base: 'crystals',  amount: [1, 2], name: 'Crystal Shard', rare: true },
  seeds:     { color: 0xffe9a1, base: 'seeds',     amount: [2, 4], name: 'Seed Pods' },
  dust:      { color: 0xfff0a8, base: 'dust',      amount: [1, 3], name: 'Fairy Dust' },
  dew:       { color: 0xc9b3ff, base: 'dew',       amount: [1, 1], name: 'Star Dew', rare: true },
};

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function prepareHarvestAssets() {
  return {
    geos: {
      log: new THREE.CylinderGeometry(0.13, 0.15, 0.9, 6),
      leaf: new THREE.IcosahedronGeometry(0.3, 0),
      stem: new THREE.CylinderGeometry(0.08, 0.1, 0.4, 5),
      cap: new THREE.SphereGeometry(0.32, 8, 5, 0, TAU, 0, Math.PI / 2),
      rock: new THREE.DodecahedronGeometry(0.5, 0),
      crystal: new THREE.OctahedronGeometry(0.4, 0),
      seed: new THREE.ConeGeometry(0.12, 0.32, 5),
      spark: new THREE.OctahedronGeometry(0.1, 0),
    },
    mats: {
      bark: new THREE.MeshLambertMaterial({ name: 'Bark', color: 0x9a6c48 }),
      leaf: new THREE.MeshLambertMaterial({ name: 'Leaf', color: 0x5fae5c }),
      stem: new THREE.MeshLambertMaterial({ name: 'Stem', color: 0xeee0c8 }),
      stone: new THREE.MeshLambertMaterial({ name: 'Stone', color: 0x929d9a }),
      crystal: new THREE.MeshStandardMaterial({ name: 'Crystal', color: 0xa8e2ff, emissive: 0x4c9ad0, emissiveIntensity: 1.3, roughness: 0.25 }),
      seed: new THREE.MeshLambertMaterial({ name: 'Seed', color: 0xdfc77d }),
      dust: new THREE.MeshBasicMaterial({ name: 'Dust', color: 0xfff2b0 }),
      flower: ['#f2a0c7', '#ffe08a', '#b9a5f5', '#f6f1ff', '#ffa979'].map((c) => new THREE.MeshLambertMaterial({ name: 'Flower', color: c, emissive: 0x222018 })),
      cap: ['#d46873', '#e59c70', '#c36bc0'].map((c) => new THREE.MeshLambertMaterial({ name: 'Cap', color: c })),
    },
  };
}

export function makeNodeMesh(type, rng, mats, geos) {
  const model = Models.create('resources.' + type);
  if (model) {
    model.scale.setScalar(0.85 + rng() * 0.4);
    return model;
  }
  return makeProceduralNodeMesh(type, rng, mats, geos);
}

export function makeProceduralNodeMesh(type, rng, mats, geos) {
  const g = new THREE.Group();
  g.name = 'Root';
  const s = 0.85 + rng() * 0.4;
  switch (type) {
    case 'wood':
      for (let i = 0; i < 3; i++) {
        const log = new THREE.Mesh(geos.log, mats.bark);
        log.scale.set(s, 0.8 + rng() * 0.4, s);
        log.position.set((i - 1) * 0.22, 0.14 + i * 0.13, (rng() - 0.5) * 0.25);
        log.rotation.z = Math.PI / 2 + (rng() - 0.5) * 0.2;
        log.rotation.y = rng() * TAU;
        g.add(log);
      }
      break;
    case 'leaves':
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(geos.leaf, mats.leaf);
        leaf.position.set((rng() - 0.5) * 0.7, 0.3 + rng() * 0.4, (rng() - 0.5) * 0.7);
        leaf.rotation.set(rng() * 3, rng() * 6, rng() * 3);
        leaf.scale.setScalar(0.7 + rng() * 0.6);
        g.add(leaf);
      }
      break;
    case 'flowers':
      for (let i = 0; i < 6; i++) {
        const f = new THREE.Mesh(geos.leaf, mats.flower[(rng() * mats.flower.length) | 0]);
        f.position.set((rng() - 0.5) * 0.9, 0.35 + rng() * 0.5, (rng() - 0.5) * 0.9);
        f.scale.set(0.6, 1.2, 0.6); f.rotation.z = (rng() - 0.5) * 0.6;
        g.add(f);
      }
      break;
    case 'mushrooms':
      for (let i = 0; i < 4; i++) {
        const st = new THREE.Mesh(geos.stem, mats.stem);
        const cap = new THREE.Mesh(geos.cap, mats.cap[(rng() * mats.cap.length) | 0]);
        const x = (rng() - 0.5) * 0.8, z = (rng() - 0.5) * 0.8, sc = 0.6 + rng() * 1.0;
        st.position.set(x, 0.22 * sc, z); st.scale.setScalar(sc);
        cap.position.set(x, 0.44 * sc, z); cap.scale.setScalar(sc);
        g.add(st, cap);
      }
      break;
    case 'stones':
      for (let i = 0; i < 5; i++) {
        const r = new THREE.Mesh(geos.rock, mats.stone);
        r.position.set((rng() - 0.5) * 0.9, 0.16 + rng() * 0.2, (rng() - 0.5) * 0.9);
        r.rotation.set(rng() * 3, rng() * 6, rng() * 3);
        r.scale.setScalar(0.35 + rng() * 0.55);
        g.add(r);
      }
      break;
    case 'crystals': case 'dew':
      for (let i = 0; i < 3; i++) {
        const c = new THREE.Mesh(geos.crystal, mats.crystal);
        c.position.set((rng() - 0.5) * 0.6, 0.35 + rng() * 0.35, (rng() - 0.5) * 0.6);
        c.rotation.set((rng() - 0.5) * 0.5, rng() * TAU, (rng() - 0.5) * 0.5);
        c.scale.set(0.5 + rng() * 0.5, 0.8 + rng() * 1.2, 0.5 + rng() * 0.5);
        g.add(c);
      }
      break;
    case 'seeds':
      for (let i = 0; i < 5; i++) {
        const sd = new THREE.Mesh(geos.seed, mats.seed);
        sd.position.set((rng() - 0.5) * 0.7, 0.35 + rng() * 0.6, (rng() - 0.5) * 0.7);
        sd.rotation.set(rng() * 3, rng() * 6, rng() * 3);
        sd.scale.setScalar(0.6 + rng() * 0.7);
        g.add(sd);
      }
      break;
    case 'dust':
      for (let i = 0; i < 7; i++) {
        const d = new THREE.Mesh(geos.spark, mats.dust);
        d.position.set((rng() - 0.5) * 1.1, 0.6 + rng() * 1.1, (rng() - 0.5) * 1.1);
        d.scale.setScalar(0.4 + rng() * 0.7);
        g.add(d);
      }
      break;
  }
  return g;
}

export class HarvestSystem {
  constructor(scene, engine) {
    this.engine = engine;
    this.group = new THREE.Group();
    this.group.name = 'harvest';
    scene.add(this.group);
    this.nodes = [];
    this.rng = mulberry32(77712);
    this.time = 0;
    this.glowTex = glowTexture();
    this._prepareAssets();
    this._populate();
  }

  _prepareAssets() {
    const assets = prepareHarvestAssets();
    this.geos = assets.geos;
    this.mats = assets.mats;
    this.glowMats = {};
    for (const [k, v] of Object.entries(TYPES)) {
      this.glowMats[k] = new THREE.SpriteMaterial({
        map: this.glowTex, color: v.color, transparent: true, opacity: v.rare ? 0.65 : 0.36,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
    }
  }

  _addNode(type, x, z, opts = {}) {
    const y = opts.y ?? heightAt(x, z);
    const node = {
      id: `${type}-${this.nodes.length}`, type, pos: new THREE.Vector3(x, y, z),
      active: true, respawnAt: 0, baseY: y,
      amount: opts.amount ?? (TYPES[type].amount[0] + ((this.rng() * (TYPES[type].amount[1] - TYPES[type].amount[0] + 1)) | 0)),
      rare: !!TYPES[type].rare,
    };
    const holder = new THREE.Group();
    holder.position.copy(node.pos);
    const mesh = makeNodeMesh(type, this.rng, this.mats, this.geos);
    holder.add(mesh);
    const sprite = new THREE.Sprite(this.glowMats[type].clone());
    sprite.position.y = type === 'dust' ? 1 : 0.6;
    sprite.scale.setScalar(type === 'dust' ? 2.4 : 1.7);
    holder.add(sprite);
    this.group.add(holder);
    node.obj = holder; node.mesh = mesh; node.sprite = sprite;
    node.phase = this.rng() * TAU;
    this.nodes.push(node);
    return node;
  }

  _populate() {
    const r = this.rng;
    const place = (type, count, minR, maxR, filter = () => true) => {
      let made = 0, tries = 0;
      while (made < count && tries < count * 40) {
        tries++;
        const a = r() * TAU, rad = minR + r() * (maxR - minR);
        const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
        if (Math.hypot(x, z) > 45 || heightAt(x, z) < WATER_LEVEL + 0.15) continue;
        if (streamDistance(x, z) < 2) continue;
        if (!filter(x, z)) continue;
        this._addNode(type, x, z); made++;
      }
    };
    place('wood', 24, 9, 44);
    place('leaves', 16, 7, 44);
    place('flowers', 16, 6, 44);
    place('mushrooms', 14, 8, 42);
    place('stones', 14, 7, 45);
    place('seeds', 12, 6, 44);
    place('dust', 8, 10, 43);
    place('crystals', 6, 24, 43, (x, z) => Math.hypot(x + 30, z - 21) < 13 || Math.hypot(x - 30, z + 26) < 12);
    this._addNode('crystals', -29.4, 22.8);
    this._addNode('crystals', -31.6, 21.2);
    this._addNode('dew', -22.6, -12.2, { y: heightAt(-22.6, -12.2) + 0.4 });
    this._addNode('dew', -29.5, 22.2);
    this._addNode('dew', 0, -3.6, { y: heightAt(0, -1.5) + 8.6 });
    this._addNode('dew', 17.5, 14, { y: 1.2 });
  }

  nearest(pos, radius = 3.4) {
    let best = null, bd = radius * radius;
    for (const n of this.nodes) {
      if (!n.active) continue;
      const dx = n.pos.x - pos.x, dy = (n.pos.y - pos.y) * 0.7, dz = n.pos.z - pos.z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  harvest(node) {
    if (!node?.active) return null;
    node.active = false;
    node.obj.visible = false;
    node.respawnAt = this.time + (node.rare ? 110 : 48 + this.rng() * 45);
    return { type: node.type, amount: node.amount, rare: node.rare, name: TYPES[node.type].name };
  }

  update(dt, playerPos) {
    this.time += dt;
    const near = this.nearest(playerPos);
    for (const n of this.nodes) {
      if (!n.active && this.time >= n.respawnAt) {
        n.active = true; n.obj.visible = true;
      }
      if (!n.active) continue;
      const t = this.time + n.phase;
      n.mesh.rotation.y += dt * (n.type === 'dust' ? 0.8 : 0.08);
      n.mesh.position.y = Math.sin(t * 1.5) * (n.type === 'dust' || n.type === 'dew' ? 0.16 : 0.025);
      const s = n === near ? 1.12 + Math.sin(t * 4) * 0.04 : 1;
      n.mesh.scale.setScalar(s);
      n.sprite.material.opacity = (n.rare ? 0.5 : 0.28) + Math.sin(t * 2.2) * 0.09 + (n === near ? 0.22 : 0);
    }
  }

  serialize() {
    return this.nodes.filter((n) => !n.active).map((n) => [n.id, Math.max(0, n.respawnAt - this.time)]);
  }

  restore(list) {
    if (!Array.isArray(list)) return;
    for (const [id, remaining] of list) {
      const n = this.nodes.find((x) => x.id === id);
      if (n) { n.active = false; n.respawnAt = this.time + remaining; n.obj.visible = false; }
    }
  }
}
