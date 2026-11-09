import { content } from '../content';
import type { DialogueNode, Topic } from '../content/types';
import { state } from './state';
import { levelOf } from './relationships';

/** Picks the node for the current level: exact match, else the highest level at or below. */
export function nodeFor(topic: Topic, level: number): DialogueNode | null {
  for (let l = level; l >= 0; l--) {
    const node = topic.byLevel[String(l)];
    if (node) return node;
  }
  return null;
}

function available(topic: Topic, npcId: string): boolean {
  const req = topic.requires;
  if (!req) return true;
  if (req.scanned && !state.hasScanned(req.scanned)) return false;
  if (req.level !== undefined && levelOf(npcId) < req.level) return false;
  return true;
}

/** Topics the player can raise with this NPC right now, excluding the greeting. */
export function topicsFor(npcId: string): { id: string; topic: Topic }[] {
  const all = content.dialogue[npcId] ?? {};
  return Object.entries(all)
    .filter(([id, t]) => id !== 'greet' && available(t, npcId) && nodeFor(t, levelOf(npcId)))
    .map(([id, topic]) => ({ id, topic }));
}
