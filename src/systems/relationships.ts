import { content } from '../content';
import { state } from './state';
import { bus, EV } from './events';

export const LEVEL_NAMES = ['Stranger', 'Acquaintance', 'Friend', 'Close friend'] as const;

/** 0 Stranger, 1 Acquaintance, 2 Friend, 3 Close friend, from a trust value. */
export function levelOfTrust(npcId: string, trust: number): number {
  const t = content.npcs[npcId]?.thresholds;
  if (!t) return 0;
  if (trust >= t.close) return 3;
  if (trust >= t.friend) return 2;
  if (trust >= t.acquaintance) return 1;
  return 0;
}

export function levelOf(npcId: string): number {
  return levelOfTrust(npcId, state.rel(npcId).trust);
}

/** Adds (or removes) trust, never below 0. Returns the new level if it changed, otherwise null. */
export function addTrust(npcId: string, amount: number): number | null {
  if (!amount) return null;
  const rel = state.rel(npcId);
  const before = levelOf(npcId);
  rel.trust = Math.max(0, rel.trust + amount);
  const after = levelOf(npcId);
  bus.emit(EV.stateChanged);
  return after !== before ? after : null;
}
