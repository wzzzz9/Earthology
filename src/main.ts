import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
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

// Whole-number zoom only: fractional scaling smears pixels and text.
const bestZoom = () => Math.max(1, Math.floor(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT)));

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
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
  scene: [BootScene, TitleScene, IntroScene, WorldScene, MapScene, HudScene, DialogueScene, NotebookScene, LabScene, SubmitScene, NameScene],
});

window.addEventListener('resize', () => game.scale.setZoom(bestZoom()));
