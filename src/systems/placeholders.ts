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

export function makePlaceholderPlayer(scene: Phaser.Scene, key = 'player', coat = '#c95b3a', hat = '#3a3f55'): void {
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
      ctx.fillStyle = coat;
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
      ctx.fillStyle = hat;
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

/** The ship: a grey saucer with a dome, 48x32. Home base, save point, sleep. */
export function makePlaceholderShip(scene: Phaser.Scene, key = 'ship'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 48, 32);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = '#8a8f99';
  ctx.beginPath(); ctx.ellipse(24, 22, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b9bec8';
  ctx.beginPath(); ctx.ellipse(24, 20, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7fd1e8';
  ctx.beginPath(); ctx.ellipse(24, 15, 9, 8, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#ffd37a';
  for (const x of [10, 18, 30, 38]) ctx.fillRect(x, 23, 2, 2);
  ctx.fillStyle = '#454851';
  ctx.fillRect(14, 28, 4, 3); ctx.fillRect(30, 28, 4, 3);
  tex.refresh();
}

/** Small 4-point sparkle shown over things you can look at. */
export function makeSparkle(scene: Phaser.Scene, key = 'sparkle'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 7, 7);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = '#fff6c8';
  ctx.fillRect(3, 0, 1, 7); ctx.fillRect(0, 3, 7, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(2, 2, 3, 3);
  tex.refresh();
}

/** Simple props: signpost and cairn, 16x16 each. */
export function makePlaceholderProps(scene: Phaser.Scene): void {
  if (!scene.textures.exists('prop.signpost')) {
    const t = scene.textures.createCanvas('prop.signpost', 16, 16)!;
    const c = t.getContext();
    c.fillStyle = '#6e4b2a'; c.fillRect(7, 4, 2, 12);
    c.fillStyle = '#b08a5a'; c.fillRect(3, 3, 11, 5);
    c.fillStyle = '#6e4b2a'; c.fillRect(11, 4, 2, 1); c.fillRect(5, 5, 6, 1);
    t.refresh();
  }
  if (!scene.textures.exists('prop.cairn')) {
    const t = scene.textures.createCanvas('prop.cairn', 16, 16)!;
    const c = t.getContext();
    c.fillStyle = '#6b6f78'; c.fillRect(2, 10, 12, 5);
    c.fillStyle = '#8a8f99'; c.fillRect(4, 6, 8, 4);
    c.fillStyle = '#a0a5ae'; c.fillRect(6, 3, 4, 3);
    c.fillStyle = '#454851'; c.fillRect(2, 14, 12, 1);
    t.refresh();
  }
}
