# Faewood model map

Generated from `src/assets/model-registry.js` by `npm run models`. The registry is the single source of truth; this table is a readable snapshot.

| Asset ID | Label | Game object | Model file | Node | Fallback |
| --- | --- | --- | --- | --- | --- |
| `characters.fairy` | Player Fairy | `Fairy.body` | `characters/fairy/fairy.glb` | `Body` | procedural fairy |
| `environment.trees.ancient` | Ancient Tree | `buildVegetation().ancient` | `environment/trees/ancient-tree.glb` | `AncientTree` | procedural ancient tree |
| `environment.trees.trunk` | Tree Trunk (instanced) | `vegetation tree trunk InstancedMesh` | `environment/trees/tree-trunk.glb` | `Trunk` | CylinderGeometry(0.3,0.52,4,6) |
| `environment.trees.crown` | Tree Crown (instanced) | `vegetation tree crown InstancedMesh` | `environment/trees/tree-crown.glb` | `Crown` | IcosahedronGeometry(2.25,0) |
| `environment.trees.crownCone` | Turret Crown (instanced) | `vegetation crown cone InstancedMesh` | `environment/trees/tree-crown-cone.glb` | `CrownCone` | ConeGeometry(1,1.8,6) |
| `environment.rocks.rock` | Rock (instanced) | `terrain rock InstancedMesh` | `environment/rocks/rock.glb` | `Rock` | DodecahedronGeometry(1,0) |
| `environment.rocks.cave` | Cave Rock | `buildVegetation().cave` | `environment/rocks/cave.glb` | `Cave` | procedural cave |
| `environment.plants.grass` | Grass Blade (instanced) | `vegetation grass InstancedMesh` | `environment/plants/grass.glb` | `Grass` | ConeGeometry(0.16,0.85,3) |
| `environment.plants.flowerStem` | Flower Stem (instanced) | `vegetation flower stem InstancedMesh` | `environment/plants/flower-stem.glb` | `Stem` | CylinderGeometry(0.03,0.04,0.6,4) |
| `environment.plants.flowerHead` | Flower Head (instanced) | `vegetation flower head InstancedMesh` | `environment/plants/flower-head.glb` | `Head` | IcosahedronGeometry(0.22,0) |
| `environment.plants.bush` | Bush (instanced) | `vegetation bush InstancedMesh` | `environment/plants/bush.glb` | `Bush` | IcosahedronGeometry(0.8,0) |
| `environment.mushrooms.stem` | Mushroom Stem (instanced) | `vegetation mushroom stem InstancedMesh` | `environment/mushrooms/stem.glb` | `Stem` | CylinderGeometry(0.13,0.18,0.5,6) |
| `environment.mushrooms.cap` | Mushroom Cap (instanced) | `vegetation mushroom cap InstancedMesh` | `environment/mushrooms/cap.glb` | `Cap` | SphereGeometry(0.46,8,5,0,TAU,0,PI/2) |
| `environment.crystals.shard` | Crystal Shard (instanced) | `vegetation crystal InstancedMesh` | `environment/crystals/shard.glb` | `Shard` | OctahedronGeometry(0.6,0) |
| `buildings.floor` | Wood Deck | `BuildSystem.makePiece('floor')` | `buildings/platforms/floor.glb` | `Root` | procedural building geometry |
| `buildings.floorRound` | Round Deck | `BuildSystem.makePiece('floorRound')` | `buildings/platforms/floorRound.glb` | `Root` | procedural building geometry |
| `buildings.floorGlass` | Glass Floor | `BuildSystem.makePiece('floorGlass')` | `buildings/platforms/floorGlass.glb` | `Root` | procedural building geometry |
| `buildings.wall` | Wall | `BuildSystem.makePiece('wall')` | `buildings/walls/wall.glb` | `Root` | procedural building geometry |
| `buildings.wallWindow` | Window Wall | `BuildSystem.makePiece('wallWindow')` | `buildings/walls/wallWindow.glb` | `Root` | procedural building geometry |
| `buildings.halfWall` | Railing | `BuildSystem.makePiece('halfWall')` | `buildings/walls/halfWall.glb` | `Root` | procedural building geometry |
| `buildings.pillar` | Pillar | `BuildSystem.makePiece('pillar')` | `buildings/walls/pillar.glb` | `Root` | procedural building geometry |
| `buildings.roof` | Sloped Roof | `BuildSystem.makePiece('roof')` | `buildings/roofs/roof.glb` | `Root` | procedural building geometry |
| `buildings.roofCone` | Turret Roof | `BuildSystem.makePiece('roofCone')` | `buildings/roofs/roofCone.glb` | `Root` | procedural building geometry |
| `buildings.roofMoss` | Living Roof | `BuildSystem.makePiece('roofMoss')` | `buildings/roofs/roofMoss.glb` | `Root` | procedural building geometry |
| `buildings.door` | Doorway | `BuildSystem.makePiece('door')` | `buildings/bridges/door.glb` | `Root` | procedural building geometry |
| `buildings.ladder` | Rope Ladder | `BuildSystem.makePiece('ladder')` | `buildings/bridges/ladder.glb` | `Root` | procedural building geometry |
| `buildings.stairs` | Stairs | `BuildSystem.makePiece('stairs')` | `buildings/bridges/stairs.glb` | `Root` | procedural building geometry |
| `buildings.bridge` | Rope Bridge | `BuildSystem.makePiece('bridge')` | `buildings/bridges/bridge.glb` | `Root` | procedural building geometry |
| `buildings.balcony` | Balcony | `BuildSystem.makePiece('balcony')` | `buildings/bridges/balcony.glb` | `Root` | procedural building geometry |
| `buildings.bed` | Fairy Bed | `BuildSystem.makePiece('bed')` | `buildings/furniture/bed.glb` | `Root` | procedural building geometry |
| `buildings.table` | Round Table | `BuildSystem.makePiece('table')` | `buildings/furniture/table.glb` | `Root` | procedural building geometry |
| `buildings.chair` | Chair | `BuildSystem.makePiece('chair')` | `buildings/furniture/chair.glb` | `Root` | procedural building geometry |
| `buildings.shelf` | Storage Shelf | `BuildSystem.makePiece('shelf')` | `buildings/furniture/shelf.glb` | `Root` | procedural building geometry |
| `buildings.wardrobe` | Little Wardrobe | `BuildSystem.makePiece('wardrobe')` | `buildings/furniture/wardrobe.glb` | `Root` | procedural building geometry |
| `buildings.lanternPost` | Lantern Post | `BuildSystem.makePiece('lanternPost')` | `buildings/furniture/lanternPost.glb` | `Root` | procedural building geometry |
| `buildings.crystalLamp` | Crystal Lamp | `BuildSystem.makePiece('crystalLamp')` | `buildings/furniture/crystalLamp.glb` | `Root` | procedural building geometry |
| `buildings.flowerBox` | Flower Box | `BuildSystem.makePiece('flowerBox')` | `buildings/furniture/flowerBox.glb` | `Root` | procedural building geometry |
| `buildings.plantPot` | Seedling Pot | `BuildSystem.makePiece('plantPot')` | `buildings/furniture/plantPot.glb` | `Root` | procedural building geometry |
| `buildings.mushroomSeat` | Mushroom Stool | `BuildSystem.makePiece('mushroomSeat')` | `buildings/furniture/mushroomSeat.glb` | `Root` | procedural building geometry |
| `buildings.windChime` | Wind Chime | `BuildSystem.makePiece('windChime')` | `buildings/furniture/windChime.glb` | `Root` | procedural building geometry |
| `buildings.rug` | Petal Rug | `BuildSystem.makePiece('rug')` | `buildings/platforms/rug.glb` | `Root` | procedural building geometry |
| `buildings.sign` | Wooden Sign | `BuildSystem.makePiece('sign')` | `buildings/furniture/sign.glb` | `Root` | procedural building geometry |
| `resources.wood` | Woodpile | `HarvestSystem.makeNodeMesh('wood')` | `resources/wood.glb` | `Root` | procedural resource geometry |
| `resources.leaves` | Leaf Bush | `HarvestSystem.makeNodeMesh('leaves')` | `resources/leaves.glb` | `Root` | procedural resource geometry |
| `resources.flowers` | Flower Patch | `HarvestSystem.makeNodeMesh('flowers')` | `resources/flowers.glb` | `Root` | procedural resource geometry |
| `resources.mushrooms` | Mushroom Ring | `HarvestSystem.makeNodeMesh('mushrooms')` | `resources/mushrooms.glb` | `Root` | procedural resource geometry |
| `resources.stones` | Pebble Pile | `HarvestSystem.makeNodeMesh('stones')` | `resources/stones.glb` | `Root` | procedural resource geometry |
| `resources.crystals` | Crystal Shard | `HarvestSystem.makeNodeMesh('crystals')` | `resources/crystals.glb` | `Root` | procedural resource geometry |
| `resources.seeds` | Seed Pods | `HarvestSystem.makeNodeMesh('seeds')` | `resources/seeds.glb` | `Root` | procedural resource geometry |
| `resources.dust` | Fairy Dust | `HarvestSystem.makeNodeMesh('dust')` | `resources/dust.glb` | `Root` | procedural resource geometry |
| `resources.dew` | Star Dew | `HarvestSystem.makeNodeMesh('dew')` | `resources/dew.glb` | `Root` | procedural resource geometry |

Animation rules: `characters.fairy` swaps wing materials to the runtime shimmer shader; `environment.trees.ancient` applies wind to nodes matching `Canopy`.
