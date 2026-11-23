import * as THREE from 'three';
import { clamp, lerp, TAU } from '../core/utils.js';

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

const wingMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  uniforms: {
    uColor: { value: new THREE.Color('#a9f5df') },
    uTime: { value: 0 },
    uFlap: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv; varying vec3 vPos;
    void main(){ vUv=uv; vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform vec3 uColor; uniform float uTime; uniform float uFlap;
    varying vec2 vUv; varying vec3 vPos;
    void main(){
      float edge = smoothstep(0.0,0.22,vUv.x)*smoothstep(1.0,0.72,vUv.x);
      float veins = pow(abs(sin(vUv.x*24.0 + vUv.y*7.0)), 12.0)*0.22;
      float shimmer = 0.5+0.5*sin(uTime*2.5 + vUv.x*8.0 - vUv.y*5.0);
      vec3 c = mix(uColor, vec3(1.0), 0.35 + shimmer*0.35 + veins);
      float a = (0.24 + shimmer*0.16 + veins) * edge * (0.85 - uFlap*0.2);
      gl_FragColor = vec4(c, a);
    }`,
});

export class Fairy {
  constructor(scene, palette = {}) {
    this.group = new THREE.Group();
    this.group.name = 'fairy';
    scene.add(this.group);

    this.body = new THREE.Group();
    this.group.add(this.body);

    this.skinMat = new THREE.MeshLambertMaterial({ color: SKIN[0] });
    this.hairMat = new THREE.MeshLambertMaterial({ color: HAIR[2] });
    this.dressMat = new THREE.MeshLambertMaterial({ color: DRESS[0], emissive: 0x112018 });
    this.shoeMat = new THREE.MeshLambertMaterial({ color: 0x7a5a48 });
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0x24313c });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 10), this.skinMat);
    head.position.y = 1.14; head.scale.set(1, 1.06, 0.94);
    this.body.add(head);
    this.head = head;

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.252, 12, 9, 0, TAU, 0, Math.PI * 0.62), this.hairMat);
    hair.position.set(0, 1.17, -0.015);
    this.body.add(hair);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 9, 7), this.hairMat);
    bun.position.set(0, 1.3, -0.2); this.body.add(bun);
    for (const s of [-1, 1]) {
      const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 3, 6), this.hairMat);
      strand.position.set(s * 0.19, 0.95, -0.04);
      strand.rotation.z = s * 0.15;
      this.body.add(strand);
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.19, 5), this.skinMat);
      ear.position.set(s * 0.235, 1.13, 0);
      ear.rotation.z = -s * 1.2;
      this.body.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.037, 7, 6), this.eyeMat);
      eye.position.set(s * 0.09, 1.15, 0.207);
      this.body.add(eye);
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: 0xef9fa6, transparent: true, opacity: 0.55 }));
      blush.position.set(s * 0.15, 1.07, 0.17); blush.scale.set(1.4, 0.6, 0.3);
      this.body.add(blush);
    }

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.28, 4, 8), this.skinMat);
    torso.position.y = 0.82; this.body.add(torso);

    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.62, 10, 2), this.dressMat);
    dress.position.y = 0.58; this.body.add(dress);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.035, 5, 14), new THREE.MeshLambertMaterial({ color: 0xffe6a8, emissive: 0x554422 }));
    trim.rotation.x = Math.PI / 2; trim.position.y = 0.29; this.body.add(trim);

    this.arms = [];
    this.legs = [];
    for (const s of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(s * 0.17, 0.93, 0);
      const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 3, 6), this.skinMat);
      armMesh.position.y = -0.18; arm.add(armMesh);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 6), this.skinMat);
      hand.position.y = -0.36; arm.add(hand);
      this.body.add(arm); this.arms.push(arm);

      const leg = new THREE.Group();
      leg.position.set(s * 0.1, 0.4, 0);
      const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.28, 3, 6), this.skinMat);
      legMesh.position.y = -0.19; leg.add(legMesh);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 6), this.shoeMat);
      shoe.position.set(0, -0.36, 0.04); shoe.scale.set(0.9, 0.6, 1.4); leg.add(shoe);
      this.body.add(leg); this.legs.push(leg);
    }

    this.wings = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.13, 0.98, -0.18);
      const upper = new THREE.Mesh(wingShape(0.95, 0.42), wingMat.clone());
      upper.material.uniforms = THREE.UniformsUtils.clone(wingMat.uniforms);
      upper.position.set(0, 0, 0);
      upper.rotation.z = s * 0.1;
      upper.scale.x = s;
      pivot.add(upper);
      const lower = new THREE.Mesh(wingShape(0.68, 0.33), upper.material);
      lower.position.set(0.06, -0.28, 0);
      lower.rotation.z = -s * 0.45;
      lower.scale.x = s;
      pivot.add(lower);
      this.body.add(pivot);
      this.wings.push({ pivot, side: s, material: upper.material });
    }

    this.glow = new THREE.PointLight(0xb6ffe0, 1.5, 8, 2);
    this.glow.position.set(0, 1, 0.3);
    this.group.add(this.glow);
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({
      color: 0xb6ffe0, transparent: true, opacity: 0.055, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    aura.position.y = 0.8; this.group.add(aura); this.aura = aura;

    this.phase = 0;
    this.flap = 0;
    this.setPalette(palette);
    this.group.traverse((o) => { if (o.isMesh && o !== aura) { o.castShadow = true; } });
  }

  setPalette(p = {}) {
    this.palette = {
      skin: p.skin ?? 0, hair: p.hair ?? 2, dress: p.dress ?? 0, wings: p.wings ?? 0,
    };
    this.skinMat.color.set(SKIN[this.palette.skin] || SKIN[0]);
    this.hairMat.color.set(HAIR[this.palette.hair] || HAIR[2]);
    this.dressMat.color.set(DRESS[this.palette.dress] || DRESS[0]);
    this.glow.color.set(WINGS[this.palette.wings] || WINGS[0]);
    this.aura.material.color.copy(this.glow.color);
    this.wings.forEach((w) => w.material.uniforms.uColor.value.set(WINGS[this.palette.wings] || WINGS[0]));
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
      material.uniforms.uTime.value = performance.now() * 0.001;
      material.uniforms.uFlap.value = flying ? 1 : 0;
    });
    this.glow.intensity = 1.3 + Math.sin(performance.now() * 0.002) * 0.25 + (state.energyLow ? 0.5 : 0);
    this.aura.material.opacity = 0.045 + Math.sin(performance.now() * 0.0018) * 0.015;
  }
}
