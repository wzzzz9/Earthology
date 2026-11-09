import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { Page } from '../systems/conversation';
import { bus, EV } from '../systems/events';
import { state } from '../systems/state';

export interface DialogueSource {
  /** Returns the next page, or null when finished. choiceIndex is set after a choice page. */
  next(choiceIndex?: number): Page | null;
}

const MIN_BOX_H = 64;
const PAD = 8;
const LINE_H = 11;

/**
 * Overlay scene: one text box at the bottom, speaker name, placeholder portrait,
 * at most 3 lines, optional choices. Enter/Space advances, Up/Down picks, Esc skips
 * the page and shows its field note instead.
 */
export class DialogueScene extends Phaser.Scene {
  private source!: DialogueSource;
  private page: Page | null = null;
  private selected = 0;
  private nameText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Rectangle;
  private portraitLetter!: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private hint!: Phaser.GameObjects.Text;
  private box!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Dialogue');
  }

  init(data: { source: DialogueSource }): void {
    this.source = data.source;
    this.page = null;
    this.selected = 0;
  }

  create(): void {
    this.box = this.add.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH - 12, MIN_BOX_H, 0x11141c, 0.94).setStrokeStyle(1, 0xf4f1e8);
    this.portrait = this.add.rectangle(6 + PAD + 20, 0, 40, 48, 0x5b7fbf);
    this.portraitLetter = this.add.text(0, 0, '?', { fontFamily: 'monospace', fontSize: '20px', color: '#f4f1e8' }).setOrigin(0.5);
    const textX = 6 + PAD + 48;
    this.nameText = this.add.text(textX, 0, '', { fontFamily: 'monospace', fontSize: '9px', color: '#ffd37a' });
    this.bodyText = this.add.text(textX, 0, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#f4f1e8',
      lineSpacing: 2,
      wordWrap: { width: GAME_WIDTH - textX - 16 },
    });
    this.hint = this.add.text(GAME_WIDTH - 12, GAME_HEIGHT - 10, 'Enter: next   Esc: skip', { fontFamily: 'monospace', fontSize: '7px', color: '#5c6577' }).setOrigin(1, 0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', this.advance, this);
    kb.on('keydown-SPACE', this.advance, this);
    kb.on('keydown-E', this.advance, this);
    kb.on('keydown-ESC', this.skip, this);
    kb.on('keydown-UP', () => this.moveSelection(-1));
    kb.on('keydown-DOWN', () => this.moveSelection(1));
    kb.on('keydown-W', () => this.moveSelection(-1));
    kb.on('keydown-S', () => this.moveSelection(1));

    this.show(this.source.next());
  }

  private show(page: Page | null): void {
    if (!page) {
      this.close();
      return;
    }
    this.page = page;
    this.selected = 0;
    const lines = page.lines.slice(0, 3).map((l) => l.replace(/\{player\}/g, state.playerName));
    const nChoices = page.choices?.length ?? 0;

    // Box grows to fit the lines and choices; everything is laid out from its top edge.
    const needed = 17 + lines.length * LINE_H + (nChoices ? 4 + nChoices * LINE_H : 0) + 10;
    const h = Math.max(MIN_BOX_H, needed);
    const top = GAME_HEIGHT - h - 6;
    this.box.setSize(GAME_WIDTH - 12, h).setPosition(GAME_WIDTH / 2, top + h / 2);
    this.portrait.setPosition(6 + PAD + 20, top + h / 2);
    this.portraitLetter.setPosition(this.portrait.x, this.portrait.y);
    this.nameText.setPosition(this.nameText.x, top + 5);
    this.bodyText.setPosition(this.bodyText.x, top + 17);

    this.nameText.setText(page.speaker);
    this.portrait.setFillStyle(Phaser.Display.Color.HexStringToColor(page.color).color);
    this.portraitLetter.setText(page.speaker.charAt(0));
    this.bodyText.setText(lines);
    for (const t of this.choiceTexts) t.destroy();
    this.choiceTexts = [];
    if (page.choices) {
      const baseY = top + 17 + lines.length * LINE_H + 4;
      page.choices.forEach((c, i) => {
        this.choiceTexts.push(
          this.add.text(this.bodyText.x + 8, baseY + i * LINE_H, c, { fontFamily: 'monospace', fontSize: '9px', color: '#f4f1e8' }),
        );
      });
      this.hint.setText('Up/Down: choose   Enter: pick');
    } else {
      this.hint.setText('Enter: next   Esc: skip');
    }
    this.paintSelection();
    this.publishDebug();
  }

  private paintSelection(): void {
    this.choiceTexts.forEach((t, i) => {
      t.setColor(i === this.selected ? '#ffd37a' : '#f4f1e8');
      t.setText((i === this.selected ? '> ' : '  ') + (this.page?.choices?.[i] ?? ''));
    });
  }

  private moveSelection(delta: number): void {
    if (!this.page?.choices?.length) return;
    const n = this.page.choices.length;
    this.selected = (this.selected + delta + n) % n;
    this.paintSelection();
  }

  private advance(): void {
    if (!this.page) return;
    const choice = this.page.choices ? this.selected : undefined;
    this.show(this.source.next(choice));
  }

  /** Skip: show the field note for this page, then move on as if "next" was pressed. */
  private skip(): void {
    if (!this.page) return;
    if (this.page.note) bus.emit(EV.toast, 'Field note: ' + this.page.note);
    // On a choice page, Esc takes the last option, which content keeps as the neutral one or "Goodbye".
    if (this.page.choices?.length) this.selected = this.page.choices.length - 1;
    this.advance();
  }

  private close(): void {
    this.page = null;
    this.publishDebug();
    bus.emit(EV.dialogueClosed);
    this.scene.stop();
  }

  private publishDebug(): void {
    const dbg = (window as unknown as { __debug: Record<string, unknown> }).__debug ?? {};
    dbg.dialogue = this.page ? { speaker: this.page.speaker, lines: this.page.lines, choices: this.page.choices ?? null } : null;
    (window as unknown as { __debug: Record<string, unknown> }).__debug = dbg;
  }
}
