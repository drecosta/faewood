import * as THREE from 'three';
import { PIECE_BY_ID, canAfford, costText } from './items.js';
import { heightAt, BUBBLE_RADIUS } from '../world/heightfield.js';
import { clamp, uid } from '../core/utils.js';

const M = {
  wood: new THREE.MeshLambertMaterial({ color: 0x9b6d49, flatShading: true }),
  plank: new THREE.MeshLambertMaterial({ color: 0xcf9f6a, flatShading: true }),
  plankDark: new THREE.MeshLambertMaterial({ color: 0x9e714b, flatShading: true }),
  leaf: new THREE.MeshLambertMaterial({ color: 0x6fbd68, flatShading: true }),
  leafBright: new THREE.MeshLambertMaterial({ color: 0x9ed97b, flatShading: true }),
  flower: new THREE.MeshLambertMaterial({ color: 0xf4a6c8 }),
  glass: new THREE.MeshPhongMaterial({ color: 0xbdeef2, transparent: true, opacity: 0.46, shininess: 100, side: THREE.DoubleSide, depthWrite: false }),
  stone: new THREE.MeshLambertMaterial({ color: 0x9aa4a1, flatShading: true }),
  crystal: new THREE.MeshStandardMaterial({ color: 0xafe4ff, emissive: 0x4b91c9, emissiveIntensity: 1.1, roughness: 0.2, flatShading: true }),
  rope: new THREE.MeshLambertMaterial({ color: 0xd6c396 }),
  cloth: new THREE.MeshLambertMaterial({ color: 0xe9b7d2 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0x8a6a20, emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.4 }),
  pot: new THREE.MeshLambertMaterial({ color: 0xb98a6a, flatShading: true }),
  seed: new THREE.MeshLambertMaterial({ color: 0x86c96e }),
};

const ghostGood = new THREE.MeshBasicMaterial({ color: 0x8dffc8, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });
const ghostBad = new THREE.MeshBasicMaterial({ color: 0xff8d9d, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });

function box(w, h, d, mat, x = 0, y = 0, z = 0, rz = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.z = rz; m.rotation.x = rx;
  return m;
}
function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); return m;
}
function ball(r, mat, x = 0, y = 0, z = 0, detail = 0) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), mat);
  m.position.set(x, y, z); return m;
}

export function makePiece(id) {
  const g = new THREE.Group();
  switch (id) {
    case 'floor':
      g.add(box(2, 0.18, 2, M.plank, 0, 0.09, 0));
      for (let i = -1; i <= 1; i++) g.add(box(1.95, 0.04, 0.045, M.plankDark, 0, 0.19, i * 0.62));
      for (const s of [-1, 1]) g.add(box(0.12, 0.3, 0.12, M.wood, s * 0.85, -0.06, s * 0.85));
      break;
    case 'floorRound':
      g.add(cyl(1.02, 1.02, 0.18, M.plank, 0, 0.09, 0, 14));
      g.add(cyl(0.95, 0.95, 0.04, M.leaf, 0, 0.2, 0, 14));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(ball(0.09, M.flower, Math.cos(a) * 0.75, 0.24, Math.sin(a) * 0.75)); }
      break;
    case 'floorGlass':
      g.add(box(2, 0.08, 2, M.glass, 0, 0.1, 0));
      for (const s of [-1, 1]) { g.add(box(2, 0.12, 0.1, M.plank, 0, 0.12, s * 0.95)); g.add(box(0.1, 0.12, 2, M.plank, s * 0.95, 0.12, 0)); }
      break;
    case 'wall':
      g.add(box(2, 2.2, 0.2, M.plank, 0, 1.1, 0));
      for (let i = 0; i < 3; i++) g.add(box(1.94, 0.06, 0.22, M.plankDark, 0, 0.45 + i * 0.65, 0));
      for (const s of [-1, 1]) g.add(cyl(0.08, 0.08, 2.25, M.wood, s * 0.96, 1.12, 0, 6));
      break;
    case 'wallWindow':
      g.add(box(2, 0.55, 0.2, M.plank, 0, 0.28, 0));
      g.add(box(2, 0.5, 0.2, M.plank, 0, 1.95, 0));
      for (const s of [-1, 1]) g.add(box(0.26, 2.2, 0.2, M.plank, s * 0.87, 1.1, 0));
      g.add(box(1.5, 1.2, 0.06, M.glass, 0, 1.2, 0));
      g.add(box(0.05, 1.2, 0.1, M.plankDark, 0, 1.2, 0));
      break;
    case 'halfWall':
      g.add(box(2, 0.12, 0.16, M.plank, 0, 0.9, 0));
      g.add(box(2, 0.12, 0.16, M.plank, 0, 0.45, 0));
      for (let i = -1; i <= 1; i++) g.add(cyl(0.05, 0.05, 0.95, M.wood, i * 0.9, 0.48, 0, 6));
      break;
    case 'pillar':
      g.add(cyl(0.19, 0.22, 2.4, M.wood, 0, 1.2, 0, 8));
      g.add(box(0.55, 0.14, 0.55, M.plankDark, 0, 2.4, 0));
      break;
    case 'roof':
      g.add(box(2.5, 0.13, 2.5, M.plankDark, 0, 0.07, 0));
      g.add(box(2.6, 0.14, 1.5, M.leaf, 0, 0.62, -0.61, 0, -0.68));
      g.add(box(2.6, 0.14, 1.5, M.leafBright, 0, 0.62, 0.61, 0, 0.68));
      g.add(box(2.7, 0.1, 0.16, M.plank, 0, 1.12, 0));
      break;
    case 'roofCone':
      g.add(cyl(0, 1.5, 1.8, M.leaf, 0, 0.9, 0, 8));
      g.add(cyl(0, 0.5, 0.5, M.leafBright, 0, 1.85, 0, 8));
      g.add(ball(0.14, M.gold, 0, 2.12, 0));
      break;
    case 'roofMoss':
      g.add(box(2.4, 0.12, 2.4, M.plank, 0, 0.06, 0));
      for (let i = 0; i < 7; i++) {
        const x = (i % 3 - 1) * 0.7, z = ((i / 3) | 0) * 0.8 - 0.8;
        g.add(ball(0.45 + (i % 3) * 0.06, i % 2 ? M.leaf : M.leafBright, x, 0.35, z));
      }
      for (let i = 0; i < 5; i++) g.add(ball(0.09, M.flower, (i - 2) * 0.4, 0.66, (i % 2) * 0.6 - 0.3));
      break;
    case 'door':
      for (const s of [-1, 1]) g.add(box(0.22, 2.2, 0.24, M.plank, s * 0.5, 1.1, 0));
      g.add(box(1.2, 0.24, 0.24, M.plank, 0, 2.08, 0));
      g.add(box(0.75, 1.7, 0.05, M.glass, 0, 0.95, 0));
      g.add(ball(0.07, M.gold, 0.34, 0.95, 0.12));
      break;
    case 'ladder':
      for (const s of [-1, 1]) g.add(cyl(0.045, 0.045, 2.6, M.rope, s * 0.28, 1.3, 0, 6));
      for (let i = 0; i < 9; i++) g.add(cyl(0.055, 0.055, 0.62, M.wood, 0, 0.18 + i * 0.29, 0, 6).rotateZ(Math.PI / 2));
      break;
    case 'stairs':
      for (let i = 0; i < 6; i++) g.add(box(1.3, 0.15, 0.36, M.plank, 0, 0.11 + i * 0.21, 0.85 - i * 0.34));
      for (const s of [-1, 1]) g.add(box(0.08, 0.09, 2.15, M.plankDark, s * 0.62, 0.65, 0, 0, 0.54));
      break;
    case 'bridge':
      for (let i = 0; i < 10; i++) g.add(box(0.32, 0.12, 1.1, M.plank, -1.8 + i * 0.4, 0.06 + Math.sin(i * 0.7) * 0.02, 0));
      for (const s of [-1, 1]) {
        const rope = cyl(0.035, 0.035, 4.1, M.rope, 0, 0.62, s * 0.5, 6);
        rope.rotation.z = Math.PI / 2; g.add(rope);
        for (let i = 0; i < 6; i++) g.add(cyl(0.02, 0.02, 0.6, M.rope, -1.7 + i * 0.68, 0.35, s * 0.5, 5));
      }
      break;
    case 'balcony':
      g.add(box(3, 0.16, 1.5, M.plank, 0, 0.08, 0));
      g.add(box(3, 0.1, 0.1, M.plankDark, 0, 1, 0.7));
      for (let i = -1; i <= 1; i++) g.add(cyl(0.05, 0.05, 1, M.wood, i * 1.35, 0.5, 0.7, 6));
      break;
    case 'bed':
      g.add(box(1.5, 0.25, 2, M.plank, 0, 0.16, 0));
      g.add(box(1.42, 0.25, 1.8, M.cloth, 0, 0.4, 0.05));
      g.add(box(1.15, 0.14, 0.45, M.gold, 0, 0.52, -0.68));
      for (const s of [-1, 1]) g.add(cyl(0.07, 0.07, 0.55, M.wood, s * 0.6, 0.28, -0.95, 6));
      break;
    case 'table':
      g.add(cyl(0.72, 0.72, 0.1, M.plank, 0, 0.78, 0, 12));
      g.add(cyl(0.11, 0.14, 0.75, M.wood, 0, 0.38, 0, 8));
      g.add(cyl(0.38, 0.42, 0.08, M.wood, 0, 0.04, 0, 8));
      break;
    case 'chair':
      g.add(box(0.75, 0.1, 0.75, M.plank, 0, 0.5, 0));
      g.add(box(0.75, 0.75, 0.1, M.plank, 0, 0.88, -0.33));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.045, 0.045, 0.5, M.wood, sx * 0.3, 0.25, sz * 0.3, 5));
      break;
    case 'shelf':
      g.add(box(1.6, 0.12, 0.6, M.plank, 0, 0.1, 0));
      for (let i = 0; i < 3; i++) g.add(box(1.6, 0.1, 0.6, M.plank, 0, 0.55 + i * 0.55, 0));
      for (const s of [-1, 1]) g.add(box(0.1, 1.7, 0.6, M.plankDark, s * 0.75, 0.85, 0));
      g.add(box(0.32, 0.3, 0.3, M.glass, -0.4, 1.27, 0));
      g.add(ball(0.16, M.flower, 0.4, 0.8, 0));
      break;
    case 'wardrobe':
      g.add(box(1.2, 1.95, 0.8, M.plank, 0, 1, 0));
      g.add(box(0.55, 1.7, 0.06, M.plankDark, -0.28, 1, 0.43));
      g.add(box(0.55, 1.7, 0.06, M.plankDark, 0.28, 1, 0.43));
      g.add(box(0.35, 0.5, 0.04, M.glass, 0, 1.35, 0.47));
      g.add(ball(0.055, M.gold, -0.06, 1, 0.49)); g.add(ball(0.055, M.gold, 0.06, 1, 0.49));
      break;
    case 'lanternPost':
      g.add(cyl(0.07, 0.1, 2, M.wood, 0, 1, 0, 7));
      g.add(box(0.42, 0.08, 0.42, M.plankDark, 0, 2.02, 0));
      g.add(box(0.34, 0.45, 0.34, M.gold, 0, 2.25, 0));
      g.add(box(0.24, 0.34, 0.24, new THREE.MeshBasicMaterial({ color: 0xfff0b0 }), 0, 2.25, 0));
      g.add(cyl(0, 0.3, 0.25, M.plank, 0, 2.58, 0, 4));
      break;
    case 'crystalLamp':
      g.add(cyl(0.22, 0.28, 0.18, M.stone, 0, 0.09, 0, 7));
      g.add(cyl(0.05, 0.05, 0.5, M.wood, 0, 0.35, 0, 6));
      g.add(ball(0.34, M.crystal, 0, 0.82, 0));
      break;
    case 'flowerBox':
      g.add(box(1.4, 0.35, 0.6, M.plank, 0, 0.18, 0));
      g.add(box(1.25, 0.1, 0.45, M.pot, 0, 0.38, 0));
      for (let i = 0; i < 5; i++) {
        const x = -0.5 + i * 0.25;
        g.add(cyl(0.02, 0.02, 0.32, M.seed, x, 0.58, 0, 5));
        g.add(ball(0.12, M.flower, x, 0.75, 0));
      }
      break;
    case 'plantPot':
      g.add(cyl(0.26, 0.2, 0.42, M.pot, 0, 0.21, 0, 8));
      g.add(ball(0.32, M.seed, 0, 0.55, 0));
      g.add(ball(0.14, M.flower, 0.16, 0.8, 0.05));
      break;
    case 'mushroomSeat':
      g.add(cyl(0.12, 0.17, 0.42, M.plank, 0, 0.21, 0, 7));
      g.add(cyl(0, 0.5, 0.34, new THREE.MeshLambertMaterial({ color: 0xd36e78 }), 0, 0.55, 0, 9));
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; g.add(ball(0.07, M.glass, Math.cos(a) * 0.3, 0.53, Math.sin(a) * 0.3)); }
      break;
    case 'windChime':
      g.add(cyl(0.05, 0.05, 1.3, M.wood, 0, 0.65, 0, 6));
      g.add(box(0.7, 0.07, 0.07, M.wood, 0, 1.28, 0));
      for (let i = -1; i <= 1; i++) {
        g.add(cyl(0.012, 0.012, 0.4, M.rope, i * 0.22, 1.05, 0, 4));
        g.add(cyl(0.045, 0.045, 0.35 + (i + 1) * 0.08, M.crystal, i * 0.22, 0.68, 0, 6));
      }
      break;
    case 'rug':
      g.add(cyl(1.02, 1.02, 0.04, M.cloth, 0, 0.02, 0, 16));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(ball(0.12, M.flower, Math.cos(a) * 0.72, 0.06, Math.sin(a) * 0.72)); }
      break;
    case 'sign':
      g.add(cyl(0.06, 0.06, 1.2, M.wood, 0, 0.6, 0, 6));
      g.add(box(0.9, 0.45, 0.08, M.plank, 0, 1.12, 0));
      g.add(box(0.6, 0.04, 0.09, M.plankDark, 0, 1.2, 0.05));
      g.add(box(0.5, 0.04, 0.09, M.plankDark, 0, 1.05, 0.05));
      break;
    default:
      g.add(box(1, 0.2, 1, M.plank, 0, 0.1, 0));
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export class BuildSystem {
  constructor(engine, world, inventory, audio, onChange = () => {}) {
    this.engine = engine; this.world = world; this.inventory = inventory; this.audio = audio;
    this.onChange = onChange;
    this.group = new THREE.Group();
    this.group.name = 'buildings';
    engine.scene.add(this.group);
    this.pieces = [];
    this.active = false;
    this.pieceId = null;
    this.rot = 0;
    this.elevation = 0;
    this.snapping = true;
    this.mode = 'place';
    this.hovered = null;
    this.ghost = null;
    this.ghostMat = ghostGood;
    this.valid = false;
    this.target = new THREE.Vector3();
    this.surface = 'ground';
    this.raycaster = new THREE.Raycaster();
    this.center = new THREE.Vector2(0, 0);
    const dummy = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
    this.selection = new THREE.BoxHelper(dummy, 0xff8d9d);
    this.selection.visible = false;
    engine.scene.add(this.selection);
    this._moving = null;
    this._tmpV = new THREE.Vector3();
  }

  get piece() { return PIECE_BY_ID[this.pieceId]; }

  begin(pieceId) {
    if (!PIECE_BY_ID[pieceId]) return;
    this.end(true);
    this.active = true;
    this.pieceId = pieceId;
    this.mode = 'place';
    this.rot = 0; this.elevation = 0;
    this._makeGhost();
    this.onChange();
  }

  beginMove(pieceId) {
    this.active = true;
    this.pieceId = pieceId;
    this.mode = 'place';
    this.rot = 0; this.elevation = 0;
    this._makeGhost();
    this.onChange();
  }

  end(silent = false) {
    if (this.selection) this.selection.visible = false;
    if (this.ghost) { this.engine.scene.remove(this.ghost); this.ghost = null; }
    this.active = false; this.pieceId = null; this.hovered = null;
    this._moving = null;
    if (!silent) this.onChange();
  }

  _makeGhost() {
    if (this.ghost) this.engine.scene.remove(this.ghost);
    this.ghost = makePiece(this.pieceId);
    this.ghost.traverse((o) => {
      if (o.isMesh) {
        o.material = ghostGood;
        o.castShadow = false; o.receiveShadow = false;
      }
    });
    this.ghost.visible = false;
    this.engine.scene.add(this.ghost);
  }

  rotate(dir) {
    if (!this.active) return;
    this.rot = (this.rot + dir * Math.PI / 2 + Math.PI * 4) % (Math.PI * 2);
    this.onChange();
  }
  elevate(dir) { if (this.active) { this.elevation = clamp(this.elevation + dir * 0.5, -8, 20); this.onChange(); } }
  toggleSnap() { this.snapping = !this.snapping; this.onChange(); return this.snapping; }
  toggleMode(mode) {
    if (!this.active) return;
    this.mode = this.mode === mode ? 'place' : mode;
    if (this.ghost) this.ghost.visible = this.mode === 'place';
    if (this.mode !== 'place') this.selection.visible = false;
    this.onChange();
  }

  _findSurface(ray) {
    ray.far = 30;
    const targets = [this.group, this.world.terrain.group.children[0]];
    const hits = ray.intersectObjects(targets, true);
    for (const h of hits) {
      if (!h.object.visible || h.distance < 0.5) continue;
      if (h.object.parent === this.group || this._isDescendant(h.object, this.group)) {
        const root = this._rootPiece(h.object);
        return { point: h.point, piece: root, built: true };
      }
      if (h.object === this.world.terrain.group.children[0]) return { point: h.point, piece: null, built: false };
    }
    return null;
  }
  _isDescendant(obj, parent) { let o = obj; while (o) { if (o === parent) return true; o = o.parent; } return false; }
  _rootPiece(obj) { let o = obj; while (o && o.parent !== this.group) o = o.parent; return o; }

  update(dt, playerPos) {
    if (!this.active) return;
    this.raycaster.setFromCamera(this.center, this.engine.camera);
    const hit = this._findSurface(this.raycaster);

    if (this.mode === 'remove' || this.mode === 'move') {
      const root = hit?.piece || null;
      if (root !== this.hovered) {
        this.hovered = root;
        if (root) { this.selection.setFromObject(root); this.selection.visible = true; }
        else this.selection.visible = false;
      } else if (root) this.selection.update();
      return;
    }

    let p;
    if (hit) {
      p = hit.point.clone();
      this.surface = hit.built ? 'structure' : 'ground';
    } else {
      const yaw = this.engine.camera.rotation.y;
      const fwd = this._tmpV.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      p = playerPos.clone().addScaledVector(fwd, 3.2);
      p.y = this.world.groundAt(p.x, p.z);
      this.surface = 'air';
    }
    if (this.snapping) {
      p.x = Math.round(p.x);
      p.z = Math.round(p.z);
      p.y = Math.round(p.y * 2) / 2;
    }
    p.y += this.elevation;
    this.target.copy(p);

    const cost = this.piece.cost || {};
    const affordable = !!this._moving || canAfford(this.inventory.items, cost);
    const inside = Math.hypot(p.x, p.z) < BUBBLE_RADIUS - 8 && p.y > -1 && p.y < 24;
    const awayFromTree = Math.hypot(p.x, p.z + 1.5) > 3.2 || p.y > 14;
    const overlap = this.pieces.some((b) => b.obj.position.distanceToSquared(p) < 0.09 && b.pieceId === this.pieceId);
    this.valid = affordable && inside && awayFromTree && !overlap;

    this.ghost.visible = true;
    this.ghost.position.copy(p);
    this.ghost.rotation.y = this.rot;
    const mat = this.valid ? ghostGood : ghostBad;
    if (this.ghostMat !== mat) { this.ghost.traverse((o) => { if (o.isMesh) o.material = mat; }); this.ghostMat = mat; }
  }

  place() {
    if (!this.active || this.mode !== 'place' || !this.ghost?.visible) return false;
    if (!this.valid) { this.audio.sfx('error'); return false; }
    const piece = PIECE_BY_ID[this.pieceId];
    if (!this._moving && !this.inventory.spend(piece.cost)) { this.audio.sfx('error'); return false; }
    if (this._moving) {
      const b = this._moving;
      b.obj.position.copy(this.target);
      b.obj.rotation.y = this.rot;
      b.x = this.target.x; b.y = this.target.y; b.z = this.target.z; b.r = this.rot;
      this._moving = null;
      this.audio.sfx('place');
      this.end();
      return true;
    }
    const obj = makePiece(this.pieceId);
    obj.position.copy(this.target);
    obj.rotation.y = this.rot;
    this.group.add(obj);
    this.pieces.push({
      id: uid(), pieceId: this.pieceId, x: this.target.x, y: this.target.y, z: this.target.z, r: this.rot, obj,
    });
    if (piece.light) {
      const light = new THREE.PointLight(0xffd98a, 1.2, 8, 2);
      light.position.y = Math.min(2.2, piece.h + 0.4);
      obj.add(light);
    }
    this.audio.sfx('place');
    this.onChange();
    return true;
  }

  remove() {
    if (!this.active) return false;
    if (this.mode === 'place' || !this.hovered) return false;
    const idx = this.pieces.findIndex((b) => b.obj === this.hovered);
    if (idx < 0) return false;
    const b = this.pieces[idx];
    const piece = PIECE_BY_ID[b.pieceId];
    if (this.mode === 'remove') {
      for (const [k, v] of Object.entries(piece.cost)) this.inventory.add(k, Math.max(1, Math.floor(v / 2)));
      this.group.remove(b.obj);
      this.pieces.splice(idx, 1);
      this.selection.visible = false; this.hovered = null;
      this.audio.sfx('remove');
      this.onChange();
      return true;
    }
    if (this.mode === 'move') {
      this._moving = b;
      this.pieceId = b.pieceId;
      this.mode = 'place';
      this.rot = b.r; this.elevation = 0;
      this.selection.visible = false; this.hovered = null;
      this._makeGhost();
      this.onChange();
      return true;
    }
    return false;
  }

  serialize() {
    return this.pieces.map(({ id, pieceId, x, y, z, r }) => ({ id, pieceId, x, y, z, r }));
  }

  restore(list) {
    if (!Array.isArray(list)) return;
    this.pieces.forEach((b) => this.group.remove(b.obj));
    this.pieces = [];
    for (const s of list) {
      if (!PIECE_BY_ID[s.pieceId]) continue;
      const obj = makePiece(s.pieceId);
      obj.position.set(s.x, s.y, s.z);
      obj.rotation.y = s.r || 0;
      this.group.add(obj);
      this.pieces.push({ id: s.id || uid(), pieceId: s.pieceId, x: s.x, y: s.y, z: s.z, r: s.r || 0, obj });
      if (PIECE_BY_ID[s.pieceId].light) {
        const l = new THREE.PointLight(0xffd98a, 1.2, 8, 2);
        l.position.y = 2.2; obj.add(l);
      }
    }
    this.onChange();
  }

  status() {
    if (!this.active) return '';
    const p = this.piece;
    const reason = !this.valid
      ? (!canAfford(this.inventory.items, p.cost) && !this._moving ? ' · need ' + costText(p.cost) : ' · blocked')
      : '';
    return `${this._moving ? 'Moving' : 'Placing'} <b>${p.name}</b> · ${this.surface}${this.snapping ? ' · snap' : ' · free'}${reason}`;
  }
}
