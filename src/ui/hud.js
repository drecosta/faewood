import { ITEMS, RECIPES, BUILD_PIECES, CATEGORIES, costText, canAfford } from '../systems/items.js';
import { PALETTES } from '../player/fairy.js';

export class UI {
  constructor(cb) {
    this.cb = cb;
    this.panel = document.getElementById('panel');
    this.body = document.getElementById('panel-body');
    this.toasts = document.getElementById('toasts');
    this.hint = document.getElementById('hint');
    this.objective = document.getElementById('objective-text');
    this.timeLabel = document.getElementById('time-label');
    this.energy = document.getElementById('energy-fill');
    this.health = document.getElementById('health-label');
    this.buildbar = document.getElementById('buildbar');
    this.buildInfo = document.getElementById('build-info');
    this.interactBtn = document.getElementById('btn-interact');
    this.tab = 'inventory';
    this.buildCat = 'Structure';
    this.state = null;
    this._wire();
  }

  _wire() {
    document.getElementById('panel-close').addEventListener('click', () => this.close());
    document.querySelectorAll('.tab').forEach((el) => el.addEventListener('click', () => {
      this.tab = el.dataset.tab;
      document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === el));
      this.render();
      this.cb.sfx?.('ui');
    }));
    this.body.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const a = el.dataset.action;
      if (a === 'craft') this.cb.craft?.(el.dataset.id);
      if (a === 'build') this.cb.build?.(el.dataset.id);
      if (a === 'palette') this.cb.palette?.(el.dataset.group, Number(el.dataset.index));
      if (a === 'quality') this.cb.quality?.(el.dataset.value);
      if (a === 'volume') this.cb.volume?.(Number(el.dataset.value));
      if (a === 'sound') this.cb.sound?.();
      if (a === 'time') this.cb.time?.(Number(el.dataset.value));
      if (a === 'save') this.cb.save?.();
      if (a === 'load') this.cb.load?.();
      if (a === 'reset') this.cb.reset?.();
      if (a === 'cat') { this.buildCat = el.dataset.value; this.render(); }
      this.cb.sfx?.('ui');
    });
    const map = {
      'tool-rotate-l': 'rotate-l', 'tool-rotate-r': 'rotate-r', 'tool-up': 'elevate-up',
      'tool-down': 'elevate-down', 'tool-snap': 'snap', 'tool-remove': 'remove',
      'tool-move': 'move', 'tool-place': 'place', 'tool-cancel': 'exit-build',
    };
    Object.entries(map).forEach(([id, ev]) => document.getElementById(id)?.addEventListener('click', () => this.cb.tool?.(ev)));
  }

  toast(msg, ms = 3000) {
    const el = document.createElement('div');
    el.className = 'toast'; el.innerHTML = msg;
    this.toasts.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  setHint(html) {
    if (!html) { this.hint.classList.add('hidden'); return; }
    if (this.hint.innerHTML !== html) this.hint.innerHTML = html;
    this.hint.classList.remove('hidden');
  }

  setObjective(text) { if (this.objective.textContent !== text) this.objective.textContent = text; }

  updateTop(timeLabel, energy, health) {
    if (this.timeLabel.textContent !== timeLabel) this.timeLabel.textContent = timeLabel;
    this.energy.style.width = `${Math.max(0, energy)}%`;
    this.health.textContent = Math.round(health);
  }

  setInteractReady(on) { this.interactBtn.classList.toggle('ready', on); }

  open(tab = this.tab) {
    this.tab = tab;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    this.render();
    this.panel.classList.remove('hidden');
  }

  close() { this.panel.classList.add('hidden'); }
  get isOpen() { return !this.panel.classList.contains('hidden'); }

  setBuildMode(on, info = '', tools = {}) {
    this.buildbar.classList.toggle('hidden', !on);
    if (info) this.buildInfo.innerHTML = info;
    document.getElementById('tool-snap')?.classList.toggle('active', !!tools.snapping);
    document.getElementById('tool-remove')?.classList.toggle('active', tools.mode === 'remove');
    document.getElementById('tool-move')?.classList.toggle('active', tools.mode === 'move');
    const place = document.getElementById('tool-place');
    place.textContent = tools.mode === 'remove' ? 'REMOVE' : tools.mode === 'move' ? 'SELECT' : 'PLACE';
  }

  setState(state) { this.state = state; if (this.isOpen) this.render(); }

  render() {
    if (!this.state) return;
    const s = this.state;
    switch (this.tab) {
      case 'inventory': this._renderInventory(s); break;
      case 'craft': this._renderCraft(s); break;
      case 'build': this._renderBuild(s); break;
      case 'style': this._renderStyle(s); break;
      case 'settings': this._renderSettings(s); break;
    }
  }

  _renderInventory(s) {
    const entries = Object.entries(s.inventory).filter(([, v]) => v > 0);
    let html = `<h2>Your Satchel <span style="float:right;color:var(--dim)">${s.inventoryTotal} things</span></h2>
      <p class="small">Everything you gather lives here. Craft planks and rope to begin building.</p><div class="grid">`;
    if (!entries.length) html += `<div class="card" style="grid-column:1/-1">Nothing yet! Tap ✧ near a glowing plant to gather.</div>`;
    for (const [id, n] of entries) {
      const it = ITEMS[id]; if (!it) continue;
      html += `<div class="card"><div class="symbol" style="color:${it.color}">${it.symbol}</div>
        <div class="name">${it.name}</div><div class="meta">×${n}</div></div>`;
    }
    html += '</div>';
    const placed = s.builtCount;
    html += `<h2 style="margin-top:18px">Treehouse</h2><p class="small">${placed} piece${placed === 1 ? '' : 's'} placed. Every piece is saved automatically.</p>`;
    this.body.innerHTML = html;
  }

  _renderCraft(s) {
    let html = `<h2>Crafting</h2><p class="small">Turn forest treasures into building materials.</p><div class="grid">`;
    for (const r of RECIPES) {
      const ok = canAfford(s.inventory, r.cost);
      html += `<div class="card clickable ${ok ? '' : 'locked'}" data-action="craft" data-id="${r.id}">
        <div class="symbol" style="color:${ITEMS[Object.keys(r.out)[0]]?.color}">${ITEMS[Object.keys(r.out)[0]]?.symbol}</div>
        <div class="name">${Object.entries(r.out).map(([k, v]) => `${ITEMS[k].name} ×${v}`).join(', ')}</div>
        <div class="meta">${costText(r.cost)}</div></div>`;
    }
    html += '</div>';
    this.body.innerHTML = html;
  }

  _renderBuild(s) {
    let html = `<h2>Build Pieces</h2><p class="small">Choose a piece, then place it with the ghost preview. Snap, rotate and raise with the build bar.</p>
      <div class="tabs" style="margin-bottom:10px;justify-content:flex-start">`;
    for (const c of CATEGORIES) html += `<button class="tab ${c === this.buildCat ? 'active' : ''}" data-action="cat" data-value="${c}">${c}</button>`;
    html += '</div><div class="grid">';
    for (const p of BUILD_PIECES.filter((x) => x.cat === this.buildCat)) {
      const ok = canAfford(s.inventory, p.cost);
      html += `<div class="card clickable ${ok ? '' : 'locked'} ${s.buildPiece === p.id ? 'selected' : ''}" data-action="build" data-id="${p.id}">
        <div class="symbol" style="color:var(--gold)">${p.icon}</div>
        <div class="name">${p.name}</div><div class="meta">${costText(p.cost, s.inventory)}</div></div>`;
    }
    html += '</div>';
    this.body.innerHTML = html;
  }

  _renderStyle(s) {
    let html = `<h2>Your Fairy</h2><p class="small">Make her yours. Changes are saved instantly.</p>`;
    const groups = { skin: 'Skin', hair: 'Hair', dress: 'Dress', wings: 'Wing Glow' };
    const colors = { skin: PALETTES.SKIN, hair: PALETTES.HAIR, dress: PALETTES.DRESS, wings: PALETTES.WINGS };
    for (const [g, label] of Object.entries(groups)) {
      html += `<h2 style="font-size:12px;color:var(--mint)">${label}</h2><div class="swatch-row">`;
      colors[g].forEach((c, i) => {
        html += `<div class="swatch ${s.palette[g] === i ? 'active' : ''}" data-action="palette" data-group="${g}" data-index="${i}" style="background:${c}"></div>`;
      });
      html += '</div>';
    }
    this.body.innerHTML = html;
  }

  _renderSettings(s) {
    const seg = (action, options, current) => `<div class="seg">` + options.map((o) =>
      `<button data-action="${action}" data-value="${o.v}" class="${current === o.v ? 'active' : ''}">${o.l}</button>`).join('') + '</div>';
    this.body.innerHTML = `<h2>Settings</h2>
      <div class="setting-row"><span>Graphics</span>${seg('quality', [{ v: 'low', l: 'Low' }, { v: 'medium', l: 'Medium' }, { v: 'high', l: 'High' }], s.quality)}</div>
      <div class="setting-row"><span>Time of day</span>${seg('time', [{ v: 0.16, l: 'Dawn' }, { v: 0.32, l: 'Day' }, { v: 0.54, l: 'Dusk' }, { v: 0.8, l: 'Night' }], Math.round(s.time * 100) / 100)}</div>
      <div class="setting-row"><span>Sound</span><button class="tab ${s.sound ? 'active' : ''}" data-action="sound">${s.sound ? 'On' : 'Off'}</button></div>
      <div class="setting-row"><span>Volume</span>${seg('volume', [{ v: 0.25, l: 'Low' }, { v: 0.55, l: 'Med' }, { v: 1, l: 'High' }], s.volume)}</div>
      <button class="wide-btn" data-action="save">✦ Save now</button>
      <button class="wide-btn" data-action="load">↺ Load last save</button>
      <button class="wide-btn" data-action="reset" style="border-color:rgba(255,140,150,.3)">Start over (erase save)</button>
      <p class="small" style="margin-top:12px">Faewood saves automatically as you play. Everything stays on this device.</p>`;
  }
}
