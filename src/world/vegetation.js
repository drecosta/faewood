import * as THREE from 'three';
import { heightAt, WATER_LEVEL, streamDistance, spots } from './heightfield.js';
import { mulberry32, TAU } from '../core/utils.js';
import { Models } from '../assets/model-library.js';
import { applyWind as windify } from '../assets/shader-materials.js';

const tmp = new THREE.Object3D();
const col = new THREE.Color();

function scatter(rng, count, tryFn, placeFn) {
  let made = 0, tries = 0;
  while (made < count && tries < count * 22) {
    tries++;
    if (tryFn(rng)) { placeFn(rng, made); made++; }
  }
  return made;
}

function validSpot(x, z, minR = 11) {
  const r = Math.hypot(x, z);
  if (r < minR || r > 47) return false;
  const h = heightAt(x, z);
  if (h < WATER_LEVEL + 0.2 || streamDistance(x, z) < 2.4) return false;
  if (Math.hypot(x - spots.CLIFF.x, z - spots.CLIFF.z) < 6) return false;
  if (Math.hypot(x - spots.POND.x, z - spots.POND.z) < 11) return false;
  return true;
}

export function vegetationPrototypes() {
  return new Map([
    ['environment.trees.trunk', ['Trunk', new THREE.CylinderGeometry(0.3, 0.52, 4, 6)]],
    ['environment.trees.crown', ['Crown', new THREE.IcosahedronGeometry(1, 0)]],
    ['environment.trees.crownCone', ['CrownCone', new THREE.ConeGeometry(1, 1.8, 6)]],
    ['environment.plants.grass', ['Grass', new THREE.ConeGeometry(0.16, 0.85, 3)]],
    ['environment.plants.flowerStem', ['Stem', new THREE.CylinderGeometry(0.03, 0.04, 0.6, 4)]],
    ['environment.plants.flowerHead', ['Head', new THREE.IcosahedronGeometry(0.22, 0)]],
    ['environment.plants.bush', ['Bush', new THREE.IcosahedronGeometry(1, 0)]],
    ['environment.mushrooms.stem', ['Stem', new THREE.CylinderGeometry(0.13, 0.18, 0.5, 6)]],
    ['environment.mushrooms.cap', ['Cap', new THREE.SphereGeometry(0.46, 8, 5, 0, TAU, 0, Math.PI / 2)]],
    ['environment.crystals.shard', ['Shard', new THREE.OctahedronGeometry(0.6, 0)]],
  ]);
}

function modelGeometry(id, node, fallback) {
  const config = Models.get(id);
  return Models.geometry(id, config?.node || node, fallback);
}

export function createAncientTree(quality = { shadows: true }, uniforms = { uTime: { value: 0 } }, rng = mulberry32(1)) {
  const ancient = new THREE.Group();
  ancient.name = 'AncientTree';
  ancient.position.set(0, 2.2, -1.5);
  const colliders = [{ x: 0, z: -1.5, r: 2.9, y0: 2.2, y1: 18 }];
  const barkMat = new THREE.MeshLambertMaterial({ name: 'Bark', color: 0x7d5b43, flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 2.6, 15, 9, 3), barkMat);
  trunk.name = 'AncientTrunk';
  trunk.position.y = 7.5;
  ancient.add(trunk);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    const root = new THREE.Mesh(new THREE.ConeGeometry(0.75, 3.4, 6), barkMat);
    root.name = `AncientRoot${i}`;
    root.position.set(Math.cos(a) * 2.1, 0.8, Math.sin(a) * 2.1);
    root.rotation.z = Math.cos(a) * 1.15;
    root.rotation.x = -Math.sin(a) * 1.15;
    ancient.add(root);
  }
  const leafMat = new THREE.MeshLambertMaterial({ name: 'Canopy', color: 0xffffff, flatShading: true });
  windify(leafMat, uniforms, 0.02);
  const canopyGeo = new THREE.IcosahedronGeometry(1, 1);
  const canopySpec = [
    [0, 15.8, 0, 6.8, '#5fa76a'], [-4.2, 13.6, 1.8, 4.5, '#77bd72'],
    [4.4, 13.9, -1.6, 4.7, '#6fb46b'], [1.2, 13.2, 4.4, 4.3, '#87c878'],
    [-1.8, 14.2, -4.5, 4.1, '#549c64'], [-5, 11.8, -3.2, 3.2, '#8ecb7d'],
    [5.2, 12, 3.4, 3.3, '#6eb16a'], [0, 18.5, 0, 4.4, '#93d488'],
  ];
  canopySpec.forEach(([x, y, z, s, c], i) => {
    const m = new THREE.Mesh(canopyGeo, leafMat.clone());
    m.name = `Canopy${i}`;
    m.position.set(x, y, z);
    m.scale.set(s, s * 0.77, s);
    m.material.color.set(c);
    windify(m.material, uniforms, 0.02);
    ancient.add(m);
  });
  const vineMat = new THREE.MeshLambertMaterial({ name: 'Vine', color: 0x5c9a58 });
  for (let i = 0; i < 9; i++) {
    const a = rng() * TAU, r = 5 + rng() * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x * 0.72, 15.5, z * 0.72),
      new THREE.Vector3(x, 13, z),
      new THREE.Vector3(x + 0.5, 9 + rng() * 2, z),
      new THREE.Vector3(x - 0.3, 5 + rng() * 3, z + 0.4),
    ]);
    const vine = new THREE.Mesh(new THREE.TubeGeometry(curve, 9, 0.075, 4, false), vineMat);
    vine.name = `Vine${i}`;
    ancient.add(vine);
  }
  const glow = new THREE.PointLight(0x9dffd2, 2.6, 26, 2);
  glow.position.set(0, 9, 0);
  ancient.add(glow);
  ancient.traverse((o) => {
    if (o.isMesh) { o.castShadow = quality.shadows; o.receiveShadow = quality.shadows; }
  });
  return { ancient, colliders, glow };
}

export function createCave(quality = { shadows: true }) {
  const cave = new THREE.Group();
  cave.name = 'Cave';
  cave.position.set(-30, heightAt(-30, 22), 22);
  const colliders = [{ x: -30, z: 22, r: 5.2, y0: heightAt(-30, 22), y1: heightAt(-30, 22) + 5.6, support: true }];
  const caveRock = new THREE.Mesh(new THREE.IcosahedronGeometry(5.5, 1), new THREE.MeshLambertMaterial({ name: 'CaveRock', color: 0x555f5c, flatShading: true }));
  caveRock.name = 'CaveRock';
  caveRock.scale.set(1.2, 0.9, 1);
  caveRock.position.y = 3;
  cave.add(caveRock);
  const caveMouth = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 10), new THREE.MeshBasicMaterial({ name: 'CaveMouth', color: 0x08151c }));
  caveMouth.name = 'CaveMouth';
  caveMouth.scale.set(1, 1.2, 0.5);
  caveMouth.position.set(2.6, 1.9, 0);
  cave.add(caveMouth);
  const caveLight = new THREE.PointLight(0x7fb4ff, 1.5, 16, 2);
  caveLight.position.set(3.5, 2, 0);
  cave.add(caveLight);
  cave.traverse((o) => { if (o.isMesh) o.castShadow = quality.shadows; });
  return { cave, colliders, caveLight };
}

export function buildVegetation(scene, quality) {
  const group = new THREE.Group();
  group.name = 'vegetation';
  scene.add(group);
  const uniforms = Models.windUniforms;
  const colliders = [];
  const density = quality.vegetation;
  const rng = mulberry32(20240520);

  const proceduralAncient = createAncientTree(quality, uniforms, rng);
  const ancient = Models.create('environment.trees.ancient') || proceduralAncient.ancient;
  if (ancient === proceduralAncient.ancient) {
    ancient.traverse((o) => { if (o.isMesh) o.castShadow = quality.shadows; });
  } else {
    const glow = new THREE.PointLight(0x9dffd2, 2.6, 26, 2);
    glow.position.set(0, 9, 0);
    (ancient.getObjectByName('AncientTree') || ancient).add(glow);
    ancient.userData.glow = glow;
  }
  colliders.push(...proceduralAncient.colliders);
  group.add(ancient);
  const glow = ancient.userData.glow || proceduralAncient.glow;

  const treeCount = Math.floor(140 * density);
  const barkMat = new THREE.MeshLambertMaterial({ color: 0x7d5b43, flatShading: true });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
  windify(leafMat, uniforms, 0.02);
  const trunkGeo = modelGeometry('environment.trees.trunk', 'Trunk', new THREE.CylinderGeometry(0.3, 0.52, 4, 6));
  const crownGeo = modelGeometry('environment.trees.crown', 'Crown', new THREE.IcosahedronGeometry(1, 0));
  const crownConeGeo = modelGeometry('environment.trees.crownCone', 'CrownCone', new THREE.ConeGeometry(1, 1.8, 6));
  const trunks = new THREE.InstancedMesh(trunkGeo, barkMat, treeCount);
  const crowns = new THREE.InstancedMesh(crownGeo, leafMat, treeCount * 2);
  const crowns2 = new THREE.InstancedMesh(crownConeGeo, leafMat, treeCount);
  let ti = 0, ci = 0;
  scatter(rng, treeCount, () => true, (r, i) => {
    let x, z;
    for (let k = 0; k < 30; k++) { x = (rng() - 0.5) * 88; z = (rng() - 0.5) * 88; if (validSpot(x, z, 12)) break; }
    if (!validSpot(x, z, 12)) return;
    const y = heightAt(x, z);
    const s = 0.75 + rng() * 0.8;
    colliders.push({ x, z, r: 0.48 * s + 0.12, y0: y, y1: y + 4.4 * s });
    tmp.position.set(x, y + 2 * s, z);
    tmp.rotation.set(0, rng() * TAU, (rng() - 0.5) * 0.1);
    tmp.scale.set(s, s * (0.9 + rng() * 0.5), s);
    tmp.updateMatrix(); trunks.setMatrixAt(ti, tmp.matrix);
    col.set(rng() > 0.2 ? '#7c5c45' : '#967055').multiplyScalar(0.85 + rng() * 0.3);
    trunks.setColorAt(ti, col); ti++;
    tmp.position.set(x, y + 4.6 * s, z);
    tmp.scale.set(2.1 * s, 1.9 * s, 2.1 * s);
    tmp.updateMatrix(); crowns.setMatrixAt(ci, tmp.matrix);
    col.setHSL(0.25 + rng() * 0.09, 0.35 + rng() * 0.22, 0.32 + rng() * 0.18);
    crowns.setColorAt(ci, col); ci++;
    tmp.position.set(x + (rng() - 0.5), y + 6.3 * s, z + (rng() - 0.5));
    tmp.scale.set(1.6 * s, 1.7 * s, 1.6 * s);
    tmp.updateMatrix(); crowns.setMatrixAt(ci, tmp.matrix);
    col.setHSL(0.26 + rng() * 0.08, 0.4, 0.38 + rng() * 0.18);
    crowns.setColorAt(ci, col); ci++;
    tmp.position.set(x, y + 6.8 * s, z);
    tmp.scale.set(1.35 * s, 1.7 * s, 1.35 * s);
    tmp.updateMatrix(); crowns2.setMatrixAt(i, tmp.matrix);
    col.setHSL(0.27 + rng() * 0.07, 0.4, 0.4 + rng() * 0.15);
    crowns2.setColorAt(i, col);
  });
  trunks.count = ti; crowns.count = ci; crowns2.count = ti;
  [trunks, crowns, crowns2].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = quality.shadows; m.receiveShadow = quality.shadows;
    group.add(m);
  });

  const grassCount = Math.floor(1800 * density);
  const grassMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  windify(grassMat, uniforms, 0.22);
  const grassGeo = modelGeometry('environment.plants.grass', 'Grass', new THREE.ConeGeometry(0.16, 0.85, 3));
  const grass = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
  let gi = 0;
  scatter(rng, grassCount, () => true, () => {
    const x = (rng() - 0.5) * 90, z = (rng() - 0.5) * 90;
    const h = heightAt(x, z);
    if (h < WATER_LEVEL + 0.15 || Math.hypot(x, z) > 46) return;
    tmp.position.set(x, h + 0.4, z);
    tmp.rotation.set((rng() - 0.5) * 0.3, rng() * TAU, (rng() - 0.5) * 0.3);
    tmp.scale.setScalar(0.5 + rng() * 1.1);
    tmp.updateMatrix(); grass.setMatrixAt(gi, tmp.matrix);
    col.setHSL(0.24 + rng() * 0.09, 0.4 + rng() * 0.2, 0.35 + rng() * 0.22);
    grass.setColorAt(gi, col); gi++;
  });
  grass.count = gi; grass.instanceMatrix.needsUpdate = true; grass.receiveShadow = quality.shadows;
  group.add(grass);

  const flowerCount = Math.floor(330 * density);
  const stemGeo = modelGeometry('environment.plants.flowerStem', 'Stem', new THREE.CylinderGeometry(0.03, 0.04, 0.6, 4));
  const headGeo = modelGeometry('environment.plants.flowerHead', 'Head', new THREE.IcosahedronGeometry(0.22, 0));
  const flowerStem = new THREE.InstancedMesh(stemGeo, new THREE.MeshLambertMaterial({ color: 0x4e9b54 }), flowerCount);
  const flowerHead = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x222211 }), flowerCount);
  windify(flowerHead.material, uniforms, 0.14);
  let fi = 0;
  scatter(rng, flowerCount, () => true, () => {
    const x = (rng() - 0.5) * 86, z = (rng() - 0.5) * 86;
    const h = heightAt(x, z);
    if (h < WATER_LEVEL + 0.2 || Math.hypot(x, z) > 45) return;
    tmp.position.set(x, h + 0.3, z); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(0.7 + rng() * 0.9);
    tmp.updateMatrix(); flowerStem.setMatrixAt(fi, tmp.matrix);
    tmp.position.y = h + 0.68; tmp.updateMatrix(); flowerHead.setMatrixAt(fi, tmp.matrix);
    col.setHSL([0.02, 0.09, 0.55, 0.78, 0.92][(rng() * 5) | 0], 0.72, 0.68);
    flowerHead.setColorAt(fi, col); fi++;
  });
  flowerStem.count = flowerHead.count = fi;
  flowerStem.instanceMatrix.needsUpdate = flowerHead.instanceMatrix.needsUpdate = true;
  group.add(flowerStem, flowerHead);

  const mushCount = Math.floor(130 * density);
  const mushStemGeo = modelGeometry('environment.mushrooms.stem', 'Stem', new THREE.CylinderGeometry(0.13, 0.18, 0.5, 6));
  const mushCapGeo = modelGeometry('environment.mushrooms.cap', 'Cap', new THREE.SphereGeometry(0.46, 8, 5, 0, TAU, 0, Math.PI / 2));
  const mushStem = new THREE.InstancedMesh(mushStemGeo, new THREE.MeshLambertMaterial({ color: 0xf2e3cb }), mushCount);
  const mushCap = new THREE.InstancedMesh(mushCapGeo, new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x2a1015 }), mushCount);
  let mi = 0;
  scatter(rng, mushCount, () => true, () => {
    let x, z;
    for (let k = 0; k < 12; k++) { x = (rng() - 0.5) * 80; z = (rng() - 0.5) * 80; if (validSpot(x, z, 9)) break; }
    if (!validSpot(x, z, 9)) return;
    const h = heightAt(x, z), s = 0.55 + rng() * 1.5;
    tmp.position.set(x, h + 0.25 * s, z); tmp.rotation.set(0, rng() * TAU, 0); tmp.scale.setScalar(s);
    tmp.updateMatrix(); mushStem.setMatrixAt(mi, tmp.matrix);
    tmp.position.y = h + 0.48 * s; tmp.updateMatrix(); mushCap.setMatrixAt(mi, tmp.matrix);
    col.setHSL(0.98 + rng() * 0.08, 0.55, 0.45 + rng() * 0.2);
    mushCap.setColorAt(mi, col); mi++;
  });
  mushStem.count = mushCap.count = mi;
  mushStem.instanceMatrix.needsUpdate = mushCap.instanceMatrix.needsUpdate = true;
  group.add(mushStem, mushCap);

  const bushCount = Math.floor(110 * density);
  const bushGeo = modelGeometry('environment.plants.bush', 'Bush', new THREE.IcosahedronGeometry(1, 0));
  const bushes = new THREE.InstancedMesh(bushGeo, leafMat, bushCount);
  let bi = 0;
  scatter(rng, bushCount, () => true, () => {
    const x = (rng() - 0.5) * 86, z = (rng() - 0.5) * 86;
    const h = heightAt(x, z);
    if (h < WATER_LEVEL + 0.2 || Math.hypot(x, z) > 46 || streamDistance(x, z) < 2) return;
    const s = 0.5 + rng() * 1.1;
    tmp.position.set(x, h + s * 0.7, z); tmp.rotation.set(0, rng() * TAU, 0);
    tmp.scale.set(s * 1.3, s * 0.9, s * 1.3);
    tmp.updateMatrix(); bushes.setMatrixAt(bi, tmp.matrix);
    col.setHSL(0.25 + rng() * 0.07, 0.4, 0.3 + rng() * 0.16);
    bushes.setColorAt(bi, col); bi++;
  });
  bushes.count = bi; bushes.instanceMatrix.needsUpdate = true; bushes.castShadow = quality.shadows;
  group.add(bushes);

  const crystalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x3c6ea0, emissiveIntensity: 0.9, roughness: 0.22, metalness: 0.15, flatShading: true });
  const shardGeo = modelGeometry('environment.crystals.shard', 'Shard', new THREE.OctahedronGeometry(0.6, 0));
  const crystals = new THREE.InstancedMesh(shardGeo, crystalMat, 60);
  let cri = 0;
  const crystalSpots = [[-30, 21], [-32, 19], [-28, 23], [-34, 22], [30, -26], [32, -24], [28, -29], [12, -30], [-14, 30]];
  for (const [sx, sz] of crystalSpots) {
    for (let j = 0; j < 6; j++) {
      const x = sx + (rng() - 0.5) * 7, z = sz + (rng() - 0.5) * 7;
      if (Math.hypot(x, z) > 46) continue;
      const h = heightAt(x, z), s = 0.5 + rng() * 1.4;
      tmp.position.set(x, h + s * 0.55, z);
      tmp.rotation.set((rng() - 0.5) * 0.5, rng() * TAU, (rng() - 0.5) * 0.5);
      tmp.scale.set(s * 0.6, s * 1.5, s * 0.6);
      tmp.updateMatrix(); crystals.setMatrixAt(cri, tmp.matrix);
      colliders.push({ x, z, r: 0.5 * s, y0: h, y1: h + 1.5 * s });
      col.setHSL(0.5 + rng() * 0.22, 0.7, 0.6 + rng() * 0.2);
      crystals.setColorAt(cri, col); cri++;
    }
  }
  crystals.count = cri; crystals.instanceMatrix.needsUpdate = true;
  group.add(crystals);

  const proceduralCave = createCave(quality);
  const cave = Models.create('environment.rocks.cave') || proceduralCave.cave;
  if (cave === proceduralCave.cave) {
    cave.traverse((o) => { if (o.isMesh) o.castShadow = quality.shadows; });
  } else {
    const caveLight = new THREE.PointLight(0x7fb4ff, 1.5, 16, 2);
    caveLight.position.set(3.5, 2, 0);
    (cave.getObjectByName('Cave') || cave).add(caveLight);
    cave.userData.caveLight = caveLight;
  }
  colliders.push(...proceduralCave.colliders);
  group.add(cave);
  const caveLight = cave.userData.caveLight || proceduralCave.caveLight;

  return {
    group, ancient, colliders,
    update(dt, elapsed, night) {
      glow.intensity = 2.2 + Math.sin(elapsed * 1.4) * 0.3 + night * 1.4;
      crystalMat.emissiveIntensity = 0.75 + night * 0.7 + Math.sin(elapsed * 2) * 0.08;
      caveLight.intensity = 1.2 + night * 1.3;
    },
  };
}
