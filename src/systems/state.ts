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

export interface Submission {
  day: number;
  score: number;
  /** Fingerprint of what was submitted, to detect identical resubmissions. */
  fingerprint: string;
}

export interface SaveData {
  version: 1;
  day: number;
  notebook: NotebookEntry[];
  relationships: Record<string, Relationship>;
  bag: BagSample[];
  factsLearned: string[];
  nextUid: number;
  submissions: Submission[];
  hintProgress: Record<string, number>;
  identicalStreak: number;
  /** When locked, the "new things" count the player must exceed before the teacher reads again. */
  lockBaseline: number | null;
  bestScore: number;
  rubricRevealed: boolean;
  playerPos: { x: number; y: number } | null;
}

/** Everything that would go in a save file. */
export class GameState {
  day = 1;
  notebook: NotebookEntry[] = [];
  relationships: Record<string, Relationship> = {};
  bag: BagSample[] = [];
  factsLearned: string[] = [];
  nextUid = 1;
  submissions: Submission[] = [];
  hintProgress: Record<string, number> = {};
  identicalStreak = 0;
  lockBaseline: number | null = null;
  bestScore = 0;
  rubricRevealed = false;
  playerPos: { x: number; y: number } | null = null;

  reset(): void {
    Object.assign(this, new GameState());
    bus.emit(EV.stateChanged);
  }

  toJSON(): SaveData {
    return {
      version: 1,
      day: this.day,
      notebook: this.notebook,
      relationships: this.relationships,
      bag: this.bag,
      factsLearned: this.factsLearned,
      nextUid: this.nextUid,
      submissions: this.submissions,
      hintProgress: this.hintProgress,
      identicalStreak: this.identicalStreak,
      lockBaseline: this.lockBaseline,
      bestScore: this.bestScore,
      rubricRevealed: this.rubricRevealed,
      playerPos: this.playerPos,
    };
  }

  load(data: SaveData): void {
    if (data.version !== 1) return;
    const fresh = new GameState();
    Object.assign(this, fresh, data);
    bus.emit(EV.stateChanged);
  }

  /** How many "things" the player has gathered. Used by the teacher's anti-spam lock. */
  get thingsCount(): number {
    return this.notebook.length + this.factsLearned.length + this.bag.filter((b) => b.identified).length;
  }

  get testsRun(): number {
    return this.bag.reduce((n, b) => n + Object.keys(b.results).length, 0);
  }

  hasScanned(id: string): boolean {
    return this.notebook.some((e) => e.kind === 'scan' && e.id === id);
  }

  hasEntry(id: string): boolean {
    return this.notebook.some((e) => e.id === id);
  }

  hasIdentified(sampleId: string): boolean {
    return this.bag.some((b) => b.identified && b.sampleId === sampleId);
  }

  addEntry(entry: Omit<NotebookEntry, 'day'>): boolean {
    if (this.notebook.some((e) => e.id === entry.id && e.kind === entry.kind)) return false;
    this.notebook.push({ ...entry, day: this.day });
    bus.emit(EV.stateChanged);
    return true;
  }

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

  rel(npcId: string): Relationship {
    return (this.relationships[npcId] ??= { trust: 0, greetedDay: 0, asked: [] });
  }

  nextDay(): void {
    this.day += 1;
    bus.emit(EV.stateChanged);
  }
}

export const state = new GameState();
