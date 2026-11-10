import Phaser from 'phaser';
import { FONT } from '../ui/font';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { content } from '../content';
import type { Section } from '../content/types';
import { state, type BagSample } from '../systems/state';
import { bus, EV } from '../systems/events';
import { List } from '../ui/List';
import { makeSampleSketch } from '../systems/placeholders';
import { evaluate, bandFor } from '../systems/rubric';
import { taskFor, gradeLabel } from '../systems/schedule';

type Tab = { id: Section | 'bag' | 'marking' | 'timetable'; label: string };
const BASE_TABS: Tab[] = [
  { id: 'timetable', label: 'Class' },
  { id: 'bag', label: 'Bag' },
  { id: 'land', label: 'Land' },
  { id: 'rocks', label: 'Rocks' },
  { id: 'earth', label: 'Earth' },
  { id: 'sky', label: 'Sky' },
  { id: 'people', label: 'People' },
  { id: 'sketches', label: 'Sketches' },
];
/** The marking sheet appears as a tab only after a perfect submission revealed it. */
const tabs = (): Tab[] => (state.rubricRevealed ? [...BASE_TABS, { id: 'marking', label: 'Marking' }] : BASE_TABS);

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
  private bars: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('Notebook');
  }

  init(data: { tab?: Tab['id'] }): void {
    if (data?.tab) this.tab = Math.max(0, tabs().findIndex((t) => t.id === data.tab));
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14, 0.85);
    // Paper
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 30, 0xf1e9d2).setStrokeStyle(2, 0x8a7a5a);
    this.add.rectangle(20 + 70, GAME_HEIGHT / 2, 1, GAME_HEIGHT - 40, 0xc9b98f);
    this.add.text(28, 22, 'FIELD NOTEBOOK', { fontFamily: FONT.body, fontSize: '8px', color: '#5a4a2a' });
    this.add.text(GAME_WIDTH - 28, 22, `Day ${state.day}`, { fontFamily: FONT.body, fontSize: '8px', color: '#5a4a2a' }).setOrigin(1, 0);

    const TABS = tabs();
    this.tabTexts = TABS.map((t, i) => this.add.text(28, 40 + i * 14, t.label, { fontFamily: FONT.body, fontSize: '8px', color: '#5a4a2a' }));
    // Progress bars under each section tab. They fill, but never say what is missing.
    this.bars = TABS.map((_t, i) => this.add.rectangle(28, 40 + i * 14 + 11, 0, 2, 0xb5451b).setOrigin(0, 0));
    const best = state.bestScore ? bandFor(state.bestScore) : null;
    if (best?.stamp) this.add.text(GAME_WIDTH - 28, GAME_HEIGHT - 24, `[ ${best.stamp.toUpperCase()} ]  best ${state.bestScore}`, { fontFamily: FONT.body, fontSize: '8px', color: '#b5451b' }).setOrigin(1, 1);
    this.list = new List(this, 100, 40, 11, '8px', 150);
    this.list.colors = { on: '#b5451b', off: '#2b2418', dim: '#9a8c74' };
    this.detail = this.add.text(262, 40, '', { fontFamily: FONT.body, fontSize: '8px', color: '#2b2418', lineSpacing: 2, wordWrap: { width: GAME_WIDTH - 262 - 32 } });
    this.sketch = this.add.image(GAME_WIDTH - 60, GAME_HEIGHT - 60, '__DEFAULT').setVisible(false);
    this.hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, '', { fontFamily: FONT.body, fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5);

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

    const onWake = () => this.refresh(true);
    this.events.on('wake', onWake);
    this.events.once('shutdown', () => this.events.off('wake', onWake));
    this.refresh();
  }

  private switchTab(delta: number): void {
    const n = tabs().length;
    this.tab = (this.tab + delta + n) % n;
    this.refresh();
  }

  private entriesFor(id: Tab['id']) {
    if (id === 'sketches') return state.notebook.filter((e) => e.kind === 'scan');
    return state.notebook.filter((e) => e.section === id);
  }

  /** Timetable rows: classes with their day and status, tasks with due day and status. */
  private timetableRows() {
    const rows: { label: string; dim: boolean; detail: string[] }[] = [];
    const deadline = content.classes.deadlineDay;
    rows.push({
      label: state.retake ? 'Retake · discovery only' : state.finalResult ? `Final · ${gradeLabel()}` : `Final report · day ${deadline}`,
      dim: false,
      detail: state.retake
        ? ['RETAKE', '', 'No more classes. Everything you found stays.', 'Pass a report and the class is done.']
        : state.finalResult
          ? ['FINAL RESULT', '', `Mark ${state.finalResult.score}. ${gradeLabel()}`, `Attempt ${state.finalResult.attempt}.`]
          : ['THE CLASS', '', `Your best report at the end of day ${deadline} is your final mark.`, `Pass mark: ${content.rubric.passMark}.`],
    });
    for (const c of content.classes.classes) {
      const attended = state.classesAttended.includes(c.id);
      const missed = state.classesMissed.includes(c.id);
      const status = attended ? 'attended' : missed ? 'missed' : state.day > c.day ? 'missed' : state.day === c.day ? 'TODAY' : 'upcoming';
      const short = c.title.split(':')[0].slice(0, 14);
      rows.push({ label: `Day ${String(c.day).padStart(2)} · ${short} · ${status}`, dim: attended || missed, detail: [c.title.toUpperCase(), '', `Day ${c.day} at the ship.`, `Status: ${status}.`, '', `Task after class: ${c.task.text}`] });
      const ts = state.tasks[c.task.id];
      if (ts) {
        const def = taskFor(c.task.id)!;
        rows.push({ label: `   task · ${ts.status} · day ${ts.due}`, dim: ts.status === 'done' || ts.status === 'missed', detail: ['TASK', '', def.text, '', `Due: end of day ${ts.due}.`, `Status: ${ts.status}.`] });
      }
    }
    return rows;
  }

  /** Rubric rows for the Marking tab: section, weight, done or not. */
  private markingRows() {
    const ev = evaluate();
    return content.rubric.items.map((it) => ({
      label: `${ev.satisfied.has(it.id) ? '✓' : '·'} ${content.teacher.sectionNames[it.section]}  ${it.weight}  ${it.hints[2]}`,
      dim: ev.satisfied.has(it.id),
      item: it,
      done: ev.satisfied.has(it.id),
    }));
  }

  private refresh(keepIndex = false): void {
    const TABS = tabs();
    const ev = evaluate();
    this.bars.forEach((b, i) => {
      const sec = ev.sections.find((x) => x.section === TABS[i].id);
      b.width = sec && sec.total ? Math.round((sec.got / sec.total) * 56) : 0;
      b.setVisible(!!sec);
    });
    this.tabTexts.forEach((t, i) => {
      const id = TABS[i].id;
      const n = id === 'bag' ? state.bag.length : id === 'timetable' || id === 'marking' ? '' : this.entriesFor(id).length;
      t.setText(`${i === this.tab ? '>' : ' '}${TABS[i].label} ${n}`);
      t.setColor(i === this.tab ? '#b5451b' : '#5a4a2a');
    });
    const id = TABS[this.tab].id;
    if (id === 'timetable') {
      this.list.setItems(this.timetableRows().map((r) => ({ label: r.label, dim: r.dim })), keepIndex);
      this.hint.setText('Your class schedule and tasks.   Left/Right: tabs   Esc: close');
    } else if (id === 'marking') {
      this.list.setItems(this.markingRows().map((r) => ({ label: `${r.done ? '✓' : '·'} ${content.teacher.sectionNames[r.item.section]} (${r.item.weight})`, dim: r.done })), keepIndex);
      this.hint.setText('The full marking sheet. You earned it.   Esc: close');
    } else if (id === 'bag') {
      this.list.setItems(state.bag.map((b) => ({ label: this.bagLabel(b), dim: b.identified })), keepIndex);
      this.hint.setText(state.bag.length ? 'Enter: test this rock   Left/Right: tabs   Esc: close' : 'Pick up rocks in the world. Left/Right: tabs   Esc: close');
    } else {
      this.list.setItems(this.entriesFor(id).map((e) => ({ label: e.name })), keepIndex);
      this.hint.setText('Left/Right: tabs   Up/Down: entries   Esc: close');
    }
    this.refreshDetail();
    this.publishDebug();
  }

  private bagLabel(b: BagSample): string {
    return b.identified ? content.samples[b.sampleId].name : `Unknown rock #${b.uid}`;
  }

  private refreshDetail(): void {
    const TABS = tabs();
    const id = TABS[this.tab].id;
    this.sketch.setVisible(false);
    if (id === 'timetable') {
      const r = this.timetableRows()[this.list.index];
      this.detail.setText(r ? r.detail : '');
      return;
    }
    if (id === 'marking') {
      const r = this.markingRows()[this.list.index];
      if (!r) { this.detail.setText('Nothing to mark.'); return; }
      this.detail.setText([`${content.teacher.sectionNames[r.item.section].toUpperCase()}  ·  ${r.item.weight} marks`, '', r.done ? 'Done.' : 'Not yet.', '', r.item.hints[2]]);
      return;
    }
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
    if (tabs()[this.tab].id !== 'bag') return;
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
    (w.__debug ??= {}).notebook = closed ? null : { tab: tabs()[this.tab].id, index: this.list.index, items: this.list.items.map((i) => i.label) };
  }
}
