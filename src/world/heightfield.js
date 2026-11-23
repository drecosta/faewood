import { fbm, clamp, smoothstep } from '../core/utils.js';

export const WATER_LEVEL = 0;
export const BUBBLE_RADIUS = 62;
export const ISLAND_RADIUS = 51;

const POND = { x: 18, z: 15, r: 10 };
export const STREAM = [
  [-25, -15], [-20, -11], [-14, -10], [-8, -6], [-2, -3],
  [4, 0], [9, 5], [13, 10], [18, 15],
];
const CLIFF = { x: -26, z: -16, r: 8 };

export function segmentDistance(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export function streamDistance(x, z) {
  let d = Infinity;
  for (let i = 0; i < STREAM.length - 1; i++) {
    d = Math.min(d, segmentDistance(x, z, ...STREAM[i], ...STREAM[i + 1]));
  }
  return d;
}

export function heightAt(x, z) {
  const r = Math.hypot(x, z);
  const edge = 1 - smoothstep(clamp((r - 30) / 20, 0, 1));
  let h = (fbm(x * 0.035 + 11, z * 0.035 - 7, 3) - 0.42) * 7.5 * edge;
  h += (fbm(x * 0.11 - 3, z * 0.11 + 19, 2) - 0.5) * 1.15 * edge;

  const cd = Math.hypot(x - CLIFF.x, z - CLIFF.z);
  if (cd < CLIFF.r + 4) h += (1 - smoothstep(clamp(cd / (CLIFF.r + 4), 0, 1))) * 7.2;

  const pondD = Math.hypot(x - POND.x, z - POND.z);
  if (pondD < POND.r + 4) h -= (1 - smoothstep(clamp(pondD / (POND.r + 4), 0, 1))) * 3.6;

  const sd = streamDistance(x, z);
  if (sd < 2.6 && x > -24) h -= (1 - smoothstep(clamp(sd / 2.6, 0, 1))) * 1.9;

  const clearing = 1 - smoothstep(clamp(r / 12, 0, 1));
  h = h * (1 - clearing * 0.88) + 2.2 * clearing;

  h -= smoothstep(clamp((r - 42) / 9, 0, 1)) * 10;
  return h;
}

export function landHeight(x, z) { return Math.max(heightAt(x, z), WATER_LEVEL + 0.06); }

export function isWater(x, z) { return heightAt(x, z) < WATER_LEVEL; }

export const spots = { POND, CLIFF, STREAM };
