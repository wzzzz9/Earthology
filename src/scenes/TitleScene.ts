import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { hasSave, peekSave, loadSave, clearSave } from '../systems/save';
import { state } from '../systems/state';
import { drawEarth } from '../systems/placeholders';

/** M1 placeholder title screen. Proves the build and deploy pipeline works. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // A small "planet" so there is something on screen besides text.
    for (let i = 0; i < 40; i++) this.add.rectangle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), 1, 1, 0xf4f1e8, Phaser.Math.FloatBetween(0.3, 1));
    const planet = drawEarth(this, cx, cy - 40, 30);
    this.tweens.add({
      targets: planet,
      y: '-=4',
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(cx, cy + 10, 'EARTHOLOGY', {
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

    const save = hasSave() ? peekSave() : null;
    const prompt = this.add
      .text(cx, GAME_HEIGHT - 40, save ? `Enter: continue (Day ${save.day})` : 'Press Enter to land', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f4f1e8',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.add
      .text(cx, GAME_HEIGHT - 16, save ? 'X: start a new game (deletes the save)' : 'Arrows or WASD to walk', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#5c6577',
      })
      .setOrigin(0.5);

    const start = () => {
      if (save) loadSave();
      this.scene.start(save && state.introDone ? 'World' : 'Intro');
    };
    const fresh = () => {
      clearSave();
      state.reset();
      this.scene.start('Intro');
    };
    this.input.keyboard!.once('keydown-ENTER', start);
    this.input.keyboard!.once('keydown-SPACE', start);
    this.input.keyboard!.once('keydown-X', fresh);
    this.input.once('pointerdown', start);
  }
}
