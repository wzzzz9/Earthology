import Phaser from 'phaser';
import { installAutosave, hasSave } from '../systems/save';
import { loadFonts } from '../ui/font';
import { makePortraits } from '../systems/placeholders';
import { sfx } from '../systems/sfx';
import { bus, EV } from '../systems/events';

/** Loads assets and content, then hands off to the title screen. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.tilemapTiledJSON('map.iceland', 'assets/maps/iceland.json');
  }

  create(): void {
    installAutosave();
    makePortraits(this);
    (window as unknown as { __debug: Record<string, unknown> }).__debug ??= {};
    sfx.install((on) => bus.emit(EV.toast, on ? 'Sound on' : 'Sound off (0 toggles)'));
    // Text objects measure their font when created, so the pixel fonts must be in before any scene starts.
    void loadFonts().then(() => this.scene.start(hasSave() ? 'Title' : 'Intro'));
  }
}
