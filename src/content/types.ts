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
