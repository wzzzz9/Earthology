import Phaser from 'phaser';

/**
 * Placeholder art drawn at runtime, so M2 needs no image files.
 * Replaced by real tiles and sprites in the art milestone (M9).
 */

export const TILE = 16;

/**
 * Tileset, 17 tiles in a row (gid 1..17). Palette aims at Iceland: yellow-green
 * tundra grass, moss-covered black lava, grey gravel, glacial blue water, black sand,
 * basalt boulders, ice patches.
 *  1 tundra   2 tundra (tufts)   3 gravel path   4 water   5 basalt boulder (solid)
 *  6 mossy boulder (solid)   7 black sand   8 void   9 moss lava   10 moss lava (dense)
 *  11 ice   12 water edge (light)
 */
export const TILE_COUNT = 17;

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
  // 9, 10, 13, 14: moss-covered lava, four variants. Real Icelandic moss fields look like
  // soft green pillows with the black rock showing only in thin seams between them, so the
  // tiles are mostly rounded mounds of green with 1px dark cracks, never dark speckle.
  const moss = (i: number, mounds: [number, number, number][], seams: [number, number, number, number][]) => {
    fill(i, '#5f8a3f'); // moss shade between mounds
    for (const [mx, my, mr] of mounds) {
      // mound: rounded, lit from the upper left
      for (let yy = -mr; yy <= mr; yy++) {
        const half = Math.max(0, Math.round(Math.sqrt(mr * mr - yy * yy)));
        px(i, '#6f9a4a', [[mx - half, my + yy, half * 2 + 1, 1]]);
      }
      for (let yy = -mr; yy <= 0; yy++) {
        const half = Math.max(0, Math.round(Math.sqrt(mr * mr - yy * yy) * 0.7));
        px(i, '#86b35a', [[mx - half - 1, my + yy - 1, half * 2 + 1, 1]]);
      }
      px(i, '#a3c86a', [[mx - 1, my - mr, 2, 1]]);
    }
    px(i, '#24262b', seams);
  };
  moss(8, [[4, 4, 4], [12, 5, 3], [5, 12, 3], [12, 12, 3]], [[8, 0, 1, 6], [0, 8, 5, 1], [9, 9, 1, 7]]);
  moss(9, [[6, 5, 5], [13, 11, 3], [3, 13, 2]], [[12, 0, 1, 5], [0, 11, 2, 1], [8, 13, 3, 1]]);
  moss(12, [[3, 3, 3], [11, 4, 4], [7, 12, 4]], [[7, 1, 1, 4], [14, 9, 2, 1], [1, 10, 1, 5]]);
  moss(13, [[8, 7, 6], [2, 13, 2], [14, 2, 2]], [[0, 4, 4, 1], [12, 13, 4, 1], [2, 0, 1, 3]]);
  // 15 chasm (the rift): near-black with a cold blue seam. 16 hot pool: milky turquoise with a pale rim.
  fill(14, '#0c0e14'); px(14, '#182434', [[6, 2, 1, 5], [9, 9, 1, 6], [4, 12, 1, 3]]);
  px(14, '#454a54', [[0, 0, 2, 16], [14, 0, 2, 16]]); px(14, '#6b6f78', [[0, 0, 1, 16], [15, 0, 1, 16]]); px(14, '#2b2e34', [[2, 0, 1, 16], [13, 0, 1, 16]]);
  fill(15, '#7fd1e8'); px(15, '#a9e3f1', [[2, 3, 5, 2], [8, 9, 6, 2], [5, 12, 3, 1], [11, 2, 3, 1]]); px(15, '#e9f6fa', [[4, 4, 2, 1], [10, 10, 2, 1]]);
  // 17 stepping stones: grass with two or three flat grey stones, for side paths.
  fill(16, '#7d9150'); px(16, '#8ea35c', [[2, 13, 2], [12, 2, 2]]);
  for (const [x, y, w, h] of [[2, 3, 6, 5], [9, 9, 6, 5], [3, 11, 3, 2]]) { px(16, '#6b6f78', [[x, y, w, h]]); px(16, '#8a8f99', [[x + 1, y + 1, w - 2, h - 2]]); px(16, '#5c626d', [[x, y + h - 1, w, 1]]); }
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
    r(17, 36, 6, 36, OUT); r(18, 36, 4, 35, '#e9e4d8'); for (const y of [42, 50, 58, 65]) r(18 + (y % 3), y, 2, 1, '#555');
    canopy(r, 20, 22, 18, '#7d9a3a', '#9ab54a', '#c9d96a');
    canopy(r, 12, 30, 9, '#7d9a3a', '#9ab54a', '#c9d96a');
    canopy(r, 29, 31, 8, '#7d9a3a', '#9ab54a', '#c9d96a');
    r(10, 69, 20, 3, 'rgba(0,0,0,0.25)');
  }, 40, 72);
  mk('tree.rowan', (_c, r) => {
    r(17, 34, 6, 38, OUT); r(18, 34, 4, 37, '#6e4b2a'); r(18, 40, 1, 24, '#8a6238');
    canopy(r, 20, 20, 19, '#4f7a3a', '#6a9a46', '#8fb85c');
    canopy(r, 10, 30, 8, '#4f7a3a', '#6a9a46', '#8fb85c');
    canopy(r, 31, 29, 8, '#4f7a3a', '#6a9a46', '#8fb85c');
    for (const [x, y] of [[9, 16], [23, 8], [31, 20], [14, 26], [20, 16], [27, 30], [8, 30]]) r(x, y, 2, 2, '#d9442f');
    r(9, 69, 22, 3, 'rgba(0,0,0,0.25)');
  }, 40, 72);
  mk('tree.willow', (_c, r) => {
    canopy(r, 16, 20, 9, '#5f7f3f', '#7f9a50', '#a9b86a');
    r(13, 27, 6, 3, OUT); r(14, 27, 4, 2, '#6e4b2a');
    r(8, 28, 16, 2, 'rgba(0,0,0,0.25)');
  }, 32, 32);
}

/**
 * Town and landmark props. Each is drawn once into a canvas texture at the listed size;
 * the base of the sprite is its bottom edge, centred.
 */
export function makeIcelandProps(scene: Phaser.Scene): void {
  const OUT = '#1a1c20';
  const mk = (key: string, w: number, h: number, draw: (r: (x: number, y: number, w: number, h: number, c: string) => void, ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, w, h);
    if (!tex) return;
    const ctx = tex.getContext();
    const r = (x: number, y: number, ww: number, hh: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, ww, hh); };
    draw(r, ctx);
    tex.refresh();
  };
  // Icelandic corrugated-iron houses: bright walls, white trim, dark roof. 48x40.
  const house = (key: string, wall: string, wallDark: string, roof: string) => mk(key, 48, 40, (r) => {
    r(6, 38, 36, 2, 'rgba(0,0,0,0.25)');
    r(3, 14, 42, 25, OUT); r(4, 15, 40, 23, wall); r(4, 30, 40, 8, wallDark);
    for (let x = 6; x < 44; x += 4) r(x, 15, 1, 23, wallDark); // corrugation
    r(1, 4, 46, 11, OUT); r(2, 5, 44, 9, roof); r(2, 13, 44, 1, '#f4f1e8');
    for (let x = 4; x < 44; x += 6) r(x, 5, 1, 9, 'rgba(255,255,255,0.15)');
    r(20, 0, 6, 6, OUT); r(21, 1, 4, 5, '#8a8f99'); // chimney
    r(21, 22, 7, 16, OUT); r(22, 23, 5, 15, '#6e4b2a'); r(26, 30, 1, 1, '#ffd37a'); // door
    for (const x of [8, 34]) { r(x, 20, 8, 8, OUT); r(x + 1, 21, 6, 6, '#ffd37a'); r(x + 3, 21, 1, 6, '#f4f1e8'); r(x + 1, 24, 6, 1, '#f4f1e8'); }
  });
  house('bld.house-red', '#c94a3a', '#9e3a2d', '#2d3140');
  house('bld.house-blue', '#4f7fb8', '#3a6190', '#2d3140');
  house('bld.house-yellow', '#e9c46a', '#c9a44e', '#3f4866');
  house('bld.house-green', '#5a8a5a', '#447044', '#2d3140');
  // White church with a red roof and a small tower. 40x56.
  mk('bld.church', 40, 56, (r) => {
    r(6, 54, 28, 2, 'rgba(0,0,0,0.25)');
    r(5, 26, 30, 29, OUT); r(6, 27, 28, 27, '#f4f1e8'); r(6, 48, 28, 6, '#d9d4c8');
    r(3, 16, 34, 11, OUT); r(4, 17, 32, 9, '#c94a3a');
    r(14, 2, 12, 16, OUT); r(15, 3, 10, 15, '#f4f1e8'); r(13, 0, 14, 4, OUT); r(14, 1, 12, 2, '#c94a3a');
    r(19, 0, 2, 3, OUT); r(19, 6, 2, 6, OUT); r(18, 8, 4, 1, OUT); // cross and slit
    r(17, 38, 7, 16, OUT); r(18, 39, 5, 15, '#6e4b2a');
    for (const x of [9, 27]) { r(x, 32, 5, 10, OUT); r(x + 1, 33, 3, 8, '#7fb3e6'); }
  });
  // Small fishing boat, blue hull, in the water. 24x16.
  mk('prop.boat', 24, 16, (r) => {
    r(1, 8, 22, 7, OUT); r(2, 9, 20, 5, '#2b6cb0'); r(2, 9, 20, 1, '#f4f1e8'); r(4, 13, 16, 1, '#1f4f82');
    r(8, 2, 8, 7, OUT); r(9, 3, 6, 5, '#f4f1e8'); r(10, 4, 4, 2, '#7fb3e6'); r(14, 0, 2, 3, OUT);
  });
  // Fish drying racks: wooden frame with fish hanging. 32x24.
  mk('prop.racks', 32, 24, (r) => {
    r(2, 22, 28, 2, 'rgba(0,0,0,0.25)');
    for (const x of [2, 15, 28]) { r(x, 4, 2, 19, OUT); r(x, 5, 1, 17, '#6e4b2a'); }
    r(1, 4, 30, 2, OUT); r(1, 12, 30, 2, OUT); r(2, 5, 28, 1, '#8a6238'); r(2, 13, 28, 1, '#8a6238');
    for (let x = 5; x < 28; x += 4) { r(x, 6, 2, 6, '#d9c7a8'); r(x, 14, 2, 6, '#d9c7a8'); r(x, 6, 1, 1, OUT); r(x, 14, 1, 1, OUT); }
  });
  // Hot-water pipe running along the ground, 64x10, with a warm glow line.
  mk('prop.pipe', 64, 10, (r) => {
    r(0, 2, 64, 7, OUT); r(1, 3, 62, 5, '#8a8f99'); r(1, 3, 62, 1, '#b9bec8'); r(1, 6, 62, 1, '#5c626d');
    for (const x of [8, 24, 40, 56]) { r(x, 1, 4, 9, OUT); r(x + 1, 2, 2, 7, '#6b6f78'); }
    r(0, 9, 64, 1, 'rgba(255,211,122,0.35)');
  });
  // Sheep sorting pens: a ring of stone walls split like a pie. 48x40.
  mk('prop.pen', 48, 40, (r, ctx) => {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(24, 22, 21, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#6b6f78'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(24, 22, 21, 14, 0, 0, Math.PI * 2); ctx.stroke();
    for (const a of [0, 1.2, 2.4, 3.6, 4.8]) { ctx.strokeStyle = '#6b6f78'; ctx.beginPath(); ctx.moveTo(24, 22); ctx.lineTo(24 + Math.cos(a) * 20, 22 + Math.sin(a) * 13); ctx.stroke(); }
    r(22, 8, 4, 4, OUT); r(23, 9, 2, 2, '#f4f1e8'); // one sheep left behind
  });
  // Basalt columns: a wall of six-sided grey pillars. 64x32.
  mk('prop.columns-wall', 64, 32, (r) => {
    r(0, 30, 64, 2, 'rgba(0,0,0,0.3)');
    for (let i = 0; i < 8; i++) {
      const x = i * 8; const top = 2 + ((i * 5) % 7);
      r(x, top, 8, 30 - top, OUT); r(x + 1, top + 1, 6, 28 - top, i % 2 ? '#2b2e34' : '#353942'); r(x + 1, top + 1, 6, 2, '#5c626d'); r(x + 1, top + 1, 2, 27 - top, '#454a54');
    }
  });
  // Glacier face: a wall of blue-white ice with a dusty top. 96x28.
  mk('prop.glacier-face', 96, 28, (r) => {
    r(0, 26, 96, 2, 'rgba(0,0,0,0.25)');
    r(0, 4, 96, 23, OUT); r(1, 5, 94, 21, '#dfe9ee'); r(1, 5, 94, 3, '#9aa3b2'); r(1, 20, 94, 6, '#9fd0e3');
    for (let x = 6; x < 92; x += 11) { r(x, 8, 2, 14, '#7fb3e6'); r(x + 5, 12, 1, 10, '#b9ccd6'); }
    for (let x = 0; x < 96; x += 7) r(x, 2, 4, 3, OUT), r(x + 1, 3, 2, 2, '#dfe9ee');
  });
  // Geyser mouth (16x10), its water column (8x48, scaled by the game), and a steam puff (10x8).
  mk('fx.geyser-base', 16, 10, (r) => { r(0, 4, 16, 6, OUT); r(1, 5, 14, 4, '#b9b4a6'); r(5, 2, 6, 4, OUT); r(6, 3, 4, 3, '#7fd1e8'); });
  mk('fx.geyser-column', 10, 48, (r) => { r(2, 0, 6, 48, 'rgba(233,246,250,0.85)'); r(0, 0, 10, 10, 'rgba(255,255,255,0.6)'); r(4, 0, 2, 48, '#ffffff'); });
  mk('fx.steam', 10, 8, (r) => { r(1, 3, 8, 4, 'rgba(240,246,250,0.55)'); r(3, 1, 5, 3, 'rgba(240,246,250,0.55)'); r(0, 5, 3, 2, 'rgba(240,246,250,0.4)'); });
  // Waterfall: two frames of falling water with foam at the foot, 16x32 each.
  for (let f = 0; f < 2; f++) mk(`fx.waterfall${f}`, 32, 36, (r) => {
    r(0, 0, 32, 32, '#4a93b5');
    for (let i = 0; i < 11; i++) r(1 + i * 3 + (f ? 1 : 0), 0, 1, 32, '#9fd0e3');
    for (let y = f ? 2 : 6; y < 30; y += 8) { r(4 + (f ? 4 : 0), y, 2, 3, '#ffffff'); r(20 - (f ? 4 : 0), y + 3, 2, 3, '#ffffff'); }
    r(0, 29, 32, 7, '#e9f6fa'); r(2, 31, 28, 3, '#ffffff'); r(0, 0, 32, 2, '#6fb3cf');
  });
  // Fences and yard clutter, all with outlines. Fence pieces are one tile wide.
  mk('prop.fence-h', 16, 12, (r) => { r(0, 4, 16, 2, OUT); r(0, 8, 16, 2, OUT); r(1, 5, 14, 1, '#b08a5a'); r(1, 9, 14, 1, '#b08a5a'); for (const x of [2, 12]) { r(x, 0, 3, 12, OUT); r(x + 1, 1, 1, 10, '#c9a470'); } });
  mk('prop.fence-v', 8, 20, (r) => { r(2, 0, 3, 20, OUT); r(3, 1, 1, 18, '#c9a470'); r(1, 6, 6, 2, OUT); r(1, 13, 6, 2, OUT); r(2, 7, 4, 1, '#b08a5a'); r(2, 14, 4, 1, '#b08a5a'); });
  mk('prop.planter', 16, 14, (r) => { r(1, 7, 14, 6, OUT); r(2, 8, 12, 4, '#8a6238'); r(2, 8, 12, 1, '#b08a5a'); r(3, 3, 10, 5, '#4f7a3a'); for (const [x, c] of [[4, '#f28cb1'], [8, '#ffd37a'], [12, '#f4f1e8']] as [number, string][]) r(x, 2, 2, 2, c); });
  mk('prop.barrel', 12, 14, (r) => { r(1, 1, 10, 12, OUT); r(2, 2, 8, 10, '#8a6238'); r(2, 4, 8, 1, '#454851'); r(2, 9, 8, 1, '#454851'); r(3, 2, 1, 10, '#b08a5a'); });
  mk('prop.lantern', 8, 20, (r) => { r(3, 6, 2, 14, OUT); r(1, 0, 6, 7, OUT); r(2, 1, 4, 5, '#ffd37a'); r(3, 2, 2, 3, '#fff6c8'); r(1, 18, 6, 2, OUT); });
  mk('prop.woodpile', 16, 12, (r) => { r(0, 2, 16, 10, OUT); for (const [x, y] of [[1, 7], [6, 7], [11, 7], [3, 3], [8, 3]]) { r(x, y, 4, 4, '#8a6238'); r(x + 1, y + 1, 2, 2, '#d9c7a8'); } });
  mk('prop.bench', 20, 10, (r) => { r(0, 3, 20, 3, OUT); r(1, 4, 18, 1, '#b08a5a'); r(2, 6, 2, 4, OUT); r(16, 6, 2, 4, OUT); r(0, 0, 20, 2, OUT); r(1, 1, 18, 1, '#b08a5a'); });
  mk('prop.well', 20, 24, (r) => { r(2, 14, 16, 9, OUT); r(3, 15, 14, 7, '#6b6f78'); r(3, 15, 14, 1, '#8a8f99'); r(4, 2, 2, 13, OUT); r(14, 2, 2, 13, OUT); r(2, 0, 16, 4, OUT); r(3, 1, 14, 2, '#c94a3a'); r(9, 6, 2, 8, OUT); });
  mk('prop.mailbox', 8, 16, (r) => { r(3, 6, 2, 10, OUT); r(0, 0, 8, 7, OUT); r(1, 1, 6, 5, '#c94a3a'); r(5, 2, 1, 2, '#ffd37a'); });
  // Pier planks: a short wooden walkway over water, 16x16 tile-sized prop.
  mk('prop.pier', 16, 16, (r) => { r(0, 0, 16, 16, '#6e4b2a'); for (let y = 0; y < 16; y += 4) r(0, y, 16, 1, '#5a3a24'); r(0, 0, 1, 16, OUT); r(15, 0, 1, 16, OUT); });
}

/** Low plants scattered on the ground: lupine, cotton grass, a shrub, a grass tuft. No collision. */
export function makePlants(scene: Phaser.Scene): void {
  const OUT = '#1a1c20';
  const mk = (key: string, w: number, h: number, draw: (r: (x: number, y: number, w: number, h: number, c: string) => void) => void) => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, w, h);
    if (!tex) return;
    const ctx = tex.getContext();
    draw((x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, ww, hh); });
    tex.refresh();
  };
  // Nootka lupine: purple-blue flower spikes over a fan of leaves (very Icelandic in June).
  mk('plant.lupine', 14, 16, (r) => {
    r(2, 12, 10, 4, '#4f7a3a'); r(1, 13, 12, 2, '#5f8a3f'); r(3, 11, 2, 1, '#6f9a4a'); r(9, 11, 2, 1, '#6f9a4a');
    for (const [x, top] of [[3, 3], [6, 0], [9, 2]]) { r(x, top, 3, 12 - top, '#6c5fc7'); r(x + 1, top, 1, 12 - top, '#8e82e0'); r(x, top, 1, 1, OUT); r(x + 2, top + 2, 1, 1, '#f4f1e8'); }
  });
  // Cotton grass: thin stems with white tufts.
  mk('plant.cotton', 12, 14, (r) => {
    for (const [x, top] of [[2, 4], [6, 1], [9, 5]]) { r(x + 1, top + 3, 1, 11 - top, '#86964f'); r(x, top, 3, 3, '#f4f1e8'); r(x + 1, top, 1, 1, '#ffffff'); }
    r(1, 12, 10, 2, '#7d9150');
  });
  // Low shrub: a rounded dark-green mound with lighter top.
  mk('plant.shrub', 16, 12, (r) => {
    r(1, 4, 14, 7, OUT); r(2, 5, 12, 5, '#4f7a3a'); r(3, 3, 10, 2, OUT); r(4, 4, 8, 2, '#6a9a46'); r(5, 4, 3, 1, '#8fb85c'); r(2, 10, 12, 1, '#2d4a26');
  });
  // Grass tuft: a few blades.
  mk('plant.tuft', 10, 8, (r) => {
    for (const [x, top] of [[1, 3], [3, 1], [5, 0], [7, 2]]) r(x, top, 1, 8 - top, '#98a85d');
    r(2, 5, 6, 1, '#86964f'); r(8, 4, 1, 4, '#86964f');
  });
  // Wildflowers: pink and white blossoms on short stems.
  mk('plant.flowers', 12, 10, (r) => { for (const [x, c] of [[1, '#f28cb1'], [5, '#f4f1e8'], [9, '#f28cb1']] as [number, string][]) { r(x + 1, 4, 1, 6, '#6f9a4a'); r(x, 1, 3, 3, c); r(x + 1, 2, 1, 1, '#ffd37a'); } });
  // Small stones: a couple of pebbles.
  mk('plant.stones', 10, 6, (r) => { r(1, 2, 4, 3, '#6b6f78'); r(6, 3, 3, 2, '#6b6f78'); r(1, 2, 2, 1, '#8a8f99'); r(1, 5, 8, 1, 'rgba(0,0,0,0.2)'); });
}
