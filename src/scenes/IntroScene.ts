import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { content } from '../content';
import { state } from '../systems/state';
import { bus, EV } from '../systems/events';
import { makePlaceholderShip, makeAlienTrueForm, makePlaceholderPlayer, DISGUISES } from '../systems/placeholders';
import type { DialogueSource } from './DialogueScene';
import { saveNow } from '../systems/save';

/**
 * The landing. Ship descends over the field, cut to the cabin: the alien's true
 * form, the teacher's call (assignment, notebook, submission), the disguise choice,
 * then out into the world.
 */
export class IntroScene extends Phaser.Scene {
  private figure!: Phaser.GameObjects.Image;
  private caption!: Phaser.GameObjects.Text;

  constructor() {
    super('Intro');
  }

  create(): void {
    makePlaceholderShip(this);
    makeAlienTrueForm(this);
    const cx = GAME_WIDTH / 2;

    // Night sky with a few stars, and a dark ground band.
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14);
    for (let i = 0; i < 40; i++) this.add.rectangle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, 180), 1, 1, 0xf4f1e8, Phaser.Math.FloatBetween(0.3, 1));
    this.add.rectangle(cx, GAME_HEIGHT - 30, GAME_WIDTH, 60, 0x1f2a1a);
    this.add.rectangle(cx, GAME_HEIGHT - 58, GAME_WIDTH, 4, 0x2e3137);

    const ship = this.add.image(cx, -30, 'ship').setScale(2);
    this.caption = this.add.text(cx, 20, 'EaRtH20934  ·  night', { fontFamily: 'monospace', fontSize: '9px', color: '#9aa3b2' }).setOrigin(0.5);

    this.tweens.add({
      targets: ship,
      y: GAME_HEIGHT - 76,
      duration: 2600,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.cameras.main.shake(200, 0.004);
        this.time.delayedCall(500, () => this.cabin());
      },
    });
    this.tweens.add({ targets: ship, x: cx + 6, duration: 700, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
  }

  private cabin(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.children.removeAll();
      const cx = GAME_WIDTH / 2;
      this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x141826);
      // Communicator screen on the cabin wall, you standing below it.
      this.add.rectangle(cx, 46, 150, 58, 0x1a1030).setStrokeStyle(2, 0x8e6bbf);
      this.add.text(cx, 24, 'INCOMING CALL', { fontFamily: 'monospace', fontSize: '8px', color: '#8e6bbf' }).setOrigin(0.5);
      this.add.rectangle(cx, 52, 24, 30, Phaser.Display.Color.HexStringToColor(content.teacher.color).color);
      this.add.text(cx, 52, 'L', { fontFamily: 'monospace', fontSize: '14px', color: '#f4f1e8' }).setOrigin(0.5);
      this.add.rectangle(cx, 158, 200, 6, 0x2a3044); // the cabin floor line
      this.figure = this.add.image(cx, 156, 'alien').setScale(3).setOrigin(0.5, 1);
      this.caption = this.add.text(cx, 170, 'You. Before the disguise.', { fontFamily: 'monospace', fontSize: '8px', color: '#9aa3b2' }).setOrigin(0.5);
      this.cameras.main.fadeIn(300, 0, 0, 0);
      this.time.delayedCall(400, () => this.call());
    });
  }

  private call(): void {
    const t = content.teacher;
    const intro = content.intro;
    let i = 0;
    let awaiting: 'disguise' | null = null;
    const ids = Object.keys(intro.disguises);
    const source: DialogueSource = {
      next: (choice?: number) => {
        if (awaiting === 'disguise' && choice !== undefined) {
          awaiting = null;
          this.wearDisguise(ids[Math.min(choice, ids.length - 1)]);
        }
        const page = intro.pages[i++];
        if (!page) return null;
        if (page.choice === 'disguise') awaiting = 'disguise';
        return {
          speaker: t.name,
          color: t.color,
          lines: page.lines,
          note: page.note,
          choices: page.choice === 'disguise' ? ids.map((id) => intro.disguises[id].label) : undefined,
        };
      },
    };
    const done = () => {
      bus.off(EV.dialogueClosed, done);
      this.leave();
    };
    bus.on(EV.dialogueClosed, done);
    this.scene.launch('Dialogue', { source });
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
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('World', { firstWalk: true });
    });
  }
}
