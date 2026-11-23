const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function circle(x, y, cx, cy, r) { return Math.hypot(x - cx, y - cy) <= r; }
function mix(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }

function render(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      let c = mix([7, 25, 36], [19, 68, 76], Math.max(0, 1 - Math.hypot(u - 0.5, v - 0.45) * 1.5));
      const bubble = Math.hypot((u - 0.5) * 1.05, (v - 0.48) * 1.1);
      if (bubble < 0.42) {
        const rim = Math.max(0, 1 - Math.abs(bubble - 0.42) / 0.035);
        c = mix(c, [120, 240, 205], Math.max(0, (0.42 - bubble) * 0.7));
        c = mix(c, [190, 255, 230], rim);
        const ground = v > 0.68 && v < 0.87 && Math.abs(u - 0.5) < 0.34;
        if (ground) c = [74, 137, 87];
        const trunk = Math.abs(u - 0.5) < 0.035 && v > 0.44 && v < 0.73;
        if (trunk) c = [128, 88, 58];
        const canopies = [[0.5, 0.38, 0.14], [0.42, 0.44, 0.1], [0.58, 0.44, 0.11], [0.5, 0.29, 0.09]];
        for (const [cx, cy, r] of canopies) if (circle(u, v, cx, cy, r)) c = mix(c, [104, 190, 116], 0.85);
        for (const [cx, cy] of [[0.28, 0.62], [0.71, 0.6], [0.36, 0.72], [0.66, 0.74]]) {
          if (circle(u, v, cx, cy, 0.018)) c = [255, 220, 130];
        }
        const sx = u - 0.72, sy = v - 0.28;
        if (Math.abs(sx) < 0.012 && Math.abs(sy) < 0.06 || Math.abs(sy) < 0.012 && Math.abs(sx) < 0.06) c = [255, 245, 190];
      }
      const i = row + 1 + x * 4;
      raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2]; raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(dir, { recursive: true });
for (const size of [192, 512]) fs.writeFileSync(path.join(dir, `icon-${size}.png`), render(size));
console.log('icons written');
