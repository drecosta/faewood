import * as THREE from 'three';
import { WATER_LEVEL, BUBBLE_RADIUS, ISLAND_RADIUS, STREAM, spots } from './heightfield.js';
import { heightAt, streamDistance } from './heightfield.js';
import { mulberry32, clamp, fbm, TAU } from '../core/utils.js';
import { Models } from '../assets/model-library.js';

const tmpColor = new THREE.Color();
const soil = new THREE.Color('#6b5a43');
const moss = new THREE.Color('#4c7a4b');
const grass = new THREE.Color('#6fae63');
const brightGrass = new THREE.Color('#9ed878');
const sand = new THREE.Color('#c9bd87');
const stone = new THREE.Color('#8b9694');

export function buildTerrain(scene, quality) {
  const group = new THREE.Group();
  group.name = 'terrain';
  scene.add(group);

  const seg = quality.waterSeg * 4;
  const size = 116;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    const r = Math.hypot(x, z);
    const n = fbm(x * 0.3, z * 0.3, 2);
    if (h < WATER_LEVEL + 0.35) tmpColor.copy(sand).lerp(moss, clamp(h / 1.2, 0, 1));
    else if (r > 42) tmpColor.copy(stone).lerp(soil, n);
    else tmpColor.copy(grass).lerp(brightGrass, n * 0.8).lerp(moss, clamp((3.5 - h) * 0.15, 0, 0.45));
    colors[i * 3] = tmpColor.r; colors[i * 3 + 1] = tmpColor.g; colors[i * 3 + 2] = tmpColor.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.receiveShadow = quality.shadows;
  group.add(ground);

  const waterMat = new THREE.MeshPhongMaterial({
    color: 0x4fbfd2, transparent: true, opacity: 0.72, shininess: 90,
    specular: 0xd6ffff, side: THREE.DoubleSide, depthWrite: false,
  });
  const pondGeo = new THREE.CircleGeometry(spots.POND.r + 1.5, 48, 0, TAU);
  pondGeo.rotateX(-Math.PI / 2);
  const pond = new THREE.Mesh(pondGeo, waterMat);
  pond.position.set(spots.POND.x, WATER_LEVEL + 0.06, spots.POND.z);
  group.add(pond);

  const streamGeo = new THREE.BufferGeometry();
  const sp = [], su = [], idx = [];
  for (let i = 0; i < STREAM.length; i++) {
    const p = STREAM[i];
    const prev = STREAM[Math.max(0, i - 1)], next = STREAM[Math.min(STREAM.length - 1, i + 1)];
    const dx = next[0] - prev[0], dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, nz = dx / len;
    const w = 1.4 + i * 0.09;
    sp.push(p[0] + nx * w, WATER_LEVEL + 0.07, p[1] + nz * w);
    sp.push(p[0] - nx * w, WATER_LEVEL + 0.07, p[1] - nz * w);
    su.push(0, i / 2, 1, i / 2);
    if (i < STREAM.length - 1) {
      const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  streamGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  streamGeo.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
  streamGeo.setIndex(idx);
  streamGeo.computeVertexNormals();
  group.add(new THREE.Mesh(streamGeo, waterMat));

  const fallMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uNight; varying vec2 vUv;
      float hash(float n){ return fract(sin(n)*43758.5453); }
      void main(){
        float flow = fract(vUv.y*3.0 - uTime*0.9 + hash(floor(vUv.x*14.0))*0.7);
        float stripe = smoothstep(0.0,0.3,flow)*smoothstep(1.0,0.65,flow);
        float edge = smoothstep(0.0,0.12,vUv.x)*smoothstep(1.0,0.88,vUv.x);
        vec3 col = mix(vec3(0.45,0.85,0.95), vec3(0.85,1.0,1.0), stripe);
        col = mix(col, vec3(0.5,0.75,1.0), uNight*0.35);
        float a = (0.24 + stripe*0.4)*edge*smoothstep(0.0,0.12,vUv.y);
        gl_FragColor = vec4(col, a);
      }`,
  });
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 6.8), fallMat);
  fall.position.set(-22.1, 4.1, -12.4);
  fall.rotation.y = -0.78;
  group.add(fall);

  const mistGeo = new THREE.BufferGeometry();
  const mp = [];
  const rng = mulberry32(91);
  for (let i = 0; i < 46; i++) mp.push(-22 + (rng() - 0.5) * 6, rng() * 2.6, -12.3 + (rng() - 0.5) * 6);
  mistGeo.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
  const mist = new THREE.Points(mistGeo, new THREE.PointsMaterial({
    color: 0xd8ffff, size: 0.34, transparent: true, opacity: 0.32,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  }));
  group.add(mist);

  const rockGeo = Models.geometry('environment.rocks.rock', 'Rock', () => new THREE.DodecahedronGeometry(1, 0));
  const rockMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 190);
  const dummy = new THREE.Object3D();
  const colliders = [];
  let ri = 0;
  for (let i = 0; i < 500 && ri < 190; i++) {
    const a = rng() * TAU, r = 8 + rng() * 42;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = heightAt(x, z);
    if (h < WATER_LEVEL + 0.1 || streamDistance(x, z) < 2.8) continue;
    const s = 0.3 + rng() * 1.3;
    dummy.position.set(x, h + s * 0.25, z);
    dummy.rotation.set(rng() * 3, rng() * 6, rng() * 3);
    dummy.scale.set(s, s * (0.6 + rng() * 0.6), s);
    dummy.updateMatrix(); rocks.setMatrixAt(ri, dummy.matrix);
    tmpColor.set(rng() > 0.75 ? '#8b9c9b' : '#7e857c').multiplyScalar(0.85 + rng() * 0.3);
    rocks.setColorAt(ri, tmpColor);
    colliders.push({ x, z, r: s * 0.62, y0: h, y1: h + s * 1.2, support: true });
    ri++;
  }
  rocks.count = ri;
  rocks.instanceMatrix.needsUpdate = true;
  rocks.castShadow = quality.shadows; rocks.receiveShadow = quality.shadows;
  group.add(rocks);

  const lilyGeo = new THREE.CircleGeometry(0.65, 7);
  lilyGeo.rotateX(-Math.PI / 2);
  const lilies = new THREE.InstancedMesh(lilyGeo, new THREE.MeshLambertMaterial({ color: 0x5fbf78, side: THREE.DoubleSide }), 26);
  for (let i = 0; i < 26; i++) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * 8.5;
    dummy.position.set(spots.POND.x + Math.cos(a) * r, WATER_LEVEL + 0.12, spots.POND.z + Math.sin(a) * r);
    dummy.rotation.set(0, rng() * TAU, 0);
    dummy.scale.setScalar(0.6 + rng() * 0.9);
    dummy.updateMatrix(); lilies.setMatrixAt(i, dummy.matrix);
  }
  lilies.instanceMatrix.needsUpdate = true;
  group.add(lilies);

  return {
    group, colliders,
    update(dt, elapsed, night) {
      fallMat.uniforms.uTime.value = elapsed;
      fallMat.uniforms.uNight.value = night;
      const pos2 = mist.geometry.attributes.position;
      for (let i = 0; i < pos2.count; i++) {
        let y = pos2.getY(i) + dt * (0.3 + (i % 5) * 0.06);
        if (y > 2.8) y = 0;
        pos2.setY(i, y);
      }
      pos2.needsUpdate = true;
    },
  };
}
