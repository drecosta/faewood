import * as THREE from 'three';
import { buildTerrain } from './terrain.js';
import { buildVegetation } from './vegetation.js';
import { buildBubble } from './bubble.js';
import { CollisionWorld } from '../systems/collision.js';
import { BUBBLE_RADIUS, landHeight } from './heightfield.js';

export class World {
  constructor(engine) {
    this.engine = engine;
    this.group = new THREE.Group();
    engine.scene.add(this.group);
    this.terrain = buildTerrain(this.group, engine.quality);
    this.vegetation = buildVegetation(this.group, engine.quality);
    this.bubble = buildBubble(this.group, engine.quality);
    this.collision = new CollisionWorld();
    for (const c of this.terrain.colliders) this.collision.addCircle(c.x, c.z, c.r, c.y0, c.y1, c.support);
    for (const c of this.vegetation.colliders) this.collision.addCircle(c.x, c.z, c.r, c.y0, c.y1, c.support);
    this.elapsed = 0;
  }

  groundAt(x, z) { return landHeight(x, z); }

  collide(pos, radius = 0.5) {
    const r = Math.hypot(pos.x, pos.z);
    if (r > BUBBLE_RADIUS - 4) {
      const k = (BUBBLE_RADIUS - 4) / r;
      pos.x *= k; pos.z *= k;
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
