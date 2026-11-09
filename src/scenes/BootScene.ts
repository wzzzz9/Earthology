import Phaser from 'phaser';
import { installAutosave, hasSave } from '../systems/save';

/** Loads assets and content, then hands off to the title screen. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.tilemapTiledJSON('map.test-field', 'assets/maps/test-field.json');
  }

  create(): void {
    installAutosave();
    (window as unknown as { __debug: Record<string, unknown> }).__debug ??= {};
    this.scene.start(hasSave() ? 'Title' : 'Intro');
  }
}
