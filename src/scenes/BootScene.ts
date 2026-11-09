import Phaser from 'phaser';

/** Loads assets and content, then hands off to the title screen. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.tilemapTiledJSON('map.test-field', 'assets/maps/test-field.json');
  }

  create(): void {
    this.scene.start('Title');
  }
}
