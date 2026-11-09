import Phaser from 'phaser';
import {
  makePlaceholderTileset, makePlaceholderPlayer, makePlaceholderShip, makeSparkle, makePlaceholderProps, makePickupRock, makeTrees,
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

const SPEED = 70; // px per second, a relaxed walking pace for 16px tiles
const REACH = 22; // px from the point in front of the player to an interactable

type Kind = 'scan' | 'npc' | 'ship' | 'sample';
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
    makePlaceholderTileset(this);
    const disguise = state.disguise && DISGUISES[state.disguise] ? state.disguise : 'a';
    this.playerKey = `player.${disguise}`;
    makePlaceholderPlayer(this, this.playerKey, DISGUISES[disguise] ?? PLAYER_LOOK);
    makePlaceholderShip(this);
    makeSparkle(this);
    makePlaceholderProps(this);
    makeTrees(this);

    const map = this.make.tilemap({ key: 'map.test-field' });
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
      markers: this.interactables.filter((it) => it.kind !== 'sample').map((it) => ({ x: it.x, y: it.y, kind: it.kind as 'ship' | 'scan' | 'npc', id: it.id })),
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
      .text(0, 0, '', { fontFamily: 'monospace', fontSize: '8px', color: '#f4f1e8', backgroundColor: '#11141cdd', padding: { x: 3, y: 1 } })
      .setOrigin(0.5, 1)
      .setDepth(100)
      .setVisible(false);

    this.scene.launch('Hud');
    bus.on(EV.dialogueClosed, this.onDialogueClosed, this);
    bus.on(EV.overlayClosed, this.onDialogueClosed, this);
    this.events.once('shutdown', () => {
      bus.off(EV.dialogueClosed, this.onDialogueClosed, this);
      bus.off(EV.overlayClosed, this.onDialogueClosed, this);
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
    const R = 4;
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
    return 'E: Your ship';
  }

  private interact(it: Interactable): void {
    if (it.kind === 'scan') return this.scan(it);
    if (it.kind === 'npc') return this.openDialogue(new Conversation(it.id));
    if (it.kind === 'sample') return this.pickUp(it);
    return this.openDialogue(this.shipMenu());
  }

  private scan(it: Interactable): void {
    const def = content.scannables[it.id];
    if (!def) return;
    const added = state.addEntry({ id: it.id, kind: 'scan', section: def.section, name: def.name, line: def.line });
    it.sparkle?.setVisible(false);
    bus.emit(EV.toast, added ? `Notebook: ${def.name}. ${def.line}` : `${def.name}. Already in your notebook.`);
  }

  private pickUp(it: Interactable): void {
    const def = content.samples[it.id];
    const s = state.addSample(it.id, it.image?.name ?? it.id);
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
    this.scene.launch(key, data);
  }

  /** The ship offers to end the day. Sleeping advances the day counter. */
  private shipMenu(): DialogueSource {
    let step = 0;
    const page = (lines: string[], choices?: string[]) => ({ speaker: 'Ship', color: '#8a8f99', lines, choices });
    return {
      next: (choice?: number) => {
        if (step === 0) {
          step = 1;
          return page([`Day ${state.day}. The cabin is warm.`, 'What now?'], ['Submit homework', 'Sleep until tomorrow', 'Nothing']);
        }
        if (step === 1 && choice === 0) {
          // Close this dialogue; the communicator opens as soon as it has closed.
          this.pendingOverlay = 'Submit';
          return null;
        }
        if (step === 1 && choice === 1) {
          step = 2;
          this.sleep();
          return page([`Day ${state.day}.`, 'The light outside has changed.']);
        }
        return null;
      },
    };
  }

  private sleep(): void {
    state.nextDay();
    saveNow();
    this.cameras.main.flash(600, 10, 12, 18);
  }

  private openDialogue(source: DialogueSource): void {
    this.busy = true;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.prompt.setVisible(false);
    this.scene.launch('Dialogue', { source });
  }

  private onDialogueClosed(): void {
    if (this.pendingOverlay) {
      const key = this.pendingOverlay;
      this.pendingOverlay = null;
      this.scene.launch(key);
      return; // stay busy
    }
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
        }),
        enumerable: true,
        configurable: true,
      },
      teleport: { value: (x: number, y: number) => (player.body as Phaser.Physics.Arcade.Body).reset(x, y), enumerable: true, configurable: true },
    });
  }
}
