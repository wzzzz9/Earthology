import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { content } from '../content';
import type { IntroLine } from '../content/types';
import { state } from '../systems/state';
import { bus, EV } from '../systems/events';
import { makePlaceholderShip, makeAlienTrueForm, makeAlienTeacher, makePlaceholderPlayer, DISGUISES } from '../systems/placeholders';
import type { DialogueSource } from './DialogueScene';
import { saveNow } from '../systems/save';

const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;
const ALIEN_COLOR = '#5fc4b0';

/**
 * The opening cinematic, in beats:
 *  1 bedroom: the acceptance letter on the space computer, then sleep
 *  2 card: "The next day"
 *  3 university: meet the professor, type your name, she summons a ship
 *  4 warp: speed streaks
 *  5 arrival: "Where is this?" "Earth."
 *  6 pull-back: field -> island -> planet, title card
 *  7 cabin: she leaves you the ship, you pick a disguise, then the world
 * Esc skips the current beat. Every line is content (intro.json).
 */
export class IntroScene extends Phaser.Scene {
  private skip = false;
  private figure!: Phaser.GameObjects.Image;
  private caption!: Phaser.GameObjects.Text;

  constructor() {
    super('Intro');
  }

  create(): void {
    makePlaceholderShip(this);
    makeAlienTrueForm(this);
    makeAlienTeacher(this);
    this.input.keyboard!.on('keydown-ESC', () => (this.skip = true));
    void this.run();
  }

  private async run(): Promise<void> {
    await this.bedroom();
    await this.card(content.intro.card);
    await this.university();
    await this.warp();
    await this.arrival();
    await this.pullBack();
    await this.cabin();
  }

  // ---------- helpers ----------
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const ev = this.time.addEvent({ delay: ms, callback: () => resolve() });
      const poll = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          if (this.skip) { this.skip = false; ev.remove(); poll.remove(); resolve(); }
          if (ev.getProgress() >= 1) poll.remove();
        },
      });
    });
  }

  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      const tw = this.tweens.add({ ...cfg, onComplete: () => resolve() });
      const poll = this.time.addEvent({ delay: 50, loop: true, callback: () => { if (this.skip) { this.skip = false; tw.complete(); poll.remove(); } if (!tw.isPlaying()) poll.remove(); } });
    });
  }

  private fade(out: boolean, ms = 350): Promise<void> {
    return new Promise((resolve) => {
      const cam = this.cameras.main;
      if (out) { cam.fadeOut(ms, 0, 0, 0); cam.once('camerafadeoutcomplete', () => resolve()); }
      else { cam.fadeIn(ms, 0, 0, 0); cam.once('camerafadeincomplete', () => resolve()); }
    });
  }

  private clear(): void {
    this.children.removeAll();
  }

  private speakerOf(line: IntroLine) {
    return line.speaker === 'teacher'
      ? { speaker: content.teacher.name, color: content.teacher.color }
      : { speaker: state.playerName, color: ALIEN_COLOR };
  }

  /** Runs a list of intro lines through the Dialogue scene; handles name entry and the disguise choice. */
  private talk(lines: IntroLine[], onDisguise?: (id: string) => void): Promise<void> {
    return new Promise((resolve) => {
      let i = 0;
      let awaiting: 'disguise' | null = null;
      const ids = Object.keys(content.intro.disguises);
      const source: DialogueSource = {
        next: (choice?: number) => {
          if (awaiting === 'disguise' && choice !== undefined) {
            awaiting = null;
            onDisguise?.(ids[Math.min(choice, ids.length - 1)]);
          }
          const prev = lines[i - 1];
          if (prev?.ask === 'name' && !nameDone) {
            // Pause the dialogue, open the name box, resume with the next page afterwards.
            nameDone = true;
            pendingResume = true;
            this.scene.launch('Name');
            return null;
          }
          const page = lines[i++];
          if (!page) return null;
          if (page.choice === 'disguise') awaiting = 'disguise';
          return {
            ...this.speakerOf(page),
            lines: page.lines,
            note: page.note,
            choices: page.choice === 'disguise' ? ids.map((id) => content.intro.disguises[id].label) : undefined,
          };
        },
      };
      let nameDone = false;
      let pendingResume = false;
      const onClosed = () => {
        if (pendingResume) return; // closed only to show the name box
        bus.off(EV.dialogueClosed, onClosed);
        bus.off(EV.nameEntered, onName);
        resolve();
      };
      const onName = () => {
        pendingResume = false;
        this.scene.launch('Dialogue', { source });
      };
      bus.on(EV.dialogueClosed, onClosed);
      bus.on(EV.nameEntered, onName);
      this.scene.launch('Dialogue', { source });
    });
  }

  private stars(count = 50, maxY = GAME_HEIGHT): void {
    for (let i = 0; i < count; i++) {
      this.add.rectangle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, maxY), 1, 1, 0xf4f1e8, Phaser.Math.FloatBetween(0.3, 1));
    }
  }

  // ---------- 1. bedroom ----------
  private async bedroom(): Promise<void> {
    this.clear();
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x1b1830);
    // window onto space
    this.add.rectangle(CX + 110, 70, 120, 80, 0x0b0d14).setStrokeStyle(3, 0x4b4470);
    for (let i = 0; i < 30; i++) this.add.rectangle(CX + 110 + Phaser.Math.Between(-56, 56), 70 + Phaser.Math.Between(-36, 36), 1, 1, 0xf4f1e8, Phaser.Math.FloatBetween(0.4, 1));
    this.add.circle(CX + 140, 50, 12, 0x3a7bd5); this.add.circle(CX + 136, 46, 4, 0x5bb36a);
    // floor, bed, desk
    this.add.rectangle(CX, GAME_HEIGHT - 40, GAME_WIDTH, 80, 0x2a2546);
    this.add.rectangle(90, 150, 90, 40, 0x3f3a66).setStrokeStyle(2, 0x1a1c20); // bed
    this.add.rectangle(90, 142, 86, 18, 0x7fa0d8); // blanket
    this.add.rectangle(60, 138, 22, 10, 0xf4f1e8); // pillow
    this.add.rectangle(CX + 10, 150, 70, 8, 0x4b4470).setStrokeStyle(1, 0x1a1c20); // desk top
    this.add.rectangle(CX - 20, 165, 6, 22, 0x4b4470); this.add.rectangle(CX + 40, 165, 6, 22, 0x4b4470);
    const screen = this.add.rectangle(CX + 10, 126, 54, 34, 0x11141c).setStrokeStyle(2, 0x8e6bbf);
    const glow = this.add.rectangle(CX + 10, 126, 60, 40, 0x8e6bbf, 0.08);
    this.tweens.add({ targets: glow, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
    const alien = this.add.image(CX - 30, 166, 'alien').setScale(2).setOrigin(0.5, 1);
    this.caption = this.add.text(CX, 16, 'Home. Somewhere far away.', { fontFamily: 'monospace', fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5);
    await this.fade(false);
    await this.wait(900);

    // Close up on the screen: zoom the camera onto it, type the letter.
    await this.tween({ targets: this.cameras.main, zoom: 2.6, scrollX: screen.x - CX, scrollY: screen.y - CY + 10, duration: 1200, ease: 'Sine.easeInOut' });
    const lines = content.intro.letter;
    const letter = this.add.text(screen.x - 24, screen.y - 14, '', { fontFamily: 'monospace', fontSize: '4px', color: '#d9b8ff', lineSpacing: 1, wordWrap: { width: 50 } }).setResolution(4);
    const full = lines.join('\n');
    for (let i = 1; i <= full.length; i++) {
      letter.setText(full.slice(0, i));
      if (this.skip) break;
      await this.wait(22);
    }
    this.skip = false;
    await this.wait(1400);

    // Back out, lights down, sleep.
    await this.tween({ targets: this.cameras.main, zoom: 1, scrollX: 0, scrollY: 0, duration: 900, ease: 'Sine.easeInOut' });
    letter.destroy();
    await this.tween({ targets: alien, x: 86, y: 150, duration: 900, ease: 'Sine.easeInOut' });
    alien.setScale(2, 1.2);
    const dark = this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0);
    const zz = this.add.text(104, 120, 'z z z', { fontFamily: 'monospace', fontSize: '8px', color: '#9aa3b2' });
    this.tweens.add({ targets: zz, y: 108, alpha: 0.2, duration: 1400, repeat: -1 });
    await this.tween({ targets: dark, alpha: 0.75, duration: 900 });
    await this.wait(1200);
    await this.fade(true);
  }

  // ---------- 2. card ----------
  private async card(text: string): Promise<void> {
    this.clear();
    this.cameras.main.setZoom(1).setScroll(0, 0);
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000);
    this.add.text(CX, CY, text, { fontFamily: 'monospace', fontSize: '12px', color: '#f4f1e8' }).setOrigin(0.5);
    await this.fade(false, 200);
    await this.wait(1400);
    await this.fade(true, 300);
  }

  // ---------- 3. university ----------
  private async university(): Promise<void> {
    this.clear();
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x24203a);
    this.stars(30, 70);
    // hall: floor, columns, a sign
    this.add.rectangle(CX, GAME_HEIGHT - 45, GAME_WIDTH, 90, 0x3a3560);
    this.add.rectangle(CX, GAME_HEIGHT - 90, GAME_WIDTH, 2, 0x8e6bbf);
    for (const x of [40, 140, 340, 440]) { this.add.rectangle(x, 110, 18, 150, 0x4b4470).setStrokeStyle(2, 0x1a1c20); this.add.rectangle(x, 40, 26, 8, 0x5c5590); }
    this.add.rectangle(CX, 50, 220, 30, 0x11141c).setStrokeStyle(2, 0x8e6bbf);
    this.add.text(CX, 44, content.intro.university.toUpperCase(), { fontFamily: 'monospace', fontSize: '9px', color: '#d9b8ff' }).setOrigin(0.5);
    this.add.text(CX, 57, 'Earthology Department', { fontFamily: 'monospace', fontSize: '7px', color: '#9aa3b2' }).setOrigin(0.5);
    const prof = this.add.image(CX + 40, 178, 'alien.teacher').setScale(2.5).setOrigin(0.5, 1);
    const you = this.add.image(-20, 178, 'alien').setScale(2.5).setOrigin(0.5, 1);
    await this.fade(false);
    await this.tween({ targets: you, x: CX - 40, duration: 1600, ease: 'Sine.easeOut' });
    await this.wait(300);
    await this.talk(content.intro.meet);
    // She summons the ship: it drops in from above and lands beside you.
    const ship = this.add.image(CX - 120, -40, 'ship').setScale(2);
    this.cameras.main.shake(150, 0.003);
    await this.tween({ targets: ship, y: 160, duration: 900, ease: 'Bounce.easeOut' });
    await this.wait(300);
    await this.tween({ targets: [you, prof], x: CX - 120, alpha: 0, duration: 700, ease: 'Sine.easeIn' });
    await this.tween({ targets: ship, y: -60, x: CX - 160, duration: 700, ease: 'Sine.easeIn' });
    await this.fade(true, 150);
  }

  // ---------- 4. warp ----------
  private async warp(): Promise<void> {
    this.clear();
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000);
    const streaks: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < 40; i++) {
      const s = this.add.rectangle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.Between(20, 90), 1, 0xf4f1e8, Phaser.Math.FloatBetween(0.3, 0.9));
      streaks.push(s);
      this.tweens.add({ targets: s, x: s.x - 700, duration: Phaser.Math.Between(300, 700), repeat: -1, onRepeat: () => { s.x = GAME_WIDTH + 100; s.y = Phaser.Math.Between(0, GAME_HEIGHT); } });
    }
    this.add.text(CX, GAME_HEIGHT - 20, '(fast. very fast.)', { fontFamily: 'monospace', fontSize: '7px', color: '#5c6577' }).setOrigin(0.5);
    this.cameras.main.fadeIn(100, 0, 0, 0);
    await this.wait(1700);
    this.cameras.main.flash(300, 255, 255, 255);
    await this.wait(300);
  }

  // ---------- 5. arrival ----------
  private async arrival(): Promise<void> {
    this.clear();
    this.cameras.main.resetFX();
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14);
    this.stars(40, 170);
    this.add.rectangle(CX, GAME_HEIGHT - 30, GAME_WIDTH, 60, 0x1f2a1a);
    this.add.rectangle(CX, GAME_HEIGHT - 58, GAME_WIDTH, 4, 0x2e3137);
    this.add.image(CX + 90, GAME_HEIGHT - 76, 'ship').setScale(2);
    this.add.image(CX - 10, GAME_HEIGHT - 58, 'alien').setScale(2.5).setOrigin(0.5, 1);
    this.add.image(CX + 30, GAME_HEIGHT - 58, 'alien.teacher').setScale(2.5).setOrigin(0.5, 1);
    this.caption = this.add.text(CX, 16, 'Night. Cold. Smells of salt.', { fontFamily: 'monospace', fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5);
    await this.wait(500);
    await this.talk(content.intro.arrival);
  }

  // ---------- 6. pull back to the planet, title card ----------
  private async pullBack(): Promise<void> {
    // Shot A: the island from above.
    await this.fade(true, 400);
    this.clear();
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x1d3f5c);
    const island = this.add.graphics();
    island.fillStyle(0x7d9150, 1);
    const outline: [number, number][] = [
      [CX - 90, CY - 10], [CX - 60, CY - 45], [CX - 10, CY - 55], [CX + 40, CY - 50], [CX + 85, CY - 25],
      [CX + 95, CY + 10], [CX + 60, CY + 45], [CX + 10, CY + 55], [CX - 50, CY + 45], [CX - 95, CY + 20],
    ];
    island.fillPoints(outline.map(([x, y]) => new Phaser.Math.Vector2(x, y)), true);
    island.fillStyle(0xdfe9ee, 1); island.fillCircle(CX + 20, CY - 5, 22); // ice cap
    island.fillStyle(0x2e3137, 1); island.fillCircle(CX - 40, CY + 10, 9); island.fillCircle(CX + 55, CY + 20, 7); // lava fields
    const dot = this.add.circle(CX - 70, CY + 25, 3, 0xffd37a).setStrokeStyle(1, 0x1a1c20);
    this.tweens.add({ targets: dot, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    this.add.text(CX - 70, CY + 34, 'you', { fontFamily: 'monospace', fontSize: '7px', color: '#f4f1e8' }).setOrigin(0.5);
    this.cameras.main.setZoom(1.6);
    await this.fade(false, 400);
    await this.tween({ targets: this.cameras.main, zoom: 1, duration: 1800, ease: 'Sine.easeInOut' });
    await this.fade(true, 400);

    // Shot B: the whole planet, and the title.
    this.clear();
    this.cameras.main.setZoom(1);
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14);
    this.stars(70);
    const planet = this.add.circle(CX, CY - 10, 48, 0x3a7bd5);
    this.add.circle(CX - 18, CY - 26, 15, 0x5bb36a); this.add.circle(CX + 20, CY + 4, 11, 0x5bb36a); this.add.circle(CX - 6, CY + 22, 7, 0x5bb36a);
    this.add.circle(CX + 8, CY - 44, 5, 0xdfe9ee);
    this.tweens.add({ targets: planet, y: planet.y - 3, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const title = this.add.text(CX, CY + 62, content.intro.titleCard.title, { fontFamily: 'monospace', fontSize: '26px', color: '#f4f1e8' }).setOrigin(0.5).setAlpha(0);
    const sub = this.add.text(CX, CY + 86, content.intro.titleCard.sub, { fontFamily: 'monospace', fontSize: '9px', color: '#9aa3b2' }).setOrigin(0.5).setAlpha(0);
    this.cameras.main.setZoom(0.5);
    await this.fade(false, 300);
    await this.tween({ targets: this.cameras.main, zoom: 1, duration: 1600, ease: 'Sine.easeOut' });
    await this.tween({ targets: [title, sub], alpha: 1, duration: 700 });
    (window as unknown as { __debug: Record<string, unknown> }).__debug.introTitle = true;
    await this.wait(2200);
    await this.fade(true, 500);
  }

  // ---------- 7. cabin ----------
  private async cabin(): Promise<void> {
    this.clear();
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x141826);
    this.add.rectangle(CX, 46, 150, 58, 0x1a1030).setStrokeStyle(2, 0x8e6bbf);
    this.add.text(CX, 24, 'SHIP  ·  CABIN', { fontFamily: 'monospace', fontSize: '8px', color: '#8e6bbf' }).setOrigin(0.5);
    this.add.rectangle(CX, 158, 200, 6, 0x2a3044);
    this.add.image(CX + 50, 156, 'alien.teacher').setScale(3).setOrigin(0.5, 1);
    this.figure = this.add.image(CX - 30, 156, 'alien').setScale(3).setOrigin(0.5, 1);
    this.caption = this.add.text(CX, 170, 'You. Before the disguise.', { fontFamily: 'monospace', fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5);
    await this.fade(false, 300);
    await this.wait(300);
    await this.talk(content.intro.cabin, (id) => this.wearDisguise(id));
    this.leave();
  }

  private wearDisguise(id: string): void {
    state.disguise = id;
    makePlaceholderPlayer(this, `player.${id}`, DISGUISES[id]);
    this.figure.setTexture(`player.${id}`, 'down0').setScale(3);
    this.caption.setText(content.intro.disguises[id].describe);
    this.cameras.main.flash(200, 255, 255, 255, false);
  }

  private leave(): void {
    if (!state.disguise) state.disguise = Object.keys(content.intro.disguises)[0];
    state.introDone = true;
    saveNow();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('World', { firstWalk: true }));
  }
}
