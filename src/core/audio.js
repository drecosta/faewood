export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.55;
    this.master = null;
    this.ambientGain = null;
    this.started = false;
    this._nextBird = 0;
    this._nextChime = 0;
  }

  start() {
    if (this.started) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? this.volume : 0;
      this.master.connect(this.ctx.destination);
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.5;
      this.ambientGain.connect(this.master);
      this._wind();
      this._water();
      this.started = true;
    } catch (e) { console.warn('Audio unavailable', e); }
  }

  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = this.enabled ? v : 0; }
  setEnabled(on) { this.enabled = on; if (this.master) this.master.gain.value = on ? this.volume : 0; }

  _noiseBuffer(seconds = 2) {
    const n = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _wind() {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(3); src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 0.6;
    const gain = this.ctx.createGain(); gain.gain.value = 0.13;
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 0.07;
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    src.connect(filter); filter.connect(gain); gain.connect(this.ambientGain);
    src.start(); lfo.start();
    this.windGain = gain;
  }

  _water() {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(2); src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1150; filter.Q.value = 0.8;
    const gain = this.ctx.createGain(); gain.gain.value = 0.075;
    src.connect(filter); filter.connect(gain); gain.connect(this.ambientGain);
    src.start();
  }

  _tone(freq, duration, type = 'sine', gain = 0.12, when = 0, slide = 0) {
    if (!this.started || !this.enabled) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + duration + 0.02);
  }

  sfx(name) {
    if (!this.started || !this.enabled) return;
    switch (name) {
      case 'collect': this._tone(660, 0.16, 'sine', 0.11); this._tone(990, 0.22, 'sine', 0.08, 0.07); break;
      case 'rare': [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.35, 'sine', 0.1, i * 0.08)); break;
      case 'craft': [392, 523, 659].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.09, i * 0.07)); break;
      case 'place': this._tone(220, 0.12, 'triangle', 0.1); this._tone(330, 0.15, 'sine', 0.07, 0.05); break;
      case 'remove': this._tone(250, 0.13, 'sawtooth', 0.05, 0, -140); break;
      case 'jump': this._tone(400, 0.14, 'sine', 0.06, 0, 260); break;
      case 'flap': this._tone(150, 0.09, 'triangle', 0.035, 0, 90); break;
      case 'error': this._tone(180, 0.14, 'square', 0.04, 0, -50); break;
      case 'ui': this._tone(720, 0.06, 'sine', 0.05); break;
      case 'save': [440, 554, 659].forEach((f, i) => this._tone(f, 0.3, 'sine', 0.07, i * 0.1)); break;
    }
  }

  update(time, isNight) {
    if (!this.started || !this.enabled) return;
    const now = this.ctx.currentTime;
    if (now > this._nextBird && !isNight) {
      const base = 900 + Math.random() * 700;
      this._tone(base, 0.07, 'sine', 0.035);
      this._tone(base * 1.25, 0.09, 'sine', 0.03, 0.1);
      this._nextBird = now + 3 + Math.random() * 7;
    }
    if (now > this._nextChime && isNight) {
      const scale = [523, 622, 784, 932, 1047];
      this._tone(scale[(Math.random() * scale.length) | 0], 0.8, 'sine', 0.035);
      this._nextChime = now + 2 + Math.random() * 5;
    }
    if (this.windGain) this.windGain.gain.value = 0.1 + Math.sin(time * 0.35) * 0.04;
  }
}
