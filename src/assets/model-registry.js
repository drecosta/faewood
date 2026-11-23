import { BUILD_PIECES } from '../systems/items.js';

const ROOT = './assets/models/';

function entry(path, extra = {}) {
  return {
    path: ROOT + path,
    node: 'Mesh',
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    position: [0, 0, 0],
    material: null,
    animation: null,
    shadows: true,
    ...extra,
  };
}

function buildingFolder(id) {
  if (/^(floor|rug)/.test(id)) return 'platforms';
  if (/^(wall|halfWall|pillar)/.test(id)) return 'walls';
  if (/^roof/.test(id)) return 'roofs';
  if (['door', 'ladder', 'stairs', 'bridge', 'balcony'].includes(id)) return 'bridges';
  return 'furniture';
}

const buildings = Object.fromEntries(BUILD_PIECES.map((piece) => {
  const id = 'buildings.' + piece.id;
  const folder = buildingFolder(piece.id);
  return [id, entry(`buildings/${folder}/${piece.id}.glb`, {
    node: 'Root',
    category: 'Buildings',
    label: piece.name,
    gameObject: `BuildSystem.makePiece('${piece.id}')`,
    fallback: 'procedural building geometry',
  })];
}));

const resources = Object.fromEntries([
  ['wood', 'Woodpile'], ['leaves', 'Leaf Bush'], ['flowers', 'Flower Patch'],
  ['mushrooms', 'Mushroom Ring'], ['stones', 'Pebble Pile'], ['crystals', 'Crystal Shard'],
  ['seeds', 'Seed Pods'], ['dust', 'Fairy Dust'], ['dew', 'Star Dew'],
].map(([id, label]) => [`resources.${id}`, entry(`resources/${id}.glb`, {
  node: 'Root',
  category: 'Resources',
  label,
  gameObject: `HarvestSystem.makeNodeMesh('${id}')`,
  fallback: 'procedural resource geometry',
})]));

export const MODEL_REGISTRY = {
  'characters.fairy': entry('characters/fairy/fairy.glb', {
    node: 'Body',
    category: 'Characters',
    label: 'Player Fairy',
    gameObject: 'Fairy.body',
    fallback: 'procedural fairy',
    animation: { wingShader: true },
  }),

  'environment.trees.ancient': entry('environment/trees/ancient-tree.glb', {
    node: 'AncientTree',
    category: 'Environment',
    label: 'Ancient Tree',
    gameObject: 'buildVegetation().ancient',
    fallback: 'procedural ancient tree',
    animation: { wind: 0.018, nodeMatch: 'Canopy' },
  }),
  'environment.trees.trunk': entry('environment/trees/tree-trunk.glb', {
    node: 'Trunk',
    category: 'Environment',
    label: 'Tree Trunk (instanced)',
    gameObject: 'vegetation tree trunk InstancedMesh',
    fallback: 'CylinderGeometry(0.3,0.52,4,6)',
  }),
  'environment.trees.crown': entry('environment/trees/tree-crown.glb', {
    node: 'Crown',
    category: 'Environment',
    label: 'Tree Crown (instanced)',
    gameObject: 'vegetation tree crown InstancedMesh',
    fallback: 'IcosahedronGeometry(2.25,0)',
  }),
  'environment.trees.crownCone': entry('environment/trees/tree-crown-cone.glb', {
    node: 'CrownCone',
    category: 'Environment',
    label: 'Turret Crown (instanced)',
    gameObject: 'vegetation crown cone InstancedMesh',
    fallback: 'ConeGeometry(1,1.8,6)',
  }),
  'environment.rocks.rock': entry('environment/rocks/rock.glb', {
    node: 'Rock',
    category: 'Environment',
    label: 'Rock (instanced)',
    gameObject: 'terrain rock InstancedMesh',
    fallback: 'DodecahedronGeometry(1,0)',
  }),
  'environment.rocks.cave': entry('environment/rocks/cave.glb', {
    node: 'Cave',
    category: 'Environment',
    label: 'Cave Rock',
    gameObject: 'buildVegetation().cave',
    fallback: 'procedural cave',
  }),
  'environment.plants.grass': entry('environment/plants/grass.glb', {
    node: 'Grass',
    category: 'Environment',
    label: 'Grass Blade (instanced)',
    gameObject: 'vegetation grass InstancedMesh',
    fallback: 'ConeGeometry(0.16,0.85,3)',
  }),
  'environment.plants.flowerStem': entry('environment/plants/flower-stem.glb', {
    node: 'Stem',
    category: 'Environment',
    label: 'Flower Stem (instanced)',
    gameObject: 'vegetation flower stem InstancedMesh',
    fallback: 'CylinderGeometry(0.03,0.04,0.6,4)',
  }),
  'environment.plants.flowerHead': entry('environment/plants/flower-head.glb', {
    node: 'Head',
    category: 'Environment',
    label: 'Flower Head (instanced)',
    gameObject: 'vegetation flower head InstancedMesh',
    fallback: 'IcosahedronGeometry(0.22,0)',
  }),
  'environment.plants.bush': entry('environment/plants/bush.glb', {
    node: 'Bush',
    category: 'Environment',
    label: 'Bush (instanced)',
    gameObject: 'vegetation bush InstancedMesh',
    fallback: 'IcosahedronGeometry(0.8,0)',
  }),
  'environment.mushrooms.stem': entry('environment/mushrooms/stem.glb', {
    node: 'Stem',
    category: 'Environment',
    label: 'Mushroom Stem (instanced)',
    gameObject: 'vegetation mushroom stem InstancedMesh',
    fallback: 'CylinderGeometry(0.13,0.18,0.5,6)',
  }),
  'environment.mushrooms.cap': entry('environment/mushrooms/cap.glb', {
    node: 'Cap',
    category: 'Environment',
    label: 'Mushroom Cap (instanced)',
    gameObject: 'vegetation mushroom cap InstancedMesh',
    fallback: 'SphereGeometry(0.46,8,5,0,TAU,0,PI/2)',
  }),
  'environment.crystals.shard': entry('environment/crystals/shard.glb', {
    node: 'Shard',
    category: 'Environment',
    label: 'Crystal Shard (instanced)',
    gameObject: 'vegetation crystal InstancedMesh',
    fallback: 'OctahedronGeometry(0.6,0)',
  }),

  ...buildings,
  ...resources,
};

export const MODEL_IDS = Object.keys(MODEL_REGISTRY);
