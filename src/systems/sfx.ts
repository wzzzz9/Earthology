/**
 * Tiny synthesised sound effects. No audio files: every sound is one or two oscillator blips
 * shaped by a gain envelope. Silent until the browser lets audio start (first key press or
 * click), and silent if Web Audio is missing. Key 0 toggles sound; the choice is remembered.
 */
const KEY = 'moonfield.sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(KEY) === 'off';
  } catch {
    return false;
  }
})();

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

interface Tone {
  type: OscillatorType;
  from: number;
  to?: number;
  /** seconds */
  dur: number;
  vol?: number;
  delay?: number;
}

function tone(t: Tone): void {
  if (muted) return;
  const c = audio();
  if (!c || !master || c.state !== 'running') return;
  const t0 = c.currentTime + (t.delay ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = t.type;
  osc.frequency.setValueAtTime(t.from, t0);
  if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, t0 + t.dur);
  const v = t.vol ?? 1;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(v, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + t.dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + t.dur + 0.03);
}

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
let lastStep = 0;
let lastKey = 0;

export const sfx = {
  /** One keystroke on the space computer: dry click with a little pitch wobble. */
  key(): void {
    const now = performance.now();
    if (now - lastKey < 20) return;
    lastKey = now;
    tone({ type: 'square', from: rnd(1500, 2100), to: 900, dur: 0.035, vol: 0.22 });
  },
  /** Carriage return: lower, longer clunk. */
  ret(): void {
    tone({ type: 'square', from: 700, to: 300, dur: 0.07, vol: 0.28 });
  },
  /** A letter appearing in a speech box: soft bip, gentler than the computer. */
  talk(): void {
    tone({ type: 'triangle', from: rnd(520, 700), dur: 0.03, vol: 0.18 });
  },
  /** One hop of the alien: a soft rising bubble. Rate-limited so held keys don't buzz. */
  step(): void {
    const now = performance.now();
    if (now - lastStep < 200) return;
    lastStep = now;
    const base = rnd(300, 420);
    tone({ type: 'sine', from: base, to: base * 2.1, dur: 0.11, vol: 0.5 });
  },
  /** Menu cursor moved. */
  tick(): void {
    tone({ type: 'triangle', from: 880, dur: 0.04, vol: 0.3 });
  },
  /** Confirm: two quick rising notes. */
  confirm(): void {
    tone({ type: 'triangle', from: 660, dur: 0.06, vol: 0.35 });
    tone({ type: 'triangle', from: 990, dur: 0.08, vol: 0.35, delay: 0.06 });
  },
  /** An overlay (notebook, map, lab) opens or closes. */
  open(): void {
    tone({ type: 'sine', from: 420, to: 840, dur: 0.12, vol: 0.4 });
  },
  close(): void {
    tone({ type: 'sine', from: 840, to: 420, dur: 0.12, vol: 0.4 });
  },
  /** Scanner ping. */
  scan(): void {
    tone({ type: 'sine', from: 1200, to: 1800, dur: 0.18, vol: 0.35 });
    tone({ type: 'sine', from: 1800, dur: 0.12, vol: 0.25, delay: 0.2 });
  },
  get muted(): boolean {
    return muted;
  },
  /** Flips mute; returns true when sound is now on. */
  toggle(): boolean {
    muted = !muted;
    try {
      localStorage.setItem(KEY, muted ? 'off' : 'on');
    } catch {
      /* private mode: not remembered */
    }
    return !muted;
  },
  /** Call once at boot: unlocks audio on the first key press or click, binds 0 to mute. */
  install(onToggle: (on: boolean) => void): void {
    const unlock = (): void => void audio();
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', (e) => {
      if (e.key === '0') onToggle(sfx.toggle());
    });
  },
};
