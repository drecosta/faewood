export const ITEMS = {
  wood:      { name: 'Wood',       symbol: '▰', color: '#b98a5c' },
  leaves:    { name: 'Leaves',     symbol: '❧', color: '#8fd77d' },
  flowers:   { name: 'Flowers',    symbol: '✿', color: '#f3a2c4' },
  mushrooms: { name: 'Mushrooms',  symbol: '⌒', color: '#e28a92' },
  stones:    { name: 'Stones',     symbol: '◆', color: '#aab4b1' },
  crystals:  { name: 'Crystals',   symbol: '✧', color: '#9fd9ff' },
  seeds:     { name: 'Seeds',      symbol: '❋', color: '#e8d58d' },
  dust:      { name: 'Fairy Dust', symbol: '✦', color: '#ffe69c' },
  dew:       { name: 'Star Dew',   symbol: '✶', color: '#c7b1ff' },
  planks:    { name: 'Planks',     symbol: '▤', color: '#d2a874' },
  rope:      { name: 'Rope',       symbol: '≋', color: '#d8c99a' },
  glass:     { name: 'Glass',      symbol: '◇', color: '#b8ecf2' },
  lantern:   { name: 'Lantern',    symbol: '✺', color: '#ffd98a' },
  cushion:   { name: 'Cushion',    symbol: '❖', color: '#f4b7d4' },
};

export const RECIPES = [
  { id: 'planks',  out: { planks: 3 },  cost: { wood: 4 },                  desc: 'Smooth timber from forest wood' },
  { id: 'rope',    out: { rope: 2 },    cost: { leaves: 5 },                 desc: 'Woven from strong leaves' },
  { id: 'glass',   out: { glass: 2 },   cost: { stones: 3, crystals: 1 },    desc: 'Clear panes from crystal and stone' },
  { id: 'lantern', out: { lantern: 1 }, cost: { glass: 1, dust: 3, wood: 1 },desc: 'A little captured starlight' },
  { id: 'cushion', out: { cushion: 1 }, cost: { leaves: 3, flowers: 3 },     desc: 'Soft and sweet' },
  { id: 'dust',    out: { dust: 3 },    cost: { crystals: 1, flowers: 2 },   desc: 'Bottle the sparkle of the forest' },
];

export const CATEGORIES = ['Structure', 'Roof', 'Access', 'Furniture', 'Decor'];

export const BUILD_PIECES = [
  { id: 'floor',       name: 'Wood Deck',      cat: 'Structure', size: [2, 2], h: 0.24, cost: { planks: 3 },        icon: '▤' },
  { id: 'floorRound',  name: 'Round Deck',     cat: 'Structure', size: [2, 2], h: 0.24, cost: { planks: 2, leaves: 3 }, icon: '◍' },
  { id: 'floorGlass',  name: 'Glass Floor',    cat: 'Structure', size: [2, 2], h: 0.2,  cost: { planks: 1, glass: 2 }, icon: '◇' },
  { id: 'wall',        name: 'Wall',           cat: 'Structure', size: [2, 0.24], h: 2.2, cost: { planks: 3 },      icon: '▥', vertical: true },
  { id: 'wallWindow',  name: 'Window Wall',    cat: 'Structure', size: [2, 0.24], h: 2.2, cost: { planks: 2, glass: 2 }, icon: '▣', vertical: true },
  { id: 'halfWall',    name: 'Railing',        cat: 'Structure', size: [2, 0.18], h: 0.95, cost: { planks: 2 },     icon: '☷' },
  { id: 'pillar',      name: 'Pillar',         cat: 'Structure', size: [0.4, 0.4], h: 2.4, cost: { wood: 2 },       icon: '▮', vertical: true },
  { id: 'roof',        name: 'Sloped Roof',    cat: 'Roof', size: [2.4, 2.4], h: 1.2, cost: { planks: 5, leaves: 2 }, icon: '⌂', top: true },
  { id: 'roofCone',    name: 'Turret Roof',    cat: 'Roof', size: [2.2, 2.2], h: 1.8, cost: { planks: 4, leaves: 4 }, icon: '△', top: true },
  { id: 'roofMoss',    name: 'Living Roof',    cat: 'Roof', size: [2.4, 2.4], h: 1.0, cost: { planks: 3, leaves: 6, flowers: 2 }, icon: '❧', top: true },
  { id: 'door',        name: 'Doorway',        cat: 'Access', size: [1.2, 0.26], h: 2.2, cost: { planks: 3, glass: 1 }, icon: '⌑', vertical: true },
  { id: 'ladder',      name: 'Rope Ladder',    cat: 'Access', size: [0.7, 0.35], h: 2.6, cost: { wood: 2, rope: 3 }, icon: '╫', vertical: true },
  { id: 'stairs',      name: 'Stairs',         cat: 'Access', size: [1.3, 2], h: 1.3, cost: { planks: 4 },          icon: '◺' },
  { id: 'bridge',      name: 'Rope Bridge',    cat: 'Access', size: [4, 1.1], h: 0.2, cost: { planks: 4, rope: 4 },  icon: '≋' },
  { id: 'balcony',     name: 'Balcony',        cat: 'Access', size: [3, 1.5], h: 0.22, cost: { planks: 4 },         icon: '▱' },
  { id: 'bed',         name: 'Fairy Bed',      cat: 'Furniture', size: [1.5, 2], h: 0.6, cost: { planks: 3, cushion: 1 }, icon: '▭' },
  { id: 'table',       name: 'Round Table',    cat: 'Furniture', size: [1.4, 1.4], h: 0.8, cost: { planks: 2 },    icon: '◎' },
  { id: 'chair',       name: 'Chair',          cat: 'Furniture', size: [0.8, 0.8], h: 1.1, cost: { planks: 2 },     icon: '▯' },
  { id: 'shelf',       name: 'Storage Shelf',  cat: 'Furniture', size: [1.6, 0.6], h: 1.7, cost: { planks: 4, stones: 2 }, icon: '▥' },
  { id: 'wardrobe',    name: 'Little Wardrobe',cat: 'Furniture', size: [1.2, 0.8], h: 2, cost: { planks: 5, glass: 1 }, icon: '▣' },
  { id: 'lanternPost', name: 'Lantern Post',   cat: 'Decor', size: [0.5, 0.5], h: 2, cost: { wood: 2, lantern: 1 },  icon: '✺', light: true },
  { id: 'crystalLamp', name: 'Crystal Lamp',   cat: 'Decor', size: [0.5, 0.5], h: 1, cost: { crystals: 2, wood: 1 }, icon: '✧', light: true },
  { id: 'flowerBox',   name: 'Flower Box',     cat: 'Decor', size: [1.4, 0.6], h: 0.6, cost: { planks: 2, flowers: 4 }, icon: '✿' },
  { id: 'plantPot',    name: 'Seedling Pot',   cat: 'Decor', size: [0.7, 0.7], h: 0.7, cost: { stones: 2, seeds: 3 }, icon: '❧' },
  { id: 'mushroomSeat',name: 'Mushroom Stool', cat: 'Decor', size: [0.9, 0.9], h: 0.7, cost: { mushrooms: 2, wood: 1 }, icon: '⌒' },
  { id: 'windChime',   name: 'Wind Chime',     cat: 'Decor', size: [0.6, 0.6], h: 1.4, cost: { crystals: 2, rope: 2 }, icon: '♫', light: true },
  { id: 'rug',         name: 'Petal Rug',      cat: 'Decor', size: [2, 2], h: 0.05, cost: { leaves: 3, flowers: 3 }, icon: '❖' },
  { id: 'sign',        name: 'Wooden Sign',    cat: 'Decor', size: [1, 0.2], h: 1.2, cost: { wood: 2 },             icon: '✎' },
];

export const PIECE_BY_ID = Object.fromEntries(BUILD_PIECES.map((p) => [p.id, p]));

export function canAfford(inv, cost) {
  return Object.entries(cost).every(([k, v]) => (inv[k] || 0) >= v);
}

export function costText(cost, inv = null) {
  return Object.entries(cost).map(([k, v]) => {
    const have = inv ? (inv[k] || 0) : null;
    return `${ITEMS[k]?.symbol || '·'}${v}${have !== null ? ` (${have})` : ''}`;
  }).join('  ');
}
