import Phaser from 'phaser';
import { hiRes } from '../ui/hires';
import { FONT, SIZE, TEXT_RES } from '../ui/font';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { FloodPuzzle } from '../content/types';
import { bus, EV } from '../systems/events';
import { sfx } from '../systems/sfx';
import { puzzleFor, puzzleStatus, runFlood, floodIndex, solvePuzzle } from '../systems/puzzles';

const CELL = 20;
const OX = 20;
const OY = 30;
/** Low to high: sea, meadow, grass, dry grass, moor, scree, snow. */
const RAMP = ['#6fb7d6', '#a9d18e', '#9bc47c', '#b7c884', '#cfc78c', '#d5b985', '#c6a67f', '#b39c8c', '#c9c3bd', '#e4e6ea'];

/**
 * The flood puzzle: a contour map of the valley. Place up to N earth banks, run the spring
 * melt, and watch where the water goes. Pens dry and water at the sea = solved.
 */
export class FloodScene extends Phaser.Scene {
  private puzzleId = '';
  private def!: FloodPuzzle;
  private W = 0;
  private H = 0;
  private cursor = { x: 0, y: 0 };
  private banks = new Set<number>();
  private bankSprites = new Map<number, Phaser.GameObjects.Container>();
  private water: Phaser.GameObjects.Rectangle[] = [];
  private cursorBox!: Phaser.GameObjects.Rectangle;
  private banksText!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private running = false;
  private solved = false;

  constructor() {
    super('Flood');
  }

  init(data: { puzzleId: string }): void {
    this.puzzleId = data.puzzleId;
    const p = puzzleFor(this.puzzleId);
    if (!p || p.trip.puzzle.type !== 'flood') throw new Error(`no flood puzzle ${this.puzzleId}`);
    this.def = p.trip.puzzle;
    this.W = this.def.heights[0].length;
    this.H = this.def.heights.length;
    this.banks = new Set();
    this.bankSprites = new Map();
    this.water = [];
    this.running = false;
    this.solved = puzzleStatus(this.puzzleId) === 'solved';
    this.cursor = { x: this.def.source[0], y: 3 };
  }

  create(): void {
    hiRes(this);
    const d = this.def;
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x11141c, 0.6);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 16, GAME_HEIGHT - 16, 0xf1e9d2).setStrokeStyle(2, 0x5a4a2a);

    // cells by height, then contour lines wherever neighbours differ
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        const h = Number(d.heights[y][x]);
        this.add.rectangle(OX + x * CELL, OY + y * CELL, CELL, CELL, Phaser.Display.Color.HexStringToColor(RAMP[h]).color).setOrigin(0);
      }
    }
    const g = this.add.graphics();
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        const h = Number(d.heights[y][x]);
        if (x + 1 < this.W) {
          const diff = Math.abs(Number(d.heights[y][x + 1]) - h);
          if (diff) { g.lineStyle(diff > 1 ? 2 : 1, 0x5a4a2a, 0.75); g.lineBetween(OX + (x + 1) * CELL, OY + y * CELL, OX + (x + 1) * CELL, OY + (y + 1) * CELL); }
        }
        if (y + 1 < this.H) {
          const diff = Math.abs(Number(d.heights[y + 1][x]) - h);
          if (diff) { g.lineStyle(diff > 1 ? 2 : 1, 0x5a4a2a, 0.75); g.lineBetween(OX + x * CELL, OY + (y + 1) * CELL, OX + (x + 1) * CELL, OY + (y + 1) * CELL); }
        }
      }
    }
    g.lineStyle(2, 0x5a4a2a, 1);
    g.strokeRect(OX, OY, this.W * CELL, this.H * CELL);

    // the melt source, the pens, the sea
    const [sx, sy] = d.source;
    const sc = this.cellCenter(sx, sy);
    this.add.rectangle(sc.x, sc.y, 10, 10, 0xffffff).setAngle(45).setStrokeStyle(1, 0x3a6f8a);
    this.add.text(sc.x + 8, sc.y - 7, 'melt', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#2b2418' });
    for (const [px, py] of d.pens) {
      const c = this.cellCenter(px, py);
      this.add.rectangle(c.x, c.y, 14, 10, 0xd9c7a0).setStrokeStyle(1, 0x7a5a3a);
      for (let i = -1; i <= 1; i++) this.add.rectangle(c.x + i * 4, c.y, 1, 10, 0x7a5a3a);
    }
    const pc = this.cellCenter(d.pens[0][0], d.pens[0][1]);
    this.add.text(pc.x - 6, pc.y + 6, 'pens', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#2b2418' });
    this.add.text(OX + 4, OY + (this.H - 1) * CELL + 3, 'sea', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#1d3f5c' });

    // side panel
    const px0 = OX + this.W * CELL + 12;
    const ink = { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#2b2418' };
    this.add.text(px0, OY - 2, 'THE MELT', ink);
    this.banksText = this.add.text(px0, OY + 16, '', ink);
    this.add.text(px0, OY + 40, 'Lines: height.\nLow ground is\ngreen, high is\nwhite. Water\nnever climbs.', { ...ink, color: '#5a4a2a', lineSpacing: 1 });
    this.msg = this.add.text(px0, OY + 118, d.lines.intro, { ...ink, wordWrap: { width: GAME_WIDTH - px0 - 16 }, lineSpacing: 1 });
    this.hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 4, '', { ...ink, color: '#9aa3b2' }).setOrigin(0.5, 1);

    this.cursorBox = this.add.rectangle(0, 0, CELL, CELL).setOrigin(0).setStrokeStyle(2, 0xffd37a);
    this.placeCursor();
    this.refreshPanel();

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.moveCursor(-1, 0));
    kb.on('keydown-RIGHT', () => this.moveCursor(1, 0));
    kb.on('keydown-UP', () => this.moveCursor(0, -1));
    kb.on('keydown-DOWN', () => this.moveCursor(0, 1));
    kb.on('keydown-A', () => this.moveCursor(-1, 0));
    kb.on('keydown-D', () => this.moveCursor(1, 0));
    kb.on('keydown-W', () => this.moveCursor(0, -1));
    kb.on('keydown-S', () => this.moveCursor(0, 1));
    kb.on('keydown-ENTER', () => this.toggleBank());
    kb.on('keydown-SPACE', () => this.toggleBank());
    kb.on('keydown-E', () => this.toggleBank());
    kb.on('keydown-R', () => void this.run());
    kb.on('keydown-ESC', () => this.close());

    (window as unknown as { __debug: Record<string, unknown> }).__debug.flood = {
      place: (x: number, y: number) => { this.cursor = { x, y }; this.placeCursor(); this.toggleBank(); },
      run: () => this.run(),
      banks: () => [...this.banks],
    };
  }

  private cellCenter(x: number, y: number): { x: number; y: number } {
    return { x: OX + x * CELL + CELL / 2, y: OY + y * CELL + CELL / 2 };
  }

  private placeCursor(): void {
    this.cursorBox.setPosition(OX + this.cursor.x * CELL, OY + this.cursor.y * CELL);
  }

  private moveCursor(dx: number, dy: number): void {
    if (this.running) return;
    this.cursor.x = Phaser.Math.Clamp(this.cursor.x + dx, 0, this.W - 1);
    this.cursor.y = Phaser.Math.Clamp(this.cursor.y + dy, 0, this.H - 2);
    this.placeCursor();
    sfx.tick();
  }

  private toggleBank(): void {
    if (this.running || this.solved) return;
    const { x, y } = this.cursor;
    const i = floodIndex(this.def, x, y);
    const isSource = x === this.def.source[0] && y === this.def.source[1];
    const isPen = this.def.pens.some(([px, py]) => px === x && py === y);
    if (isSource || isPen || y === this.H - 1) { sfx.close(); return; }
    this.clearWater();
    if (this.banks.has(i)) {
      this.banks.delete(i);
      this.bankSprites.get(i)?.destroy();
      this.bankSprites.delete(i);
      sfx.close();
    } else {
      if (this.banks.size >= this.def.banks) { sfx.close(); this.msg.setText(this.def.lines.noBanks); return; }
      this.banks.add(i);
      const c = this.cellCenter(x, y);
      const bank = this.add.container(c.x, c.y);
      bank.add([
        this.add.ellipse(0, 2, 18, 12, 0x7a5a3a).setStrokeStyle(1, 0x3a2a1a),
        this.add.ellipse(0, 0, 14, 6, 0x9a7a4a),
      ]);
      this.bankSprites.set(i, bank);
      sfx.confirm();
    }
    this.msg.setText(this.def.lines.intro);
    this.refreshPanel();
  }

  private refreshPanel(): void {
    this.banksText.setText(this.solved ? 'Solved.' : `Banks left: ${this.def.banks - this.banks.size}`);
    this.hint.setText(this.solved ? 'Esc: close' : 'Arrows: move   Enter: bank   R: run the melt   Esc: close');
  }

  private clearWater(): void {
    for (const w of this.water) w.destroy();
    this.water = [];
  }

  /** The melt comes down: cells turn blue in flood order, then the verdict. */
  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.clearWater();
    const res = runFlood(this.def, this.banks);
    this.msg.setText(this.def.lines.running);
    for (const i of res.order) {
      const x = i % this.W;
      const y = Math.floor(i / this.W);
      this.water.push(this.add.rectangle(OX + x * CELL, OY + y * CELL, CELL, CELL, 0x3f8fc9, 0.7).setOrigin(0));
      if (this.water.length % 3 === 0) sfx.talk();
      await new Promise<void>((r) => this.time.delayedCall(45, r));
    }
    this.running = false;
    if (!res.pensHit && res.reachedSea) {
      this.solved = true;
      solvePuzzle(this.puzzleId);
      sfx.confirm();
      this.msg.setText(this.def.lines.success);
    } else {
      sfx.close();
      this.msg.setText(res.pensHit ? this.def.lines.pensFlooded : this.def.lines.blocked);
    }
    this.refreshPanel();
    (window as unknown as { __debug: Record<string, unknown> }).__debug.floodResult = { pensHit: res.pensHit, reachedSea: res.reachedSea, solved: this.solved };
  }

  private close(): void {
    if (this.running) return;
    (window as unknown as { __debug: Record<string, unknown> }).__debug.flood = null;
    bus.emit(EV.overlayClosed);
    this.scene.stop();
  }
}
