import { RECIPES, canAfford } from './items.js';

export class Inventory {
  constructor(initial = {}) {
    this.items = { ...initial };
    this.capacity = 999;
  }

  get(id) { return this.items[id] || 0; }
  add(id, n = 1) { this.items[id] = this.get(id) + n; }
  remove(id, n = 1) {
    if (this.get(id) < n) return false;
    this.items[id] -= n;
    if (this.items[id] <= 0) delete this.items[id];
    return true;
  }
  spend(cost) {
    if (!canAfford(this.items, cost)) return false;
    for (const [k, v] of Object.entries(cost)) this.remove(k, v);
    return true;
  }
  craft(id) {
    const r = RECIPES.find((x) => x.id === id);
    if (!r || !this.spend(r.cost)) return false;
    for (const [k, v] of Object.entries(r.out)) this.add(k, v);
    return true;
  }
  get total() { return Object.values(this.items).reduce((a, b) => a + b, 0); }
  serialize() { return { ...this.items }; }
}
