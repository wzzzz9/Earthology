import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { DialogueScene } from './scenes/DialogueScene';
import { HudScene } from './scenes/HudScene';
import { NotebookScene } from './scenes/NotebookScene';
import { LabScene } from './scenes/LabScene';
import { SubmitScene } from './scenes/SubmitScene';
import { IntroScene } from './scenes/IntroScene';
import { MapScene } from './scenes/MapScene';
import { NameScene } from './scenes/NameScene';
import { FloodScene } from './scenes/FloodScene';

// Every game pixel must cover a whole number of *device* pixels, or the browser smears them.
// Windows/Mac display scaling makes a CSS pixel 1.25 or 1.5 device pixels, so the zoom is
// computed in device pixels and converted back (it may be a fraction in CSS units).
const bestZoom = () => {
  const dpr = window.devicePixelRatio || 1;
  const z = Math.floor(Math.min((window.innerWidth * dpr) / (GAME_WIDTH * RENDER_SCALE), (window.innerHeight * dpr) / (GAME_HEIGHT * RENDER_SCALE)));
  return Math.max(1, z) / dpr;
};

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH * RENDER_SCALE,
  height: GAME_HEIGHT * RENDER_SCALE,
  pixelArt: true,
  backgroundColor: '#0b0d14',
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: bestZoom(),
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, TitleScene, IntroScene, WorldScene, MapScene, HudScene, DialogueScene, NotebookScene, LabScene, SubmitScene, NameScene, FloodScene],
});

window.addEventListener('resize', () => game.scale.setZoom(bestZoom()));
