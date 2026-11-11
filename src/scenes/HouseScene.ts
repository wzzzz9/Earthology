import Phaser from 'phaser';
import { hiRes } from '../ui/hires';
import { FONT, SIZE, TEXT_RES } from '../ui/font';
import { GAME_WIDTH } from '../config';
import { content } from '../content';
import type { HouseDef, HouseThing } from '../content/types';
import { state } from '../systems/state';
import { bus, EV } from '../systems/events';
import { sfx } from '../systems/sfx';
import { MoveInput } from '../systems/input';
import { addTrust } from '../systems/relationships';
import * as P from '../art/palette';
import { FURNITURE_FOOT, FURNITURE_HEADROOM, makeFurniture } from '../systems/placeholders';

const T = 16;
const COLS = 18;
const ROWS = 9;
const OX = (GAME_WIDTH - COLS * T) / 2;
const OY = 52;
const SPEED = 70;
const DOOR_COLS = [8, 9];

const FOOT = FURNITURE_FOOT;

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
      const key = makeFurniture(this, f.type, f.color);
      const img = this.add.image(px, py + foot.h * T, key).setOrigin(0, 1);
      img.setDepth(f.type === 'rug' ? 2 : foot.solid ? py + foot.h * T : 3);
      void FURNITURE_HEADROOM;
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
