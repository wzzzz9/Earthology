import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { state } from '../systems/state';
import { bus, EV } from '../systems/events';

/** Always-on overlay: day counter, notebook count, and toasts. */
export class HudScene extends Phaser.Scene {
  private dayText!: Phaser.GameObjects.Text;
  private bookText!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private toastQueue: string[] = [];
  private toastBusy = false;

  constructor() {
    super('Hud');
  }

  create(): void {
    const style = { fontFamily: 'monospace', fontSize: '9px', color: '#f4f1e8', backgroundColor: '#11141cdd', padding: { x: 4, y: 2 } };
    this.dayText = this.add.text(6, 6, '', style);
    this.bookText = this.add.text(GAME_WIDTH - 6, 6, '', style).setOrigin(1, 0);
    this.toast = this.add
      .text(GAME_WIDTH / 2, 26, '', { ...style, color: '#ffd37a', wordWrap: { width: GAME_WIDTH - 40 }, align: 'center' })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    this.refresh();
    bus.on(EV.stateChanged, this.refresh, this);
    bus.on(EV.toast, this.enqueue, this);
    this.events.once('shutdown', () => {
      bus.off(EV.stateChanged, this.refresh, this);
      bus.off(EV.toast, this.enqueue, this);
    });
  }

  private refresh(): void {
    this.dayText.setText(`Day ${state.day}`);
    this.bookText.setText(`Notebook ${state.notebook.length}`);
  }

  private enqueue(msg: string): void {
    this.toastQueue.push(msg);
    if (!this.toastBusy) this.nextToast();
  }

  private nextToast(): void {
    const msg = this.toastQueue.shift();
    if (!msg) {
      this.toastBusy = false;
      return;
    }
    this.toastBusy = true;
    this.toast.setText(msg).setAlpha(1);
    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: this.toast, alpha: 0, duration: 250, onComplete: () => this.nextToast() });
    });
  }
}
