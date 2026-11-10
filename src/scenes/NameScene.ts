import Phaser from 'phaser';
import { hiRes } from '../ui/hires';
import { FONT, SIZE, TEXT_RES } from '../ui/font';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { state } from '../systems/state';
import { bus, EV } from '../systems/events';

const MAX = 12;

/** "You must be..." Type a name, Enter to confirm. Empty keeps the default. */
export class NameScene extends Phaser.Scene {
  private value = '';
  private field!: Phaser.GameObjects.Text;

  constructor() {
    super('Name');
  }

  create(): void {
    hiRes(this);
    this.value = '';
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 20;
    this.add.rectangle(cx, cy, 240, 70, 0x11141c, 0.96).setStrokeStyle(1, 0xf4f1e8);
    this.add.text(cx, cy - 22, 'Your name:', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#ffd37a' }).setOrigin(0.5);
    this.add.rectangle(cx, cy, 200, 16, 0x1f2430).setStrokeStyle(1, 0x5c6577);
    this.field = this.add.text(cx, cy, '', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#f4f1e8' }).setOrigin(0.5);
    this.add.text(cx, cy + 22, 'Letters only. Enter to confirm.', { fontFamily: FONT.body, resolution: TEXT_RES, fontSize: SIZE.body, color: '#9aa3b2' }).setOrigin(0.5);
    this.time.addEvent({ delay: 450, loop: true, callback: () => this.paint() });
    this.paint();

    this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'Enter') return this.confirm();
      if (ev.key === 'Backspace') { this.value = this.value.slice(0, -1); return this.paint(); }
      if (ev.key.length === 1 && /[\p{L} '-]/u.test(ev.key) && this.value.length < MAX) {
        this.value += ev.key;
        this.paint();
      }
    });
    (window as unknown as { __debug: Record<string, unknown> }).__debug.nameEntry = true;
  }

  private paint(): void {
    const blink = Math.floor(this.time.now / 450) % 2 === 0 ? '_' : ' ';
    this.field.setText(this.value + blink);
  }

  private confirm(): void {
    const name = this.value.trim();
    state.playerName = name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Student';
    const dbg = (window as unknown as { __debug: Record<string, unknown> }).__debug;
    dbg.nameEntry = false;
    dbg.playerName = state.playerName;
    bus.emit(EV.stateChanged);
    bus.emit(EV.nameEntered, state.playerName);
    this.scene.stop();
  }
}
