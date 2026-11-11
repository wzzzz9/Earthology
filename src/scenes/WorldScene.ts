import Phaser from 'phaser';
import { hiRes } from '../ui/hires';
import { FONT, SIZE, TEXT_RES } from '../ui/font';
import { sfx } from '../systems/sfx';
import { puzzleFor, puzzleStatus, geyserPull, geyserClock } from '../systems/puzzles';
import { levelOf } from '../systems/relationships';
import type { ClassDef, PuzzleObject } from '../content/types';
import {
  makePlaceholderTileset, makePlaceholderPlayer, makePlaceholderShip, makeSparkle, makePlaceholderProps, makePickupRock, makeTrees, makeIcelandProps, makePlants,
  PLAYER_W, PLAYER_H, DISGUISES, PLAYER_LOOK,
} from '../systems/placeholders';
import { MoveInput } from '../systems/input';
import { content } from '../content';
import { state } from '../systems/state';
import { Conversation } from '../systems/conversation';
import type { DialogueSource } from './DialogueScene';
import type { MapInfo } from './MapScene';
import { bus, EV } from '../systems/events';
import { saveNow } from '../systems/save';
import { onNewDay, classToday, attendClass, checkTasks, type Notice } from '../systems/schedule';

const SPEED = 70; // px per second, a relaxed walking pace for 16px tiles
const REACH = 22; // px from the point in front of the player to an interactable

type Kind = 'scan' | 'npc' | 'ship' | 'sample' | 'puzzle' | 'door';
interface Interactable {
  kind: Kind;
  id: string;
  x: number;
  y: number;
  sparkle?: Phaser.GameObjects.Image;
  image?: Phaser.GameObjects.Image;
}

/** The current region map with the player. M2: walk. M3: notice, talk, sleep. */
export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private move!: MoveInput;
  private actKey!: Phaser.Input.Keyboard.Key;
  private bookKey!: Phaser.Input.Keyboard.Key;
  private interactables: Interactable[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private busy = false;
  /** An overlay to open as soon as the current dialogue closes (ship -> Submit). */
  private pendingOverlay: string | null = null;
  /** Keys that were down when an overlay closed; ignored until released, so the closing press does not re-open. */
  private heldE = false;
  private heldN = false;
  private heldM = false;
  private mapKey!: Phaser.Input.Keyboard.Key;
  private mapInfo!: Omit<MapInfo, 'player'>;
  private lastTile = -1;
  private firstWalk = false;
  private playerKey = 'player';

  constructor() {
    super('World');
  }

  init(data: { firstWalk?: boolean }): void {
    this.firstWalk = !!data?.firstWalk;
    this.interactables = [];
    this.busy = false;
    this.pendingOverlay = null;
    this.lastTile = -1;
  }

  create(): void {
    hiRes(this);
    makePlaceholderTileset(this);
    const disguise = state.disguise && DISGUISES[state.disguise] ? state.disguise : 'a';
    this.playerKey = `player.${disguise}`;
    makePlaceholderPlayer(this, this.playerKey, DISGUISES[disguise] ?? PLAYER_LOOK);
    makePlaceholderShip(this);
    makeSparkle(this);
    makePlaceholderProps(this);
    makeTrees(this);
    makeIcelandProps(this);
    makePlants(this);

    const map = this.make.tilemap({ key: 'map.iceland' });
    state.mapTiles = map.width * map.height;
    const tileset = map.addTilesetImage('placeholder', 'placeholder')!;
    const ground = map.createLayer('ground', tileset)!;
    const walls = map.createLayer('walls', tileset)!;
    ground.setCollisionByProperty({ collides: true });
    walls.setCollisionByProperty({ collides: true });

    const objects = map.getObjectLayer('objects')?.objects ?? [];
    const spawn = objects.find((o) => o.name === 'spawn');

    const start = state.playerPos ?? { x: spawn?.x ?? 100, y: spawn?.y ?? 100 };
    this.player = this.physics.add.sprite(start.x, start.y, this.playerKey, 'down0');
    this.player.body!.setSize(10, 8).setOffset((PLAYER_W - 10) / 2, PLAYER_H - 8);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    const solids = this.physics.add.staticGroup();
    for (const o of objects) {
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      if (o.type === 'ship') {
        const ship = this.add.image(x, y - 8, 'ship').setDepth(5);
        solids.add(this.add.rectangle(x, y, 44, 14).setVisible(false));
        this.interactables.push({ kind: 'ship', id: 'ship', x, y: y + 4 });
        void ship;
      } else if (o.type === 'scan') {
        if (this.textures.exists(`prop.${o.name}`)) {
          this.add.image(x, y, `prop.${o.name}`).setDepth(y);
          solids.add(this.add.rectangle(x, y + 3, 12, 8).setVisible(false));
        }
        this.interactables.push({ kind: 'scan', id: o.name, x, y, sparkle: this.addSparkle(x, y - 12) });
      } else if (o.type === 'building') {
        const key = `bld.${o.name}`;
        if (!this.textures.exists(key)) continue;
        const img = this.add.image(x + 8, y + 8, key).setOrigin(0.5, 1).setDepth(y + 8);
        const fw = img.width - 4;
        solids.add(this.add.rectangle(x + 8, y + 2, fw, 22).setVisible(false));
        // whose house: a Tiled property on the object (array or map, depending on the parser)
        const props = (o as unknown as { properties?: { name: string; value: string }[] | Record<string, string> }).properties;
        const houseId = Array.isArray(props) ? props.find((p) => p.name === 'house')?.value : props?.house;
        if (houseId && content.houses[houseId]) this.interactables.push({ kind: 'door', id: houseId, x: x + 8, y: y + 12 });
      } else if (o.type === 'prop') {
        const key = `prop.${o.name}`;
        if (!this.textures.exists(key)) continue;
        const img = this.add.image(x, y + 8, key).setOrigin(0.5, 1).setDepth(y + 8);
        solids.add(this.add.rectangle(x, y + 2, Math.max(8, img.width - 6), Math.min(12, img.height / 2)).setVisible(false));
      } else if (o.type === 'deco') {
        const key = `prop.${o.name}`;
        if (!this.textures.exists(key)) continue;
        const img = this.add.image(x, y + 8, key).setOrigin(0.5, 1).setDepth(y + 8);
        solids.add(this.add.rectangle(x, y + 4, Math.max(6, img.width - 4), 6).setVisible(false));
      } else if (o.type === 'plant') {
        const key = `plant.${o.name}`;
        if (this.textures.exists(key)) this.add.image(x + Phaser.Math.Between(-3, 3), y + 6, key).setOrigin(0.5, 1).setDepth(y + 2);
      } else if (o.type === 'pier') {
        this.add.image(x, y, 'prop.pier').setDepth(1);
      } else if (o.type === 'scanwater') {
        // Something you look at from the shore (a boat): drawn, scannable, never walkable.
        if (this.textures.exists(`prop.${o.name}`)) this.add.image(x, y, `prop.${o.name}`).setDepth(y);
        this.interactables.push({ kind: 'scan', id: o.name, x, y, sparkle: this.addSparkle(x, y - 12) });
      } else if (o.type === 'fx') {
        this.addFx(o.name, x, y, solids);
      } else if (o.type === 'tree') {
        const key = `tree.${o.name}`;
        if (!this.textures.exists(key)) continue;
        // Trunk base sits on the object point; depth by the base so you can walk behind the canopy.
        this.add.image(x, y + 8, key).setOrigin(0.5, 1).setDepth(y + 8);
        solids.add(this.add.rectangle(x, y + 3, 8, 6).setVisible(false));
      } else if (o.type === 'sample') {
        const def = content.samples[o.name];
        if (!def) continue;
        const pickupId = `${o.name}@${o.id}`;
        if (state.hasPickedUp(pickupId)) continue;
        makePickupRock(this, `rock.${o.name}`, def.color);
        const img = this.add.image(x, y, `rock.${o.name}`).setDepth(y - 8);
        this.interactables.push({ kind: 'sample', id: o.name, x, y, sparkle: this.addSparkle(x, y - 10), image: img });
        // Store the pickup id on the interactable via the image name.
        img.setName(pickupId);
      } else if (o.type === 'puzzle') {
        // <puzzle>.<object>: a thing at a field-trip site. Drawn simply here; the rules live in puzzles.ts.
        const [pid, oid] = o.name.split('.');
        if (!puzzleFor(pid)?.trip.puzzle.objects[oid]) continue;
        if (oid === 'blocked') this.add.circle(x, y - 14, 3, 0x3a3f55).setStrokeStyle(1, 0x2a2630).setDepth(y - 14);
        if (oid === 'table') {
          this.add.rectangle(x, y - 4, 16, 9, 0x7a5a3a).setStrokeStyle(1, 0x2a2630).setDepth(y);
          this.add.rectangle(x, y - 5, 11, 6, 0xf1e9d2).setDepth(y + 1);
          solids.add(this.add.rectangle(x, y - 2, 14, 6).setVisible(false));
        }
        this.interactables.push({ kind: 'puzzle', id: o.name, x, y, sparkle: this.addSparkle(x, y - 12) });
      } else if (o.type === 'npc') {
        const def = content.npcs[o.name];
        makePlaceholderPlayer(this, `npc.${o.name}`, { coat: def.coat, coatDark: '#2f5238', hair: '#cfd2d8', skin: '#f3cfae', hat: null, legs: '#3a3f55' });
        this.add.image(x, y - 4, `npc.${o.name}`, 'down0').setDepth(y);
        solids.add(this.add.rectangle(x, y + 2, 10, 8).setVisible(false));
        this.interactables.push({ kind: 'npc', id: o.name, x, y });
      }
    }
    // Hide sparkles for things already in the notebook (relevant once saving exists).
    for (const it of this.interactables) if (it.kind === 'scan' && state.hasScanned(it.id)) it.sparkle?.setVisible(false);
    this.refreshPuzzleSparkles();

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, walls);
    this.physics.add.collider(this.player, solids);

    for (const dir of ['down', 'up', 'left', 'right'] as const) {
      const key = `walk-${dir}-${disguise}`;
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: [{ key: this.playerKey, frame: `${dir}0` }, { key: this.playerKey, frame: `${dir}1` }],
          frameRate: 6,
          repeat: -1,
        });
      }
    }

    // What the paper map needs: tile layers and marker positions.
    const groundData = ground.layer.data.flat().map((t) => (t.index > 0 ? t.index : 0));
    const wallData = walls.layer.data.flat().map((t) => (t.index > 0 ? t.index : 0));
    this.mapInfo = {
      width: map.width,
      height: map.height,
      ground: groundData,
      walls: wallData,
      markers: this.interactables.filter((it) => it.kind !== 'sample' && it.kind !== 'puzzle' && it.kind !== 'door').map((it) => ({ x: it.x, y: it.y, kind: it.kind as 'ship' | 'scan' | 'npc', id: it.id })),
    };

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setRoundPixels(true);

    this.move = new MoveInput(this);
    this.actKey = this.input.keyboard!.addKey('E');
    this.bookKey = this.input.keyboard!.addKey('N');
    this.mapKey = this.input.keyboard!.addKey('M');
    this.prompt = this.add
      .text(0, 0, '', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#f4f1e8', backgroundColor: '#11141cdd', padding: { x: 3, y: 1 } })
      .setOrigin(0.5, 1)
      .setDepth(100)
      .setVisible(false);

    this.scene.launch('Hud');
    bus.on(EV.dialogueClosed, this.onDialogueClosed, this);
    bus.on(EV.overlayClosed, this.onDialogueClosed, this);
    bus.on(EV.stateChanged, checkTasks);
    this.events.once('shutdown', () => {
      bus.off(EV.dialogueClosed, this.onDialogueClosed, this);
      bus.off(EV.overlayClosed, this.onDialogueClosed, this);
      bus.off(EV.stateChanged, checkTasks);
    });

    this.events.on('wake', (_sys: Phaser.Scenes.Systems, data?: { from?: string; x?: number; y?: number }) => {
      if (data?.from === 'house' && data.x !== undefined && data.y !== undefined) {
        (this.player.body as Phaser.Physics.Arcade.Body).reset(data.x, data.y);
        this.player.setFrame('down0');
      }
      this.cameras.main.resetFX();
      this.cameras.main.fadeIn(300, 0, 0, 0);
      this.busy = false;
      this.heldE = this.actKey.isDown;
    });
    this.installDebug();
    this.revealAround();
    if (this.firstWalk) {
      this.cameras.main.fadeIn(500, 0, 0, 0);
      this.time.delayedCall(600, () => bus.emit(EV.toast, content.intro.controls));
    }
  }

  /** Fog of war: mark tiles within a few tiles of the player as explored. */
  private revealAround(): void {
    const tx = Math.floor(this.player.x / 16);
    const ty = Math.floor(this.player.y / 16);
    const idx = ty * this.mapInfo.width + tx;
    if (idx === this.lastTile) return;
    this.lastTile = idx;
    const R = 5;
    let changed = false;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx * dx + dy * dy > R * R + 2) continue;
        const x = tx + dx;
        const y = ty + dy;
        if (x < 0 || y < 0 || x >= this.mapInfo.width || y >= this.mapInfo.height) continue;
        if (state.explore(y * this.mapInfo.width + x)) changed = true;
      }
    }
    if (changed) bus.emit(EV.stateChanged);
  }

  /** Animated landmarks: the geyser erupts now and then, steam drifts, the waterfall flickers. */
  private addFx(name: string, x: number, y: number, solids: Phaser.Physics.Arcade.StaticGroup): void {
    if (name === 'geyser') {
      this.add.image(x, y, 'fx.geyser-base').setDepth(y);
      solids.add(this.add.rectangle(x, y, 14, 8).setVisible(false));
      const column = this.add.image(x, y - 2, 'fx.geyser-column').setOrigin(0.5, 1).setDepth(y + 1).setScale(1, 0);
      const erupt = () => {
        this.tweens.add({
          targets: column, scaleY: 1, duration: 500, ease: 'Quad.easeOut', yoyo: true, hold: 900,
          onStart: () => {
            geyserClock.lastEruptAt = this.time.now;
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 160) { this.cameras.main.shake(300, 0.002); sfx.geyser(); }
          },
          onComplete: () => this.time.delayedCall(Phaser.Math.Between(6000, 11000), erupt),
        });
      };
      this.time.delayedCall(2500, erupt);
    } else if (name === 'steam') {
      for (let i = 0; i < 2; i++) {
        const puff = this.add.image(x + i * 5 - 2, y - 6, 'fx.steam').setDepth(y + 20).setAlpha(0);
        this.tweens.add({ targets: puff, y: y - 26, alpha: { from: 0.8, to: 0 }, duration: 2200, delay: i * 1100, repeat: -1, ease: 'Sine.easeOut' });
      }
    } else if (name === 'waterfall') {
      const img = this.add.image(x + 8, y + 12, 'fx.waterfall0').setOrigin(0.5, 1).setDepth(y + 8);
      let f = 0;
      this.time.addEvent({ delay: 140, loop: true, callback: () => img.setTexture(`fx.waterfall${(f = 1 - f)}`) });
      for (let i = 0; i < 2; i++) {
        const puff = this.add.image(x + i * 8 - 4, y + 4, 'fx.steam').setDepth(y + 20).setAlpha(0);
        this.tweens.add({ targets: puff, y: y - 10, alpha: { from: 0.6, to: 0 }, duration: 1800, delay: i * 900, repeat: -1 });
      }
    }
  }

  private addSparkle(x: number, y: number): Phaser.GameObjects.Image {
    const s = this.add.image(x, y, 'sparkle').setDepth(50);
    this.tweens.add({ targets: s, alpha: 0.2, scale: 0.7, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return s;
  }

  /** The interactable nearest to the spot just in front of the player, if within reach. */
  private target(): Interactable | null {
    const f = this.move.facing;
    const px = this.player.x + (f === 'left' ? -12 : f === 'right' ? 12 : 0);
    const py = this.player.y + 6 + (f === 'up' ? -12 : f === 'down' ? 12 : 0);
    let best: Interactable | null = null;
    let bestD = REACH;
    for (const it of this.interactables) {
      const d = Phaser.Math.Distance.Between(px, py, it.x, it.y);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    return best;
  }

  private promptFor(it: Interactable): string {
    if (it.kind === 'scan') return `E: Look at ${content.scannables[it.id]?.name.toLowerCase() ?? it.id}`;
    if (it.kind === 'npc') return `E: Talk to ${content.npcs[it.id]?.name ?? it.id}`;
    if (it.kind === 'sample') return 'E: Pick up rock';
    if (it.kind === 'puzzle') return `E: ${this.puzzleObject(it)?.prompt ?? 'Look'}`;
    if (it.kind === 'door') {
      const h = content.houses[it.id];
      return h.owner && levelOf(h.owner) >= 2 ? `E: Go into ${h.name}` : `E: Knock at ${h.name}`;
    }
    return 'E: Your ship';
  }

  private interact(it: Interactable): void {
    if (it.kind === 'scan') return this.scan(it);
    if (it.kind === 'npc') return this.openDialogue(new Conversation(it.id));
    if (it.kind === 'sample') return this.pickUp(it);
    if (it.kind === 'puzzle') return this.openDialogue(this.puzzleTalk(it));
    if (it.kind === 'door') return this.knock(it);
    return this.openDialogue(this.shipMenu());
  }

  private scan(it: Interactable): void {
    const def = content.scannables[it.id];
    if (!def) return;
    const added = state.addEntry({ id: it.id, kind: 'scan', section: def.section, name: def.name, line: def.line });
    it.sparkle?.setVisible(false);
    if (added) sfx.scan();
    bus.emit(EV.toast, added ? `Notebook: ${def.name}. ${def.line}` : `${def.name}. Already in your notebook.`);
  }

  private pickUp(it: Interactable): void {
    const def = content.samples[it.id];
    const s = state.addSample(it.id, it.image?.name ?? it.id);
    sfx.confirm();
    it.sparkle?.destroy();
    it.image?.destroy();
    this.interactables = this.interactables.filter((x) => x !== it);
    bus.emit(EV.toast, `Picked up a rock. ${def.look} Press N to open the notebook and test it. (#${s.uid})`);
  }

  private openOverlay(key: string, data?: object): void {
    this.busy = true;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.prompt.setVisible(false);
    sfx.open();
    this.scene.launch(key, data);
  }

  /** The ship offers to end the day. Sleeping advances the day counter. */
  private shipMenu(): DialogueSource {
    let step = 0;
    const page = (lines: string[], choices?: string[]) => ({ speaker: 'Ship', color: '#8a8f99', lines, choices });
    return {
      next: (choice?: number) => {
        const cls = classToday();
        const options = [...(cls ? ['Attend class'] : []), 'Submit homework', 'Sleep until tomorrow', 'Nothing'];
        if (step === 0) {
          step = 1;
          return page([`Day ${state.day}. The cabin is warm.`, 'What now?'], options);
        }
        if (step === 1) {
          const picked = options[choice ?? options.length - 1];
          if (picked === 'Attend class' && cls) {
            if (cls.trip) {
              // A field trip: the professor takes you to the place first.
              this.pendingClass = cls;
              this.pendingOverlay = 'trip';
              return null;
            }
            // The lesson is the professor talking; it replaces this menu.
            this.pendingNotices = attendClass(cls);
            this.pendingOverlay = 'notices';
            return null;
          }
          if (picked === 'Submit homework') {
            this.pendingOverlay = 'Submit';
            return null;
          }
          if (picked === 'Sleep until tomorrow') {
            this.sleep();
            return null;
          }
        }
        return null;
      },
    };
  }

  private pendingNotices: Notice[] = [];
  private pendingClass: ClassDef | null = null;
  private pendingOverlayData: object | undefined;
  private tripTeacher: Phaser.GameObjects.Image | null = null;

  /**
   * Field trip: fade out, stand the player at the place with the professor beside them,
   * then the lesson plays there and she leaves. The puzzle at the site is open from then on.
   */
  private startTrip(cls: ClassDef): void {
    const trip = cls.trip!;
    const spot = this.interactables.find((i) => i.kind === 'scan' && i.id === trip.place);
    // The scan point is a walkable tile by the landmark; stand there, the professor one tile east.
    const tx = spot ? spot.x : this.player.x;
    const ty = spot ? spot.y + 4 : this.player.y;
    this.busy = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      (this.player.body as Phaser.Physics.Arcade.Body).reset(tx, ty);
      this.player.setFrame('up0');
      if (!this.textures.exists('npc.teacher')) {
        makePlaceholderPlayer(this, 'npc.teacher', { coat: content.teacher.color, coatDark: '#2f5238', hair: '#3a2a1a', skin: '#f3cfae', hat: null, legs: '#3a3f55' });
      }
      this.tripTeacher = this.add.image(tx + 18, ty - 4, 'npc.teacher', 'up0').setDepth(ty);
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this.time.delayedCall(700, () => {
        this.pendingNotices = [...attendClass(cls), { lines: trip.leave, note: `Puzzle: ${cls.task.text}` }];
        this.refreshPuzzleSparkles();
        this.scene.launch('Dialogue', { source: this.noticesSource(this.pendingNotices) });
        this.pendingNotices = [];
      });
    });
  }

  private puzzleObject(it: Interactable): PuzzleObject | undefined {
    const [pid, oid] = it.id.split('.');
    return puzzleFor(pid)?.trip.puzzle.objects[oid];
  }

  /** Sparkles mark puzzle objects only while their puzzle is open. */
  private refreshPuzzleSparkles(): void {
    for (const it of this.interactables) {
      if (it.kind !== 'puzzle') continue;
      it.sparkle?.setVisible(puzzleStatus(it.id.split('.')[0]) === 'open');
    }
  }

  /** Looking at a puzzle object: its description, then a choice of things to do with it. */
  private puzzleTalk(it: Interactable): DialogueSource {
    const [pid] = it.id.split('.');
    const ref = puzzleFor(pid)!;
    const obj = this.puzzleObject(it)!;
    const page = (lines: string[], choices?: string[]) => ({ speaker: obj.name, color: '#5fc4b0', lines, choices });
    let step = 0;
    return {
      next: (choice?: number) => {
        if (step === 0) {
          step = 1;
          if (puzzleStatus(pid) === 'locked') { step = 2; return page([...obj.look, content.classes.lines.puzzleLocked]); }
          return page(obj.look, [...obj.choices.map((c) => c.text), 'Leave it']);
        }
        if (step === 1) {
          step = 2;
          const c = obj.choices[choice ?? obj.choices.length];
          if (!c) return null;
          if (c.action === 'watch') return page(c.reply ?? []);
          if (c.action === 'plan') {
            this.pendingOverlay = 'Flood';
            this.pendingOverlayData = { puzzleId: pid };
            return null;
          }
          if (c.action === 'pull' && ref.trip.puzzle.type === 'geyser') {
            const L = ref.trip.puzzle.lines;
            const r = geyserPull(pid, ref.trip.puzzle, this.time.now);
            if (r === 'solved') { this.eruptAt(it.x, it.y - 16); this.refreshPuzzleSparkles(); return page(L.pullSolved); }
            if (r === 'done') return page(L.pullDone);
            this.cameras.main.shake(250, 0.004);
            sfx.close();
            return page(L.pullEarly);
          }
        }
        return null;
      },
    };
  }

  /** Knocking: friends are let in, strangers get the door. Inside is its own scene; the world sleeps. */
  private knock(it: Interactable): void {
    const h = content.houses[it.id];
    sfx.tick();
    if (!h.owner) { bus.emit(EV.toast, h.locked ?? 'Nobody answers.'); return; }
    const owner = content.npcs[h.owner];
    if (levelOf(h.owner) < 2) {
      bus.emit(EV.toast, `${owner.name} opens the door a crack. "Yes?" You are not close enough to be asked in. Not yet.`);
      return;
    }
    this.busy = true;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.prompt.setVisible(false);
    sfx.open();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('House', { house: it.id, returnTo: { x: it.x, y: it.y + 10 }, playerKey: this.playerKey });
      this.scene.sleep();
    });
  }

  /** A one-off eruption where a blocked pool used to be. */
  private eruptAt(x: number, y: number): void {
    const column = this.add.image(x, y, 'fx.geyser-column').setOrigin(0.5, 1).setDepth(y + 1).setScale(1, 0);
    this.time.delayedCall(900, () => {
      sfx.geyser();
      this.cameras.main.shake(400, 0.003);
      this.tweens.add({ targets: column, scaleY: 1.2, duration: 500, ease: 'Quad.easeOut', yoyo: true, hold: 1400, onComplete: () => column.destroy() });
    });
  }

  private sleep(): void {
    state.nextDay();
    saveNow();
    this.cameras.main.flash(600, 10, 12, 18);
    const notices = [{ lines: [`Day ${state.day}.`, 'The light outside has changed.'] }, ...onNewDay()];
    this.pendingNotices = notices;
    this.pendingOverlay = 'notices';
  }

  /** The professor speaks: a list of pages shown through the dialogue box. */
  private noticesSource(notices: Notice[]): DialogueSource {
    let i = 0;
    const t = content.teacher;
    return {
      next: () => {
        const n = notices[i++];
        return n ? { speaker: t.name, color: t.color, lines: n.lines, note: n.note } : null;
      },
    };
  }

  /** Testing hook: sleep n nights, processing each morning's schedule. */
  private skipDays(n: number): void {
    for (let i = 0; i < n; i++) {
      state.nextDay();
      this.pendingNotices = onNewDay();
    }
    saveNow();
  }

  private openDialogue(source: DialogueSource): void {
    this.busy = true;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.prompt.setVisible(false);
    this.scene.launch('Dialogue', { source });
  }

  private onDialogueClosed(): void {
    if (this.scene.isSleeping()) return; // inside a house: the house scene handles its own overlays
    if (this.pendingOverlay) {
      const key = this.pendingOverlay;
      this.pendingOverlay = null;
      if (key === 'notices') {
        const notices = this.pendingNotices;
        this.pendingNotices = [];
        if (notices.length) {
          // The Dialogue scene is still shutting down in this very tick; relaunching it now
          // would be cancelled by its queued stop. Wait a beat, then open the notices.
          this.time.delayedCall(80, () => this.scene.launch('Dialogue', { source: this.noticesSource(notices) }));
          return; // stay busy
        }
      } else if (key === 'trip') {
        const cls = this.pendingClass;
        this.pendingClass = null;
        if (cls) { this.startTrip(cls); return; }
      } else {
        const data = this.pendingOverlayData;
        this.pendingOverlayData = undefined;
        this.scene.launch(key, data);
        return; // stay busy
      }
    }
    if (this.tripTeacher) {
      // The lesson is over: the professor heads back to the ship.
      const t = this.tripTeacher;
      this.tripTeacher = null;
      this.tweens.add({ targets: t, alpha: 0, x: t.x + 30, duration: 900, onComplete: () => t.destroy() });
    }
    this.refreshPuzzleSparkles();
    // Whatever key closed the overlay must be released before it counts again.
    this.heldE = this.actKey.isDown;
    this.heldN = this.bookKey.isDown;
    this.heldM = this.mapKey.isDown;
    this.busy = false;
  }

  update(): void {
    if (this.busy) return;
    if (this.heldE && !this.actKey.isDown) this.heldE = false;
    if (this.heldN && !this.bookKey.isDown) this.heldN = false;
    if (this.heldM && !this.mapKey.isDown) this.heldM = false;
    if (Phaser.Input.Keyboard.JustDown(this.bookKey) && !this.heldN) return this.openOverlay('Notebook');
    if (Phaser.Input.Keyboard.JustDown(this.mapKey) && !this.heldM) {
      return this.openOverlay('Map', { info: { ...this.mapInfo, player: { x: this.player.x, y: this.player.y } } });
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
    this.player.setDepth(this.player.y + 12);
    state.playerPos = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    this.revealAround();

    const it = this.target();
    if (it) {
      this.prompt.setText(this.promptFor(it)).setPosition(this.player.x, this.player.y - 16).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actKey) && !this.heldE) this.interact(it);
    } else {
      this.prompt.setVisible(false);
    }
  }

  /** Debug hooks read by scripts/shot.mjs so headless checks can confirm behaviour. */
  private installDebug(): void {
    const player = this.player;
    const w = window as unknown as { __debug: Record<string, unknown> };
    const dbg = (w.__debug ??= {});
    // defineProperties keeps these as live getters; Object.assign would copy snapshots.
    Object.defineProperties(dbg, {
      player: { get: () => ({ x: Math.round(player.x), y: Math.round(player.y) }), enumerable: true, configurable: true },
      state: {
        get: () => ({
          day: state.day,
          notebook: state.notebook.map((e) => e.id),
          relationships: state.relationships,
          bag: state.bag.map((b) => ({ uid: b.uid, identified: b.identified, tests: Object.keys(b.results).length, wrong: b.wrongGuesses })),
          facts: state.factsLearned,
          submissions: state.submissions.map((x) => x.score),
          bestScore: state.bestScore,
          locked: state.lockBaseline !== null,
          identicalStreak: state.identicalStreak,
          disguise: state.disguise,
          introDone: state.introDone,
          explored: state.explored.length,
          classesAttended: state.classesAttended,
          classesMissed: state.classesMissed,
          tasks: state.tasks,
          finalResult: state.finalResult,
          retake: state.retake,
          attempt: state.attempt,
          puzzlesSolved: state.puzzlesSolved,
        }),
        enumerable: true,
        configurable: true,
      },
      teleport: { value: (x: number, y: number) => (player.body as Phaser.Physics.Arcade.Body).reset(x, y), enumerable: true, configurable: true },
      skipDays: { value: (n: number) => this.skipDays(n), enumerable: true, configurable: true },
      notices: { get: () => this.pendingNotices, enumerable: true, configurable: true },
      sinceErupt: { get: () => this.time.now - geyserClock.lastEruptAt, enumerable: true, configurable: true },
    });
  }
}
