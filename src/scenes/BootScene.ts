import Phaser from 'phaser';

/** Loads assets and content, then hands off to the title screen. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Assets will be loaded here from public/assets/ in later milestones.
  }

  create(): void {
    this.scene.start('Title');
  }
}
