import * as THREE from 'three';
import { Engine } from './core/engine.js';
import { Input } from './core/input.js';
import { Save } from './core/save.js';
import { AudioEngine } from './core/audio.js';
import { World } from './world/world.js';
import { PlayerController } from './player/controller.js';
import { Inventory } from './systems/inventory.js';
import { HarvestSystem } from './systems/harvest.js';
import { BuildSystem } from './systems/building.js';
import { UI } from './ui/hud.js';
import { ITEMS, PIECE_BY_ID, canAfford } from './systems/items.js';
import { clamp } from './core/utils.js';

const saved = Save.load();
const engine = new Engine(document.getElementById('game'));
const quality = saved?.quality && ['low', 'medium', 'high'].includes(saved.quality) ? saved.quality : 'medium';
engine.setQuality(quality);
if (typeof saved?.time === 'number') engine.setTime(saved.time);

const world = new World(engine);
const input = new Input(engine.canvas);
const audio = new AudioEngine();
audio.enabled = saved?.sound !== false;
audio.volume = clamp(saved?.volume ?? 0.55, 0, 1);

const inventory = new Inventory(saved?.inventory ?? { wood: 3, leaves: 2 });
const harvest = new HarvestSystem(engine.scene, engine);
harvest.restore(saved?.harvest);
const player = new PlayerController(engine, world, input, audio, saved?.palette);

let ui;
const build = new BuildSystem(engine, world, inventory, audio, () => refreshUI());

function stateForUI() {
  return {
    inventory: inventory.items,
    inventoryTotal: inventory.total,
    builtCount: build.pieces.length,
    buildPiece: build.pieceId,
    palette: player.fairy.palette,
    quality: engine.qualityName,
    sound: audio.enabled,
    volume: audio.volume,
    time: engine.time,
  };
}

function refreshUI() {
  ui?.setState(stateForUI());
  if (build.active) {
    ui.setBuildMode(true, build.status(), { snapping: build.snapping, mode: build.mode });
  } else ui.setBuildMode(false);
}

const saveNow = () => {
  const ok = Save.write({
    player: player.serialize(), inventory: inventory.serialize(), harvest: harvest.serialize(),
    buildings: build.serialize(), palette: player.fairy.palette, quality: engine.qualityName,
    sound: audio.enabled, volume: audio.volume, time: engine.time,
  });
  if (ok) audio.sfx('save');
  return ok;
};
const queueSave = Save.debounce(() => Save.write({
  player: player.serialize(), inventory: inventory.serialize(), harvest: harvest.serialize(),
  buildings: build.serialize(), palette: player.fairy.palette, quality: engine.qualityName,
  sound: audio.enabled, volume: audio.volume, time: engine.time,
}), 1600);

ui = new UI({
  sfx: (n) => audio.sfx(n),
  craft: (id) => {
    if (inventory.craft(id)) { audio.sfx('craft'); ui.toast(`✦ Crafted something new!`); queueSave(); }
    else { audio.sfx('error'); ui.toast('Not enough materials'); }
    refreshUI();
  },
  build: (id) => {
    if (!canAfford(inventory.items, PIECE_BY_ID[id].cost)) {
      ui.toast('Gather more materials first'); audio.sfx('error'); return;
    }
    build.begin(id);
    ui.close();
    ui.toast(`Placing <b>${PIECE_BY_ID[id].name}</b> — use the build bar`, 2400);
    refreshUI();
  },
  palette: (group, index) => {
    player.fairy.setPalette({ ...player.fairy.palette, [group]: index });
    refreshUI(); queueSave();
  },
  quality: (v) => { engine.setQuality(v); refreshUI(); queueSave(); ui.toast(`Graphics: ${v}`); },
  volume: (v) => { audio.setVolume(v); refreshUI(); queueSave(); },
  sound: () => { audio.setEnabled(!audio.enabled); refreshUI(); queueSave(); },
  time: (v) => { engine.setTime(v); refreshUI(); queueSave(); },
  save: () => { ui.toast(saveNow() ? '✦ Progress saved' : 'Save unavailable'); },
  load: () => {
    const s = Save.load();
    if (!s) { ui.toast('No save found'); return; }
    inventory.items = { ...s.inventory };
    build.restore(s.buildings);
    harvest.restore(s.harvest);
    player.restore(s.player);
    player.fairy.setPalette(s.palette || {});
    if (s.quality) engine.setQuality(s.quality);
    if (typeof s.time === 'number') engine.setTime(s.time);
    audio.setEnabled(s.sound !== false); audio.setVolume(s.volume ?? 0.55);
    ui.toast('↺ World restored'); refreshUI();
  },
  reset: () => {
    if (!confirm('Erase your Faewood world and start over?')) return;
    Save.clear(); location.reload();
  },
  tool: (ev) => {
    if (ev === 'rotate-l') build.rotate(-1);
    if (ev === 'rotate-r') build.rotate(1);
    if (ev === 'elevate-up') build.elevate(1);
    if (ev === 'elevate-down') build.elevate(-1);
    if (ev === 'snap') { const on = build.toggleSnap(); ui.toast(on ? 'Grid snap on' : 'Free placement'); }
    if (ev === 'remove') { build.toggleMode('remove'); ui.toast('Tap REMOVE over a piece to take it back'); }
    if (ev === 'move') { build.toggleMode('move'); ui.toast('Tap SELECT over a piece, then place it again'); }
    if (ev === 'place') {
      if (build.mode === 'place') { build.place(); queueSave(); }
      else { build.remove(); queueSave(); }
    }
    if (ev === 'exit-build') { build.end(); ui.toast('Build mode closed'); }
    refreshUI();
  },
});

input.on('interact', () => {
  if (!started) return;
  if (build.active && build.mode !== 'place') { build.remove(); queueSave(); refreshUI(); return; }
  const n = harvest.nearest(player.position, 3.6);
  if (!n) { ui.toast('Move closer to a glowing resource'); return; }
  const got = harvest.harvest(n);
  if (!got) return;
  inventory.add(got.type, got.amount);
  audio.sfx(got.rare ? 'rare' : 'collect');
  ui.toast(`${ITEMS[got.type].symbol} +${got.amount} ${ITEMS[got.type].name}${got.rare ? ' · rare find!' : ''}`);
  refreshUI(); queueSave();
});

input.on('build', () => {
  if (!started) return;
  if (build.active) { build.end(); refreshUI(); }
  else ui.open('build');
});
input.on('bag', () => { if (started) ui.open('inventory'); });
input.on('menu', () => {
  if (!started) return;
  if (ui.isOpen) ui.close(); else ui.open('settings');
});

function objective() {
  const inv = inventory.items;
  if ((inv.wood || 0) < 5 && (inv.planks || 0) < 3) return 'Gather glowing woodpiles — tap ✧ when close';
  if ((inv.planks || 0) < 3 && build.pieces.length === 0) return 'Open Craft (I) and make planks';
  if (build.pieces.length === 0) return 'Open Build (B) and place your first deck';
  if (build.pieces.length < 6) return 'Grow your treehouse — walls, roofs and balconies';
  if (!(inv.lantern || 0) && !build.pieces.some((b) => b.pieceId === 'lanternPost')) return 'Craft a lantern from glass, dust and wood';
  if (!(inv.dew || 0)) return 'Search the cave, waterfall and treetop for Star Dew';
  return 'Your sanctuary is growing — keep building!';
}

let started = false;
const gate = document.getElementById('start-gate');
const loading = document.getElementById('loading');
document.getElementById('start-btn').addEventListener('click', () => {
  audio.start(); audio.resume();
  gate.classList.add('hidden');
  started = true;
  ui.toast('Welcome to Faewood ✦', 2600);
  ui.setHint('Drag left stick to move · drag screen to look · hold FLY to take off');
  setTimeout(() => ui.setHint(''), 7000);
});

build.restore(saved?.buildings?.length ? saved.buildings : [
  { id: 'starter-1', pieceId: 'floor', x: 0, y: 3.5, z: 2, r: 0 },
  { id: 'starter-2', pieceId: 'floor', x: 2, y: 3.5, z: 2, r: 0 },
]);
player.restore(saved?.player);
refreshUI();
loading.classList.add('hidden');
gate.classList.remove('hidden');
if (saved) ui.toast('Your world was restored ✦', 2400);

let last = performance.now();
let uiTimer = 0;
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const look = input.update();
  engine.update(dt);
  if (started) {
    player.update(dt, look);
    harvest.update(dt, player.position);
    if (build.active) build.update(dt, player.position);
  }
  world.update(dt);
  audio.update(world.elapsed, engine.isNight);
  uiTimer += dt;
  if (uiTimer > 0.2) {
    uiTimer = 0;
    ui.updateTop(engine.timeString, player.energy, player.health);
    ui.setObjective(objective());
    const near = harvest.nearest(player.position, 3.6);
    ui.setInteractReady(!!near && started);
    if (build.active) ui.setBuildMode(true, build.status(), { snapping: build.snapping, mode: build.mode });
  }
  engine.render();
}
requestAnimationFrame(tick);

window.addEventListener('beforeunload', () => {
  if (started) Save.write({
    player: player.serialize(), inventory: inventory.serialize(), harvest: harvest.serialize(),
    buildings: build.serialize(), palette: player.fairy.palette, quality: engine.qualityName,
    sound: audio.enabled, volume: audio.volume, time: engine.time,
  });
});
