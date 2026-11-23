import { clamp } from '../core/utils.js';

const CELL = 6;

export class CollisionWorld {
  constructor() {
    this.circles = [];
    this.boxes = [];
    this.grid = new Map();
  }

  addCircle(x, z, r, y0, y1, support = false) {
    const c = { x, z, r, y0, y1, support };
    this.circles.push(c);
    const minX = Math.floor((x - r) / CELL), maxX = Math.floor((x + r) / CELL);
    const minZ = Math.floor((z - r) / CELL), maxZ = Math.floor((z + r) / CELL);
    for (let ix = minX; ix <= maxX; ix++) {
      for (let iz = minZ; iz <= maxZ; iz++) {
        const key = ix + ',' + iz;
        let list = this.grid.get(key);
        if (!list) { list = []; this.grid.set(key, list); }
        list.push(c);
      }
    }
    return c;
  }

  addBox(box, ref) { this.boxes.push({ box, ref }); }
  removeBox(ref) { this.boxes = this.boxes.filter((b) => b.ref !== ref); }
  clearBoxes() { this.boxes.length = 0; }

  _near(x, z, r) {
    const out = [];
    const minX = Math.floor((x - r) / CELL), maxX = Math.floor((x + r) / CELL);
    const minZ = Math.floor((z - r) / CELL), maxZ = Math.floor((z + r) / CELL);
    for (let ix = minX; ix <= maxX; ix++) {
      for (let iz = minZ; iz <= maxZ; iz++) {
        const list = this.grid.get(ix + ',' + iz);
        if (list) for (const c of list) if (!out.includes(c)) out.push(c);
      }
    }
    return out;
  }

  resolve(pos, radius, feetY, height) {
    const headY = feetY + height;
    for (let pass = 0; pass < 2; pass++) {
      for (const c of this._near(pos.x, pos.z, radius + 2)) {
        if (headY <= c.y0 + 0.05 || feetY >= c.y1 - 0.05) continue;
        if (c.y1 <= feetY + 0.42 && c.y1 > feetY - 0.15) continue;
        const dx = pos.x - c.x, dz = pos.z - c.z;
        const d2 = dx * dx + dz * dz;
        const rr = radius + c.r;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 0.0001;
        const push = rr - d;
        pos.x += (dx / d) * push;
        pos.z += (dz / d) * push;
      }

      for (const { box } of this.boxes) {
        if (box.max.y <= feetY + 0.14 || box.min.y >= headY - 0.08) continue;
        if (box.max.y <= feetY + 0.42 && box.max.y > feetY - 0.15) continue;
        const cx = clamp(pos.x, box.min.x, box.max.x);
        const cz = clamp(pos.z, box.min.z, box.max.z);
        let dx = pos.x - cx, dz = pos.z - cz;
        let d2 = dx * dx + dz * dz;
        if (d2 >= radius * radius) continue;
        if (d2 > 0.000001) {
          const d = Math.sqrt(d2);
          const push = radius - d;
          pos.x += (dx / d) * push;
          pos.z += (dz / d) * push;
        } else {
          const left = pos.x - box.min.x, right = box.max.x - pos.x;
          const back = pos.z - box.min.z, front = box.max.z - pos.z;
          const min = Math.min(left, right, back, front);
          if (min === left) pos.x = box.min.x - radius;
          else if (min === right) pos.x = box.max.x + radius;
          else if (min === back) pos.z = box.min.z - radius;
          else pos.z = box.max.z + radius;
        }
      }
    }
  }

  supportAt(x, z, feetY, prevFeetY, radius) {
    let best = -Infinity;
    for (const c of this.circles) {
      if (!c.support || c.y1 > prevFeetY + 0.22 || c.y1 <= best) continue;
      const dx = x - c.x, dz = z - c.z;
      if (dx * dx + dz * dz <= (radius + c.r) * (radius + c.r)) best = c.y1;
    }
    for (const { box } of this.boxes) {
      if (box.max.y > prevFeetY + 0.22 || box.max.y <= best) continue;
      const cx = clamp(x, box.min.x, box.max.x);
      const cz = clamp(z, box.min.z, box.max.z);
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz <= radius * radius) best = box.max.y;
    }
    return best;
  }

  ceilingAt(x, z, headY, prevHeadY, radius) {
    let best = Infinity;
    for (const { box } of this.boxes) {
      if (box.min.y < prevHeadY - 0.15 || box.min.y > headY + 0.2) continue;
      const cx = clamp(x, box.min.x, box.max.x);
      const cz = clamp(z, box.min.z, box.max.z);
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz <= radius * radius) best = Math.min(best, box.min.y);
    }
    return best;
  }
}
