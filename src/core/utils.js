export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const TAU = Math.PI * 2;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x, z) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function noise2(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = smoothstep(x - ix), fz = smoothstep(z - iz);
  return lerp(
    lerp(hash2(ix, iz), hash2(ix + 1, iz), fx),
    lerp(hash2(ix, iz + 1), hash2(ix + 1, iz + 1), fx),
    fz
  );
}

export function fbm(x, z, octaves = 3) {
  let v = 0, amp = 0.5, f = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    v += noise2(x * f, z * f) * amp;
    total += amp; amp *= 0.5; f *= 2;
  }
  return v / total;
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

export function timeLabel(t) {
  const h = (t * 24 + 6) % 24;
  if (h < 5) return 'Deep Night';
  if (h < 8) return 'Dawn';
  if (h < 11) return 'Morning';
  if (h < 16) return 'Sunshine';
  if (h < 19) return 'Golden Hour';
  if (h < 21) return 'Dusk';
  return 'Night';
}

export const uid = () => Math.random().toString(36).slice(2, 10);
