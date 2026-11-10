import Phaser from 'phaser';
import { FONT } from '../ui/font';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { content, TEST_ORDER } from '../content';
import type { KeyLeaf, TestId } from '../content/types';
import { state, type BagSample } from '../systems/state';
import { bus, EV } from '../systems/events';
import { List } from '../ui/List';
import { makeSampleSketch } from '../systems/placeholders';

type Mode = 'tests' | 'key' | 'result';

/**
 * Field-test mini-game. Left: the rock. Right: six tests; Enter runs one and records
 * the result. I opens the identification key: yes/no questions, each showing the
 * matching test result if you have run it. Naming the rock right identifies it.
 */
export class LabScene extends Phaser.Scene {
  private sample!: BagSample;
  private mode: Mode = 'tests';
  private list!: List;
  private resultText!: Phaser.GameObjects.Text;
  private header!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private keyNode = '';
  private keyChoice = 0;
  private keyTexts: Phaser.GameObjects.Text[] = [];
  private pendingLeaf: KeyLeaf | null = null;

  constructor() {
    super('Lab');
  }

  init(data: { uid: number }): void {
    this.sample = state.bag.find((b) => b.uid === data.uid)!;
    this.mode = 'tests';
    this.pendingLeaf = null;
  }

  create(): void {
    const def = content.samples[this.sample.sampleId];
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14, 0.9);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 30, 0x1b1f2a).setStrokeStyle(2, 0x5c6577);
    this.header = this.add.text(28, 22, '', { fontFamily: FONT.body, fontSize: '8px', color: '#ffd37a' });
    makeSampleSketch(this, `sketch.${this.sample.sampleId}`, def.color, def.pattern);
    this.add.image(28 + 48, 70, `sketch.${this.sample.sampleId}`).setScale(2);
    this.add.text(28, 118, def.look, { fontFamily: FONT.body, fontSize: '8px', color: '#9aa3b2', wordWrap: { width: 130 } });

    this.list = new List(this, 180, 40, 12, '8px');
    this.resultText = this.add.text(180, 128, '', { fontFamily: FONT.body, fontSize: '8px', color: '#f4f1e8', lineSpacing: 2, wordWrap: { width: GAME_WIDTH - 180 - 32 } });
    this.hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, '', { fontFamily: FONT.body, fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.nav(-1));
    kb.on('keydown-DOWN', () => this.nav(1));
    kb.on('keydown-W', () => this.nav(-1));
    kb.on('keydown-S', () => this.nav(1));
    kb.on('keydown-LEFT', () => this.nav(-1));
    kb.on('keydown-RIGHT', () => this.nav(1));
    kb.on('keydown-ENTER', this.activate, this);
    kb.on('keydown-E', this.activate, this);
    kb.on('keydown-SPACE', this.activate, this);
    kb.on('keydown-I', () => this.mode === 'tests' && !this.sample.identified && this.startKey());
    kb.on('keydown-ESC', this.back, this);

    this.showTests();
  }

  // ---------- tests ----------
  private showTests(): void {
    this.mode = 'tests';
    this.clearKey();
    const def = content.samples[this.sample.sampleId];
    this.header.setText(this.sample.identified ? `${def.name.toUpperCase()}  (identified)` : `UNKNOWN ROCK #${this.sample.uid}`);
    this.list.setItems(
      TEST_ORDER.map((t) => ({ label: `${content.tests[t].name}${this.sample.results[t] ? '  ✓' : ''}`, dim: !!this.sample.results[t] })),
      true,
    );
    this.list.setVisible(true);
    this.refreshResult();
    this.hint.setText(this.sample.identified ? 'Enter: run test   Esc: back' : 'Enter: run test   I: identify with the key   Esc: back');
    this.publishDebug();
  }

  private refreshResult(): void {
    const t = TEST_ORDER[this.list.index];
    const r = this.sample.results[t];
    this.resultText.setText(r ? [`${content.tests[t].verb}:`, r] : [`${content.tests[t].verb}.`, content.tests[t].hint]);
    this.resultText.setColor(r ? '#f4f1e8' : '#7a8294');
  }

  private runTest(t: TestId): void {
    const def = content.samples[this.sample.sampleId];
    if (!this.sample.results[t]) {
      this.sample.results[t] = def.tests[t];
      bus.emit(EV.stateChanged);
    }
    this.cameras.main.flash(150, 255, 255, 255, false);
    this.showTests();
  }

  // ---------- identification key ----------
  private startKey(): void {
    this.mode = 'key';
    this.keyNode = content.key.start;
    this.keyChoice = 0;
    this.list.setVisible(false);
    this.header.setText('IDENTIFICATION KEY');
    this.hint.setText('Up/Down: answer   Enter: choose   Esc: back to tests');
    this.renderKey();
  }

  private renderKey(): void {
    this.clearKey();
    const node = content.key.nodes[this.keyNode];
    const r = this.sample.results[node.test];
    const lines = [node.question, '', r ? `Your ${content.tests[node.test].name.toLowerCase()} result: ${r}` : `(You have not done the ${content.tests[node.test].name.toLowerCase()} test yet.)`];
    this.resultText.setText(lines).setColor('#f4f1e8');
    const labels = [node.yesLabel ?? 'Yes', node.noLabel ?? 'No'];
    const y = this.resultText.y + this.resultText.height + 8;
    this.keyTexts = labels.map((l, i) =>
      this.add.text(188, y + i * 12, (i === this.keyChoice ? '> ' : '  ') + l, { fontFamily: FONT.body, fontSize: '8px', color: i === this.keyChoice ? '#ffd37a' : '#f4f1e8' }),
    );
    this.publishDebug();
  }

  private clearKey(): void {
    for (const t of this.keyTexts) t.destroy();
    this.keyTexts = [];
  }

  private answerKey(): void {
    const node = content.key.nodes[this.keyNode];
    const leaf = this.keyChoice === 0 ? node.yes : node.no;
    if ('node' in leaf) {
      this.keyNode = leaf.node;
      this.keyChoice = 0;
      this.renderKey();
      return;
    }
    // A name. Ask for confirmation, then check it.
    this.pendingLeaf = leaf;
    this.mode = 'result';
    this.clearKey();
    const guess = content.samples[leaf.sample];
    this.resultText.setText([`The key says: ${guess ? guess.name : leaf.sample}.`, '', 'Write that in the notebook?']);
    const y = this.resultText.y + this.resultText.height + 8;
    this.keyChoice = 0;
    this.keyTexts = ['Yes, that is what it is', 'Go back and check'].map((l, i) =>
      this.add.text(188, y + i * 12, (i === 0 ? '> ' : '  ') + l, { fontFamily: FONT.body, fontSize: '8px', color: i === 0 ? '#ffd37a' : '#f4f1e8' }),
    );
    this.hint.setText('Enter: choose   Esc: back to tests');
    this.publishDebug();
  }

  private confirmGuess(): void {
    const leaf = this.pendingLeaf;
    this.pendingLeaf = null;
    if (!leaf || !('sample' in leaf)) return this.showTests();
    if (this.keyChoice === 1) return this.startKey();

    if (leaf.sample === this.sample.sampleId) {
      this.sample.identified = true;
      const def = content.samples[this.sample.sampleId];
      state.addEntry({ id: `sample.${this.sample.sampleId}`, kind: 'scan', section: 'rocks', name: def.name, line: def.look });
      for (const f of def.facts) if (state.learnFact(f)) bus.emit(EV.toast, 'Learned: ' + content.facts[f].fieldNote);
      bus.emit(EV.toast, `Identified: ${def.name}`);
      this.cameras.main.flash(300, 255, 230, 150, false);
      this.showTests();
    } else {
      this.sample.wrongGuesses += 1;
      bus.emit(EV.stateChanged);
      this.mode = 'result';
      this.clearKey();
      const guess = content.samples[leaf.sample];
      this.resultText.setText([`${guess ? guess.name : leaf.sample}? That does not fit what you saw.`, '', 'Run the tests the key asks about, and read the results again.']);
      this.hint.setText('Enter: back to tests');
      this.publishDebug();
    }
  }

  // ---------- input plumbing ----------
  private nav(delta: number): void {
    if (this.mode === 'tests') {
      this.list.move(delta);
      this.refreshResult();
    } else if (this.keyTexts.length) {
      this.keyChoice = (this.keyChoice + delta + this.keyTexts.length) % this.keyTexts.length;
      this.keyTexts.forEach((t, i) => {
        const base = t.text.slice(2);
        t.setText((i === this.keyChoice ? '> ' : '  ') + base).setColor(i === this.keyChoice ? '#ffd37a' : '#f4f1e8');
      });
    }
    this.publishDebug();
  }

  private activate(): void {
    if (this.mode === 'tests') return this.runTest(TEST_ORDER[this.list.index]);
    if (this.mode === 'key') return this.answerKey();
    if (this.mode === 'result') return this.pendingLeaf ? this.confirmGuess() : this.showTests();
  }

  private back(): void {
    if (this.mode !== 'tests') return this.showTests();
    this.publishDebug(true);
    this.scene.stop();
    this.scene.wake('Notebook');
  }

  private publishDebug(closed = false): void {
    const w = window as unknown as { __debug: Record<string, unknown> };
    (w.__debug ??= {}).lab = closed
      ? null
      : { mode: this.mode, uid: this.sample.uid, identified: this.sample.identified, results: this.sample.results, index: this.list.index, keyNode: this.keyNode, keyChoice: this.keyChoice, text: this.resultText.text };
  }
}
