import Phaser from 'phaser';
import { FONT } from '../ui/font';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { content } from '../content';
import { submit, type Feedback } from '../systems/rubric';
import { bus, EV } from '../systems/events';
import { state } from '../systems/state';
import { checkRetakePass } from '../systems/schedule';

/**
 * The communicator screen. The teacher "reads" the notebook, then returns the mark,
 * the band, one line per section and one hint. Enter turns pages, Esc closes at the end.
 */
export class SubmitScene extends Phaser.Scene {
  private feedback!: Feedback;
  private pageIndex = -1;
  private body!: Phaser.GameObjects.Text;
  private big!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private stamp!: Phaser.GameObjects.Text;
  private reading = true;

  constructor() {
    super('Submit');
  }

  create(): void {
    const t = content.teacher;
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14, 0.92);
    // Screen bezel and glow
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 60, GAME_HEIGHT - 50, 0x1a1030).setStrokeStyle(2, 0x8e6bbf);
    this.add.text(40, 32, 'COMMUNICATOR  ·  ' + t.name.toUpperCase(), { fontFamily: FONT.body, fontSize: '8px', color: '#8e6bbf' });
    // Portrait placeholder
    this.add.rectangle(40 + 24, 70, 48, 56, Phaser.Display.Color.HexStringToColor(t.color).color);
    this.add.text(40 + 24, 70, t.name.split(' ').pop()!.charAt(0), { fontFamily: FONT.body, fontSize: '24px', color: '#f4f1e8' }).setOrigin(0.5);
    this.big = this.add.text(110, 44, '', { fontFamily: FONT.body, fontSize: '16px', color: '#ffd37a' });
    this.body = this.add.text(110, 70, '', { fontFamily: FONT.body, fontSize: '8px', color: '#f4f1e8', lineSpacing: 3, wordWrap: { width: GAME_WIDTH - 110 - 48 } });
    this.stamp = this.add.text(GAME_WIDTH - 48, GAME_HEIGHT - 40, '', { fontFamily: FONT.body, fontSize: '8px', color: '#ffd37a' }).setOrigin(1, 1);
    this.hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, 'Enter: next', { fontFamily: FONT.body, fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5);

    this.feedback = submit();
    if (this.feedback.kind === 'marked') {
      for (const n of checkRetakePass(this.feedback.score)) this.feedback.pages.push(n.lines);
    }

    // "Reading..." beat before the mark appears.
    this.body.setText(t.reading);
    this.big.setText('');
    this.hint.setText('');
    this.reading = true;
    this.time.delayedCall(900, () => {
      this.reading = false;
      this.pageIndex = -1;
      this.advance();
    });

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', this.advance, this);
    kb.on('keydown-SPACE', this.advance, this);
    kb.on('keydown-E', this.advance, this);
    kb.on('keydown-ESC', this.close, this);
    this.publishDebug();
  }

  private advance(): void {
    if (this.reading) return; // the teacher is still "reading"; ignore key presses
    this.pageIndex += 1;
    const pages = this.feedback.pages;
    if (this.pageIndex >= pages.length) return this.close();
    const page = pages[this.pageIndex];
    const isMark = this.feedback.kind === 'marked' && this.pageIndex === 0;
    this.big.setText(isMark ? `${this.feedback.score} / 100` : '');
    this.body.setY(isMark ? 72 : 48).setText(isMark ? page.slice(1) : page);
    const stampName = this.feedback.band.stamp;
    const reward = this.feedback.band.reward;
    const bits: string[] = [];
    if (this.feedback.kind === 'marked' && stampName) bits.push(`[ ${stampName.toUpperCase()} STAMP ]`);
    if (this.feedback.kind === 'marked' && reward) bits.push(`[ ${reward} ]`);
    if (!bits.length && state.bestScore) bits.push(`best so far: ${state.bestScore}`);
    this.stamp.setText(bits.join('   '));
    this.hint.setText(this.pageIndex === pages.length - 1 ? 'Enter: close' : 'Enter: next');
    this.publishDebug();
  }

  private close(): void {
    this.publishDebug(true);
    bus.emit(EV.overlayClosed);
    this.scene.stop();
  }

  private publishDebug(closed = false): void {
    const w = window as unknown as { __debug: Record<string, unknown> };
    (w.__debug ??= {}).submit = closed
      ? null
      : { kind: this.feedback.kind, score: this.feedback.score, band: this.feedback.band.name, page: this.pageIndex, pages: this.feedback.pages, text: this.body.text };
  }
}
