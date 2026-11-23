import * as THREE from 'three';
import { clamp, lerp, timeLabel } from './utils.js';

export const QUALITY = {
  low:    { pixelRatio: 1,    shadows: false, shadowSize: 512,  vegetation: 0.5, fireflies: 40,  waterSeg: 16 },
  medium: { pixelRatio: 1.25, shadows: true,  shadowSize: 1024, vegetation: 0.8, fireflies: 80,  waterSeg: 24 },
  high:   { pixelRatio: 1.6,  shadows: true,  shadowSize: 1536, vegetation: 1,   fireflies: 140, waterSeg: 32 },
};

const SKY = {
  night: new THREE.Color('#0b1730'),
  dawn: new THREE.Color('#e9a982'),
  day: new THREE.Color('#8ed3ee'),
  dusk: new THREE.Color('#d98ba0'),
};

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.qualityName = 'medium';
    this.quality = QUALITY.medium;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
      stencil: false, depth: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x9ccfd0, 0.0105);
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 400);
    this.camera.position.set(0, 8, 16);

    this.hemi = new THREE.HemisphereLight(0xbfefff, 0x3c5d3a, 1.25);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffe7b5, 2.1);
    this.sun.position.set(18, 34, 12);
    this.sun.castShadow = this.quality.shadows;
    this.sun.shadow.mapSize.set(this.quality.shadowSize, this.quality.shadowSize);
    this.sun.shadow.camera.left = -34;
    this.sun.shadow.camera.right = 34;
    this.sun.shadow.camera.top = 34;
    this.sun.shadow.camera.bottom = -34;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 90;
    this.sun.shadow.bias = -0.0012;
    this.sun.shadow.normalBias = 0.035;
    this.scene.add(this.sun, this.sun.target);

    this.fill = new THREE.DirectionalLight(0x8ba8ff, 0.35);
    this.fill.position.set(-16, 12, -20);
    this.scene.add(this.fill);

    this.time = 0.16;
    this.dayLength = 420;
    this.ambient = 1;
    this._applyTime();

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    window.visualViewport?.addEventListener('resize', this._onResize);
    this.resize();
  }

  setQuality(name) {
    if (!QUALITY[name]) return;
    this.qualityName = name;
    this.quality = QUALITY[name];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.pixelRatio));
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.sun.castShadow = this.quality.shadows;
    this.sun.shadow.mapSize.set(this.quality.shadowSize, this.quality.shadowSize);
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    this.renderer.shadowMap.needsUpdate = true;
    this.resize();
  }

  resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.pixelRatio));
    this.renderer.setSize(w, h, false);
  }

  setTime(t) { this.time = ((t % 1) + 1) % 1; this._applyTime(); }

  _applyTime() {
    const t = this.time;
    const sunAngle = (t - 0.16) * Math.PI * 2;
    const sunY = Math.sin(sunAngle);
    const daylight = clamp(sunY * 1.6 + 0.28, 0, 1);
    const golden = clamp(1 - Math.abs(sunY) * 3.4, 0, 1) * clamp(sunY + 0.45, 0, 1);

    let sky;
    if (t < 0.08) sky = SKY.night.clone().lerp(SKY.dawn, t / 0.08);
    else if (t < 0.17) sky = SKY.dawn.clone().lerp(SKY.day, (t - 0.08) / 0.09);
    else if (t < 0.46) sky = SKY.day.clone();
    else if (t < 0.57) sky = SKY.day.clone().lerp(SKY.dusk, (t - 0.46) / 0.11);
    else if (t < 0.68) sky = SKY.dusk.clone().lerp(SKY.night, (t - 0.57) / 0.11);
    else sky = SKY.night.clone();

    if (golden > 0.1) sky.lerp(new THREE.Color('#ffb07a'), golden * 0.22);
    this.scene.background = sky;
    this.scene.fog.color.copy(sky).lerp(new THREE.Color('#79b8b0'), daylight * 0.35);
    this.scene.fog.density = lerp(0.016, 0.009, daylight);

    this.sun.position.set(Math.cos(sunAngle) * 34, Math.max(-12, sunY * 40 + 8), Math.sin(sunAngle * 0.7) * 26 + 8);
    this.sun.intensity = lerp(0.12, 2.3, daylight);
    this.sun.color.copy(new THREE.Color('#ffcf96')).lerp(new THREE.Color('#fff4d8'), daylight * 0.8);
    this.hemi.intensity = lerp(0.5, 1.3, daylight);
    this.hemi.color.copy(new THREE.Color('#8fa8e8')).lerp(new THREE.Color('#cdf2ff'), daylight);
    this.fill.intensity = lerp(0.65, 0.28, daylight);
    this.ambient = daylight;
    this.isNight = daylight < 0.35;
    this.timeString = timeLabel(t);
    this.sun.target.position.set(0, 2, 0);
    this.sun.target.updateMatrixWorld();
  }

  update(dt) {
    this.time = (this.time + dt / this.dayLength) % 1;
    this._applyTime();
  }

  render() { this.renderer.render(this.scene, this.camera); }
}
