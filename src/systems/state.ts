import type { Section } from '../content/types';
import { bus, EV } from './events';

export interface NotebookEntry {
  id: string;
  kind: 'scan' | 'talk';
  section: Section;
  name: string;
  line: string;
  day: number;
}

export interface Relationship {
  trust: number;
  /** Day the player last greeted this NPC, so greeting gives trust once per day. */
  greetedDay: number;
  /** Topics already asked, so topic trust is given once. */
  asked: string[];
}

/** Everything that would go in a save file. Save/load itself arrives in M5. */
export class GameState {
  day = 1;
  notebook: NotebookEntry[] = [];
  relationships: Record<string, Relationship> = {};

  hasScanned(id: string): boolean {
    return this.notebook.some((e) => e.kind === 'scan' && e.id === id);
  }

  addEntry(entry: Omit<NotebookEntry, 'day'>): boolean {
    if (this.notebook.some((e) => e.id === entry.id && e.kind === entry.kind)) return false;
    this.notebook.push({ ...entry, day: this.day });
    bus.emit(EV.stateChanged);
    return true;
  }

  rel(npcId: string): Relationship {
    return (this.relationships[npcId] ??= { trust: 0, greetedDay: 0, asked: [] });
  }

  nextDay(): void {
    this.day += 1;
    bus.emit(EV.stateChanged);
  }
}

export const state = new GameState();
