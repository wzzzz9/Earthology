import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/** M1 placeholder title screen. Proves the build and deploy pipeline works. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // A small "planet" so there is something on screen besides text.
    const planet = this.add.circle(cx, cy - 40, 28, 0x3a7bd5);
    const land1 = this.add.circle(cx - 10, cy - 48, 9, 0x5bb36a);
    const land2 = this.add.circle(cx + 12, cy - 32, 6, 0x5bb36a);
    this.tweens.add({
      targets: [planet, land1, land2],
      y: '-=4',
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(cx, cy + 10, 'MOON FIELD', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#f4f1e8',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 36, 'Assignment: survey planet EaRtH20934', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9aa3b2',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, GAME_HEIGHT - 40, 'Press Enter to land', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f4f1e8',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.add
      .text(cx, GAME_HEIGHT - 16, 'Arrows or WASD to walk', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#5c6577',
      })
      .setOrigin(0.5);

    const start = () => this.scene.start('World');
    this.input.keyboard!.once('keydown-ENTER', start);
    this.input.keyboard!.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
