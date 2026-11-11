import { content } from '../content';
import type { Choice } from '../content/types';
import { state } from './state';
import { addTrust, levelOf, LEVEL_NAMES } from './relationships';
import { nodeFor, topicsFor } from './topics';
import { bus, EV } from './events';

export interface Page {
  speaker: string;
  color: string;
  lines: string[];
  /** Field note shown if the player skips this page. */
  note?: string;
  choices?: string[];
  /** Texture key of a portrait (portrait.<id>); falls back to a lettered box. */
  portrait?: string;
}

/**
 * Drives one conversation with an NPC, page by page:
 * greeting -> (choice reply) -> topic menu -> topic answer -> menu ... -> goodbye.
 * The DialogueScene only displays pages and reports choices back.
 */
export class Conversation {
  private step: 'greet' | 'reply' | 'menu' | 'done' = 'greet';
  private pendingChoices: Choice[] = [];
  private menuTopics: string[] = [];
  private readonly npcId: string;
  private readonly npc;

  constructor(npcId: string) {
    this.npcId = npcId;
    this.npc = content.npcs[npcId];
  }

  private page(lines: string[], note?: string, choices?: string[]): Page {
    return { speaker: this.npc.name, color: this.npc.color, lines, note, choices, portrait: `portrait.${this.npcId}` };
  }

  /** Returns the next page, or null when the conversation is over. */
  next(choiceIndex?: number): Page | null {
    const level = levelOf(this.npcId);

    if (this.step === 'greet') {
      const node = nodeFor(content.dialogue[this.npcId].greet, level);
      if (!node) return this.finish();
      const rel = state.rel(this.npcId);
      if (node.trust && rel.greetedDay !== state.day) {
        rel.greetedDay = state.day;
        this.announce(addTrust(this.npcId, node.trust));
      }
      if (node.choices?.length) {
        this.pendingChoices = node.choices;
        this.step = 'reply';
        return this.page(node.lines, node.note, node.choices.map((c) => c.text));
      }
      this.step = 'menu';
      return this.page(node.lines, node.note);
    }

    if (this.step === 'reply') {
      const choice = this.pendingChoices[choiceIndex ?? 0];
      this.pendingChoices = [];
      this.step = 'menu';
      const rel = state.rel(this.npcId);
      if (choice.trust && rel.greetedDay !== state.day) {
        rel.greetedDay = state.day;
        this.announce(addTrust(this.npcId, choice.trust));
      }
      return this.page(choice.reply);
    }

    if (this.step === 'menu') {
      // Coming back from a topic answer or the greeting: offer topics, or end.
      if (this.menuTopics.length && choiceIndex !== undefined) {
        const picked = this.menuTopics[choiceIndex];
        this.menuTopics = [];
        if (picked === undefined) return this.finish(); // "Goodbye"
        return this.answer(picked);
      }
      const topics = topicsFor(this.npcId);
      if (!topics.length) return this.finish();
      this.menuTopics = topics.map((t) => t.id);
      return this.page(['What do you want to ask about?'], undefined, [
        ...topics.map((t) => t.topic.label),
        'Nothing. Goodbye.',
      ]);
    }

    return null;
  }

  private answer(topicId: string): Page {
    const topic = content.dialogue[this.npcId][topicId];
    const node = nodeFor(topic, levelOf(this.npcId))!;
    const rel = state.rel(this.npcId);
    if (!rel.asked.includes(topicId)) {
      rel.asked.push(topicId);
      bus.emit(EV.stateChanged);
      if (node.trust) this.announce(addTrust(this.npcId, node.trust));
      if (node.note) {
        const added = state.addEntry({
          id: `${this.npcId}.${topicId}`,
          kind: 'talk',
          section: 'people',
          name: `${this.npc.name} on ${topic.label.replace(/^Ask about /, '')}`,
          line: node.note,
        });
        if (added) bus.emit(EV.toast, 'Notebook: ' + node.note);
      }
    }
    this.step = 'menu';
    this.menuTopics = [];
    return this.page(node.lines, node.note);
  }

  private announce(newLevel: number | null): void {
    if (newLevel !== null) bus.emit(EV.toast, `${this.npc.name} now sees you as: ${LEVEL_NAMES[newLevel]}`);
  }

  private finish(): null {
    this.step = 'done';
    return null;
  }
}
