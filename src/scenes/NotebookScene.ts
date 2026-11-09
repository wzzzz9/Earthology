import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { content } from '../content';
import type { Section } from '../content/types';
import { state, type BagSample } from '../systems/state';
import { bus, EV } from '../systems/events';
import { List } from '../ui/List';
import { makeSampleSketch } from '../systems/placeholders';

type Tab = { id: Section | 'bag'; label: string };
const TABS: Tab[] = [
  { id: 'bag', label: 'Bag' },
  { id: 'land', label: 'Land' },
  { id: 'rocks', label: 'Rocks' },
  { id: 'earth', label: 'Earth' },
  { id: 'sky', label: 'Sky' },
  { id: 'people', label: 'People' },
  { id: 'sketches', label: 'Sketches' },
];

/**
 * The field notebook, which is also the homework. Left: section tabs with counts.
 * Right: entries in the section, or the bag of rocks. Enter on a rock opens the lab.
 * Left/Right switches tabs, Up/Down moves, Esc or N closes.
 */
export class NotebookScene extends Phaser.Scene {
  private tab = 0;
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private list!: List;
  private detail!: Phaser.GameObjects.Text;
  private sketch!: Phaser.GameObjects.Image;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super('Notebook');
  }

  init(data: { tab?: Tab['id'] }): void {
    if (data?.tab) this.tab = Math.max(0, TABS.findIndex((t) => t.id === data.tab));
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14, 0.85);
    // Paper
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 30, 0xf1e9d2).setStrokeStyle(2, 0x8a7a5a);
    this.add.rectangle(20 + 70, GAME_HEIGHT / 2, 1, GAME_HEIGHT - 40, 0xc9b98f);
    this.add.text(28, 22, 'FIELD NOTEBOOK', { fontFamily: 'monospace', fontSize: '9px', color: '#5a4a2a' });
    this.add.text(GAME_WIDTH - 28, 22, `Day ${state.day}`, { fontFamily: 'monospace', fontSize: '9px', color: '#5a4a2a' }).setOrigin(1, 0);

    this.tabTexts = TABS.map((t, i) => this.add.text(28, 40 + i * 14, t.label, { fontFamily: 'monospace', fontSize: '9px', color: '#5a4a2a' }));
    this.list = new List(this, 100, 40, 11, '9px', 150);
    this.detail = this.add.text(262, 40, '', { fontFamily: 'monospace', fontSize: '9px', color: '#2b2418', lineSpacing: 2, wordWrap: { width: GAME_WIDTH - 262 - 32 } });
    this.sketch = this.add.image(GAME_WIDTH - 60, GAME_HEIGHT - 60, '__DEFAULT').setVisible(false);
    this.hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, '', { fontFamily: 'monospace', fontSize: '7px', color: '#9aa3b2' }).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.switchTab(-1));
    kb.on('keydown-RIGHT', () => this.switchTab(1));
    kb.on('keydown-A', () => this.switchTab(-1));
    kb.on('keydown-D', () => this.switchTab(1));
    kb.on('keydown-UP', () => { this.list.move(-1); this.refreshDetail(); });
    kb.on('keydown-DOWN', () => { this.list.move(1); this.refreshDetail(); });
    kb.on('keydown-W', () => { this.list.move(-1); this.refreshDetail(); });
    kb.on('keydown-S', () => { this.list.move(1); this.refreshDetail(); });
    kb.on('keydown-ENTER', this.activate, this);
    kb.on('keydown-E', this.activate, this);
    kb.on('keydown-ESC', this.close, this);
    kb.on('keydown-N', this.close, this);
    kb.on('keydown-TAB', this.close, this);

    this.events.on('wake', () => this.refresh());
    this.refresh();
  }

  private switchTab(delta: number): void {
    this.tab = (this.tab + delta + TABS.length) % TABS.length;
    this.refresh();
  }

  private entriesFor(id: Tab['id']) {
    if (id === 'sketches') return state.notebook.filter((e) => e.kind === 'scan');
    return state.notebook.filter((e) => e.section === id);
  }

  private refresh(): void {
    this.tabTexts.forEach((t, i) => {
      const id = TABS[i].id;
      const n = id === 'bag' ? state.bag.length : this.entriesFor(id).length;
      t.setText(`${i === this.tab ? '>' : ' '}${TABS[i].label} ${n}`);
      t.setColor(i === this.tab ? '#b5451b' : '#5a4a2a');
    });
    const id = TABS[this.tab].id;
    if (id === 'bag') {
      this.list.setItems(state.bag.map((b) => ({ label: this.bagLabel(b), dim: b.identified })));
      this.hint.setText(state.bag.length ? 'Enter: test this rock   Left/Right: tabs   Esc: close' : 'Pick up rocks in the world. Left/Right: tabs   Esc: close');
    } else {
      this.list.setItems(this.entriesFor(id).map((e) => ({ label: e.name })));
      this.hint.setText('Left/Right: tabs   Up/Down: entries   Esc: close');
    }
    this.refreshDetail();
    this.publishDebug();
  }

  private bagLabel(b: BagSample): string {
    return b.identified ? content.samples[b.sampleId].name : `Unknown rock #${b.uid}`;
  }

  private refreshDetail(): void {
    const id = TABS[this.tab].id;
    this.sketch.setVisible(false);
    if (id === 'bag') {
      const b = state.bag[this.list.index];
      if (!b) { this.detail.setText('Your bag is empty.\n\nRocks on the ground sparkle. Press E to pick one up.'); return; }
      const def = content.samples[b.sampleId];
      const done = Object.keys(b.results).length;
      const lines = [b.identified ? def.name.toUpperCase() : 'UNKNOWN ROCK', '', def.look, '', `Tests done: ${done} of 6`];
      if (b.identified) lines.push('', ...def.facts.map((f) => '* ' + content.facts[f].fieldNote));
      this.detail.setText(lines);
      makeSampleSketch(this, `sketch.${b.sampleId}`, def.color, def.pattern);
      this.sketch.setTexture(`sketch.${b.sampleId}`).setVisible(true);
    } else {
      const e = this.entriesFor(id)[this.list.index];
      if (!e) { this.detail.setText(id === 'rocks' ? 'Identify a rock in the lab to fill this page.' : 'Nothing here yet. Go and look around.'); return; }
      const lines = [e.name.toUpperCase(), '', e.line, '', `Day ${e.day}`];
      const sampleId = e.id.startsWith('sample.') ? e.id.slice(7) : null;
      if (sampleId && content.samples[sampleId]) {
        const facts = content.samples[sampleId].facts.filter((f) => state.factsLearned.includes(f));
        if (facts.length) lines.push('', ...facts.map((f) => '* ' + content.facts[f].fieldNote));
        makeSampleSketch(this, `sketch.${sampleId}`, content.samples[sampleId].color, content.samples[sampleId].pattern);
        this.sketch.setTexture(`sketch.${sampleId}`).setVisible(true);
      }
      this.detail.setText(lines);
      const sc = content.scannables[e.id];
      if (sc) {
        const key = `sketch.scan.${e.id}`;
        makeSampleSketch(this, key, sc.sketch, 'plain');
        this.sketch.setTexture(key).setVisible(true);
      }
    }
    this.publishDebug();
  }

  private activate(): void {
    if (TABS[this.tab].id !== 'bag') return;
    const b = state.bag[this.list.index];
    if (!b) return;
    this.scene.sleep();
    this.scene.launch('Lab', { uid: b.uid });
  }

  private close(): void {
    this.publishDebug(true);
    bus.emit(EV.overlayClosed);
    this.scene.stop();
  }

  private publishDebug(closed = false): void {
    const w = window as unknown as { __debug: Record<string, unknown> };
    (w.__debug ??= {}).notebook = closed ? null : { tab: TABS[this.tab].id, index: this.list.index, items: this.list.items.map((i) => i.label) };
  }
}
