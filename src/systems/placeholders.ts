import Phaser from 'phaser';

/**
 * Placeholder art drawn at runtime, so M2 needs no image files.
 * Replaced by real tiles and sprites in the art milestone (M9).
 */

export const TILE = 16;

/**
 * Tileset, 14 tiles in a row (gid 1..14). Palette aims at Iceland: yellow-green
 * tundra grass, moss-covered black lava, grey gravel, glacial blue water, black sand,
 * basalt boulders, ice patches.
 *  1 tundra   2 tundra (tufts)   3 gravel path   4 water   5 basalt boulder (solid)
 *  6 mossy boulder (solid)   7 black sand   8 void   9 moss lava   10 moss lava (dense)
 *  11 ice   12 water edge (light)
 */
export const TILE_COUNT = 14;

export function makePlaceholderTileset(scene: Phaser.Scene, key = 'placeholder'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, TILE * TILE_COUNT, TILE);
  if (!tex) return;
  const ctx = tex.getContext();
  const fill = (i: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * TILE, 0, TILE, TILE);
  };
  const px = (i: number, color: string, pts: [number, number, number?, number?][]) => {
    ctx.fillStyle = color;
    for (const [x, y, w = 1, h = 1] of pts) ctx.fillRect(i * TILE + x, y, w, h);
  };
  // Rounded blotch: a rectangle with its corner pixels knocked off.
  const blotch = (i: number, color: string, x: number, y: number, w: number, h: number) => {
    px(i, color, [[x + 1, y, w - 2, h], [x, y + 1, w, h - 2]]);
  };
  // Rounded boulder on a ground colour.
  const boulder = (i: number, ground: string, mossy: boolean) => {
    fill(i, ground);
    blotch(i, '#1a1c20', 2, 5, 12, 10); // shadow/base
    blotch(i, '#2b2e34', 2, 3, 12, 10);
    blotch(i, '#454a54', 4, 4, 6, 4);
    px(i, '#5c626d', [[5, 5, 3, 1]]);
    if (mossy) { blotch(i, '#6f9a4a', 7, 3, 6, 4); px(i, '#8fb85c', [[8, 4, 3, 1], [3, 9, 2, 2]]); }
  };

  // 1 tundra grass: muted yellow-green with a few tufts
  fill(0, '#7d9150'); px(0, '#8ea35c', [[2, 3, 2], [9, 7, 2], [5, 12, 2], [12, 13, 2]]); px(0, '#6a7f42', [[6, 5], [13, 2], [3, 9], [10, 11]]);
  // 2 tundra variant: paler, drier
  fill(1, '#86964f'); px(1, '#98a85d', [[4, 4, 2], [11, 9, 2], [7, 13, 2]]); px(1, '#6f8244', [[2, 11], [13, 4], [8, 7]]);
  // 3 gravel path: grey-brown with pebbles
  fill(2, '#8a8378'); px(2, '#a39b8d', [[3, 5, 2], [10, 10, 2], [7, 13]]); px(2, '#6c665d', [[6, 3], [12, 6], [2, 12], [9, 8]]);
  // 4 glacial water: blue-turquoise with ripples
  fill(3, '#4a93b5'); px(3, '#6fb3cf', [[2, 4, 4], [8, 9, 5], [11, 2, 3]]); px(3, '#3a7a98', [[5, 12, 4], [12, 13, 3]]);
  // 5 basalt boulder (solid)   6 mossy boulder (solid)
  boulder(4, '#7d9150', false);
  boulder(5, '#7d9150', true);
  // 7 black sand: near-black with grey grains
  fill(6, '#33343a'); px(6, '#4a4b52', [[3, 4], [9, 7], [13, 12], [6, 11], [11, 2]]); px(6, '#26272c', [[5, 8], [12, 5], [2, 13]]);
  // 8 void
  fill(7, '#0b0d14');
  // 9, 10, 13, 14: moss-covered lava, four variants so the field does not read as a grid.
  // Base is dark lava; moss is laid on in rounded blotches of two greens.
  // Moss is laid on as many small tufts, so the field reads as a carpet of moss rather than tree tops.
  const lava = (i: number, blots: [number, number, number, number][], bright: [number, number, number, number][], cracks: [number, number, number?, number?][]) => {
    fill(i, '#2e3137');
    px(i, '#24262b', [[0, 0, 16, 1], [0, 15, 16, 1]]);
    for (const [x, y, w, h] of blots) {
      for (let yy = y; yy < y + h; yy += 2) for (let xx = x; xx < x + w; xx += 2) {
        if (((xx * 7 + yy * 13 + i * 5) % 11) < 7) px(i, '#6f9a4a', [[xx, yy, 2, 2]]);
      }
    }
    for (const [x, y, w, h] of bright) {
      for (let yy = y; yy < y + h; yy += 2) for (let xx = x; xx < x + w; xx += 2) {
        if (((xx * 5 + yy * 3 + i) % 7) < 3) px(i, '#8fb85c', [[xx, yy, 1, 1]]);
      }
    }
    px(i, '#1c1e23', cracks);
  };
  lava(8, [[0, 1, 8, 7], [8, 8, 8, 7]], [[1, 2, 4, 3], [10, 9, 4, 3]], [[9, 2, 3, 2], [2, 11, 3, 2]]);
  lava(9, [[0, 0, 16, 6], [0, 9, 7, 7], [9, 10, 7, 6]], [[2, 1, 6, 3], [10, 11, 4, 3]], [[7, 7, 3, 2]]);
  lava(12, [[3, 0, 10, 5], [0, 6, 6, 10], [8, 7, 8, 5]], [[5, 1, 4, 2], [1, 8, 3, 4]], [[11, 13, 4, 2]]);
  lava(13, [[0, 3, 5, 6], [6, 0, 10, 4], [5, 10, 11, 6]], [[7, 1, 5, 2], [7, 11, 5, 3]], [[1, 11, 3, 3], [12, 6, 3, 3]]);
  // 11 ice / old snow: white-blue
  fill(10, '#dfe9ee'); px(10, '#f6fafc', [[2, 2, 5, 3], [9, 9, 5, 4]]); px(10, '#b9ccd6', [[8, 3, 4, 2], [2, 10, 4, 2], [12, 6, 2, 2]]);
  // 12 water edge: lighter shallow water
  fill(11, '#6fb3cf'); px(11, '#9fd0e3', [[2, 3, 5, 2], [9, 10, 5, 2]]); px(11, '#4a93b5', [[7, 7, 4, 2], [1, 12, 5, 2]]);
  tex.refresh();
}

/**
 * Character spritesheet: 4 directions x 2 frames (idle, step), 16x24 each.
 * Frame order: down0, down1, up0, up1, left0, left1, right0, right1.
 * Chibi proportions (big head, short body), 1px dark outline, soft shadow.
 */
export const PLAYER_W = 16;
export const PLAYER_H = 24;

export interface FigureLook {
  coat: string;
  coatDark: string;
  hair: string;
  skin: string;
  /** Hat colour, or null for bare hair. */
  hat: string | null;
  legs: string;
  /** Long hair falls to the shoulders. */
  hairLong?: boolean;
  /** A knitted headband instead of a hat. */
  headband?: string | null;
}

export const PLAYER_LOOK: FigureLook = { coat: '#e2673f', coatDark: '#b84d2e', hair: '#3b2a2a', skin: '#f3cfae', hat: '#3f4866', legs: '#2d3140' };
export const DISGUISES: Record<string, FigureLook> = {
  a: PLAYER_LOOK,
  b: { coat: '#4f7fb8', coatDark: '#3a6190', hair: '#6b3f2a', skin: '#f3cfae', hat: null, headband: '#e9c46a', legs: '#3a3f55', hairLong: true },
};

export function makePlaceholderPlayer(scene: Phaser.Scene, key = 'player', look: FigureLook = PLAYER_LOOK): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, PLAYER_W * 8, PLAYER_H);
  if (!tex) return;
  const ctx = tex.getContext();
  const OUT = '#1a1c20';
  const dirs = ['down', 'up', 'left', 'right'] as const;
  dirs.forEach((dir, d) => {
    for (let step = 0; step < 2; step++) {
      const i = d * 2 + step;
      const ox = i * PLAYER_W;
      const bob = step === 1 ? 1 : 0;
      const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(ox + x, y, w, h); };

      // shadow
      r(4, 22, 8, 2, 'rgba(0,0,0,0.28)');
      // legs (outline then fill); the step frame lifts one leg
      r(4, 17, 3, 6 - bob, OUT); r(9, 17, 3, 6 - bob, OUT);
      r(5, 17, 1, 5 - bob, look.legs); r(10, 17, 1, 5 - bob, look.legs);
      if (step === 1) { r(4, 21, 3, 1, OUT); }
      // body
      r(3, 12 + bob, 10, 6, OUT);
      r(4, 13 + bob, 8, 4, look.coat);
      r(4, 16 + bob, 8, 1, look.coatDark);
      // yoke band (Icelandic sweater nod)
      r(4, 13 + bob, 8, 1, '#efe9dc'); r(5, 14 + bob, 1, 1, '#efe9dc'); r(7, 14 + bob, 1, 1, '#efe9dc'); r(9, 14 + bob, 1, 1, '#efe9dc');
      // arms
      r(2, 13 + bob, 2, 4, OUT); r(12, 13 + bob, 2, 4, OUT);
      r(3, 14 + bob, 1, 2, look.coat); r(12, 14 + bob, 1, 2, look.coat);
      // head: outline, skin, hair
      r(3, 2 + bob, 10, 11, OUT);
      r(4, 3 + bob, 8, 9, look.skin);
      if (dir === 'up') {
        r(4, 3 + bob, 8, 7, look.hair);
        if (look.hairLong) r(4, 10 + bob, 8, 4, look.hair);
      } else {
        r(4, 3 + bob, 8, 3, look.hair);
        r(4, 6 + bob, 1, 3, look.hair); r(11, 6 + bob, 1, 3, look.hair);
        if (dir === 'left') r(10, 6 + bob, 2, 2, look.hair);
        if (dir === 'right') r(4, 6 + bob, 2, 2, look.hair);
        if (look.hairLong) { r(3, 8 + bob, 2, 7, OUT); r(11, 8 + bob, 2, 7, OUT); r(4, 9 + bob, 1, 5, look.hair); r(11, 9 + bob, 1, 5, look.hair); }
      }
      if (look.headband) { r(4, 5 + bob, 8, 1, look.headband); r(5, 4 + bob, 1, 1, look.headband); r(10, 4 + bob, 1, 1, look.headband); }
      // hat (the disguise): a beanie over the hair
      if (look.hat) {
        r(3, 1 + bob, 10, 4, OUT);
        r(4, 2 + bob, 8, 2, look.hat);
        r(4, 4 + bob, 8, 1, '#efe9dc');
      }
      // eyes
      if (dir === 'down') { r(5, 8 + bob, 2, 2, OUT); r(9, 8 + bob, 2, 2, OUT); r(5, 8 + bob, 1, 1, '#ffffff'); r(9, 8 + bob, 1, 1, '#ffffff'); }
      if (dir === 'left') { r(5, 8 + bob, 2, 2, OUT); r(5, 8 + bob, 1, 1, '#ffffff'); }
      if (dir === 'right') { r(9, 8 + bob, 2, 2, OUT); r(10, 8 + bob, 1, 1, '#ffffff'); }
      // cheeks
      if (dir === 'down') { r(4, 10 + bob, 1, 1, '#f0a58a'); r(11, 10 + bob, 1, 1, '#f0a58a'); }

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
    c.fillStyle = '#2b2e34'; c.fillRect(2, 10, 12, 5);
    c.fillStyle = '#454a54'; c.fillRect(4, 6, 8, 4);
    c.fillStyle = '#5c626d'; c.fillRect(6, 3, 4, 3);
    c.fillStyle = '#8fb85c'; c.fillRect(3, 10, 2, 1); c.fillRect(10, 7, 2, 1);
    c.fillStyle = '#1a1c20'; c.fillRect(2, 14, 12, 1);
    t.refresh();
  }
}

/** A rock sketch for the notebook and the lab: a blob with a pattern. 48x40. */
export function makeSampleSketch(scene: Phaser.Scene, key: string, color: string, pattern: 'speckle' | 'shine' | 'holes' | 'plain'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 48, 40);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(6, 26); ctx.lineTo(12, 10); ctx.lineTo(26, 5); ctx.lineTo(40, 12); ctx.lineTo(44, 26); ctx.lineTo(34, 36); ctx.lineTo(14, 36); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f4f1e8'; ctx.lineWidth = 1; ctx.stroke();
  if (pattern === 'speckle') { ctx.fillStyle = '#6b6f78'; for (const [x, y] of [[14, 18], [22, 12], [30, 22], [20, 28], [34, 30], [26, 20]]) ctx.fillRect(x, y, 2, 2); }
  if (pattern === 'shine') { ctx.fillStyle = '#9fb3c8'; ctx.fillRect(16, 10, 10, 2); ctx.fillRect(14, 13, 4, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(18, 11, 4, 1); }
  if (pattern === 'holes') { ctx.fillStyle = '#6e6a60'; for (const [x, y] of [[12, 20], [18, 12], [24, 24], [30, 14], [36, 24], [22, 32], [32, 32], [16, 28], [28, 8]]) ctx.fillRect(x, y, 3, 3); }
  tex.refresh();
}

/** Small ground rock you can pick up, 12x10. */
export function makePickupRock(scene: Phaser.Scene, key: string, color: string): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 12, 10);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = color; ctx.fillRect(2, 3, 8, 6); ctx.fillRect(4, 1, 5, 2);
  ctx.fillStyle = '#ffffff55'; ctx.fillRect(4, 3, 3, 1);
  ctx.fillStyle = '#00000055'; ctx.fillRect(2, 8, 8, 1);
  tex.refresh();
}

/**
 * The alien's true form, 16x20: a round teal body, one wide eye band with two pupils,
 * two antennae with lights, stubby feet. Gender-free, little-monster vibe.
 */
export function makeAlienTrueForm(scene: Phaser.Scene, key = 'alien'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 16, 20);
  if (!tex) return;
  const ctx = tex.getContext();
  const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const OUT = '#1a1c20';
  r(3, 18, 10, 2, 'rgba(0,0,0,0.28)');
  // antennae
  r(4, 0, 1, 4, OUT); r(11, 0, 1, 4, OUT); r(3, 0, 2, 1, '#ffd37a'); r(11, 0, 2, 1, '#ffd37a');
  // body
  r(2, 4, 12, 13, OUT); r(1, 6, 14, 9, OUT);
  r(3, 5, 10, 11, '#5fc4b0'); r(2, 7, 12, 7, '#5fc4b0');
  r(3, 13, 10, 3, '#3f9d8c');
  // eye band
  r(3, 7, 10, 4, '#f4f1e8'); r(4, 8, 2, 2, OUT); r(10, 8, 2, 2, OUT); r(4, 8, 1, 1, '#9fd8ff'); r(10, 8, 1, 1, '#9fd8ff');
  // mouth
  r(7, 12, 2, 1, OUT);
  // feet
  r(3, 16, 4, 2, OUT); r(9, 16, 4, 2, OUT); r(4, 16, 2, 1, '#3f9d8c'); r(10, 16, 2, 1, '#3f9d8c');
  tex.refresh();
}

/** The professor's true form, 16x28: taller, violet, a glasses line across the eye band, a hair-bun antenna. */
export function makeAlienTeacher(scene: Phaser.Scene, key = 'alien.teacher'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 16, 28);
  if (!tex) return;
  const ctx = tex.getContext();
  const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const OUT = '#1a1c20';
  r(3, 26, 10, 2, 'rgba(0,0,0,0.28)');
  r(7, 0, 2, 3, OUT); r(6, 0, 4, 2, '#d9b8ff'); // bun
  r(2, 3, 12, 22, OUT); r(1, 6, 14, 12, OUT);
  r(3, 4, 10, 20, '#9a7bd1'); r(2, 7, 12, 10, '#9a7bd1');
  r(3, 18, 10, 6, '#6e55a8'); // long coat
  r(3, 7, 10, 4, '#f4f1e8'); r(3, 8, 10, 1, OUT); // eye band with glasses line
  r(4, 8, 2, 2, OUT); r(10, 8, 2, 2, OUT); r(4, 8, 1, 1, '#ffe9a8'); r(10, 8, 1, 1, '#ffe9a8');
  r(7, 13, 2, 1, OUT);
  r(3, 24, 4, 2, OUT); r(9, 24, 4, 2, OUT);
  tex.refresh();
}

/**
 * Earth, drawn with Graphics so it can be any size: layered ocean, shaped continents,
 * ice caps, cloud swirls, a shadowed night side, atmosphere rim and a highlight.
 */
export function drawEarth(scene: Phaser.Scene, x: number, y: number, r: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const k = r / 48;
  // atmosphere
  g.fillStyle(0x7fb3e6, 0.10); g.fillCircle(x, y, r * 1.16);
  g.fillStyle(0x9fd0e3, 0.12); g.fillCircle(x, y, r * 1.08);
  // ocean, lighter toward the sunlit upper-left
  g.fillStyle(0x2f68b8, 1); g.fillCircle(x, y, r);
  g.fillStyle(0x3a7bd5, 1); g.fillCircle(x - 4 * k, y - 4 * k, r * 0.9);
  g.fillStyle(0x4b8fe0, 1); g.fillCircle(x - 10 * k, y - 10 * k, r * 0.62);
  // continents: irregular shapes, clipped by redrawing the ocean edge afterwards
  const land = (pts: [number, number][], color: number) => {
    g.fillStyle(color, 1);
    g.fillPoints(pts.map(([px, py]) => new Phaser.Math.Vector2(x + px * k, y + py * k)), true);
  };
  land([[-34, -22], [-18, -30], [-6, -24], [-10, -10], [-20, 2], [-30, -2], [-38, -12]], 0x5bb36a);
  land([[-14, 6], [-4, 2], [4, 10], [0, 26], [-8, 30], [-14, 20]], 0x6cbf77);
  land([[6, -34], [26, -30], [36, -16], [30, -4], [16, -6], [8, -14], [4, -24]], 0x5bb36a);
  land([[14, 4], [28, 8], [30, 20], [20, 26], [12, 16]], 0x6cbf77);
  land([[-2, -8], [8, -10], [10, 0], [2, 2]], 0x7fa05d);
  // deserts and mountains as small accents
  g.fillStyle(0xd9c79a, 1); g.fillCircle(x + 20 * k, y - 18 * k, 4 * k); g.fillCircle(x - 24 * k, y - 14 * k, 3 * k);
  g.fillStyle(0x4f8a3a, 1); g.fillCircle(x - 8 * k, y + 18 * k, 3 * k);
  // ice caps
  g.fillStyle(0xeef5f8, 1); g.fillEllipse(x + 2 * k, y - r + 5 * k, 30 * k, 10 * k); g.fillEllipse(x - 4 * k, y + r - 4 * k, 26 * k, 7 * k);
  // clouds
  g.fillStyle(0xffffff, 0.75);
  for (const [cx, cy, w] of [[-26, -4, 22], [6, -26, 16], [22, 10, 18], [-10, 28, 14], [-2, 12, 10], [30, -8, 8]]) {
    g.fillEllipse(x + cx * k, y + cy * k, w * k, 4.5 * k); g.fillEllipse(x + (cx + 4) * k, y + (cy - 2) * k, w * 0.5 * k, 3.5 * k);
  }
  // night side: a dark disc offset to the lower-right, clipped to the globe
  g.fillStyle(0x0b0d14, 0.35); g.fillCircle(x + 14 * k, y + 12 * k, r * 0.95);
  // re-trim the edge so nothing pokes out of the disc
  g.lineStyle(3 * k, 0x0b0d14, 0.0);
  // highlight
  g.fillStyle(0xffffff, 0.35); g.fillEllipse(x - 20 * k, y - 26 * k, 12 * k, 6 * k);
  g.fillStyle(0xffffff, 0.6); g.fillEllipse(x - 22 * k, y - 28 * k, 5 * k, 3 * k);
  return g;
}

/**
 * Small Icelandic trees as props: birch (white trunk, airy canopy), rowan (round canopy,
 * red berries) and a low willow bush. About two character heights, not more; Iceland is
 * not a forest. Each is 32x48 with the trunk base at the bottom centre.
 */
export function makeTrees(scene: Phaser.Scene): void {
  const OUT = '#1a1c20';
  const mk = (key: string, draw: (ctx: CanvasRenderingContext2D, r: (x: number, y: number, w: number, h: number, c: string) => void) => void, w = 32, h = 48) => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, w, h);
    if (!tex) return;
    const ctx = tex.getContext();
    const r = (x: number, y: number, ww: number, hh: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, ww, hh); };
    draw(ctx, r);
    tex.refresh();
  };
  const canopy = (r: (x: number, y: number, w: number, h: number, c: string) => void, cx: number, cy: number, rad: number, dark: string, mid: string, light: string) => {
    for (let yy = -rad; yy <= rad; yy++) {
      const half = Math.round(Math.sqrt(rad * rad - yy * yy) * (1 + (yy % 3 === 0 ? 0.08 : 0)));
      r(cx - half - 1, cy + yy, half * 2 + 2, 1, OUT);
    }
    for (let yy = -rad + 1; yy <= rad - 1; yy++) {
      const half = Math.round(Math.sqrt(rad * rad - yy * yy));
      r(cx - half, cy + yy, half * 2, 1, yy > rad * 0.3 ? dark : mid);
    }
    for (let i = 0; i < 9; i++) r(cx - rad + 2 + ((i * 7) % (rad * 2 - 4)), cy - rad + 2 + ((i * 5) % (rad - 1)), 2, 1, light);
  };
  mk('tree.birch', (_c, r) => {
    r(14, 26, 4, 22, OUT); r(15, 26, 2, 21, '#e9e4d8'); r(15, 30, 2, 1, '#555'); r(15, 37, 2, 1, '#555'); r(15, 43, 1, 1, '#555');
    canopy(r, 16, 16, 12, '#7d9a3a', '#9ab54a', '#c9d96a');
    r(8, 42, 16, 3, 'rgba(0,0,0,0.25)');
  });
  mk('tree.rowan', (_c, r) => {
    r(14, 24, 4, 24, OUT); r(15, 24, 2, 23, '#6e4b2a'); r(15, 30, 1, 10, '#8a6238');
    canopy(r, 16, 15, 13, '#4f7a3a', '#6a9a46', '#8fb85c');
    for (const [x, y] of [[9, 12], [19, 8], [23, 17], [12, 20], [16, 13]]) r(x, y, 2, 2, '#d9442f');
    r(7, 43, 18, 3, 'rgba(0,0,0,0.25)');
  });
  mk('tree.willow', (_c, r) => {
    canopy(r, 16, 20, 9, '#5f7f3f', '#7f9a50', '#a9b86a');
    r(13, 27, 6, 3, OUT); r(14, 27, 4, 2, '#6e4b2a');
    r(8, 28, 16, 2, 'rgba(0,0,0,0.25)');
  }, 32, 32);
}
