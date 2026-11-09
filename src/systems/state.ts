import type { Section, TestId } from '../content/types';
import { bus, EV } from './events';

export interface NotebookEntry {
  id: string;
  kind: 'scan' | 'talk';
  section: Section;
  name: string;
  line: string;
  day: number;
}

/** A rock in the bag. sampleId is the truth; the player only learns it by identifying. */
export interface BagSample {
  uid: number;
  sampleId: string;
  /** Where it was picked up, so the world does not respawn it. */
  pickupId: string;
  results: Partial<Record<TestId, string>>;
  identified: boolean;
  wrongGuesses: number;
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
  bag: BagSample[] = [];
  factsLearned: string[] = [];
  private nextUid = 1;

  hasPickedUp(pickupId: string): boolean {
    return this.bag.some((b) => b.pickupId === pickupId);
  }

  addSample(sampleId: string, pickupId: string): BagSample {
    const s: BagSample = { uid: this.nextUid++, sampleId, pickupId, results: {}, identified: false, wrongGuesses: 0 };
    this.bag.push(s);
    bus.emit(EV.stateChanged);
    return s;
  }

  learnFact(id: string): boolean {
    if (this.factsLearned.includes(id)) return false;
    this.factsLearned.push(id);
    bus.emit(EV.stateChanged);
    return true;
  }

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
