import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/utils.js';
import { Fairy } from './fairy.js';

const START = new THREE.Vector3(6, 0, 8);
const BODY_RADIUS = 0.34;
const BODY_HEIGHT = 1.35;

export class PlayerController {
  constructor(engine, world, input, audio, palette) {
    this.engine = engine;
    this.world = world;
    this.input = input;
    this.audio = audio;
    this.fairy = new Fairy(engine.scene, palette);
    this.position = START.clone();
    this.position.y = world.groundAt(this.position.x, this.position.z);
    this.velocity = new THREE.Vector3();
    this.yaw = 0.6;
    this.pitch = 0.38;
    this.distance = 9;
    this.camTarget = new THREE.Vector3();
    this.energy = 100;
    this.health = 100;
    this.grounded = true;
    this.flying = false;
    this.hoverLock = false;
    this.glide = 0;
    this.speed = 0;
    this.controlsEnabled = true;
    this.lastGroundY = this.position.y;
    this._tmp = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();

    engine.camera.position.copy(this.position).add(new THREE.Vector3(0, 4, 9));
    input.on('jump', () => this.jump());
    input.on('fly-down', () => this.flyDown());
    input.on('fly-up', () => this.flyUp());
    input.on('fly-toggle', () => this.toggleFly());
  }

  setControls(v) { this.controlsEnabled = v; }

  jump() {
    if (!this.controlsEnabled) return;
    if (this.grounded || this.position.y - this.world.groundAt(this.position.x, this.position.z) < 0.35) {
      this.velocity.y = 8.4;
      this.grounded = false;
      this.audio.sfx('jump');
    }
  }

  flyDown() {
    if (!this.controlsEnabled) return;
    if (this.energy > 3) { this.flying = true; this.glide = 0.85; }
  }

  flyUp() {
    if (!this.controlsEnabled) return;
    this.glide = 0.85;
  }

  toggleFly() {
    if (!this.controlsEnabled) return;
    if (this.hoverLock || (this.flying && this.grounded)) {
      this.hoverLock = false; this.flying = false;
    } else if (this.energy > 5) {
      this.hoverLock = true; this.flying = true;
      this.audio.sfx('flap');
    }
  }

  teleport(x, y, z) {
    this.position.set(x, y ?? this.world.groundAt(x, z), z);
    this.world.collision?.resolve(this.position, BODY_RADIUS, this.position.y, BODY_HEIGHT);
    this.velocity.set(0, 0, 0);
    this.flying = false; this.hoverLock = false;
    this.camTarget.copy(this.position);
  }

  serialize() {
    return {
      pos: [this.position.x, this.position.y, this.position.z],
      energy: this.energy, health: this.health,
      yaw: this.yaw, pitch: this.pitch, distance: this.distance,
    };
  }

  restore(s) {
    if (!s?.pos) return;
    this.teleport(s.pos[0], s.pos[1], s.pos[2]);
    this.energy = clamp(s.energy ?? 100, 0, 100);
    this.health = clamp(s.health ?? 100, 1, 100);
    this.yaw = s.yaw ?? 0.6;
    this.pitch = s.pitch ?? 0.38;
    this.distance = s.distance ?? 9;
  }

  update(dt, look) {
    const input = this.input;
    const active = this.controlsEnabled;
    const mx = active ? input.move.x : 0;
    const my = active ? input.move.y : 0;
    const running = active && input.run;

    if (active) {
      this.yaw -= look.x;
      this.pitch = clamp(this.pitch + look.y, -0.22, 1.15);
      this.distance = clamp(this.distance + look.z, 4.5, 17);
    }

    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this._tmp.set(0, 0, 0)
      .addScaledVector(this._forward, my)
      .addScaledVector(this._right, mx);
    if (this._tmp.lengthSq() > 1) this._tmp.normalize();

    const flyActive = this.flying && (input.flyHeld || this.hoverLock || this.glide > 0);
    if (this.flying && !flyActive) this.flying = false;
    if (this.flying && this.energy <= 0) { this.flying = false; this.hoverLock = false; }

    const walkSpeed = running ? 10.5 : 6.2;
    const flySpeed = running ? 16 : 11.5;
    const targetSpeed = this.flying ? flySpeed : walkSpeed;
    const accel = this.grounded ? 22 : this.flying ? 10 : 7;

    this.velocity.x = damp(this.velocity.x, this._tmp.x * targetSpeed, accel * 0.32, dt);
    this.velocity.z = damp(this.velocity.z, this._tmp.z * targetSpeed, accel * 0.32, dt);

    if (this.flying) {
      const thrust = input.flyHeld ? 15 : this.hoverLock ? 4.2 : 1.2;
      this.velocity.y += thrust * dt;
      this.velocity.y = clamp(this.velocity.y, -5, input.flyHeld ? 8 : 3.5);
      this.glide = Math.max(0, this.glide - dt);
      this.energy = clamp(this.energy - (input.flyHeld ? 15 : 5.5) * dt, 0, 100);
      if (Math.random() < dt * 6) this.audio.sfx('flap');
    } else {
      this.velocity.y -= 23 * dt;
      this.velocity.y = clamp(this.velocity.y, -26, 12);
      this.energy = clamp(this.energy + (this.grounded ? 15 : 6) * dt, 0, 100);
    }

    const prevFeet = this.position.y;
    const dx = this.velocity.x * dt;
    const dy = this.velocity.y * dt;
    const dz = this.velocity.z * dt;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) / 0.28));
    const sx = dx / steps, sy = dy / steps, sz = dz / steps;
    for (let i = 0; i < steps; i++) {
      this.position.x += sx;
      this.position.z += sz;
      this.world.collision?.resolve(this.position, BODY_RADIUS, this.position.y, BODY_HEIGHT);
      this.world.collide(this.position, BODY_RADIUS);

      const beforeY = this.position.y;
      this.position.y += sy;
      if (this.velocity.y > 0) {
        const ceiling = this.world.collision?.ceilingAt(
          this.position.x, this.position.z, this.position.y + BODY_HEIGHT,
          beforeY + BODY_HEIGHT, BODY_RADIUS
        );
        if (ceiling !== undefined && this.position.y + BODY_HEIGHT > ceiling) {
          this.position.y = ceiling - BODY_HEIGHT;
          this.velocity.y = 0;
        }
      }
    }

    const ground = Math.max(
      this.world.groundAt(this.position.x, this.position.z),
      this.world.collision?.supportAt(this.position.x, this.position.z, this.position.y, prevFeet, BODY_RADIUS) ?? -Infinity
    );
    if (this.position.y <= ground + 0.02) {
      if (!this.grounded && this.velocity.y < -18) {
        this.health = clamp(this.health - Math.min(28, (-this.velocity.y - 18) * 1.7), 1, 100);
        this.audio.sfx('error');
      }
      this.position.y = ground + 0.02;
      this.velocity.y = 0;
      this.grounded = true;
      if (this.hoverLock && this.energy > 5) { this.flying = true; }
    } else {
      this.grounded = false;
    }
    if (this.position.y > 26) this.position.y = 26;

    this.speed = Math.hypot(this.velocity.x, this.velocity.z);
    this.fairy.group.position.copy(this.position);
    const targetYaw = Math.atan2(this._tmp.x, this._tmp.z);
    if (this._tmp.lengthSq() > 0.01) {
      let diff = ((targetYaw - this.fairy.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.fairy.group.rotation.y += diff * Math.min(1, dt * 11);
    }
    this.fairy.update(dt, {
      speed: this.speed, flying: this.flying, grounded: this.grounded,
      energyLow: this.energy < 20,
    });

    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const desired = this._tmp.set(
      this.position.x + Math.sin(this.yaw) * cp * this.distance,
      this.position.y + 1.35 + sp * this.distance,
      this.position.z + Math.cos(this.yaw) * cp * this.distance
    );
    const camGround = this.world.groundAt(desired.x, desired.z) + 1.1;
    if (desired.y < camGround) desired.y = camGround;
    const cam = this.engine.camera;
    cam.position.x = damp(cam.position.x, desired.x, 7, dt);
    cam.position.y = damp(cam.position.y, desired.y, 7, dt);
    cam.position.z = damp(cam.position.z, desired.z, 7, dt);
    this.camTarget.lerp(this._tmp.copy(this.position).add(new THREE.Vector3(0, 1.2, 0)), Math.min(1, dt * 9));
    cam.lookAt(this.camTarget);
  }
}
