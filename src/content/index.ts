import scannablesJson from '../../content/countries/iceland/scannables.json';
import npcsJson from '../../content/countries/iceland/npcs.json';
import dialogueJson from '../../content/countries/iceland/dialogue.json';
import type { Scannable, NpcDef, NpcDialogue } from './types';

/** All game content, bundled at build time. Never hard-code facts in src/. */
export const content = {
  scannables: scannablesJson as Record<string, Scannable>,
  npcs: npcsJson as Record<string, NpcDef>,
  dialogue: dialogueJson as Record<string, NpcDialogue>,
};
