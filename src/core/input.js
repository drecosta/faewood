import { clamp } from './utils.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.move = { x: 0, y: 0 };
    this.run = false;
    this.look = { x: 0, y: 0 };
    this.zoom = 0;
    this.flyHeld = false;
    this.keys = new Set();
    this.pointers = new Map();
    this.pinching = false;
    this._pinchDist = 0;
    this._listeners = {};
    this._lastTap = 0;
    this._flyDownAt = 0;
    this._keyFlyAt = 0;
    this._setupJoystick();
    this._setupLook();
    this._setupActions();
    this._setupKeys();
  }

  on(name, fn) { (this._listeners[name] ||= []).push(fn); return this; }
  emit(name, arg) { (this._listeners[name] || []).forEach((f) => f(arg)); }

  _setupJoystick() {
    const zone = document.getElementById('joystick');
    const knob = document.getElementById('joy-knob');
    let id = null;
    const radius = () => zone.getBoundingClientRect().width * 0.35;
    const move = (e) => {
      if (id !== e.pointerId) return;
      const r = zone.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy), max = radius();
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.move.x = dx / max;
      this.move.y = -dy / max;
      this.run = Math.hypot(this.move.x, this.move.y) > 0.78;
    };
    const end = (e) => {
      if (id !== e.pointerId) return;
      id = null; this.move.x = 0; this.move.y = 0; this.run = false;
      knob.style.transform = 'translate(0,0)';
    };
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault(); id = e.pointerId; zone.setPointerCapture(id); move(e);
    });
    zone.addEventListener('pointermove', (e) => { e.preventDefault(); move(e); });
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  _setupLook() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        const p = [...this.pointers.values()];
        this._pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        this.pinching = true;
      }
    });
    c.addEventListener('pointermove', (e) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size >= 2) {
        const p = [...this.pointers.values()];
        const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        this.zoom += (this._pinchDist - d) * 0.03;
        this._pinchDist = d;
      } else {
        const scale = 0.0042;
        this.look.x += dx * scale;
        this.look.y += dy * scale;
      }
    });
    const up = (e) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinching = false;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom += e.deltaY * 0.012; }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _setupActions() {
    const bindTap = (id, name) => {
      const el = document.getElementById(id);
      el?.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); });
      el?.addEventListener('click', (e) => { e.preventDefault(); this.emit(name); });
    };
    bindTap('btn-jump', 'jump');
    bindTap('btn-interact', 'interact');
    bindTap('btn-bag', 'bag');
    bindTap('btn-build', 'build');
    bindTap('menu-btn', 'menu');
    bindTap('tool-rotate-l', 'rotate-l');
    bindTap('tool-rotate-r', 'rotate-r');
    bindTap('tool-up', 'elevate-up');
    bindTap('tool-down', 'elevate-down');
    bindTap('tool-snap', 'snap');
    bindTap('tool-remove', 'remove');
    bindTap('tool-place', 'place');
    bindTap('tool-cancel', 'exit-build');

    const fly = document.getElementById('btn-fly');
    const down = (e) => {
      e.preventDefault(); fly.setPointerCapture?.(e.pointerId);
      this._flyDownAt = performance.now();
      this.flyHeld = true; fly.classList.add('active');
      this.emit('fly-down');
    };
    const up = (e) => {
      if (!this.flyHeld) return;
      e?.preventDefault();
      const held = performance.now() - this._flyDownAt;
      this.flyHeld = false; fly.classList.remove('active');
      this.emit('fly-up');
      if (held < 240) {
        const now = performance.now();
        if (now - this._lastTap < 320) { this.emit('fly-toggle'); this._lastTap = 0; }
        else { this.emit('jump'); this._lastTap = now; }
      }
    };
    fly.addEventListener('pointerdown', down);
    fly.addEventListener('pointerup', up);
    fly.addEventListener('pointercancel', up);
    fly.addEventListener('lostpointercapture', () => { if (this.flyHeld) up(); });
  }

  _setupKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) { this.keys.add(e.code); return; }
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      switch (e.code) {
        case 'Space': this._keyFlyAt = performance.now(); this.flyHeld = true; this.emit('fly-down'); break;
        case 'KeyF': this.emit('fly-toggle'); break;
        case 'KeyE': this.emit('interact'); break;
        case 'KeyB': this.emit('build'); break;
        case 'KeyI': this.emit('bag'); break;
        case 'Escape': this.emit('menu'); break;
        case 'KeyR': this.emit('rotate-r'); break;
        case 'KeyQ': this.emit('rotate-l'); break;
        case 'KeyT': this.emit('snap'); break;
        case 'Delete': case 'Backspace': this.emit('remove'); break;
        case 'Enter': this.emit('place'); break;
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Space') {
        const held = performance.now() - this._keyFlyAt;
        this.flyHeld = false; this.emit('fly-up');
        if (held < 240) this.emit('jump');
      }
    });
    window.addEventListener('blur', () => {
      this.keys.clear(); this.move.x = this.move.y = 0;
      if (this.flyHeld) { this.flyHeld = false; this.emit('fly-up'); }
    });
  }

  update() {
    let x = this.move.x, y = this.move.y;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    this.move.x = clamp(x, -1, 1);
    this.move.y = clamp(y, -1, 1);
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) this.run = true;
    else if (!this.keys.size && !this.pointers.size) this.run = Math.hypot(x, y) > 0.8;
    const l = { x: this.look.x, y: this.look.y, z: this.zoom };
    this.look.x = this.look.y = this.zoom = 0;
    return l;
  }
}
