import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/gltf/GLTFLoader.js';
import { MODEL_REGISTRY, MODEL_IDS } from './model-registry.js';
import { createWingMaterial, applyWind } from './shader-materials.js';

const loader = new GLTFLoader();
const prototypes = new Map();
const failed = new Set();
const windUniforms = { uTime: { value: 0 } };
let preloaded = false;

function applyTransform(root, config) {
  root.scale.fromArray(config.scale);
  root.rotation.fromArray(config.rotation);
  root.position.fromArray(config.position);
}

function matches(value, pattern) {
  return !pattern || new RegExp(pattern, 'i').test(value || '');
}

function applyMaterialOverride(material, override) {
  if (!material || !override) return;
  if (override.color !== undefined) material.color?.set(override.color);
  if (override.emissive !== undefined) material.emissive?.set(override.emissive);
  if (override.roughness !== undefined && material.roughness !== undefined) material.roughness = override.roughness;
  if (override.metalness !== undefined && material.metalness !== undefined) material.metalness = override.metalness;
  if (override.opacity !== undefined) {
    material.opacity = override.opacity;
    material.transparent = override.transparent ?? override.opacity < 1;
  }
  if (override.transparent !== undefined) material.transparent = override.transparent;
  if (override.side === 'double') material.side = THREE.DoubleSide;
  if (override.side === 'front') material.side = THREE.FrontSide;
  if (override.side === 'back') material.side = THREE.BackSide;
  if (override.flatShading !== undefined && material.flatShading !== undefined) {
    material.flatShading = override.flatShading;
    material.needsUpdate = true;
  }
  material.name = override.name || material.name;
}

function configure(instance, id, config) {
  instance.userData.modelId = id;
  applyTransform(instance, config);
  const wings = [];
  const windMaterials = [];
  instance.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = config.shadows;
    node.receiveShadow = config.shadows;
    node.material = Array.isArray(node.material)
      ? node.material.map((material) => material.clone())
      : node.material.clone();

    const overrides = config.material || [];
    for (const override of (Array.isArray(overrides) ? overrides : [overrides])) {
      if (!matches(node.name, override.nodeMatch) && !matches(node.material.name, override.materialMatch)) continue;
      const list = Array.isArray(node.material) ? node.material : [node.material];
      list.forEach((material) => applyMaterialOverride(material, override));
    }

    const animation = config.animation || {};
    if (animation.wingShader && /wing/i.test(node.name + ' ' + node.material.name)) {
      const wingMaterial = createWingMaterial();
      node.material = wingMaterial;
      wings.push(wingMaterial);
    }
    if (animation.wind && matches(node.name, animation.nodeMatch)) {
      const list = Array.isArray(node.material) ? node.material : [node.material];
      list.forEach((material) => windMaterials.push(applyWind(material, windUniforms, animation.wind)));
    }
  });
  if (wings.length) instance.userData.wingMaterials = wings;
  if (windMaterials.length) instance.userData.windMaterials = windMaterials;
  return instance;
}

export const Models = {
  get(id) {
    return MODEL_REGISTRY[id] || null;
  },

  has(id) {
    return prototypes.has(id);
  },

  async preload(onProgress) {
    if (preloaded) return this.stats();
    preloaded = true;
    const total = MODEL_IDS.length;
    let done = 0;
    await Promise.all(MODEL_IDS.map(async (id) => {
      const config = MODEL_REGISTRY[id];
      try {
        const gltf = await loader.loadAsync(config.path);
        gltf.scene.name = id;
        gltf.scene.updateMatrixWorld(true);
        prototypes.set(id, gltf.scene);
      } catch (error) {
        failed.add(id);
        console.warn(`[Faewood] model unavailable: ${id}`, error?.message || error);
      } finally {
        onProgress?.(++done, total, id);
      }
    }));
    return this.stats();
  },

  create(id) {
    const prototype = prototypes.get(id);
    if (!prototype) return null;
    return configure(prototype.clone(true), id, MODEL_REGISTRY[id]);
  },

  geometry(id, nodeName, fallback) {
    const prototype = prototypes.get(id);
    if (!prototype) return typeof fallback === 'function' ? fallback() : fallback;
    const config = MODEL_REGISTRY[id];
    const instance = prototype.clone(true);
    applyTransform(instance, config);
    instance.updateMatrixWorld(true);
    const node = (nodeName && instance.getObjectByName(nodeName)) || instance.getObjectByProperty('isMesh', true);
    if (!node?.isMesh) return typeof fallback === 'function' ? fallback() : fallback;
    const geometry = node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    return geometry;
  },

  update(dt) {
    windUniforms.uTime.value += dt;
  },

  stats() {
    return { loaded: prototypes.size, failed: [...failed], total: MODEL_IDS.length };
  },

  windUniforms,
};
