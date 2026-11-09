import { content } from '../content';
import { state } from './state';
import { bus, EV } from './events';

export const LEVEL_NAMES = ['Stranger', 'Acquaintance', 'Friend', 'Close friend'] as const;

/** 0 Stranger, 1 Acquaintance, 2 Friend, 3 Close friend. */
export function levelOf(npcId: string): number {
  const t = content.npcs[npcId].thresholds;
  const trust = state.rel(npcId).trust;
  if (trust >= t.close) return 3;
  if (trust >= t.friend) return 2;
  if (trust >= t.acquaintance) return 1;
  return 0;
}

/** Adds trust and returns the new level if it changed, otherwise null. */
export function addTrust(npcId: string, amount: number): number | null {
  if (amount <= 0) return null;
  const before = levelOf(npcId);
  state.rel(npcId).trust += amount;
  const after = levelOf(npcId);
  bus.emit(EV.stateChanged);
  return after !== before ? after : null;
}
