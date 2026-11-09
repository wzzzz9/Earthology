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
