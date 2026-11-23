import * as THREE from 'three';
import { buildTerrain } from './terrain.js';
import { buildVegetation } from './vegetation.js';
import { buildBubble } from './bubble.js';
import { BUBBLE_RADIUS, heightAt, landHeight } from './heightfield.js';
import { clamp } from '../core/utils.js';

export class World {
  constructor(engine) {
    this.engine = engine;
    this.group = new THREE.Group();
    engine.scene.add(this.group);
    this.terrain = buildTerrain(this.group, engine.quality);
    this.vegetation = buildVegetation(this.group, engine.quality);
    this.bubble = buildBubble(this.group, engine.quality);
    this.elapsed = 0;
  }

  groundAt(x, z) { return landHeight(x, z); }

  collide(pos, radius = 0.5) {
    const r = Math.hypot(pos.x, pos.z);
    if (r > BUBBLE_RADIUS - 4) {
      const k = (BUBBLE_RADIUS - 4) / r;
      pos.x *= k; pos.z *= k;
    }
    const dx = pos.x;
    const dz = pos.z + 1.5;
    const d = Math.hypot(dx, dz);
    if (pos.y < 14 && d < 2.9 + radius) {
      const k = (2.9 + radius) / (d || 1);
      pos.x = dx * k;
      pos.z = dz * k - 1.5;
    }
    if (pos.y < -1.5) pos.y = -1.5;
  }

  update(dt) {
    this.elapsed += dt;
    const night = this.engine.isNight ? 1 : 0;
    this.terrain.update(dt, this.elapsed, night);
    this.vegetation.update(dt, this.elapsed, night);
    this.bubble.update(dt, this.elapsed, night);
  }
}
