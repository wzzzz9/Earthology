import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE } from '../config';

/** Zooms a scene's camera so the 480x270 game fills the double-resolution canvas. Call first in create(). */
export function hiRes(scene: Phaser.Scene): Phaser.Cameras.Scene2D.Camera {
  return scene.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
}
