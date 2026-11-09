import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { content } from '../content';
import type { IntroLine } from '../content/types';
import { state } from '../systems/state';
import { bus, EV } from '../systems/events';
import { makePlaceholderShip, makeAlienTrueForm, makeAlienTeacher, makePlaceholderPlayer, DISGUISES, drawEarth } from '../systems/placeholders';
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

  /** Soft dark edges so each shot reads like a framed picture. */
  private vignette(alpha = 0.35): void {
    const g = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      g.lineStyle(10, 0x000000, (alpha / 6) * (6 - i) * 0.5);
      g.strokeRect(i * 8 - 5, i * 8 - 5, GAME_WIDTH - i * 16 + 10, GAME_HEIGHT - i * 16 + 10);
    }
    g.setDepth(900);
  }

  /** Northern lights: slow wavy translucent bands. */
  private aurora(y: number): void {
    const colors = [0x5fc4b0, 0x8fd98a, 0x7fb3e6];
    colors.forEach((c, i) => {
      const band = this.add.graphics();
      const draw = (phase: number) => {
        band.clear();
        band.fillStyle(c, 0.16);
        for (let x = 0; x < GAME_WIDTH; x += 6) {
          const h = 26 + Math.sin(x / 38 + phase + i) * 10;
          const yy = y + i * 14 + Math.sin(x / 55 + phase * 0.7) * 8;
          band.fillRect(x, yy - h, 6, h);
        }
      };
      let t = i * 1.3;
      draw(t);
      this.time.addEvent({ delay: 60, loop: true, callback: () => { t += 0.035; draw(t); } });
    });
  }

  /** Two layers of hills along the bottom. */
  private hills(baseY: number, front = 0x1f2a1a, back = 0x16211a): void {
    const g = this.add.graphics();
    g.fillStyle(back, 1);
    for (let x = 0; x <= GAME_WIDTH; x += 4) g.fillRect(x, baseY - 26 - Math.sin(x / 70) * 12 - Math.sin(x / 23) * 4, 4, 60);
    g.fillStyle(front, 1);
    for (let x = 0; x <= GAME_WIDTH; x += 4) g.fillRect(x, baseY - 10 - Math.sin(x / 45 + 2) * 8, 4, 60);
  }

  /** A hazy nebula made of soft overlapping circles. */
  private nebula(x: number, y: number, r: number, color: number): void {
    for (let i = 0; i < 7; i++) this.add.circle(x + Phaser.Math.Between(-r, r) * 0.6, y + Phaser.Math.Between(-r, r) * 0.4, r * Phaser.Math.FloatBetween(0.4, 0.9), color, 0.07);
  }

  private stars(count = 50, maxY = GAME_HEIGHT): void {
    for (let i = 0; i < count; i++) {
      this.add.rectangle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, maxY), 1, 1, 0xf4f1e8, Phaser.Math.FloatBetween(0.3, 1));
    }
  }

  // ---------- 1. bedroom ----------
  private async bedroom(): Promise<void> {
    this.clear();
    // walls: two tones with a dado rail, and a floor with boards
    this.add.rectangle(CX, 80, GAME_WIDTH, 160, 0x241f3d);
    this.add.rectangle(CX, 150, GAME_WIDTH, 24, 0x2e2850);
    this.add.rectangle(CX, 138, GAME_WIDTH, 2, 0x4b4470);
    this.add.rectangle(CX, GAME_HEIGHT - 50, GAME_WIDTH, 100, 0x2a2546);
    for (let x = 0; x < GAME_WIDTH; x += 40) this.add.rectangle(x, GAME_HEIGHT - 50, 1, 100, 0x221d3a);
    // round window onto space, with a frame and a nebula
    const wx = CX + 120;
    const wy = 66;
    this.add.circle(wx, wy, 46, 0x4b4470);
    this.add.circle(wx, wy, 40, 0x0b0d14);
    this.nebula(wx - 10, wy + 6, 26, 0x8e6bbf);
    this.nebula(wx + 12, wy - 10, 18, 0x5fc4b0);
    for (let i = 0; i < 26; i++) {
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const d = Phaser.Math.FloatBetween(0, 36);
      this.add.rectangle(wx + Math.cos(a) * d, wy + Math.sin(a) * d, 1, 1, 0xf4f1e8, Phaser.Math.FloatBetween(0.4, 1));
    }
    drawEarth(this, wx + 18, wy - 12, 10);
    this.add.rectangle(wx, wy, 80, 2, 0x4b4470); this.add.rectangle(wx, wy, 2, 80, 0x4b4470);
    // hanging lamp with a warm glow
    this.add.rectangle(120, 20, 1, 30, 0x4b4470);
    this.add.triangle(120, 44, 0, 0, 24, 0, 12, -12, 0xd9b8ff).setOrigin(0.5, 0);
    const glow = this.add.circle(120, 70, 50, 0xffd37a, 0.07);
    this.tweens.add({ targets: glow, alpha: 0.12, duration: 1500, yoyo: true, repeat: -1 });
    // poster: a wanted-style Earth poster, because of course
    this.add.rectangle(200, 70, 44, 54, 0xe9e4d8).setStrokeStyle(2, 0x1a1c20);
    drawEarth(this, 200, 62, 13);
    this.add.text(200, 84, 'EARTH', { fontFamily: 'monospace', fontSize: '6px', color: '#1a1c20' }).setOrigin(0.5);
    // shelf with books and a plant
    this.add.rectangle(330, 100, 70, 4, 0x4b4470);
    for (const [i, c] of [0xe2673f, 0x5fc4b0, 0xffd37a, 0x8e6bbf, 0x4f7fb8].entries()) this.add.rectangle(302 + i * 9, 90, 7, 16, c).setStrokeStyle(1, 0x1a1c20);
    this.add.rectangle(356, 92, 10, 10, 0xb5451b).setStrokeStyle(1, 0x1a1c20); this.add.circle(356, 82, 7, 0x6f9a4a);
    // rug, bed, desk
    this.add.ellipse(CX - 40, GAME_HEIGHT - 42, 180, 36, 0x3f3a66);
    this.add.rectangle(90, 150, 90, 40, 0x3f3a66).setStrokeStyle(2, 0x1a1c20);
    this.add.rectangle(90, 142, 86, 18, 0x7fa0d8);
    this.add.rectangle(90, 150, 86, 2, 0x5f80b8);
    this.add.rectangle(60, 138, 22, 10, 0xf4f1e8).setStrokeStyle(1, 0x1a1c20);
    this.add.rectangle(CX + 10, 150, 70, 8, 0x4b4470).setStrokeStyle(1, 0x1a1c20);
    this.add.rectangle(CX - 20, 165, 6, 22, 0x4b4470); this.add.rectangle(CX + 40, 165, 6, 22, 0x4b4470);
    this.add.rectangle(CX + 36, 142, 10, 6, 0xffd37a).setStrokeStyle(1, 0x1a1c20); // a mug
    const screen = this.add.rectangle(CX + 10, 126, 54, 34, 0x11141c).setStrokeStyle(2, 0x8e6bbf);
    const sglow = this.add.rectangle(CX + 10, 126, 60, 40, 0x8e6bbf, 0.08);
    this.tweens.add({ targets: sglow, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
    const alien = this.add.image(CX - 30, 166, 'alien').setScale(2).setOrigin(0.5, 1);
    this.vignette();
    this.caption = this.add.text(CX, 14, 'Home. Somewhere far away.', { fontFamily: 'monospace', fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5).setDepth(950);
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
    // tall arched windows showing space
    for (const x of [90, CX, GAME_WIDTH - 90]) {
      this.add.rectangle(x, 70, 56, 66, 0x0b0d14).setStrokeStyle(3, 0x4b4470);
      this.add.circle(x, 38, 28, 0x0b0d14).setStrokeStyle(3, 0x4b4470);
      this.nebula(x, 60, 18, x === CX ? 0x5fc4b0 : 0x8e6bbf);
      for (let i = 0; i < 12; i++) this.add.rectangle(x + Phaser.Math.Between(-24, 24), Phaser.Math.Between(16, 100), 1, 1, 0xf4f1e8, Phaser.Math.FloatBetween(0.4, 1));
    }
    // chequered floor
    const floorY = GAME_HEIGHT - 120;
    for (let y = floorY; y < GAME_HEIGHT; y += 12) for (let x = 0; x < GAME_WIDTH; x += 12) {
      this.add.rectangle(x + 6, y + 6, 12, 12, ((x + y) / 12) % 2 === 0 ? 0x3a3560 : 0x332e55);
    }
    this.add.rectangle(CX, floorY, GAME_WIDTH, 3, 0x8e6bbf);
    // columns with capitals, banners between them, plants at their feet
    for (const x of [40, 140, 340, 440]) {
      this.add.rectangle(x, 80, 18, 140, 0x4b4470).setStrokeStyle(2, 0x1a1c20);
      this.add.rectangle(x, 12, 26, 8, 0x5c5590).setStrokeStyle(1, 0x1a1c20);
      this.add.rectangle(x - 4, 80, 3, 140, 0x5c5590, 0.6);
    }
    for (const x of [190, 290]) {
      this.add.rectangle(x, 44, 22, 56, 0x6e55a8).setStrokeStyle(2, 0x1a1c20);
      this.add.triangle(x, 72, 0, 0, 22, 0, 11, 10, 0x6e55a8).setOrigin(0.5, 0);
      this.add.circle(x, 40, 6, 0xffd37a);
    }
    for (const x of [62, 418]) { this.add.rectangle(x, floorY - 8, 14, 14, 0xb5451b).setStrokeStyle(1, 0x1a1c20); this.add.circle(x, floorY - 22, 10, 0x6f9a4a); this.add.circle(x - 6, floorY - 16, 6, 0x5fc4b0); }
    // the sign, above the floor line
    this.add.rectangle(CX, 118, 220, 30, 0x11141c).setStrokeStyle(2, 0x8e6bbf);
    this.add.text(CX, 112, content.intro.university.toUpperCase(), { fontFamily: 'monospace', fontSize: '9px', color: '#d9b8ff' }).setOrigin(0.5);
    this.add.text(CX, 125, 'Earthology Department', { fontFamily: 'monospace', fontSize: '7px', color: '#9aa3b2' }).setOrigin(0.5);
    this.vignette(0.25);
    const prof = this.add.image(CX + 40, GAME_HEIGHT - 76, 'alien.teacher').setScale(2.2).setOrigin(0.5, 1);
    const you = this.add.image(-20, GAME_HEIGHT - 76, 'alien').setScale(2.2).setOrigin(0.5, 1);
    await this.fade(false);
    await this.tween({ targets: you, x: CX - 40, duration: 1600, ease: 'Sine.easeOut' });
    await this.wait(300);
    await this.talk(content.intro.meet);
    // She summons the ship: it drops in from above and lands beside you.
    const ship = this.add.image(CX - 120, -40, 'ship').setScale(2);
    this.cameras.main.shake(150, 0.003);
    await this.tween({ targets: ship, y: GAME_HEIGHT - 96, duration: 900, ease: 'Bounce.easeOut' });
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
    this.stars(60, 170);
    this.aurora(110);
    this.add.circle(GAME_WIDTH - 70, 40, 14, 0xe6edf0); this.add.circle(GAME_WIDTH - 76, 36, 11, 0x0b0d14, 0.0); // moon
    // far mountains with snow, then hills, then the dark foreground
    const m = this.add.graphics();
    m.fillStyle(0x2e3137, 1);
    for (let x = 0; x <= GAME_WIDTH; x += 4) m.fillRect(x, 165 - Math.abs(Math.sin(x / 90)) * 55 - Math.sin(x / 17) * 3, 4, 60);
    m.fillStyle(0xdfe9ee, 1);
    for (let x = 0; x <= GAME_WIDTH; x += 4) { const top = 165 - Math.abs(Math.sin(x / 90)) * 55 - Math.sin(x / 17) * 3; if (top < 125) m.fillRect(x, top, 4, Math.min(8, 125 - top)); }
    this.hills(GAME_HEIGHT - 96);
    this.add.rectangle(CX, GAME_HEIGHT - 48, GAME_WIDTH, 96, 0x151c12);
    for (let i = 0; i < 30; i++) this.add.rectangle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(GAME_HEIGHT - 90, GAME_HEIGHT), 3, 1, 0x1f2a1a);
    // lake glint on the right
    this.add.ellipse(GAME_WIDTH - 110, GAME_HEIGHT - 90, 120, 12, 0x3a6f8a);
    this.add.ellipse(GAME_WIDTH - 110, GAME_HEIGHT - 90, 90, 5, 0x5fc4b0, 0.25);
    // the ship with landing lights
    const ship = this.add.image(CX + 100, GAME_HEIGHT - 110, 'ship').setScale(2);
    const light = this.add.circle(ship.x, GAME_HEIGHT - 92, 36, 0xffd37a, 0.08);
    this.tweens.add({ targets: light, alpha: 0.16, duration: 700, yoyo: true, repeat: -1 });
    this.add.image(CX - 10, GAME_HEIGHT - 80, 'alien').setScale(2.5).setOrigin(0.5, 1);
    this.add.image(CX + 30, GAME_HEIGHT - 80, 'alien.teacher').setScale(2.5).setOrigin(0.5, 1);
    this.vignette(0.3);
    this.caption = this.add.text(CX, 14, 'Night. Cold. Smells of salt.', { fontFamily: 'monospace', fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5).setDepth(950);
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
    // sea texture and a foam line along the coast
    const sea = this.add.graphics();
    sea.lineStyle(1, 0x3f6f8f, 0.6);
    for (let i = 0; i < 40; i++) { const sx = Phaser.Math.Between(0, GAME_WIDTH); const sy = Phaser.Math.Between(0, GAME_HEIGHT); sea.lineBetween(sx, sy, sx + Phaser.Math.Between(6, 16), sy); }
    island.lineStyle(2, 0xdfe9ee, 0.5);
    island.strokePoints(outline.map(([x, y]) => new Phaser.Math.Vector2(x, y)), true);
    this.cameras.main.setZoom(1.6);
    await this.fade(false, 400);
    await this.tween({ targets: this.cameras.main, zoom: 1, duration: 1800, ease: 'Sine.easeInOut' });
    await this.fade(true, 400);

    // Shot B: the whole planet, and the title.
    this.clear();
    this.cameras.main.setZoom(1);
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14);
    this.stars(70);
    this.nebula(CX - 150, CY - 60, 60, 0x8e6bbf);
    this.nebula(CX + 160, CY + 40, 50, 0x5fc4b0);
    const planet = drawEarth(this, CX, CY - 10, 52);
    const moon = this.add.circle(CX + 96, CY - 54, 9, 0xb9bec8); this.add.circle(CX + 93, CY - 57, 3, 0xd9dde3); this.add.circle(CX + 99, CY - 50, 2, 0x8a8f99);
    void moon;
    this.vignette(0.25);
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
    // riveted wall panels
    for (let x = 0; x < GAME_WIDTH; x += 60) {
      this.add.rectangle(x + 30, 80, 56, 150, 0x1a2032).setStrokeStyle(1, 0x2a3044);
      for (const y of [12, 148]) { this.add.rectangle(x + 6, y, 2, 2, 0x3a4560); this.add.rectangle(x + 54, y, 2, 2, 0x3a4560); }
    }
    this.add.rectangle(CX, 158, GAME_WIDTH, 6, 0x2a3044);
    this.add.rectangle(CX, GAME_HEIGHT - 55, GAME_WIDTH, 110, 0x10141f);
    for (let x = 0; x < GAME_WIDTH; x += 24) this.add.rectangle(x, GAME_HEIGHT - 55, 1, 110, 0x182033);
    // porthole onto the night field with aurora
    this.add.circle(90, 70, 38, 0x3a4560);
    this.add.circle(90, 70, 32, 0x0b0d14);
    const g = this.add.graphics();
    g.fillStyle(0x5fc4b0, 0.18); g.fillEllipse(90, 60, 50, 10); g.fillStyle(0x8fd98a, 0.14); g.fillEllipse(84, 66, 40, 8);
    g.fillStyle(0x1f2a1a, 1); g.fillEllipse(90, 92, 60, 24);
    for (let i = 0; i < 10; i++) this.add.rectangle(90 + Phaser.Math.Between(-26, 26), 70 + Phaser.Math.Between(-26, -6), 1, 1, 0xf4f1e8);
    // console with blinking lights, a bunk, the communicator screen
    this.add.rectangle(CX + 150, 140, 90, 30, 0x1f2838).setStrokeStyle(1, 0x3a4560);
    for (let i = 0; i < 6; i++) {
      const l = this.add.rectangle(CX + 115 + i * 14, 134, 6, 4, [0xffd37a, 0x5fc4b0, 0xe2673f][i % 3]);
      this.tweens.add({ targets: l, alpha: 0.2, duration: 400 + i * 170, yoyo: true, repeat: -1 });
    }
    this.add.rectangle(CX + 150, 146, 70, 8, 0x3a4560);
    this.add.rectangle(60, 140, 80, 26, 0x2a3044).setStrokeStyle(1, 0x3a4560); this.add.rectangle(60, 132, 76, 10, 0x4f7fb8); // bunk
    this.add.rectangle(CX, 46, 150, 58, 0x1a1030).setStrokeStyle(2, 0x8e6bbf);
    this.add.text(CX, 24, 'SHIP  ·  CABIN', { fontFamily: 'monospace', fontSize: '8px', color: '#8e6bbf' }).setOrigin(0.5);
    this.add.text(CX, 46, 'EaRtH20934  ·  local time: night', { fontFamily: 'monospace', fontSize: '7px', color: '#9aa3b2' }).setOrigin(0.5);
    this.add.image(CX + 50, 156, 'alien.teacher').setScale(3).setOrigin(0.5, 1);
    this.figure = this.add.image(CX - 30, 156, 'alien').setScale(3).setOrigin(0.5, 1);
    this.vignette(0.3);
    this.caption = this.add.text(CX, 170, 'You. Before the disguise.', { fontFamily: 'monospace', fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5).setDepth(950);
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
