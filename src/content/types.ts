export type Section = 'land' | 'rocks' | 'earth' | 'sky' | 'people' | 'sketches';

export interface Scannable {
  name: string;
  section: Section;
  line: string;
  /** Placeholder sketch colour until real sketches exist. */
  sketch: string;
}

export interface NpcDef {
  name: string;
  role: string;
  color: string;
  coat: string;
  thresholds: { acquaintance: number; friend: number; close: number };
}

export interface Choice {
  text: string;
  trust?: number;
  reply: string[];
}

export interface DialogueNode {
  lines: string[];
  /** One-line field note shown when the player skips, and saved to the notebook for topics. */
  note?: string;
  /** Trust given when this node is shown. Greeting: once per day. Topic: once ever. */
  trust?: number;
  choices?: Choice[];
}

export interface Topic {
  label: string;
  requires?: { scanned?: string; level?: number };
  /** Keyed by relationship level as a string. Falls back to the highest level at or below the current one. */
  byLevel: Record<string, DialogueNode>;
}

export type NpcDialogue = Record<string, Topic>;

export type TestId = 'lens' | 'water' | 'magnet' | 'acid' | 'streak' | 'scratch';

export interface Fact {
  tier: 1 | 2 | 3;
  text: string;
  fieldNote: string;
  topics: string[];
  curriculum: string[];
  source: string;
  verified: boolean;
}

export interface SampleDef {
  name: string;
  rockType: string;
  region: string;
  /** What the player sees before identifying it. */
  look: string;
  color: string;
  pattern: 'speckle' | 'shine' | 'holes' | 'plain';
  tests: Record<TestId, string>;
  facts: string[];
}

export interface TestDef {
  name: string;
  verb: string;
  hint: string;
}

export type KeyLeaf = { sample: string } | { node: string };
export interface KeyNode {
  question: string;
  /** Which test's result helps answer this question. */
  test: TestId;
  yesLabel?: string;
  noLabel?: string;
  yes: KeyLeaf;
  no: KeyLeaf;
}
export interface IdKey {
  start: string;
  nodes: Record<string, KeyNode>;
}

export type SatisfiedBy =
  | { scanned: string }
  | { identified: string }
  | { factLearned: string }
  | { entry: string }
  | { testsRun: number }
  | { relationshipAtLeast: { npc: string; level: number } };

export interface RubricItem {
  id: string;
  section: Section;
  weight: number;
  satisfiedBy: SatisfiedBy;
  /** nudge, clue, answer */
  hints: string[];
}

export interface Rubric {
  passMark: number;
  items: RubricItem[];
}

export interface Band {
  min: number;
  name: string;
  stamp: string | null;
  lines: string[];
}

export interface TeacherDef {
  name: string;
  color: string;
  reading: string[];
  bands: Band[];
  sectionNames: Record<Section, string>;
  sectionLines: { strong: string; ok: string; thin: string; empty: string };
  hintIntro: string;
  spam: string[];
  locked: string;
  unlockNeeded: number;
  reveal: string;
}

export interface IntroLine {
  speaker: 'teacher' | 'player';
  lines: string[];
  note?: string;
  /** "name" opens the name entry after this page. */
  ask?: 'name';
  /** "disguise" turns this page into the disguise choice. */
  choice?: 'disguise';
}
export interface IntroDef {
  university: string;
  letter: string[];
  card: string;
  meet: IntroLine[];
  arrival: IntroLine[];
  titleCard: { title: string; sub: string };
  cabin: IntroLine[];
  disguises: Record<string, { label: string; describe: string }>;
  controls: string;
}
