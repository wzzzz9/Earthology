import Phaser from 'phaser';
import { hiRes } from '../ui/hires';
import { FONT, SIZE, TEXT_RES } from '../ui/font';
import { GAME_WIDTH } from '../config';
import { content } from '../content';
import type { HouseDef, HouseFurniture, HouseThing } from '../content/types';
import { state } from '../systems/state';
import { bus, EV } from '../systems/events';
import { sfx } from '../systems/sfx';
import { MoveInput } from '../systems/input';
import { addTrust } from '../systems/relationships';
import * as P from '../art/palette';

const T = 16;
const COLS = 18;
const ROWS = 9;
const OX = (GAME_WIDTH - COLS * T) / 2;
const OY = 52;
const SPEED = 70;
const DOOR_COLS = [8, 9];

/** Tiles each piece covers. Wall pieces (window, picture) and rugs block nothing. */
const FOOT: Record<string, { w: number; h: number; solid: boolean }> = {
  bed: { w: 2, h: 3, solid: true }, table: { w: 2, h: 2, solid: true }, chair: { w: 1, h: 1, solid: true },
  stove: { w: 1, h: 2, solid: true }, shelf: { w: 2, h: 1, solid: false }, bookshelf: { w: 2, h: 2, solid: true },
  wardrobe: { w: 1, h: 2, solid: true }, chest: { w: 1, h: 1, solid: true }, barrel: { w: 1, h: 1, solid: true },
  plant: { w: 1, h: 1, solid: true }, rug: { w: 3, h: 2, solid: false }, window: { w: 1, h: 1, solid: false },
  picture: { w: 1, h: 1, solid: false }, lamp: { w: 1, h: 1, solid: true }, counter: { w: 3, h: 1, solid: true },
  oven: { w: 2, h: 2, solid: true }, nets: { w: 1, h: 2, solid: true }, radio: { w: 1, h: 1, solid: true },
  loom: { w: 2, h: 2, solid: true }, cabinet: { w: 2, h: 1, solid: true }, sink: { w: 1, h: 1, solid: true },
  toybox: { w: 1, h: 1, solid: true }, desk: { w: 2, h: 1, solid: true }, crates: { w: 1, h: 1, solid: true },
  sacks: { w: 1, h: 1, solid: true },
};

/**
 * Inside someone's house: one room, 18x9 tiles, furniture that says who lives here, and a
 * few things to look at that go in the People pages. You can only get in once the owner
 * counts you as a friend. Walk out through the door at the bottom.
 */
export class HouseScene extends Phaser.Scene {
  private houseId = '';
  private def!: HouseDef;
  private returnTo = { x: 0, y: 0 };
  private player!: Phaser.Physics.Arcade.Sprite;
  private move!: MoveInput;
  private actKey!: Phaser.Input.Keyboard.Key;
  private bookKey!: Phaser.Input.Keyboard.Key;
  private prompt!: Phaser.GameObjects.Text;
  private things: { def: HouseThing; x: number; y: number; sparkle: Phaser.GameObjects.Image }[] = [];
  private busy = false;
  private leaving = false;
  private heldE = false;

  constructor() {
    super('House');
  }

  init(data: { house: string; returnTo: { x: number; y: number }; playerKey: string }): void {
    this.houseId = data.house;
    this.def = content.houses[data.house];
    this.returnTo = data.returnTo;
    this.things = [];
    this.busy = false;
    this.leaving = false;
    this.playerKey = data.playerKey;
  }
  private playerKey = 'player';

  create(): void {
    hiRes(this);
    const d = this.def;
    this.add.rectangle(GAME_WIDTH / 2, 135, GAME_WIDTH, 270, 0x11141c);
    // walls: a band at the back with a wainscot, thin walls around, the floor in planks
    const wall = Phaser.Display.Color.HexStringToColor(d.wall).color;
    const floor = Phaser.Display.Color.HexStringToColor(d.floor).color;
    this.add.rectangle(OX - 6, OY - 14, COLS * T + 12, ROWS * T + 24, Phaser.Display.Color.HexStringToColor(P.OUTLINE).color).setOrigin(0);
    this.add.rectangle(OX - 4, OY - 12, COLS * T + 8, T + 12, wall).setOrigin(0);
    this.add.rectangle(OX - 4, OY + T - 3, COLS * T + 8, 3, Phaser.Display.Color.HexStringToColor(P.WOOD_DARK).color).setOrigin(0);
    this.add.rectangle(OX, OY + T, COLS * T, (ROWS - 1) * T, floor).setOrigin(0);
    for (let y = 1; y < ROWS; y++) this.add.rectangle(OX, OY + y * T, COLS * T, 1, 0x000000, 0.12).setOrigin(0);
    for (let x = 0; x < COLS; x += 3) this.add.rectangle(OX + x * T + ((x / 3) % 2) * 8, OY + T, 1, (ROWS - 1) * T, 0x000000, 0.08).setOrigin(0);
    // the door gap in the bottom wall, and a doormat
    this.add.rectangle(OX + DOOR_COLS[0] * T, OY + ROWS * T - 2, 2 * T, 10, Phaser.Display.Color.HexStringToColor(P.WOOD).color).setOrigin(0).setDepth(1);
    this.add.rectangle(OX + DOOR_COLS[0] * T + 4, OY + (ROWS - 1) * T + 6, 2 * T - 8, 8, Phaser.Display.Color.HexStringToColor(P.CREAM).color, 0.6).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, OY - 26, d.name, { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#f4f1e8' }).setOrigin(0.5, 1);

    const solids = this.physics.add.staticGroup();
    for (const f of d.furniture) {
      const foot = FOOT[f.type];
      if (!foot) continue;
      const px = OX + f.x * T;
      const py = OY + f.y * T;
      drawFurniture(this, f, px, py);
      if (foot.solid) solids.add(this.add.rectangle(px + (foot.w * T) / 2, py + (foot.h * T) / 2 + 2, foot.w * T - 2, foot.h * T - 6).setVisible(false));
    }
    for (const t of d.things) {
      const x = OX + t.x * T + 8;
      const y = OY + t.y * T + 12;
      const seen = state.hasEntry(`house.${this.houseId}.${t.id}`);
      const sparkle = this.add.image(x, y - 10, 'sparkle').setDepth(300).setVisible(!seen);
      this.tweens.add({ targets: sparkle, alpha: 0.2, scale: 0.7, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.things.push({ def: t, x, y, sparkle });
    }

    const doorX = OX + DOOR_COLS[0] * T + T;
    this.player = this.physics.add.sprite(doorX, OY + (ROWS - 1) * T + 2, this.playerKey, 'up0');
    this.player.body!.setSize(10, 8).setOffset((this.player.width - 10) / 2, this.player.height - 8);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(OX + 2, OY + T + 2, COLS * T - 4, (ROWS - 1) * T + 4);
    this.physics.add.collider(this.player, solids);

    this.move = new MoveInput(this);
    this.actKey = this.input.keyboard!.addKey('E');
    this.bookKey = this.input.keyboard!.addKey('N');
    this.heldE = this.actKey.isDown;
    this.prompt = this.add
      .text(0, 0, '', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#f4f1e8', backgroundColor: '#11141cdd', padding: { x: 3, y: 1 } })
      .setOrigin(0.5, 1).setDepth(400).setVisible(false);
    this.add.text(GAME_WIDTH / 2, 266, 'Walk out of the door to leave   N: notebook', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#5c6577' }).setOrigin(0.5, 1);

    bus.on(EV.overlayClosed, this.onOverlayClosed, this);
    this.events.once('shutdown', () => bus.off(EV.overlayClosed, this.onOverlayClosed, this));
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const dbg = (window as unknown as { __debug: Record<string, unknown> }).__debug;
    dbg.house = { id: this.houseId, things: this.things.map((t) => t.def.id) };
    Object.defineProperties(dbg.house as object, {
      p: { get: () => [Math.round(this.player.x), Math.round(this.player.y)], enumerable: true },
      v: { get: () => [this.player.body?.velocity.x, this.player.body?.velocity.y], enumerable: true },
      paused: { get: () => this.physics.world.isPaused, enumerable: true },
      busy: { get: () => this.busy, enumerable: true },
      seen: { get: () => this.things.filter((t) => !t.sparkle.visible).map((t) => t.def.id), enumerable: true },
    });
  }

  private onOverlayClosed(): void {
    this.busy = false;
    this.heldE = this.actKey.isDown;
  }

  private nearest(): { def: HouseThing; x: number; y: number; sparkle: Phaser.GameObjects.Image } | null {
    let best = null as typeof this.things[number] | null;
    let bestD = 34;
    for (const t of this.things) {
      const dd = Phaser.Math.Distance.Between(this.player.x, this.player.y - 6, t.x, t.y);
      if (dd < bestD) { bestD = dd; best = t; }
    }
    return best;
  }

  private look(t: typeof this.things[number]): void {
    const id = `house.${this.houseId}.${t.def.id}`;
    const added = state.addEntry({ id, kind: 'scan', section: 'people', name: t.def.name, line: t.def.line });
    if (added) {
      sfx.scan();
      t.sparkle.setVisible(false);
      if (this.def.owner) addTrust(this.def.owner, 1);
      bus.emit(EV.toast, `Notebook: ${t.def.name}. ${t.def.line}`);
    } else {
      bus.emit(EV.toast, `${t.def.name}. ${t.def.line}`);
    }
  }

  update(): void {
    if (this.busy || this.leaving) return;
    if (this.heldE && !this.actKey.isDown) this.heldE = false;
    if (Phaser.Input.Keyboard.JustDown(this.bookKey)) {
      this.busy = true;
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      sfx.open();
      this.scene.launch('Notebook');
      return;
    }
    this.move.update();
    this.player.setVelocity(this.move.vec.x * SPEED, this.move.vec.y * SPEED);
    if (this.move.moving) {
      sfx.step();
      this.player.anims.play(`walk-${this.move.facing}-${state.disguise ?? 'a'}`, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(`${this.move.facing}0`);
    }
    this.player.setDepth(this.player.y);

    const t = this.nearest();
    if (t) {
      this.prompt.setText(`E: Look at ${t.def.name}`).setPosition(this.player.x, this.player.y - 26).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actKey) && !this.heldE) this.look(t);
    } else {
      this.prompt.setVisible(false);
    }

    // out through the door
    const col = Math.floor((this.player.x - OX) / T);
    if (DOOR_COLS.includes(col) && this.player.y >= OY + ROWS * T - 10 && this.move.vec.y > 0) this.leave();
  }

  private leave(): void {
    this.leaving = true;
    this.player.setVelocity(0, 0);
    sfx.close();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      (window as unknown as { __debug: Record<string, unknown> }).__debug.house = null;
      this.scene.stop();
      this.scene.wake('World', { from: 'house', x: this.returnTo.x, y: this.returnTo.y });
    });
  }
}

/** Code-drawn furniture, 16px grid, pastel palette. The Art session may replace these with sprites. */
function drawFurniture(scene: Phaser.Scene, f: HouseFurniture, px: number, py: number): void {
  const foot = FOOT[f.type];
  const depth = py + foot.h * T;
  const col = (c: string) => Phaser.Display.Color.HexStringToColor(c).color;
  const r = (x: number, y: number, w: number, h: number, c: string, a = 1) => scene.add.rectangle(px + x, py + y, w, h, col(c), a).setOrigin(0).setDepth(foot.solid || f.type === 'rug' ? (f.type === 'rug' ? 2 : depth) : 3);
  const accent = f.color ?? P.BLUE;
  switch (f.type) {
    case 'bed':
      r(1, 2, 30, 46, P.OUTLINE); r(2, 3, 28, 44, P.WOOD); r(4, 5, 24, 40, P.WHITE); r(6, 7, 20, 9, P.CREAM);
      r(4, 19, 24, 26, accent); r(4, 19, 24, 3, P.WHITE, 0.5); r(4, 43, 24, 2, P.OUTLINE, 0.25); break;
    case 'table':
      r(2, 6, 28, 16, P.OUTLINE); r(3, 7, 26, 14, P.WOOD_LIGHT); r(3, 7, 26, 2, P.CREAM, 0.5);
      r(4, 22, 3, 8, P.WOOD_DARK); r(25, 22, 3, 8, P.WOOD_DARK); r(12, 9, 8, 6, P.CREAM); r(14, 10, 4, 3, P.YELLOW); break;
    case 'chair':
      r(3, 1, 10, 4, P.WOOD_DARK); r(4, 5, 8, 7, P.WOOD); r(4, 12, 2, 4, P.WOOD_DARK); r(10, 12, 2, 4, P.WOOD_DARK); break;
    case 'stove':
      r(6, 0, 4, 10, P.ROCK); r(2, 8, 12, 22, P.OUTLINE); r(3, 9, 10, 20, P.ROCK_DARK); r(4, 18, 8, 8, P.ROCK); r(5, 20, 6, 4, P.ORANGE); r(6, 21, 4, 2, P.YELLOW);
      r(3, 9, 10, 2, P.ROCK_LIGHT); r(4, 4, 6, 4, P.STONE_PALE); break;
    case 'shelf':
      r(0, 9, 32, 3, P.WOOD_DARK);
      [P.RED, P.BLUE, P.YELLOW, P.VIOLET, P.TEAL, P.ORANGE].forEach((c, i) => r(2 + i * 5, 1, 4, 8, c)); break;
    case 'bookshelf':
      r(0, 0, 32, 32, P.OUTLINE); r(1, 1, 30, 30, P.WOOD_DARK); r(2, 2, 28, 12, P.WOOD); r(2, 17, 28, 12, P.WOOD);
      [P.RED, P.BLUE, P.YELLOW, P.VIOLET, P.TEAL, P.CREAM].forEach((c, i) => { r(3 + i * 4.5, 4, 4, 10, c); r(3 + i * 4.5, 19, 4, 10, [P.TEAL, P.RED, P.CREAM, P.BLUE, P.YELLOW, P.VIOLET][i]); }); break;
    case 'wardrobe':
      r(1, 0, 14, 32, P.OUTLINE); r(2, 1, 12, 30, P.WOOD_DARK); r(3, 2, 5, 27, P.WOOD); r(8, 2, 5, 27, P.WOOD); r(7, 14, 1, 2, P.YELLOW); r(9, 14, 1, 2, P.YELLOW); break;
    case 'chest':
      r(1, 4, 14, 11, P.OUTLINE); r(2, 5, 12, 9, P.WOOD); r(2, 5, 12, 3, P.WOOD_DARK); r(7, 9, 2, 2, P.YELLOW); break;
    case 'barrel':
      r(2, 1, 12, 14, P.OUTLINE); r(3, 2, 10, 12, P.WOOD); r(3, 4, 10, 2, P.ROCK); r(3, 10, 10, 2, P.ROCK); break;
    case 'plant':
      r(4, 9, 8, 6, P.RED_DARK); r(5, 10, 6, 1, P.ORANGE); r(2, 3, 12, 7, P.MOSS); r(5, 0, 6, 5, P.MOSS_LIGHT); r(1, 6, 4, 3, P.MOSS_DARK); break;
    case 'rug':
      r(0, 0, 48, 32, accent); r(0, 0, 48, 2, P.CREAM); r(0, 30, 48, 2, P.CREAM); r(0, 2, 2, 28, P.CREAM); r(46, 2, 2, 28, P.CREAM); r(16, 10, 16, 12, P.CREAM, 0.35); break;
    case 'window':
      r(1, -2, 14, 16, P.WHITE); r(3, 0, 10, 12, P.WATER_LIGHT); r(7, 0, 1, 12, P.WHITE); r(3, 5, 10, 1, P.WHITE); r(0, 14, 16, 2, P.WHITE); r(4, 1, 3, 3, P.ICE, 0.7); break;
    case 'picture':
      r(2, 0, 12, 11, P.WOOD_DARK); r(3, 1, 10, 9, P.CREAM); r(4, 5, 8, 4, P.BLUE); r(6, 3, 3, 3, P.WHITE); break;
    case 'lamp':
      r(5, 15, 6, 1, P.ROCK_DARK); r(7, 4, 2, 12, P.ROCK); r(3, 0, 10, 5, P.LIGHT); r(4, 5, 8, 1, P.YELLOW_DARK); break;
    case 'counter':
      r(0, 4, 48, 16, P.OUTLINE); r(1, 5, 46, 5, P.CREAM); r(1, 10, 46, 9, P.WOOD); r(6, 0, 10, 5, P.YELLOW_DARK); r(7, -1, 8, 2, P.CREAM); r(30, 1, 8, 4, P.ORANGE); r(20, 2, 6, 3, P.PINK); break;
    case 'oven':
      r(1, 2, 30, 28, P.OUTLINE); r(2, 3, 28, 26, P.ROCK_DARK); r(2, 3, 28, 4, P.ROCK_LIGHT); r(6, 10, 20, 12, P.ROCK); r(9, 13, 14, 6, P.ORANGE); r(12, 14, 8, 3, P.YELLOW); r(12, -4, 8, 7, P.ROCK); break;
    case 'nets':
      r(2, 0, 12, 28, P.TEAL_DARK); for (let i = 0; i < 4; i++) r(2 + i * 4, 0, 1, 28, P.WATER_LIGHT, 0.6); for (let j = 0; j < 7; j++) r(2, j * 4, 12, 1, P.WATER_LIGHT, 0.6); r(4, 26, 8, 3, P.ORANGE); break;
    case 'radio':
      r(2, 5, 12, 9, P.OUTLINE); r(3, 6, 10, 7, P.WOOD_DARK); r(4, 7, 3, 3, P.YELLOW); r(9, 7, 3, 5, P.ROCK); r(6, 2, 1, 4, P.ROCK_LIGHT); break;
    case 'loom':
      r(1, 0, 30, 30, P.OUTLINE); r(2, 1, 28, 28, P.WOOD); r(4, 3, 24, 24, P.WOOD_LIGHT); for (let i = 0; i < 8; i++) r(5 + i * 3, 3, 1, 24, P.CREAM); r(4, 16, 24, 10, P.RED); r(4, 16, 24, 2, P.WHITE, 0.5); break;
    case 'cabinet':
      r(0, 0, 32, 16, P.OUTLINE); r(1, 1, 30, 14, P.WOOD_DARK); for (const [x, y] of [[2, 2], [16, 2], [2, 8], [16, 8]] as const) { r(x, y, 13, 5, P.WOOD); r(x + 6, y + 2, 2, 1, P.YELLOW); } break;
    case 'sink':
      r(2, 4, 12, 9, P.OUTLINE); r(3, 5, 10, 7, P.STONE_PALE); r(4, 6, 8, 5, P.WATER_LIGHT); r(7, 0, 2, 6, P.ROCK_LIGHT); r(7, 0, 4, 1, P.ROCK_LIGHT); break;
    case 'toybox':
      r(1, 4, 14, 11, P.OUTLINE); r(2, 5, 12, 9, P.BLUE); r(2, 5, 12, 3, P.YELLOW); r(5, 0, 5, 5, P.RED); r(6, 1, 2, 2, P.WHITE); break;
    case 'desk':
      r(0, 2, 32, 8, P.OUTLINE); r(1, 3, 30, 6, P.WOOD_LIGHT); r(1, 10, 3, 6, P.WOOD_DARK); r(28, 10, 3, 6, P.WOOD_DARK); r(6, 3, 8, 5, P.WHITE); r(18, 4, 6, 3, P.ROCK); break;
    case 'crates':
      r(1, 3, 14, 12, P.OUTLINE); r(2, 4, 12, 10, P.WOOD); r(2, 8, 12, 1, P.WOOD_DARK); r(8, 4, 1, 10, P.WOOD_DARK); break;
    case 'sacks':
      r(2, 4, 12, 11, P.OUTLINE); r(3, 5, 10, 9, P.CREAM); r(6, 2, 4, 3, P.WOOD); r(4, 9, 8, 1, P.GRAVEL); break;
  }
}
