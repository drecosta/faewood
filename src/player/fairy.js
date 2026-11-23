import * as THREE from 'three';
import { clamp, lerp, TAU } from '../core/utils.js';
import { Models } from '../assets/model-library.js';
import { createWingMaterial } from '../assets/shader-materials.js';

const SKIN = ['#f6d2b8', '#e8b394', '#c88d6b', '#a86f55', '#f7dfc9'];
const HAIR = ['#5b3a2e', '#a76033', '#e2b955', '#3b5aa8', '#c96d9b', '#d9d5cd', '#7d5fc4'];
const DRESS = ['#8ed8b0', '#c99bf2', '#f4a6c1', '#8fc7f5', '#f5c37e', '#a8e6e0'];
const WINGS = ['#a9f5df', '#d9b6ff', '#ffd5e8', '#bfe0ff', '#fff1b8'];

export const PALETTES = { SKIN, HAIR, DRESS, WINGS };

function wingShape(len, wid) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(len * 0.18, wid * 1.15, len * 0.85, wid * 1.05, len, wid * 0.12);
  s.bezierCurveTo(len * 0.9, -wid * 0.5, len * 0.35, -wid * 0.68, 0, 0);
  return new THREE.ShapeGeometry(s, 10);
}

function collectMaterials(root, pattern) {
  const found = new Set();
  root.traverse((node) => {
    if (!node.isMesh) return;
    const list = Array.isArray(node.material) ? node.material : [node.material];
    list.forEach((material) => {
      if (pattern.test(material?.name || '') || pattern.test(node.name || '')) found.add(material);
    });
  });
  return [...found];
}

export class Fairy {
  constructor(scene, palette = {}) {
    this.group = new THREE.Group();
    this.group.name = 'fairy';
    scene.add(this.group);

    this.glow = new THREE.PointLight(0xb6ffe0, 1.5, 8, 2);
    this.glow.position.set(0, 1, 0.3);
    this.group.add(this.glow);
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({
      color: 0xb6ffe0, transparent: true, opacity: 0.055, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    aura.name = 'Aura';
    aura.position.y = 0.8;
    this.group.add(aura);
    this.aura = aura;

    const model = Models.create('characters.fairy');
    if (model && this.bindModel(model)) {
      this.modelSource = 'glb';
    } else {
      this.buildProcedural();
      this.modelSource = 'procedural';
    }

    this.phase = 0;
    this.flap = 0;
    this.setPalette(palette);
    this.group.traverse((o) => { if (o.isMesh && o !== aura) o.castShadow = true; });
  }

  bindModel(model) {
    const body = model.getObjectByName('Body') || model;
    if (!body) return false;
    this.group.add(model);
    this.body = body;
    this.head = model.getObjectByName('Head') || null;
    this.arms = [model.getObjectByName('ArmL'), model.getObjectByName('ArmR')].filter(Boolean);
    this.legs = [model.getObjectByName('LegL'), model.getObjectByName('LegR')].filter(Boolean);
    if (!this.arms.length || !this.legs.length) {
      this.group.remove(model);
      return false;
    }

    const wingMaterials = model.userData.wingMaterials || collectMaterials(model, /wing/i);
    this.wings = [-1, 1].map((side) => {
      const pivot = model.getObjectByName(side < 0 ? 'WingPivotL' : 'WingPivotR') || new THREE.Group();
      const material = wingMaterials.find((m) => m?.uniforms?.uFlap) || createWingMaterial();
      return { pivot, side, material };
    });
    model.traverse((node) => {
      if (node.isMesh && /wing/i.test(node.name + ' ' + node.material?.name) && !node.material?.uniforms) {
        node.material = this.wings.find((w) => w.side === Math.sign(node.position.x || w.side))?.material || this.wings[0].material;
      }
    });

    this.modelMaterials = {
      skin: collectMaterials(model, /skin/i),
      hair: collectMaterials(model, /hair/i),
      dress: collectMaterials(model, /dress/i),
      shoe: collectMaterials(model, /shoe/i),
      eye: collectMaterials(model, /eye/i),
      wing: this.wings.map((w) => w.material),
    };
    return true;
  }

  buildProcedural() {
    this.body = new THREE.Group();
    this.body.name = 'Body';
    this.group.add(this.body);

    this.skinMat = new THREE.MeshLambertMaterial({ name: 'Skin', color: SKIN[0] });
    this.hairMat = new THREE.MeshLambertMaterial({ name: 'Hair', color: HAIR[2] });
    this.dressMat = new THREE.MeshLambertMaterial({ name: 'Dress', color: DRESS[0], emissive: 0x112018 });
    this.shoeMat = new THREE.MeshLambertMaterial({ name: 'Shoe', color: 0x7a5a48 });
    this.eyeMat = new THREE.MeshBasicMaterial({ name: 'Eye', color: 0x24313c });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 10), this.skinMat);
    head.name = 'Head';
    head.position.y = 1.14;
    head.scale.set(1, 1.06, 0.94);
    this.body.add(head);
    this.head = head;

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.252, 12, 9, 0, TAU, 0, Math.PI * 0.62), this.hairMat);
    hair.name = 'Hair';
    hair.position.set(0, 1.17, -0.015);
    this.body.add(hair);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 9, 7), this.hairMat);
    bun.name = 'HairBun';
    bun.position.set(0, 1.3, -0.2);
    this.body.add(bun);
    for (const s of [-1, 1]) {
      const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 3, 6), this.hairMat);
      strand.name = s < 0 ? 'HairStrandL' : 'HairStrandR';
      strand.position.set(s * 0.19, 0.95, -0.04);
      strand.rotation.z = s * 0.15;
      this.body.add(strand);
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.19, 5), this.skinMat);
      ear.name = s < 0 ? 'EarL' : 'EarR';
      ear.position.set(s * 0.235, 1.13, 0);
      ear.rotation.z = -s * 1.2;
      this.body.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.037, 7, 6), this.eyeMat);
      eye.name = s < 0 ? 'EyeL' : 'EyeR';
      eye.position.set(s * 0.09, 1.15, 0.207);
      this.body.add(eye);
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ name: 'Blush', color: 0xef9fa6, transparent: true, opacity: 0.55 }));
      blush.name = s < 0 ? 'BlushL' : 'BlushR';
      blush.position.set(s * 0.15, 1.07, 0.17);
      blush.scale.set(1.4, 0.6, 0.3);
      this.body.add(blush);
    }

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.28, 4, 8), this.skinMat);
    torso.name = 'Torso';
    torso.position.y = 0.82;
    this.body.add(torso);

    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.62, 10, 2), this.dressMat);
    dress.name = 'Dress';
    dress.position.y = 0.58;
    this.body.add(dress);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.035, 5, 14), new THREE.MeshLambertMaterial({ name: 'Trim', color: 0xffe6a8, emissive: 0x554422 }));
    trim.name = 'DressTrim';
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0.29;
    this.body.add(trim);

    this.arms = [];
    this.legs = [];
    for (const s of [-1, 1]) {
      const arm = new THREE.Group();
      arm.name = s < 0 ? 'ArmL' : 'ArmR';
      arm.position.set(s * 0.17, 0.93, 0);
      const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 3, 6), this.skinMat);
      armMesh.name = 'ArmMesh';
      armMesh.position.y = -0.18;
      arm.add(armMesh);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 6), this.skinMat);
      hand.name = 'Hand';
      hand.position.y = -0.36;
      arm.add(hand);
      this.body.add(arm);
      this.arms.push(arm);

      const leg = new THREE.Group();
      leg.name = s < 0 ? 'LegL' : 'LegR';
      leg.position.set(s * 0.1, 0.4, 0);
      const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.28, 3, 6), this.skinMat);
      legMesh.name = 'LegMesh';
      legMesh.position.y = -0.19;
      leg.add(legMesh);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 6), this.shoeMat);
      shoe.name = 'Shoe';
      shoe.position.set(0, -0.36, 0.04);
      shoe.scale.set(0.9, 0.6, 1.4);
      leg.add(shoe);
      this.body.add(leg);
      this.legs.push(leg);
    }

    this.wings = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.name = s < 0 ? 'WingPivotL' : 'WingPivotR';
      pivot.position.set(s * 0.13, 0.98, -0.18);
      const material = createWingMaterial();
      const upper = new THREE.Mesh(wingShape(0.95, 0.42), material);
      upper.name = s < 0 ? 'WingUpperL' : 'WingUpperR';
      upper.material.name = 'WingGlow';
      upper.position.set(0, 0, 0);
      upper.rotation.z = s * 0.1;
      upper.scale.x = s;
      pivot.add(upper);
      const lower = new THREE.Mesh(wingShape(0.68, 0.33), material);
      lower.name = s < 0 ? 'WingLowerL' : 'WingLowerR';
      lower.position.set(0.06, -0.28, 0);
      lower.rotation.z = -s * 0.45;
      lower.scale.x = s;
      pivot.add(lower);
      this.body.add(pivot);
      this.wings.push({ pivot, side: s, material });
    }

    this.modelMaterials = {
      skin: [this.skinMat], hair: [this.hairMat], dress: [this.dressMat],
      shoe: [this.shoeMat], eye: [this.eyeMat], wing: this.wings.map((w) => w.material),
    };
  }

  setPalette(p = {}) {
    this.palette = {
      skin: clamp(p.skin ?? this.palette?.skin ?? 0, 0, SKIN.length - 1),
      hair: clamp(p.hair ?? this.palette?.hair ?? 2, 0, HAIR.length - 1),
      dress: clamp(p.dress ?? this.palette?.dress ?? 0, 0, DRESS.length - 1),
      wings: clamp(p.wings ?? this.palette?.wings ?? 0, 0, WINGS.length - 1),
    };
    const mats = this.modelMaterials || {};
    (mats.skin || []).forEach((m) => m.color?.set(SKIN[this.palette.skin]));
    (mats.hair || []).forEach((m) => m.color?.set(HAIR[this.palette.hair]));
    (mats.dress || []).forEach((m) => m.color?.set(DRESS[this.palette.dress]));
    (mats.eye || []).forEach((m) => m.color?.set(0x24313c));
    (mats.wing || []).forEach((m) => {
      if (m.uniforms?.uColor) m.uniforms.uColor.value.set(WINGS[this.palette.wings]);
      else m.color?.set(WINGS[this.palette.wings]);
    });
    this.glow.color.set(WINGS[this.palette.wings]);
    this.aura.material.color.copy(this.glow.color);
  }

  update(dt, state = {}) {
    const speed = state.speed || 0;
    const flying = !!state.flying;
    const grounded = state.grounded !== false;
    this.phase += dt * (flying ? 15 : speed > 0.1 ? 12 : 3.2);
    const t = this.phase;

    const bob = grounded ? Math.sin(t) * (speed > 0.1 ? 0.045 : 0.025) : Math.sin(t * 0.45) * 0.05;
    this.body.position.y = bob;
    this.body.rotation.x = lerp(this.body.rotation.x, flying ? -0.28 : speed > 0.1 ? -0.12 : 0, 1 - Math.exp(-8 * dt));

    const swing = Math.sin(t) * Math.min(0.6, speed * 0.09);
    this.arms[0].rotation.x = flying ? -1.25 + Math.sin(t * 0.5) * 0.1 : swing;
    this.arms[1].rotation.x = flying ? -1.25 + Math.sin(t * 0.5) * 0.1 : -swing;
    this.arms[0].rotation.z = flying ? 0.5 : 0.12;
    this.arms[1].rotation.z = flying ? -0.5 : -0.12;
    this.legs[0].rotation.x = flying ? 0.55 : -swing * 0.8;
    this.legs[1].rotation.x = flying ? 0.55 : swing * 0.8;

    const flapSpeed = flying ? 23 : speed > 0.1 ? 9 : 5;
    this.flap = Math.sin(performance.now() * 0.001 * flapSpeed);
    const amp = flying ? 0.95 : 0.42;
    this.wings.forEach(({ pivot, side, material }) => {
      pivot.rotation.y = side * (0.2 + this.flap * amp);
      pivot.rotation.z = side * (0.12 + Math.abs(this.flap) * 0.18);
      if (material.uniforms) {
        material.uniforms.uTime.value = performance.now() * 0.001;
        material.uniforms.uFlap.value = flying ? 1 : 0;
      }
    });
    this.glow.intensity = 1.3 + Math.sin(performance.now() * 0.002) * 0.25 + (state.energyLow ? 0.5 : 0);
    this.aura.material.opacity = 0.045 + Math.sin(performance.now() * 0.0018) * 0.015;
  }
}
