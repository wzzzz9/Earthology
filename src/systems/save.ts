import { state, type SaveData } from './state';
import { bus, EV } from './events';

const KEY = 'moonfield.save.v1';
let timer: ReturnType<typeof setTimeout> | null = null;

export function hasSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function peekSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
}

export function saveNow(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.toJSON()));
  } catch {
    // Private mode or storage blocked: play on without saving.
  }
}

export function loadSave(): boolean {
  const data = peekSave();
  if (!data) return false;
  state.load(data);
  return true;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Autosave: any state change saves half a second later (batched). */
export function installAutosave(): void {
  bus.on(EV.stateChanged, () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(saveNow, 500);
  });
}
