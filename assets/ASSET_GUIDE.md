# Editing Faewood models in Blender

Faewood now loads its reusable meshes from **GLB files** instead of hard-coded geometry. The registry is the single source of truth:

- `src/assets/model-registry.js` — asset ID → file path, node, transform, material/animation settings, game object and fallback.
- `assets/models/MODEL_MAP.md` — readable snapshot of every registered asset.
- `assets/models/model-manifest.json` — generated file list used for verification/cache tooling.
- `src/assets/model-library.js` — loader, cache, clones, overrides and fallbacks.

No Blender installation was available when these assets were generated, so `.blend` sources are not included yet. Save a `.blend` file next to any GLB you author from Blender (for example `fairy.blend` beside `fairy.glb`); the game only reads the GLB.

## Folder layout

```
assets/models/
  characters/fairy/          player fairy
  environment/trees/         ancient tree + instanced tree parts
  environment/rocks/         terrain rock + cave
  environment/plants/        grass, flowers, bushes
  environment/mushrooms/     stems + caps
  environment/crystals/      instanced shards
  buildings/platforms/       decks + rugs
  buildings/walls/           walls, railings, pillars
  buildings/roofs/           roofs
  buildings/bridges/         doors, ladders, stairs, bridges, balconies
  buildings/furniture/       furniture + decorations
  resources/                 harvest nodes
  creatures/                 reserved for future NPCs/critters
assets/textures/             reserved for Blender-exported textures
assets/materials/            reserved for shared material notes
assets/animations/           reserved for future GLB animation clips
```

## Coordinate + naming conventions

- Units are metres; the fairy is about 1.4 units tall.
- **+Y is up**, **+Z is forward** (the fairy's face points along +Z).
- Put the object origin at its base/footprint centre, not at its geometric centre. Instanced parts keep their origin at local `(0,0,0)`.
- Keep meaningful node names. Runtime code binds to these names:
  - Fairy: `Body`, `Head`, `ArmL`, `ArmR`, `LegL`, `LegR`, `WingPivotL`, `WingPivotR`, `WingUpperL`, `WingUpperR`, `WingLowerL`, `WingLowerR`.
  - Building pieces: `Root`.
  - Resources: `Root`.
  - Ancient tree: `AncientTree`, `AncientTrunk`, `AncientRoot0…5`, `Canopy0…7`, `Vine0…8`.
  - Cave: `Cave`, `CaveRock`, `CaveMouth`.
  - Instanced primitives: `Trunk`, `Crown`, `CrownCone`, `Rock`, `Grass`, `Stem`, `Head`, `Bush`, `Cap`, `Shard`.
- Material names drive palette swapping: `Skin`, `Hair`, `Dress`, `Shoe`, `Eye`, `WingGlow`, `Bark`, `Leaf`, `Crystal`, etc.

## Blender workflow

1. Open Blender and `File → Import → glTF 2.0…`; choose the GLB listed in `MODEL_MAP.md`.
2. Edit geometry, materials or UVs. Keep node names unchanged unless you also update the registry/caller binding.
3. Apply transforms where appropriate (`Ctrl+A → All Transforms`) and re-centre the origin at the base of the object.
4. `File → Export → glTF 2.0…` with:
   - Format: **GLB**
   - Include: selected objects only if you are replacing one asset
   - Transform: `+Y Up`, scale `1.0`
   - Materials: export as glTF materials (Principled BSDF)
5. Save the editable `.blend` next to the GLB.
6. Overwrite the original path from `MODEL_MAP.md`. No gameplay code changes are needed.
7. Run `npm run models` if you also want to regenerate the map/manifest and bump the PWA cache version.

The export command rebuilds every GLB from the procedural source code, so **do not run it after hand-editing a GLB** unless you intend to discard those edits. Regenerate only when you deliberately want to reset models to the procedural baseline.

## Registry fields

```js
'characters.fairy': entry('characters/fairy/fairy.glb', {
  node: 'Body',
  scale: [1, 1, 1],
  rotation: [0, 0, 0],
  position: [0, 0, 0],
  material: null,
  animation: { wingShader: true },
  shadows: true,
  gameObject: 'Fairy.body',
  fallback: 'procedural fairy',
});
```

- `path` — GLB relative to `index.html`.
- `node` — node used when only geometry is extracted for `InstancedMesh` objects.
- `scale` / `rotation` / `position` — applied by `Models.create()` and `Models.geometry()`. Change these instead of editing call sites.
- `material` — optional override list with `nodeMatch`, `materialMatch`, `color`, `emissive`, `roughness`, `metalness`, `opacity`, `transparent`, `side`, `flatShading`.
- `animation` — `{ wingShader: true }` restores the fairy shimmer shader; `{ wind: 0.018, nodeMatch: 'Canopy' }` applies the shared wind shader.
- `shadows` — cast/receive flags for group instances.
- `gameObject` / `fallback` — documentation used by `MODEL_MAP.md`.

## Runtime behaviour

- `Models.preload()` loads all registered GLBs before the world is created; the loading screen shows progress.
- `Models.create(id)` returns a fresh clone with materials cloned per instance, so changing one fairy or building piece never mutates another.
- If a file is missing or fails to parse, the loader logs a warning and the caller uses its procedural fallback. The game remains playable offline.
- Instanced meshes still use one geometry per mesh — replacing `tree-trunk.glb` updates every tree without adding draw calls.
- `sw.js` caches every GLB. `npm run models` bumps the cache name automatically; if you replace a GLB manually, bump `CACHE` in `sw.js` once so returning players receive the new file.

## Testing a replacement

```bash
npm start
# open http://localhost:8080, hard-refresh, then:
# - check the fairy animates and palette changes still work
# - place each changed building piece
# - harvest a changed resource node
# - confirm trees/rocks/cave still collide
```

Verify GLB loading headlessly (after installing dev dependencies):

```bash
npm run models   # includes GLTFLoader r187 verification of all 51 GLBs
```
