export function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function nowISO() {
  return new Date().toISOString();
}

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
