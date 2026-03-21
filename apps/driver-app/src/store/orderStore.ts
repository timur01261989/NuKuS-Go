// Zustand store for driver orders
let listeners: Function[] = [];

interface DriverState {
  driverId: string | null;
  isOnline: boolean;
  activeOrder: any | null;
  earnings: { today: number; week: number };
}

let state: DriverState = {
  driverId: null,
  isOnline: false,
  activeOrder: null,
  earnings: { today: 0, week: 0 },
};

export function getState() { return state; }

export function setState(patch: Partial<DriverState>) {
  state = { ...state, ...patch };
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn: (s: DriverState) => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}
