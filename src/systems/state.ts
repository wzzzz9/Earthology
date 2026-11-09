import type { Section, TestId } from '../content/types';
import { bus, EV } from './events';
import { levelOfTrust } from './relationships';

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

export type TaskStatus = 'open' | 'graced' | 'done' | 'missed';
export interface TaskState {
  status: TaskStatus;
  /** Current due day (extended once when graced). */
  due: number;
}

export interface FinalResult {
  score: number;
  passed: boolean;
  day: number;
  /** 1 = first attempt, 2 = passed on retake, ... */
  attempt: number;
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
  disguise: string | null;
  playerName: string;
  introDone: boolean;
  /** Explored tile indexes of the current map (fog of war on the paper map). */
  explored: number[];
  classesAttended: string[];
  classesMissed: string[];
  tasks: Record<string, TaskState>;
  finalResult: FinalResult | null;
  /** True while retaking the class: no more scheduled classes, no deadline. */
  retake: boolean;
  attempt: number;
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
  disguise: string | null = null;
  playerName = 'Student';
  introDone = false;
  explored: number[] = [];
  classesAttended: string[] = [];
  classesMissed: string[] = [];
  tasks: Record<string, TaskState> = {};
  finalResult: FinalResult | null = null;
  retake = false;
  attempt = 1;
  private exploredSet = new Set<number>();

  reset(): void {
    Object.assign(this, new GameState());
    this.exploredSet = new Set();
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
      disguise: this.disguise,
      playerName: this.playerName,
      introDone: this.introDone,
      explored: this.explored,
      classesAttended: this.classesAttended,
      classesMissed: this.classesMissed,
      tasks: this.tasks,
      finalResult: this.finalResult,
      retake: this.retake,
      attempt: this.attempt,
    };
  }

  get identifiedCount(): number {
    return new Set(this.bag.filter((b) => b.identified).map((b) => b.sampleId)).size;
  }

  get scannedCount(): number {
    return this.notebook.filter((e) => e.kind === 'scan' && !e.id.startsWith('sample.')).length;
  }

  get talkEntries(): number {
    return this.notebook.filter((e) => e.kind === 'talk').length;
  }

  /** Marks a tile index as explored. Returns true if it was new. */
  explore(index: number): boolean {
    if (this.exploredSet.has(index)) return false;
    this.exploredSet.add(index);
    this.explored.push(index);
    return true;
  }

  isExplored(index: number): boolean {
    return this.exploredSet.has(index);
  }

  load(data: SaveData): void {
    if (data.version !== 1) return;
    const fresh = new GameState();
    Object.assign(this, fresh, data);
    this.exploredSet = new Set(this.explored);
    bus.emit(EV.stateChanged);
  }

  /**
   * How many "things" the player has gathered: notebook entries (scans, talks,
   * identified rocks), rocks picked up, and relationship levels. Used by the
   * teacher's anti-spam fingerprint and lock. Facts are not counted separately,
   * since they always arrive with a notebook entry.
   */
  get thingsCount(): number {
    const levels = Object.keys(this.relationships).reduce((n, id) => n + levelOfTrust(id, this.relationships[id].trust), 0);
    return this.notebook.length + this.bag.length + levels;
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
