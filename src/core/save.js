const KEY = 'faewood.save.v1';

export const Save = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Faewood: could not read save', e);
      return null;
    }
  },
  write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now(), version: 1 }));
      return true;
    } catch (e) {
      console.warn('Faewood: could not save', e);
      return false;
    }
  },
  clear() {
    try { localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
  },
  debounce(fn, ms = 1200) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },
};
