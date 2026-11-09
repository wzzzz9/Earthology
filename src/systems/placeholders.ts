import Phaser from 'phaser';

/**
 * Placeholder art drawn at runtime, so M2 needs no image files.
 * Replaced by real tiles and sprites in the art milestone (M9).
 */

export const TILE = 16;

/** 8 tiles in a row: grass, grass2, path, water, rock, moss rock, sand, dark. */
export function makePlaceholderTileset(scene: Phaser.Scene, key = 'placeholder'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, TILE * 8, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  const fill = (i: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * TILE, 0, TILE, TILE);
  };
  const dots = (i: number, color: string, pts: [number, number][]) => {
    ctx.fillStyle = color;
    for (const [x, y] of pts) ctx.fillRect(i * TILE + x, y, 2, 2);
  };
  fill(0, '#4f8a3a'); dots(0, '#5e9c46', [[3, 4], [10, 9], [6, 12]]);
  fill(1, '#4a8236'); dots(1, '#3f7430', [[2, 10], [9, 3], [12, 12]]);
  fill(2, '#b08a5a'); dots(2, '#9c7849', [[4, 6], [11, 11], [7, 13]]);
  fill(3, '#3b78c2'); dots(3, '#5f97d8', [[2, 5], [9, 10], [12, 3]]);
  fill(4, '#4f8a3a'); // rock on grass
  ctx.fillStyle = '#6b6f78'; ctx.fillRect(4 * TILE + 2, 3, 12, 11);
  ctx.fillStyle = '#8a8f99'; ctx.fillRect(4 * TILE + 4, 4, 6, 4);
  ctx.fillStyle = '#454851'; ctx.fillRect(4 * TILE + 3, 12, 11, 2);
  fill(5, '#4f8a3a'); // moss rock
  ctx.fillStyle = '#5f6a5a'; ctx.fillRect(5 * TILE + 2, 3, 12, 11);
  ctx.fillStyle = '#7fa060'; ctx.fillRect(5 * TILE + 3, 4, 7, 3);
  ctx.fillStyle = '#3e463a'; ctx.fillRect(5 * TILE + 3, 12, 11, 2);
  fill(6, '#d9c79a'); dots(6, '#c9b586', [[5, 5], [10, 11]]);
  fill(7, '#1a1c22');
  tex.refresh();
}

/**
 * Player spritesheet: 4 directions x 2 frames (idle, step), 16x24 each.
 * Frame order: down0, down1, up0, up1, left0, left1, right0, right1.
 * This is the human disguise; it's a simple figure for now.
 */
export const PLAYER_W = 16;
export const PLAYER_H = 24;

export function makePlaceholderPlayer(scene: Phaser.Scene, key = 'player'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, PLAYER_W * 8, PLAYER_H);
  if (!tex) return;
  const ctx = tex.getContext();
  const dirs = ['down', 'up', 'left', 'right'] as const;
  dirs.forEach((dir, d) => {
    for (let step = 0; step < 2; step++) {
      const i = d * 2 + step;
      const ox = i * PLAYER_W;
      const bob = step === 1 ? 1 : 0;
      // coat
      ctx.fillStyle = '#c95b3a';
      ctx.fillRect(ox + 4, 10 + bob, 8, 9);
      // legs
      ctx.fillStyle = '#2d3140';
      ctx.fillRect(ox + 4, 19, 3, 5 - bob);
      ctx.fillRect(ox + 9, 19, 3, 5 - bob);
      if (step === 1) ctx.fillRect(ox + 4, 22, 3, 2);
      // head
      ctx.fillStyle = '#f0c8a0';
      ctx.fillRect(ox + 4, 2 + bob, 8, 8);
      // hat (the disguise)
      ctx.fillStyle = '#3a3f55';
      ctx.fillRect(ox + 3, 1 + bob, 10, 3);
      ctx.fillRect(ox + 5, 0 + bob, 6, 2);
      // eyes depend on direction
      ctx.fillStyle = '#1a1c22';
      if (dir === 'down') { ctx.fillRect(ox + 5, 6 + bob, 2, 2); ctx.fillRect(ox + 9, 6 + bob, 2, 2); }
      if (dir === 'left') { ctx.fillRect(ox + 4, 6 + bob, 2, 2); }
      if (dir === 'right') { ctx.fillRect(ox + 10, 6 + bob, 2, 2); }
      // up: no eyes (back of head), show hair
      if (dir === 'up') { ctx.fillStyle = '#5a3a24'; ctx.fillRect(ox + 4, 4 + bob, 8, 4); }
      tex.add(`${dir}${step}`, 0, ox, 0, PLAYER_W, PLAYER_H);
    }
  });
  tex.refresh();
}
