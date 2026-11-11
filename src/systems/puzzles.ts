import { content } from '../content';
import type { ClassDef, FloodPuzzle, GeyserPuzzle, TripDef } from '../content/types';
import { state } from './state';
import { bus, EV } from './events';
import { saveNow } from './save';
import { checkTasks } from './schedule';

/**
 * Field-trip puzzles. A class with a `trip` takes the player to a place for the lesson and
 * leaves a puzzle there. Solving it is what earns the "understood" entry for that place.
 * The puzzle types are small and generic; this file holds their rules, the scenes hold the
 * drawing and input.
 */

export type PuzzleStatus = 'locked' | 'open' | 'solved';

export interface PuzzleRef {
  id: string;
  cls: ClassDef;
  trip: TripDef;
}

export function puzzleFor(id: string): PuzzleRef | undefined {
  const cls = content.classes.classes.find((c) => c.trip && c.id === id);
  return cls?.trip ? { id, cls, trip: cls.trip } : undefined;
}

/** Locked until the class has happened (attended or missed), open until solved. */
export function puzzleStatus(id: string): PuzzleStatus {
  if (state.puzzlesSolved.includes(id)) return 'solved';
  const p = puzzleFor(id);
  if (!p) return 'locked';
  return state.classesAttended.includes(p.cls.id) || state.classesMissed.includes(p.cls.id) ? 'open' : 'locked';
}

/** Marks the puzzle solved and writes the understood entry into the notebook. */
export function solvePuzzle(id: string): boolean {
  const p = puzzleFor(id);
  if (!p || state.puzzlesSolved.includes(id)) return false;
  state.puzzlesSolved.push(id);
  const e = p.trip.entry;
  state.addEntry({ id: `puzzle.${id}`, kind: 'puzzle', section: e.section, name: e.name, line: e.line });
  bus.emit(EV.toast, `Notebook: ${e.name}. ${e.line}`);
  checkTasks();
  bus.emit(EV.stateChanged);
  saveNow();
  return true;
}

// ---------- geyser: pull the stone while the throat is empty ----------

/** Runtime clock: the world scene stamps every eruption of the big geyser here. */
export const geyserClock = { lastEruptAt: 0 };

export type PullResult = 'solved' | 'early' | 'locked' | 'done';

/** Pulling the stone works only within `window` ms after the big geyser starts to spout. */
export function geyserPull(id: string, def: GeyserPuzzle, now: number): PullResult {
  const st = puzzleStatus(id);
  if (st === 'locked') return 'locked';
  if (st === 'solved') return 'done';
  const since = now - geyserClock.lastEruptAt;
  if (geyserClock.lastEruptAt > 0 && since >= 0 && since <= def.window) {
    solvePuzzle(id);
    return 'solved';
  }
  return 'early';
}

// ---------- flood: water takes the lowest path ----------

export interface FloodResult {
  /** Cell indexes in the order the water reaches them. */
  order: number[];
  pensHit: boolean;
  reachedSea: boolean;
}

export const floodIndex = (def: FloodPuzzle, x: number, y: number): number => y * def.heights[0].length + x;
export const floodHeight = (def: FloodPuzzle, x: number, y: number): number => Number(def.heights[y][x]);

/**
 * Water spreads from the source to any neighbour that is not higher and not a bank: it never
 * climbs. Breadth-first, so the order reads as the flood advancing.
 */
export function runFlood(def: FloodPuzzle, banks: Set<number>): FloodResult {
  const W = def.heights[0].length;
  const H = def.heights.length;
  const [sx, sy] = def.source;
  const start = floodIndex(def, sx, sy);
  const seen = new Set<number>([start]);
  const order: number[] = [start];
  let frontier = [start];
  while (frontier.length) {
    const next: number[] = [];
    for (const i of frontier) {
      const x = i % W;
      const y = Math.floor(i / W);
      const h = floodHeight(def, x, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = floodIndex(def, nx, ny);
        if (seen.has(j) || banks.has(j) || floodHeight(def, nx, ny) > h) continue;
        seen.add(j);
        order.push(j);
        next.push(j);
      }
    }
    frontier = next;
  }
  const pensHit = def.pens.some(([px, py]) => seen.has(floodIndex(def, px, py)));
  const reachedSea = order.some((i) => Math.floor(i / W) === H - 1);
  return { order, pensHit, reachedSea };
}
