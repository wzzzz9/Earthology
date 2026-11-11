import Phaser from 'phaser';
import * as P from '../art/palette';
import { alpha, num, snap, SHADOW, SHADOW_SOFT } from '../art/palette';
import { content } from '../content';

/**
 * Placeholder art drawn at runtime, so M2 needs no image files.
 * Replaced by real tiles and sprites in the art milestone (M9).
 *
 * Every colour here is a name from src/art/palette.ts. No hex codes in this file:
 * if a sprite needs a colour the palette lacks, the palette changes first (docs/art/palette.md).
 */

export const TILE = 16;

/**
 * Tileset, 17 tiles in a row (gid 1..17). Palette aims at Iceland: yellow-green
 * tundra grass, moss-covered black lava, grey gravel, glacial blue water, black sand,
 * basalt boulders, ice patches.
 *  1 tundra   2 tundra (tufts)   3 gravel path   4 water   5 basalt boulder (solid)
 *  6 mossy boulder (solid)   7 black sand   8 void   9 moss lava   10 moss lava (dense)
 *  11 ice   12 water edge (light)   13, 14 moss lava   15 chasm   16 hot pool   17 stepping stones
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
    blotch(i, P.OUTLINE, 2, 5, 12, 10); // shadow/base
    blotch(i, P.ROCK_DARK, 2, 3, 12, 10);
    blotch(i, P.ROCK, 4, 4, 6, 4);
    px(i, P.ROCK_LIGHT, [[5, 5, 3, 1]]);
    if (mossy) { blotch(i, P.MOSS, 7, 3, 6, 4); px(i, P.MOSS_LIGHT, [[8, 4, 3, 1], [3, 9, 2, 2]]); }
  };

  // Grass texture: small three-blade tufts (a 'V' of lighter green with a bright tip) and a
  // soft shade pixel under each, instead of single dots. Both tundra tiles share the same base
  // colour so a field of them reads as one meadow, not a checkerboard.
  const tuft = (i: number, x: number, y: number, bright = false) => {
    px(i, P.GRASS_LIGHT, [[x, y, 1, 2], [x + 2, y, 1, 2], [x + 1, y + 1, 1, 1]]);
    if (bright) px(i, P.LEAF_LIGHT, [[x + 2, y, 1, 1]]);
    px(i, P.GRASS_DARK, [[x + 1, y + 2, 1, 1]]);
  };
  // 1 tundra grass: the common ground
  fill(0, P.GRASS); tuft(0, 2, 2, true); tuft(0, 9, 5); tuft(0, 4, 10); tuft(0, 11, 11, true); px(0, P.GRASS_LIGHT, [[13, 2], [7, 13]]);
  // 2 tundra variant: same base, a lighter patch and different tufts
  fill(1, P.GRASS); blotch(1, P.GRASS_LIGHT, 8, 2, 6, 4); tuft(1, 2, 5); tuft(1, 10, 3, true); tuft(1, 6, 11, true); tuft(1, 12, 12); px(1, P.GRASS_DARK, [[4, 14]]);
  // 3 gravel path: grey-brown with pebbles
  fill(2, P.GRAVEL); px(2, P.STONE_PALE, [[3, 5, 2], [10, 10, 2], [7, 13]]); px(2, P.ROCK_LIGHT, [[6, 3], [12, 6], [2, 12], [9, 8]]);
  // 4 glacial water: blue-turquoise with ripples
  fill(3, P.WATER); px(3, P.WATER_LIGHT, [[2, 4, 4], [8, 9, 5], [11, 2, 3]]); px(3, P.WATER_DEEP, [[5, 12, 4], [12, 13, 3]]);
  // 5 basalt boulder (solid)   6 mossy boulder (solid)
  boulder(4, P.GRASS, false);
  boulder(5, P.GRASS, true);
  // 7 black sand: near-black with grey grains
  fill(6, P.ROCK_DARK); px(6, P.ROCK, [[3, 4], [9, 7], [13, 12], [6, 11], [11, 2]]); px(6, P.OUTLINE, [[5, 8], [12, 5], [2, 13]]);
  // 8 void
  fill(7, P.VOID);
  // 9, 10, 13, 14: moss-covered lava, four variants. Real Icelandic moss fields look like
  // soft green pillows with the black rock showing only in thin seams between them, so the
  // tiles are mostly rounded mounds of green with 1px dark cracks, never dark speckle.
  const moss = (i: number, mounds: [number, number, number][], seams: [number, number, number, number][]) => {
    fill(i, P.MOSS_DARK); // moss shade between mounds
    for (const [mx, my, mr] of mounds) {
      // mound: rounded, lit from the upper left
      for (let yy = -mr; yy <= mr; yy++) {
        const half = Math.max(0, Math.round(Math.sqrt(mr * mr - yy * yy)));
        px(i, P.MOSS, [[mx - half, my + yy, half * 2 + 1, 1]]);
      }
      for (let yy = -mr; yy <= 0; yy++) {
        const half = Math.max(0, Math.round(Math.sqrt(mr * mr - yy * yy) * 0.7));
        px(i, P.MOSS_LIGHT, [[mx - half - 1, my + yy - 1, half * 2 + 1, 1]]);
      }
      px(i, P.LEAF_LIGHT, [[mx - 1, my - mr, 2, 1]]);
    }
    px(i, P.ROCK_DARK, seams);
  };
  moss(8, [[4, 4, 4], [12, 5, 3], [5, 12, 3], [12, 12, 3]], [[8, 0, 1, 6], [0, 8, 5, 1], [9, 9, 1, 7]]);
  moss(9, [[6, 5, 5], [13, 11, 3], [3, 13, 2]], [[12, 0, 1, 5], [0, 11, 2, 1], [8, 13, 3, 1]]);
  moss(12, [[3, 3, 3], [11, 4, 4], [7, 12, 4]], [[7, 1, 1, 4], [14, 9, 2, 1], [1, 10, 1, 5]]);
  moss(13, [[8, 7, 6], [2, 13, 2], [14, 2, 2]], [[0, 4, 4, 1], [12, 13, 4, 1], [2, 0, 1, 3]]);
  // 15 chasm (the rift): near-black with a cold blue seam. 16 hot pool: milky turquoise with a pale rim.
  fill(14, P.VOID); px(14, P.NAVY, [[6, 2, 1, 5], [9, 9, 1, 6], [4, 12, 1, 3]]);
  px(14, P.ROCK, [[0, 0, 2, 16], [14, 0, 2, 16]]); px(14, P.ROCK_LIGHT, [[0, 0, 1, 16], [15, 0, 1, 16]]); px(14, P.ROCK_DARK, [[2, 0, 1, 16], [13, 0, 1, 16]]);
  fill(15, P.WATER_LIGHT); px(15, P.ICE, [[2, 3, 5, 2], [8, 9, 6, 2], [5, 12, 3, 1], [11, 2, 3, 1]]); px(15, P.WHITE, [[4, 4, 2, 1], [10, 10, 2, 1]]);
  // 17 stepping stones: grass with two or three flat grey stones, for side paths.
  fill(16, P.GRASS); tuft(16, 12, 1); px(16, P.GRASS_LIGHT, [[7, 14, 2, 1]]);
  for (const [x, y, w, h] of [[2, 3, 6, 5], [9, 9, 6, 5], [3, 11, 3, 2]]) { px(16, P.ROCK_LIGHT, [[x, y, w, h]]); px(16, P.STONE_PALE, [[x + 1, y + 1, w - 2, h - 2]]); px(16, P.ROCK, [[x, y + h - 1, w, 1]]); }
  // 11 ice / old snow: white-blue
  fill(10, P.ICE); px(10, P.WHITE, [[2, 2, 5, 3], [9, 9, 5, 4]]); px(10, P.WATER_LIGHT, [[8, 3, 4, 2], [2, 10, 4, 2], [12, 6, 2, 2]]);
  // 12 water edge: lighter shallow water
  fill(11, P.WATER_LIGHT); px(11, P.ICE, [[2, 3, 5, 2], [9, 10, 5, 2]]); px(11, P.WATER, [[7, 7, 4, 2], [1, 12, 5, 2]]);
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

export const PLAYER_LOOK: FigureLook = { coat: P.ORANGE, coatDark: P.RED_DARK, hair: P.WOOD_DARK, skin: P.SKIN, hat: P.NAVY, legs: P.ROCK_DARK };
export const DISGUISES: Record<string, FigureLook> = {
  a: PLAYER_LOOK,
  b: { coat: P.BLUE, coatDark: P.BLUE_DARK, hair: P.WOOD, skin: P.SKIN, hat: null, headband: P.YELLOW, legs: P.NAVY, hairLong: true },
};

export function makePlaceholderPlayer(scene: Phaser.Scene, key = 'player', look: FigureLook = PLAYER_LOOK): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, PLAYER_W * 8, PLAYER_H);
  if (!tex) return;
  const ctx = tex.getContext();
  const OUT = P.OUTLINE;
  // Looks can come from content JSON (NPC coats), so snap every colour onto the palette.
  const L = {
    coat: snap(look.coat), coatDark: snap(look.coatDark), hair: snap(look.hair), skin: snap(look.skin), legs: snap(look.legs),
    hat: look.hat ? snap(look.hat) : null, headband: look.headband ? snap(look.headband) : null, hairLong: look.hairLong,
  };
  const dirs = ['down', 'up', 'left', 'right'] as const;
  dirs.forEach((dir, d) => {
    for (let step = 0; step < 2; step++) {
      const i = d * 2 + step;
      const ox = i * PLAYER_W;
      const bob = step === 1 ? 1 : 0;
      const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(ox + x, y, w, h); };

      // shadow
      r(4, 22, 8, 2, SHADOW);
      // legs (outline then fill); the step frame lifts one leg
      r(4, 17, 3, 6 - bob, OUT); r(9, 17, 3, 6 - bob, OUT);
      r(5, 17, 1, 5 - bob, L.legs); r(10, 17, 1, 5 - bob, L.legs);
      if (step === 1) { r(4, 21, 3, 1, OUT); }
      // body
      r(3, 12 + bob, 10, 6, OUT);
      r(4, 13 + bob, 8, 4, L.coat);
      r(4, 16 + bob, 8, 1, L.coatDark);
      // yoke band (Icelandic sweater nod)
      r(4, 13 + bob, 8, 1, P.CREAM); r(5, 14 + bob, 1, 1, P.CREAM); r(7, 14 + bob, 1, 1, P.CREAM); r(9, 14 + bob, 1, 1, P.CREAM);
      // arms
      r(2, 13 + bob, 2, 4, OUT); r(12, 13 + bob, 2, 4, OUT);
      r(3, 14 + bob, 1, 2, L.coat); r(12, 14 + bob, 1, 2, L.coat);
      // head: outline, skin, hair
      r(3, 2 + bob, 10, 11, OUT);
      r(4, 3 + bob, 8, 9, L.skin);
      if (dir === 'up') {
        r(4, 3 + bob, 8, 7, L.hair);
        if (L.hairLong) r(4, 10 + bob, 8, 4, L.hair);
      } else {
        r(4, 3 + bob, 8, 3, L.hair);
        r(4, 6 + bob, 1, 3, L.hair); r(11, 6 + bob, 1, 3, L.hair);
        if (dir === 'left') r(10, 6 + bob, 2, 2, L.hair);
        if (dir === 'right') r(4, 6 + bob, 2, 2, L.hair);
        if (L.hairLong) { r(3, 8 + bob, 2, 7, OUT); r(11, 8 + bob, 2, 7, OUT); r(4, 9 + bob, 1, 5, L.hair); r(11, 9 + bob, 1, 5, L.hair); }
      }
      if (L.headband) { r(4, 5 + bob, 8, 1, L.headband); r(5, 4 + bob, 1, 1, L.headband); r(10, 4 + bob, 1, 1, L.headband); }
      // hat (the disguise): a beanie over the hair
      if (L.hat) {
        r(3, 1 + bob, 10, 4, OUT);
        r(4, 2 + bob, 8, 2, L.hat);
        r(4, 4 + bob, 8, 1, P.CREAM);
      }
      // eyes
      if (dir === 'down') { r(5, 8 + bob, 2, 2, OUT); r(9, 8 + bob, 2, 2, OUT); r(5, 8 + bob, 1, 1, P.WHITE); r(9, 8 + bob, 1, 1, P.WHITE); }
      if (dir === 'left') { r(5, 8 + bob, 2, 2, OUT); r(5, 8 + bob, 1, 1, P.WHITE); }
      if (dir === 'right') { r(9, 8 + bob, 2, 2, OUT); r(10, 8 + bob, 1, 1, P.WHITE); }
      // cheeks
      if (dir === 'down') { r(4, 10 + bob, 1, 1, P.BLUSH); r(11, 10 + bob, 1, 1, P.BLUSH); }

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
  ctx.fillStyle = P.ROCK_LIGHT;
  ctx.beginPath(); ctx.ellipse(24, 22, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.STONE_PALE;
  ctx.beginPath(); ctx.ellipse(24, 20, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.WATER_LIGHT;
  ctx.beginPath(); ctx.ellipse(24, 15, 9, 8, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = P.LIGHT;
  for (const x of [10, 18, 30, 38]) ctx.fillRect(x, 23, 2, 2);
  ctx.fillStyle = P.ROCK;
  ctx.fillRect(14, 28, 4, 3); ctx.fillRect(30, 28, 4, 3);
  tex.refresh();
}

/** Small 4-point sparkle shown over things you can look at. */
export function makeSparkle(scene: Phaser.Scene, key = 'sparkle'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 7, 7);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = P.LIGHT;
  ctx.fillRect(3, 0, 1, 7); ctx.fillRect(0, 3, 7, 1);
  ctx.fillStyle = P.WHITE;
  ctx.fillRect(2, 2, 3, 3);
  tex.refresh();
}

/** Simple props: signpost and cairn, 16x16 each. */
export function makePlaceholderProps(scene: Phaser.Scene): void {
  if (!scene.textures.exists('prop.signpost')) {
    const t = scene.textures.createCanvas('prop.signpost', 16, 16)!;
    const c = t.getContext();
    c.fillStyle = P.WOOD_DARK; c.fillRect(7, 4, 2, 12);
    c.fillStyle = P.WOOD_LIGHT; c.fillRect(3, 3, 11, 5);
    c.fillStyle = P.WOOD_DARK; c.fillRect(11, 4, 2, 1); c.fillRect(5, 5, 6, 1);
    t.refresh();
  }
  if (!scene.textures.exists('prop.cairn')) {
    const t = scene.textures.createCanvas('prop.cairn', 16, 16)!;
    const c = t.getContext();
    c.fillStyle = P.ROCK_DARK; c.fillRect(2, 10, 12, 5);
    c.fillStyle = P.ROCK; c.fillRect(4, 6, 8, 4);
    c.fillStyle = P.ROCK_LIGHT; c.fillRect(6, 3, 4, 3);
    c.fillStyle = P.MOSS_LIGHT; c.fillRect(3, 10, 2, 1); c.fillRect(10, 7, 2, 1);
    c.fillStyle = P.OUTLINE; c.fillRect(2, 14, 12, 1);
    t.refresh();
  }
}

/** A rock sketch for the notebook and the lab: a blob with a pattern. 48x40. */
export function makeSampleSketch(scene: Phaser.Scene, key: string, color: string, pattern: 'speckle' | 'shine' | 'holes' | 'plain'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 48, 40);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = snap(color);
  ctx.beginPath();
  ctx.moveTo(6, 26); ctx.lineTo(12, 10); ctx.lineTo(26, 5); ctx.lineTo(40, 12); ctx.lineTo(44, 26); ctx.lineTo(34, 36); ctx.lineTo(14, 36); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.WHITE; ctx.lineWidth = 1; ctx.stroke();
  if (pattern === 'speckle') { ctx.fillStyle = P.ROCK_LIGHT; for (const [x, y] of [[14, 18], [22, 12], [30, 22], [20, 28], [34, 30], [26, 20]]) ctx.fillRect(x, y, 2, 2); }
  if (pattern === 'shine') { ctx.fillStyle = P.WATER_LIGHT; ctx.fillRect(16, 10, 10, 2); ctx.fillRect(14, 13, 4, 2); ctx.fillStyle = P.WHITE; ctx.fillRect(18, 11, 4, 1); }
  if (pattern === 'holes') { ctx.fillStyle = P.ROCK; for (const [x, y] of [[12, 20], [18, 12], [24, 24], [30, 14], [36, 24], [22, 32], [32, 32], [16, 28], [28, 8]]) ctx.fillRect(x, y, 3, 3); }
  tex.refresh();
}

/** Small ground rock you can pick up, 12x10. */
export function makePickupRock(scene: Phaser.Scene, key: string, color: string): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 12, 10);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = snap(color); ctx.fillRect(2, 3, 8, 6); ctx.fillRect(4, 1, 5, 2);
  ctx.fillStyle = alpha(P.WHITE, 0.33); ctx.fillRect(4, 3, 3, 1);
  ctx.fillStyle = alpha(P.OUTLINE, 0.33); ctx.fillRect(2, 8, 8, 1);
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
  const OUT = P.OUTLINE;
  r(3, 18, 10, 2, SHADOW);
  // antennae
  r(4, 0, 1, 4, OUT); r(11, 0, 1, 4, OUT); r(3, 0, 2, 1, P.LIGHT); r(11, 0, 2, 1, P.LIGHT);
  // body
  r(2, 4, 12, 13, OUT); r(1, 6, 14, 9, OUT);
  r(3, 5, 10, 11, P.TEAL); r(2, 7, 12, 7, P.TEAL);
  r(3, 13, 10, 3, P.TEAL_DARK);
  // eye band
  r(3, 7, 10, 4, P.WHITE); r(4, 8, 2, 2, OUT); r(10, 8, 2, 2, OUT); r(4, 8, 1, 1, P.WATER_LIGHT); r(10, 8, 1, 1, P.WATER_LIGHT);
  // mouth
  r(7, 12, 2, 1, OUT);
  // feet
  r(3, 16, 4, 2, OUT); r(9, 16, 4, 2, OUT); r(4, 16, 2, 1, P.TEAL_DARK); r(10, 16, 2, 1, P.TEAL_DARK);
  tex.refresh();
}

/** The professor's true form, 16x28: taller, violet, a glasses line across the eye band, a hair-bun antenna. */
export function makeAlienTeacher(scene: Phaser.Scene, key = 'alien.teacher'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 16, 28);
  if (!tex) return;
  const ctx = tex.getContext();
  const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const OUT = P.OUTLINE;
  r(3, 26, 10, 2, SHADOW);
  r(7, 0, 2, 3, OUT); r(6, 0, 4, 2, P.LILAC); // bun
  r(2, 3, 12, 22, OUT); r(1, 6, 14, 12, OUT);
  r(3, 4, 10, 20, P.VIOLET); r(2, 7, 12, 10, P.VIOLET);
  r(3, 18, 10, 6, P.VIOLET_DARK); // long coat
  r(3, 7, 10, 4, P.WHITE); r(3, 8, 10, 1, OUT); // eye band with glasses line
  r(4, 8, 2, 2, OUT); r(10, 8, 2, 2, OUT); r(4, 8, 1, 1, P.LIGHT); r(10, 8, 1, 1, P.LIGHT);
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
  g.fillStyle(num(P.WATER_LIGHT), 0.10); g.fillCircle(x, y, r * 1.16);
  g.fillStyle(num(P.ICE), 0.12); g.fillCircle(x, y, r * 1.08);
  // ocean, lighter toward the sunlit upper-left
  g.fillStyle(num(P.BLUE_DARK), 1); g.fillCircle(x, y, r);
  g.fillStyle(num(P.BLUE), 1); g.fillCircle(x - 4 * k, y - 4 * k, r * 0.9);
  g.fillStyle(num(P.WATER), 1); g.fillCircle(x - 10 * k, y - 10 * k, r * 0.62);
  // continents: irregular shapes, clipped by redrawing the ocean edge afterwards
  const land = (pts: [number, number][], color: number) => {
    g.fillStyle(color, 1);
    g.fillPoints(pts.map(([px, py]) => new Phaser.Math.Vector2(x + px * k, y + py * k)), true);
  };
  land([[-34, -22], [-18, -30], [-6, -24], [-10, -10], [-20, 2], [-30, -2], [-38, -12]], num(P.MOSS));
  land([[-14, 6], [-4, 2], [4, 10], [0, 26], [-8, 30], [-14, 20]], num(P.MOSS_LIGHT));
  land([[6, -34], [26, -30], [36, -16], [30, -4], [16, -6], [8, -14], [4, -24]], num(P.MOSS));
  land([[14, 4], [28, 8], [30, 20], [20, 26], [12, 16]], num(P.MOSS_LIGHT));
  land([[-2, -8], [8, -10], [10, 0], [2, 2]], num(P.GRASS));
  // deserts and mountains as small accents
  g.fillStyle(num(P.WOOD_LIGHT), 1); g.fillCircle(x + 20 * k, y - 18 * k, 4 * k); g.fillCircle(x - 24 * k, y - 14 * k, 3 * k);
  g.fillStyle(num(P.MOSS_DARK), 1); g.fillCircle(x - 8 * k, y + 18 * k, 3 * k);
  // ice caps
  g.fillStyle(num(P.ICE), 1); g.fillEllipse(x + 2 * k, y - r + 5 * k, 30 * k, 10 * k); g.fillEllipse(x - 4 * k, y + r - 4 * k, 26 * k, 7 * k);
  // clouds
  g.fillStyle(num(P.WHITE), 0.75);
  for (const [cx, cy, w] of [[-26, -4, 22], [6, -26, 16], [22, 10, 18], [-10, 28, 14], [-2, 12, 10], [30, -8, 8]]) {
    g.fillEllipse(x + cx * k, y + cy * k, w * k, 4.5 * k); g.fillEllipse(x + (cx + 4) * k, y + (cy - 2) * k, w * 0.5 * k, 3.5 * k);
  }
  // night side: a dark disc offset to the lower-right, clipped to the globe
  g.fillStyle(num(P.VOID), 0.35); g.fillCircle(x + 14 * k, y + 12 * k, r * 0.95);
  // re-trim the edge so nothing pokes out of the disc
  g.lineStyle(3 * k, num(P.VOID), 0.0);
  // highlight
  g.fillStyle(num(P.WHITE), 0.35); g.fillEllipse(x - 20 * k, y - 26 * k, 12 * k, 6 * k);
  g.fillStyle(num(P.WHITE), 0.6); g.fillEllipse(x - 22 * k, y - 28 * k, 5 * k, 3 * k);
  return g;
}

/**
 * Small Icelandic trees as props: birch (white trunk, airy canopy), rowan (round canopy,
 * red berries) and a low willow bush. About two character heights, not more; Iceland is
 * not a forest. Each is 32x48 with the trunk base at the bottom centre.
 */
export function makeTrees(scene: Phaser.Scene): void {
  const OUT = P.OUTLINE;
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
  // Birch: airy, yellow-side greens (the grass family) over a cream trunk.
  mk('tree.birch', (_c, r) => {
    r(17, 36, 6, 36, OUT); r(18, 36, 4, 35, P.CREAM); for (const y of [42, 50, 58, 65]) r(18 + (y % 3), y, 2, 1, P.ROCK);
    canopy(r, 20, 22, 18, P.GRASS, P.GRASS_LIGHT, P.LEAF_LIGHT);
    canopy(r, 12, 30, 9, P.GRASS, P.GRASS_LIGHT, P.LEAF_LIGHT);
    canopy(r, 29, 31, 8, P.GRASS, P.GRASS_LIGHT, P.LEAF_LIGHT);
    r(10, 69, 20, 3, SHADOW_SOFT);
  }, 40, 72);
  // Rowan: denser, blue-side greens (the moss family) with red berries.
  mk('tree.rowan', (_c, r) => {
    r(17, 34, 6, 38, OUT); r(18, 34, 4, 37, P.WOOD_DARK); r(18, 40, 1, 24, P.WOOD);
    canopy(r, 20, 20, 19, P.MOSS_DARK, P.MOSS, P.MOSS_LIGHT);
    canopy(r, 10, 30, 8, P.MOSS_DARK, P.MOSS, P.MOSS_LIGHT);
    canopy(r, 31, 29, 8, P.MOSS_DARK, P.MOSS, P.MOSS_LIGHT);
    for (const [x, y] of [[9, 16], [23, 8], [31, 20], [14, 26], [20, 16], [27, 30], [8, 30]]) r(x, y, 2, 2, P.RED);
    r(9, 69, 22, 3, SHADOW_SOFT);
  }, 40, 72);
  mk('tree.willow', (_c, r) => {
    canopy(r, 16, 20, 9, P.GRASS_DARK, P.GRASS, P.LEAF_LIGHT);
    r(13, 27, 6, 3, OUT); r(14, 27, 4, 2, P.WOOD_DARK);
    r(8, 28, 16, 2, SHADOW_SOFT);
  }, 32, 32);
}

/**
 * Town and landmark props. Each is drawn once into a canvas texture at the listed size;
 * the base of the sprite is its bottom edge, centred.
 */
export function makeIcelandProps(scene: Phaser.Scene): void {
  const OUT = P.OUTLINE;
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
    r(6, 38, 36, 2, SHADOW_SOFT);
    r(3, 14, 42, 25, OUT); r(4, 15, 40, 23, wall); r(4, 30, 40, 8, wallDark);
    for (let x = 6; x < 44; x += 4) r(x, 15, 1, 23, wallDark); // corrugation
    r(1, 4, 46, 11, OUT); r(2, 5, 44, 9, roof); r(2, 13, 44, 1, P.WHITE);
    for (let x = 4; x < 44; x += 6) r(x, 5, 1, 9, alpha(P.WHITE, 0.15));
    r(20, 0, 6, 6, OUT); r(21, 1, 4, 5, P.ROCK_LIGHT); // chimney
    r(21, 22, 7, 16, OUT); r(22, 23, 5, 15, P.WOOD_DARK); r(26, 30, 1, 1, P.LIGHT); // door
    for (const x of [8, 34]) { r(x, 20, 8, 8, OUT); r(x + 1, 21, 6, 6, P.YELLOW); r(x + 3, 21, 1, 6, P.WHITE); r(x + 1, 24, 6, 1, P.WHITE); }
  });
  house('bld.house-red', P.RED, P.RED_DARK, P.NAVY);
  house('bld.house-blue', P.BLUE, P.BLUE_DARK, P.NAVY);
  house('bld.house-yellow', P.YELLOW, P.YELLOW_DARK, P.NAVY);
  house('bld.house-green', P.MOSS, P.MOSS_DARK, P.NAVY);
  // White church with a red roof and a small tower. 40x56.
  mk('bld.church', 40, 56, (r) => {
    r(6, 54, 28, 2, SHADOW_SOFT);
    r(5, 26, 30, 29, OUT); r(6, 27, 28, 27, P.WHITE); r(6, 48, 28, 6, P.CREAM);
    r(3, 16, 34, 11, OUT); r(4, 17, 32, 9, P.RED);
    r(14, 2, 12, 16, OUT); r(15, 3, 10, 15, P.WHITE); r(13, 0, 14, 4, OUT); r(14, 1, 12, 2, P.RED);
    r(19, 0, 2, 3, OUT); r(19, 6, 2, 6, OUT); r(18, 8, 4, 1, OUT); // cross and slit
    r(17, 38, 7, 16, OUT); r(18, 39, 5, 15, P.WOOD_DARK);
    for (const x of [9, 27]) { r(x, 32, 5, 10, OUT); r(x + 1, 33, 3, 8, P.WATER_LIGHT); }
  });
  // Small fishing boat, blue hull, in the water. 24x16.
  mk('prop.boat', 24, 16, (r) => {
    r(1, 8, 22, 7, OUT); r(2, 9, 20, 5, P.BLUE); r(2, 9, 20, 1, P.WHITE); r(4, 13, 16, 1, P.BLUE_DARK);
    r(8, 2, 8, 7, OUT); r(9, 3, 6, 5, P.WHITE); r(10, 4, 4, 2, P.WATER_LIGHT); r(14, 0, 2, 3, OUT);
  });
  // Fish drying racks: wooden frame with fish hanging. 32x24.
  mk('prop.racks', 32, 24, (r) => {
    r(2, 22, 28, 2, SHADOW_SOFT);
    for (const x of [2, 15, 28]) { r(x, 4, 2, 19, OUT); r(x, 5, 1, 17, P.WOOD_DARK); }
    r(1, 4, 30, 2, OUT); r(1, 12, 30, 2, OUT); r(2, 5, 28, 1, P.WOOD); r(2, 13, 28, 1, P.WOOD);
    for (let x = 5; x < 28; x += 4) { r(x, 6, 2, 6, P.CREAM); r(x, 14, 2, 6, P.CREAM); r(x, 6, 1, 1, OUT); r(x, 14, 1, 1, OUT); }
  });
  // Hot-water pipe running along the ground, 64x10, with a warm glow line.
  mk('prop.pipe', 64, 10, (r) => {
    r(0, 2, 64, 7, OUT); r(1, 3, 62, 5, P.ROCK_LIGHT); r(1, 3, 62, 1, P.STONE_PALE); r(1, 6, 62, 1, P.ROCK);
    for (const x of [8, 24, 40, 56]) { r(x, 1, 4, 9, OUT); r(x + 1, 2, 2, 7, P.ROCK); }
    r(0, 9, 64, 1, alpha(P.LIGHT, 0.35));
  });
  // Sheep sorting pens: a ring of stone walls split like a pie. 48x40.
  mk('prop.pen', 48, 40, (r, ctx) => {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(24, 22, 21, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = P.ROCK_LIGHT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(24, 22, 21, 14, 0, 0, Math.PI * 2); ctx.stroke();
    for (const a of [0, 1.2, 2.4, 3.6, 4.8]) { ctx.strokeStyle = P.ROCK_LIGHT; ctx.beginPath(); ctx.moveTo(24, 22); ctx.lineTo(24 + Math.cos(a) * 20, 22 + Math.sin(a) * 13); ctx.stroke(); }
    r(22, 8, 4, 4, OUT); r(23, 9, 2, 2, P.WHITE); // one sheep left behind
  });
  // Basalt columns: a wall of six-sided grey pillars. 64x32.
  mk('prop.columns-wall', 64, 32, (r) => {
    r(0, 30, 64, 2, SHADOW);
    for (let i = 0; i < 8; i++) {
      const x = i * 8; const top = 2 + ((i * 5) % 7);
      r(x, top, 8, 30 - top, OUT); r(x + 1, top + 1, 6, 28 - top, i % 2 ? P.ROCK_DARK : P.ROCK); r(x + 1, top + 1, 6, 2, P.STONE_PALE); r(x + 1, top + 1, 2, 27 - top, P.ROCK_LIGHT);
    }
  });
  // Glacier face: a wall of blue-white ice with a dusty top. 96x28.
  mk('prop.glacier-face', 96, 28, (r) => {
    r(0, 26, 96, 2, SHADOW_SOFT);
    r(0, 4, 96, 23, OUT); r(1, 5, 94, 21, P.ICE); r(1, 5, 94, 3, P.STONE_PALE); r(1, 20, 94, 6, P.WATER_LIGHT);
    for (let x = 6; x < 92; x += 11) { r(x, 8, 2, 14, P.WATER); r(x + 5, 12, 1, 10, P.WATER_LIGHT); }
    for (let x = 0; x < 96; x += 7) r(x, 2, 4, 3, OUT), r(x + 1, 3, 2, 2, P.ICE);
  });
  // Geyser mouth (16x10), its water column (8x48, scaled by the game), and a steam puff (10x8).
  mk('fx.geyser-base', 16, 10, (r) => { r(0, 4, 16, 6, OUT); r(1, 5, 14, 4, P.STONE_PALE); r(5, 2, 6, 4, OUT); r(6, 3, 4, 3, P.WATER_LIGHT); });
  mk('fx.geyser-column', 10, 48, (r) => { r(2, 0, 6, 48, alpha(P.ICE, 0.85)); r(0, 0, 10, 10, alpha(P.WHITE, 0.6)); r(4, 0, 2, 48, P.WHITE); });
  mk('fx.steam', 10, 8, (r) => { r(1, 3, 8, 4, alpha(P.WHITE, 0.55)); r(3, 1, 5, 3, alpha(P.WHITE, 0.55)); r(0, 5, 3, 2, alpha(P.WHITE, 0.4)); });
  // Waterfall: two frames of falling water with foam at the foot, 16x32 each.
  for (let f = 0; f < 2; f++) mk(`fx.waterfall${f}`, 32, 36, (r) => {
    r(0, 0, 32, 32, P.WATER);
    for (let i = 0; i < 11; i++) r(1 + i * 3 + (f ? 1 : 0), 0, 1, 32, P.WATER_LIGHT);
    for (let y = f ? 2 : 6; y < 30; y += 8) { r(4 + (f ? 4 : 0), y, 2, 3, P.WHITE); r(20 - (f ? 4 : 0), y + 3, 2, 3, P.WHITE); }
    r(0, 29, 32, 7, P.ICE); r(2, 31, 28, 3, P.WHITE); r(0, 0, 32, 2, P.WATER_LIGHT);
  });
  // Fences and yard clutter, all with outlines. Fence pieces are one tile wide.
  mk('prop.fence-h', 16, 12, (r) => { r(0, 4, 16, 2, OUT); r(0, 8, 16, 2, OUT); r(1, 5, 14, 1, P.WOOD); r(1, 9, 14, 1, P.WOOD); for (const x of [2, 12]) { r(x, 0, 3, 12, OUT); r(x + 1, 1, 1, 10, P.WOOD_LIGHT); } });
  mk('prop.fence-v', 8, 20, (r) => { r(2, 0, 3, 20, OUT); r(3, 1, 1, 18, P.WOOD_LIGHT); r(1, 6, 6, 2, OUT); r(1, 13, 6, 2, OUT); r(2, 7, 4, 1, P.WOOD); r(2, 14, 4, 1, P.WOOD); });
  mk('prop.planter', 16, 14, (r) => { r(1, 7, 14, 6, OUT); r(2, 8, 12, 4, P.WOOD); r(2, 8, 12, 1, P.WOOD_LIGHT); r(3, 3, 10, 5, P.MOSS_DARK); for (const [x, c] of [[4, P.PINK], [8, P.YELLOW], [12, P.WHITE]] as [number, string][]) r(x, 2, 2, 2, c); });
  mk('prop.barrel', 12, 14, (r) => { r(1, 1, 10, 12, OUT); r(2, 2, 8, 10, P.WOOD); r(2, 4, 8, 1, P.ROCK); r(2, 9, 8, 1, P.ROCK); r(3, 2, 1, 10, P.WOOD_LIGHT); });
  mk('prop.lantern', 8, 20, (r) => { r(3, 6, 2, 14, OUT); r(1, 0, 6, 7, OUT); r(2, 1, 4, 5, P.YELLOW); r(3, 2, 2, 3, P.LIGHT); r(1, 18, 6, 2, OUT); });
  mk('prop.woodpile', 16, 12, (r) => { r(0, 2, 16, 10, OUT); for (const [x, y] of [[1, 7], [6, 7], [11, 7], [3, 3], [8, 3]]) { r(x, y, 4, 4, P.WOOD); r(x + 1, y + 1, 2, 2, P.CREAM); } });
  mk('prop.bench', 20, 10, (r) => { r(0, 3, 20, 3, OUT); r(1, 4, 18, 1, P.WOOD_LIGHT); r(2, 6, 2, 4, OUT); r(16, 6, 2, 4, OUT); r(0, 0, 20, 2, OUT); r(1, 1, 18, 1, P.WOOD_LIGHT); });
  mk('prop.well', 20, 24, (r) => { r(2, 14, 16, 9, OUT); r(3, 15, 14, 7, P.ROCK_LIGHT); r(3, 15, 14, 1, P.STONE_PALE); r(4, 2, 2, 13, OUT); r(14, 2, 2, 13, OUT); r(2, 0, 16, 4, OUT); r(3, 1, 14, 2, P.RED); r(9, 6, 2, 8, OUT); });
  mk('prop.mailbox', 8, 16, (r) => { r(3, 6, 2, 10, OUT); r(0, 0, 8, 7, OUT); r(1, 1, 6, 5, P.RED); r(5, 2, 1, 2, P.YELLOW); });
  // Washing line between two posts, three bits of laundry. 32x20.
  mk('prop.washing', 32, 20, (r) => {
    r(1, 2, 2, 18, OUT); r(29, 2, 2, 18, OUT); r(2, 4, 28, 1, OUT);
    for (const [x, w, c] of [[5, 6, P.WHITE], [13, 7, P.BLUE], [22, 6, P.PINK]] as [number, number, string][]) { r(x - 1, 4, w + 2, 10, OUT); r(x, 5, w, 8, c); r(x, 5, w, 1, alpha(P.WHITE, 0.4)); }
    r(14, 13, 5, 3, P.BLUE_DARK);
  });
  // Chicken coop: a little hut with a ramp and two hens pecking. 28x20.
  mk('prop.coop', 28, 20, (r) => {
    r(2, 18, 24, 2, SHADOW_SOFT);
    r(1, 6, 18, 13, OUT); r(2, 7, 16, 11, P.WOOD); r(2, 7, 16, 1, P.WOOD_LIGHT);
    r(0, 2, 20, 5, OUT); r(1, 3, 18, 3, P.RED_DARK); r(7, 11, 5, 7, OUT); r(8, 12, 3, 6, P.OUTLINE);
    r(12, 14, 8, 2, P.WOOD_LIGHT); r(13, 15, 8, 2, P.WOOD_LIGHT);
    for (const x of [20, 24]) { r(x, 12, 5, 5, OUT); r(x + 1, 13, 3, 3, P.WHITE); r(x + 3, 12, 1, 1, P.RED); r(x + 4, 14, 1, 1, P.YELLOW); r(x + 1, 17, 1, 2, P.YELLOW); }
  });
  // One hen, for scattering about a yard. 8x8.
  mk('prop.hen', 8, 8, (r) => { r(1, 2, 6, 5, OUT); r(2, 3, 4, 3, P.WHITE); r(5, 1, 2, 2, OUT); r(6, 2, 1, 1, P.YELLOW); r(5, 0, 1, 1, P.RED); r(2, 6, 1, 2, P.YELLOW); r(4, 6, 1, 2, P.YELLOW); });
  // Flower bed: dark soil edged with stones, bright flowers. 24x12.
  mk('prop.flowerbed', 24, 12, (r) => {
    r(0, 4, 24, 8, OUT); r(1, 5, 22, 6, P.WOOD_DARK); for (let x = 1; x < 23; x += 3) r(x, 10, 2, 1, P.STONE_PALE);
    for (const [x, c] of [[2, P.PINK], [6, P.YELLOW], [10, P.WHITE], [14, P.VIOLET], [18, P.ORANGE]] as [number, string][]) { r(x + 1, 3, 1, 4, P.MOSS_DARK); r(x, 1, 3, 3, c); r(x + 1, 2, 1, 1, P.LIGHT); }
  });
  // Notice board: two posts, a roof, papers pinned up. 20x22.
  mk('prop.board', 20, 22, (r) => {
    r(2, 10, 2, 12, OUT); r(16, 10, 2, 12, OUT); r(0, 2, 20, 16, OUT); r(1, 3, 18, 14, P.WOOD); r(0, 1, 20, 2, P.WOOD_DARK);
    r(3, 5, 5, 6, P.WHITE); r(9, 5, 7, 4, P.CREAM); r(4, 12, 6, 4, P.CREAM); r(11, 11, 5, 5, P.WHITE);
    r(4, 6, 3, 1, P.ROCK); r(10, 6, 5, 1, P.ROCK); r(5, 13, 4, 1, P.ROCK); r(12, 12, 3, 1, P.ROCK); r(5, 5, 1, 1, P.RED); r(12, 11, 1, 1, P.BLUE);
  });
  // Rowing boat pulled up on the sand, oars inside. 28x14.
  mk('prop.rowboat', 28, 14, (r) => {
    r(2, 12, 24, 2, SHADOW_SOFT);
    r(1, 4, 26, 8, OUT); r(2, 5, 24, 6, P.RED); r(2, 5, 24, 1, P.WHITE); r(4, 9, 20, 2, P.RED_DARK);
    r(6, 7, 1, 3, OUT); r(13, 7, 1, 3, OUT); r(20, 7, 1, 3, OUT); r(3, 2, 22, 2, P.WOOD_LIGHT); r(3, 2, 22, 1, OUT);
  });
  // Pier planks: a short wooden walkway over water, 16x16 tile-sized prop.
  mk('prop.pier', 16, 16, (r) => { r(0, 0, 16, 16, P.WOOD); for (let y = 0; y < 16; y += 4) r(0, y, 16, 1, P.WOOD_DARK); r(0, 0, 1, 16, OUT); r(15, 0, 1, 16, OUT); });
}

/** Low plants scattered on the ground: lupine, cotton grass, a shrub, a grass tuft. No collision. */
export function makePlants(scene: Phaser.Scene): void {
  const OUT = P.OUTLINE;
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
    r(2, 12, 10, 4, P.MOSS_DARK); r(1, 13, 12, 2, P.MOSS); r(3, 11, 2, 1, P.MOSS_LIGHT); r(9, 11, 2, 1, P.MOSS_LIGHT);
    for (const [x, top] of [[3, 3], [6, 0], [9, 2]]) { r(x, top, 3, 12 - top, P.VIOLET); r(x + 1, top, 1, 12 - top, P.LILAC); r(x, top, 1, 1, OUT); r(x + 2, top + 2, 1, 1, P.WHITE); }
  });
  // Cotton grass: thin stems with white tufts.
  mk('plant.cotton', 12, 14, (r) => {
    for (const [x, top] of [[2, 4], [6, 1], [9, 5]]) { r(x + 1, top + 3, 1, 11 - top, P.GRASS_LIGHT); r(x, top, 3, 3, P.ICE); r(x + 1, top, 1, 1, P.WHITE); }
    r(1, 12, 10, 2, P.GRASS);
  });
  // Low shrub: a rounded green mound, lit on top, shaded underneath.
  mk('plant.shrub', 16, 12, (r) => {
    r(1, 4, 14, 7, OUT); r(2, 5, 12, 5, P.MOSS); r(3, 3, 10, 2, OUT); r(4, 4, 8, 2, P.MOSS_LIGHT); r(5, 4, 3, 1, P.LEAF_LIGHT); r(2, 9, 12, 2, P.MOSS_DARK);
  });
  // Grass tuft: a few blades.
  mk('plant.tuft', 10, 8, (r) => {
    for (const [x, top] of [[1, 3], [3, 1], [5, 0], [7, 2]]) r(x, top, 1, 8 - top, P.LEAF_LIGHT);
    r(2, 5, 6, 1, P.GRASS_LIGHT); r(8, 4, 1, 4, P.GRASS_LIGHT);
  });
  // Buttercups: a spray of small yellow flowers.
  mk('plant.buttercup', 12, 10, (r) => { for (const [x, top] of [[1, 2], [4, 0], [7, 3], [9, 1]]) { r(x + 1, top + 2, 1, 8 - top, P.GRASS); r(x, top, 3, 2, P.YELLOW); r(x + 1, top, 1, 1, P.LIGHT); } r(2, 8, 8, 2, P.GRASS_LIGHT); });
  // Moss campion: a low pink cushion.
  mk('plant.campion', 14, 8, (r) => { r(1, 2, 12, 5, OUT); r(2, 3, 10, 3, P.MOSS); r(3, 1, 8, 2, OUT); r(4, 2, 6, 1, P.MOSS_LIGHT); for (const [x, y] of [[3, 3], [6, 2], [9, 3], [5, 5], [8, 5]]) r(x, y, 2, 2, P.PINK); r(6, 2, 1, 1, P.WHITE); });
  // Angelica: tall stems with white umbels.
  mk('plant.angelica', 14, 20, (r) => { for (const [x, top] of [[2, 4], [6, 0], [10, 3]]) { r(x + 1, top + 3, 1, 16 - top, P.MOSS_DARK); r(x - 1, top, 5, 3, P.WHITE); r(x, top - 1 < 0 ? 0 : top - 1, 3, 1, P.CREAM); r(x, top + 1, 1, 1, P.LIGHT); } r(1, 16, 12, 2, P.MOSS); r(0, 18, 14, 2, P.MOSS_DARK); });
  // Heather: a purple-brown tuft.
  mk('plant.heather', 12, 10, (r) => { r(1, 4, 10, 5, OUT); r(2, 5, 8, 3, P.WOOD_DARK); for (const [x, top] of [[2, 1], [5, 0], [8, 2]]) { r(x, top, 2, 6, P.VIOLET_DARK); r(x, top, 1, 3, P.VIOLET); r(x, top, 1, 1, P.LILAC); } });
  // Mushrooms: two little caps on the moss.
  mk('plant.mushroom', 12, 9, (r) => { r(2, 5, 3, 4, P.CREAM); r(1, 2, 5, 4, OUT); r(2, 3, 3, 2, P.ORANGE); r(3, 3, 1, 1, P.WHITE); r(7, 4, 3, 5, P.CREAM); r(6, 1, 5, 4, OUT); r(7, 2, 3, 2, P.RED); r(8, 2, 1, 1, P.WHITE); });
  // Dandelion clocks: pale puffs on thin stems.
  mk('plant.dandelion', 10, 12, (r) => { for (const [x, top] of [[1, 1], [5, 0]]) { r(x + 1, top + 3, 1, 9 - top, P.GRASS); r(x, top, 4, 4, alpha(P.WHITE, 0.85)); r(x + 1, top + 1, 2, 2, P.WHITE); } r(2, 10, 6, 2, P.GRASS_LIGHT); });
  // Wildflowers: pink and white blossoms on short stems.
  mk('plant.flowers', 12, 10, (r) => { for (const [x, c] of [[1, P.PINK], [5, P.WHITE], [9, P.PINK]] as [number, string][]) { r(x + 1, 4, 1, 6, P.MOSS); r(x, 1, 3, 3, c); r(x + 1, 2, 1, 1, P.YELLOW); } });
  // Small stones: a couple of pebbles.
  mk('plant.stones', 10, 6, (r) => { r(1, 2, 4, 3, P.ROCK_LIGHT); r(6, 3, 3, 2, P.ROCK_LIGHT); r(1, 2, 2, 1, P.STONE_PALE); r(1, 5, 8, 1, SHADOW_SOFT); });
}

/** The alien asleep on its side, 22x12: body lying down, eye band closed, antennae drooping. */
export function makeAlienSleeping(scene: Phaser.Scene, key = 'alien.sleep'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 22, 12);
  if (!tex) return;
  const ctx = tex.getContext();
  const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  r(1, 2, 18, 10, P.OUTLINE); r(0, 4, 20, 6, P.OUTLINE);
  r(2, 3, 16, 8, P.TEAL); r(1, 5, 18, 4, P.TEAL);
  r(3, 9, 15, 2, P.TEAL_DARK);
  r(4, 5, 8, 3, P.WHITE); r(5, 6, 2, 1, P.OUTLINE); r(9, 6, 2, 1, P.OUTLINE); // closed eyes
  r(18, 6, 3, 1, P.OUTLINE); r(19, 8, 3, 1, P.OUTLINE); r(20, 5, 2, 1, P.LIGHT); r(21, 7, 1, 1, P.LIGHT); // drooping antennae
  tex.refresh();
}

// ---------------------------------------------------------------------------
// Furniture for house interiors: one sprite per piece, on the 16px grid, same chibi pastel
// style as the buildings. Each texture is footprint-sized plus 6px of headroom on top so
// tall things (a lamp, a bottle on a table) can poke up; HouseScene draws them bottom-left.
// ---------------------------------------------------------------------------
export const FURNITURE_FOOT: Record<string, { w: number; h: number; solid: boolean }> = {
  bed: { w: 2, h: 3, solid: true }, table: { w: 2, h: 2, solid: true }, chair: { w: 1, h: 1, solid: true },
  stove: { w: 1, h: 2, solid: true }, shelf: { w: 2, h: 1, solid: false }, bookshelf: { w: 2, h: 2, solid: true },
  wardrobe: { w: 1, h: 2, solid: true }, chest: { w: 1, h: 1, solid: true }, barrel: { w: 1, h: 1, solid: true },
  plant: { w: 1, h: 1, solid: true }, rug: { w: 3, h: 2, solid: false }, window: { w: 1, h: 1, solid: false },
  picture: { w: 1, h: 1, solid: false }, lamp: { w: 1, h: 1, solid: true }, counter: { w: 3, h: 1, solid: true },
  oven: { w: 2, h: 2, solid: true }, nets: { w: 1, h: 2, solid: true }, radio: { w: 1, h: 1, solid: true },
  loom: { w: 2, h: 2, solid: true }, cabinet: { w: 2, h: 1, solid: true }, sink: { w: 1, h: 1, solid: true },
  toybox: { w: 1, h: 1, solid: true }, desk: { w: 2, h: 1, solid: true }, crates: { w: 1, h: 1, solid: true },
  sacks: { w: 1, h: 1, solid: true },
};
export const FURNITURE_HEADROOM = 6;

/** Makes (once) and returns the texture key for a piece of furniture, in an optional accent colour. */
export function makeFurniture(scene: Phaser.Scene, type: string, accent?: string): string {
  const foot = FURNITURE_FOOT[type];
  const acc = snap(accent ?? P.BLUE);
  const key = `furn.${type}.${acc}`;
  if (!foot || scene.textures.exists(key)) return key;
  const W = foot.w * 16;
  const H = foot.h * 16 + FURNITURE_HEADROOM;
  const tex = scene.textures.createCanvas(key, W, H);
  if (!tex) return key;
  const ctx = tex.getContext();
  const OUT = P.OUTLINE;
  const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y + FURNITURE_HEADROOM, w, h); };
  const hi = alpha(P.WHITE, 0.35);
  const lo = alpha(P.OUTLINE, 0.25);
  const accDark = alpha(P.OUTLINE, 0.3);
  switch (type) {
    case 'bed':
      r(1, 1, 30, 47, OUT); r(2, 2, 28, 45, P.WOOD); r(2, 2, 28, 1, P.WOOD_LIGHT); r(2, 2, 1, 45, P.WOOD_LIGHT);
      r(4, 4, 24, 42, P.WHITE); r(4, 44, 24, 2, lo);
      r(6, 6, 20, 9, OUT); r(7, 7, 18, 7, P.CREAM); r(8, 8, 16, 1, P.WHITE);
      r(4, 18, 24, 27, OUT); r(5, 19, 22, 25, acc); r(5, 19, 22, 3, hi); r(5, 19, 22, 1, P.WHITE); r(5, 42, 22, 2, accDark);
      for (let y = 25; y < 42; y += 6) r(7, y, 18, 1, hi); break;
    case 'table':
      r(1, 5, 30, 17, OUT); r(2, 6, 28, 15, P.WOOD_LIGHT); r(2, 6, 28, 2, P.CREAM); r(2, 19, 28, 2, lo);
      r(3, 22, 4, 9, OUT); r(4, 22, 2, 8, P.WOOD_DARK); r(25, 22, 4, 9, OUT); r(26, 22, 2, 8, P.WOOD_DARK);
      r(11, 7, 10, 7, OUT); r(12, 8, 8, 5, P.CREAM); r(14, 3, 4, 5, OUT); r(15, 4, 2, 4, P.YELLOW); r(15, 1, 2, 3, OUT); r(15, 2, 2, 1, P.WHITE); break;
    case 'chair':
      r(2, 0, 12, 5, OUT); r(3, 1, 10, 3, P.WOOD_DARK); r(3, 1, 10, 1, P.WOOD);
      r(2, 5, 12, 7, OUT); r(3, 6, 10, 5, P.WOOD); r(3, 6, 10, 1, P.WOOD_LIGHT);
      r(3, 12, 3, 4, OUT); r(10, 12, 3, 4, OUT); r(4, 12, 1, 3, P.WOOD_DARK); r(11, 12, 1, 3, P.WOOD_DARK); break;
    case 'stove':
      r(5, 0, 6, 10, OUT); r(6, 1, 4, 9, P.ROCK); r(6, 1, 1, 9, P.ROCK_LIGHT);
      r(1, 8, 14, 24, OUT); r(2, 9, 12, 22, P.ROCK_DARK); r(2, 9, 12, 2, P.ROCK_LIGHT); r(2, 11, 12, 1, P.ROCK);
      r(3, 16, 10, 9, OUT); r(4, 17, 8, 7, P.ROCK); r(5, 19, 6, 4, P.ORANGE); r(6, 20, 4, 2, P.YELLOW); r(7, 21, 2, 1, P.LIGHT);
      r(3, 27, 10, 2, P.ROCK); r(4, 4, 7, 5, OUT); r(5, 5, 5, 3, P.STONE_PALE); r(9, 3, 2, 2, OUT); break;
    case 'shelf':
      r(0, 10, 32, 4, OUT); r(1, 11, 30, 2, P.WOOD); r(1, 11, 30, 1, P.WOOD_LIGHT); r(2, 14, 2, 2, OUT); r(28, 14, 2, 2, OUT);
      [P.RED, P.BLUE, P.YELLOW, P.VIOLET, P.TEAL, P.ORANGE].forEach((c, i) => { r(2 + i * 5, 1 + (i % 2), 5, 9 - (i % 2), OUT); r(3 + i * 5, 2 + (i % 2), 3, 7 - (i % 2), c); r(3 + i * 5, 4 + (i % 2), 3, 1, hi); }); break;
    case 'bookshelf':
      r(0, 0, 32, 32, OUT); r(1, 1, 30, 30, P.WOOD_DARK); r(2, 2, 28, 12, P.WOOD); r(2, 17, 28, 12, P.WOOD); r(2, 14, 28, 1, P.WOOD_LIGHT); r(2, 29, 28, 1, P.WOOD_LIGHT);
      [P.RED, P.BLUE, P.YELLOW, P.VIOLET, P.TEAL, P.CREAM].forEach((c, i) => { r(3 + i * 4.5, 3, 4, 11, OUT); r(4 + i * 4.5, 4, 2, 10, c); r(4 + i * 4.5, 6, 2, 1, hi); });
      [P.TEAL, P.RED, P.CREAM, P.BLUE, P.YELLOW, P.VIOLET].forEach((c, i) => { r(3 + i * 4.5, 18, 4, 11, OUT); r(4 + i * 4.5, 19, 2, 10, c); r(4 + i * 4.5, 21, 2, 1, hi); }); break;
    case 'wardrobe':
      r(0, 0, 16, 32, OUT); r(1, 1, 14, 30, P.WOOD_DARK); r(2, 2, 5, 27, P.WOOD); r(9, 2, 5, 27, P.WOOD); r(2, 2, 5, 1, P.WOOD_LIGHT); r(9, 2, 5, 1, P.WOOD_LIGHT);
      r(6, 14, 1, 2, P.YELLOW); r(9, 14, 1, 2, P.YELLOW); r(1, 29, 14, 2, lo); break;
    case 'chest':
      r(1, 3, 14, 13, OUT); r(2, 4, 12, 11, P.WOOD); r(2, 4, 12, 4, P.WOOD_DARK); r(2, 4, 12, 1, P.WOOD_LIGHT); r(2, 8, 12, 1, OUT);
      r(6, 7, 4, 4, OUT); r(7, 8, 2, 2, P.YELLOW); r(2, 13, 12, 2, lo); break;
    case 'barrel':
      r(2, 0, 12, 16, OUT); r(3, 1, 10, 14, P.WOOD); r(3, 1, 10, 1, P.WOOD_LIGHT); r(3, 4, 10, 2, P.ROCK); r(3, 10, 10, 2, P.ROCK); r(4, 1, 1, 14, hi); r(11, 1, 1, 14, lo); break;
    case 'plant':
      r(3, 8, 10, 8, OUT); r(4, 9, 8, 6, P.RED_DARK); r(4, 9, 8, 2, P.ORANGE); r(1, 1, 14, 8, OUT); r(2, 2, 12, 6, P.MOSS); r(5, 0, 6, 3, OUT); r(6, 1, 4, 2, P.MOSS_LIGHT); r(3, 3, 3, 2, P.MOSS_LIGHT); r(9, 5, 4, 2, P.MOSS_DARK); break;
    case 'rug':
      r(0, 0, 48, 32, accDark); r(1, 1, 46, 30, acc); r(3, 3, 42, 26, hi); r(5, 5, 38, 22, acc); r(16, 10, 16, 12, hi); r(20, 13, 8, 6, acc);
      for (let x = 2; x < 46; x += 4) { r(x, 1, 2, 1, P.CREAM); r(x, 30, 2, 1, P.CREAM); } break;
    case 'window':
      r(0, -4, 16, 20, OUT); r(1, -3, 14, 18, P.WHITE); r(3, -1, 10, 13, P.WATER_LIGHT); r(7, -1, 2, 13, P.WHITE); r(3, 5, 10, 2, P.WHITE); r(4, 0, 2, 3, P.ICE); r(0, 13, 16, 3, P.CREAM); r(0, 15, 16, 1, lo); break;
    case 'picture':
      r(1, 0, 14, 12, OUT); r(2, 1, 12, 10, P.WOOD_DARK); r(3, 2, 10, 8, P.CREAM); r(3, 6, 10, 4, P.BLUE); r(5, 4, 4, 3, P.WHITE); r(10, 3, 2, 2, P.YELLOW); r(7, 8, 3, 1, P.NAVY); break;
    case 'lamp':
      r(2, -2, 12, 7, OUT); r(3, -1, 10, 5, P.LIGHT); r(3, -1, 10, 1, P.WHITE); r(4, 4, 8, 1, P.YELLOW_DARK); r(6, 5, 4, 10, OUT); r(7, 6, 2, 9, P.ROCK); r(4, 14, 8, 2, OUT); r(5, 15, 6, 1, P.ROCK_DARK); break;
    case 'counter':
      r(0, 3, 48, 13, OUT); r(1, 4, 46, 5, P.CREAM); r(1, 4, 46, 1, P.WHITE); r(1, 9, 46, 6, P.WOOD); r(1, 9, 46, 1, P.WOOD_DARK); for (let x = 12; x < 48; x += 12) r(x, 9, 1, 6, lo);
      r(5, -2, 12, 6, OUT); r(6, -1, 10, 4, P.YELLOW_DARK); r(7, -1, 8, 1, P.CREAM); r(28, 0, 10, 4, OUT); r(29, 1, 8, 2, P.ORANGE); r(19, 0, 8, 4, OUT); r(20, 1, 6, 2, P.PINK); r(21, 1, 1, 1, P.WHITE); break;
    case 'oven':
      r(11, -5, 10, 8, OUT); r(12, -4, 8, 6, P.ROCK); r(1, 1, 30, 30, OUT); r(2, 2, 28, 28, P.ROCK_DARK); r(2, 2, 28, 4, P.ROCK_LIGHT); r(2, 6, 28, 1, P.ROCK);
      r(5, 9, 22, 14, OUT); r(6, 10, 20, 12, P.ROCK); r(8, 12, 16, 8, OUT); r(9, 13, 14, 6, P.ORANGE); r(11, 14, 10, 3, P.YELLOW); r(13, 15, 4, 1, P.LIGHT); r(6, 25, 20, 2, P.ROCK); r(2, 28, 28, 2, lo); break;
    case 'nets':
      r(2, 0, 12, 29, OUT); r(3, 1, 10, 27, P.TEAL_DARK); for (let i = 1; i < 4; i++) r(2 + i * 3, 1, 1, 27, P.WATER_LIGHT); for (let j = 1; j < 9; j++) r(3, j * 3, 10, 1, P.WATER_LIGHT);
      r(1, -1, 14, 3, OUT); r(2, 0, 12, 1, P.WOOD); r(3, 25, 10, 5, OUT); r(4, 26, 8, 3, P.ORANGE); r(5, 26, 2, 1, P.LIGHT); break;
    case 'radio':
      r(1, 4, 14, 11, OUT); r(2, 5, 12, 9, P.WOOD_DARK); r(2, 5, 12, 1, P.WOOD); r(3, 7, 4, 4, OUT); r(4, 8, 2, 2, P.YELLOW); r(8, 7, 5, 6, OUT); r(9, 8, 3, 4, P.ROCK); r(9, 9, 3, 1, P.ROCK_LIGHT); r(5, 0, 2, 5, OUT); r(6, 1, 1, 3, P.ROCK_LIGHT); break;
    case 'loom':
      r(0, 0, 32, 32, OUT); r(1, 1, 30, 30, P.WOOD); r(1, 1, 30, 1, P.WOOD_LIGHT); r(3, 3, 26, 26, P.WOOD_LIGHT); r(3, 3, 26, 2, P.WOOD_DARK); r(3, 27, 26, 2, P.WOOD_DARK);
      for (let i = 0; i < 9; i++) r(4 + i * 3, 5, 1, 22, P.CREAM); r(3, 15, 26, 11, OUT); r(4, 16, 24, 9, P.RED); r(4, 16, 24, 1, P.WHITE); for (let y = 19; y < 25; y += 3) r(4, y, 24, 1, hi); break;
    case 'cabinet':
      r(0, 0, 32, 16, OUT); r(1, 1, 30, 14, P.WOOD_DARK); r(1, 1, 30, 1, P.WOOD_LIGHT);
      for (const [x, y] of [[2, 2], [16, 2], [2, 8], [16, 8]] as const) { r(x, y, 14, 6, OUT); r(x + 1, y + 1, 12, 4, P.WOOD); r(x + 1, y + 1, 12, 1, P.WOOD_LIGHT); r(x + 6, y + 2, 2, 2, P.YELLOW); } break;
    case 'sink':
      r(6, -3, 4, 8, OUT); r(7, -2, 2, 6, P.ROCK_LIGHT); r(6, -3, 6, 2, OUT); r(7, -3, 4, 1, P.ROCK_LIGHT);
      r(1, 4, 14, 11, OUT); r(2, 5, 12, 9, P.STONE_PALE); r(3, 6, 10, 6, P.WATER_LIGHT); r(4, 7, 3, 1, P.WHITE); r(2, 12, 12, 2, P.ROCK_LIGHT); break;
    case 'toybox':
      r(1, 3, 14, 13, OUT); r(2, 4, 12, 11, P.BLUE); r(2, 4, 12, 4, P.YELLOW); r(2, 4, 12, 1, P.LIGHT); r(2, 8, 12, 1, OUT); r(4, -1, 7, 7, OUT); r(5, 0, 5, 5, P.RED); r(6, 1, 2, 2, P.WHITE); r(3, 13, 10, 2, lo); break;
    case 'desk':
      r(0, 2, 32, 9, OUT); r(1, 3, 30, 7, P.WOOD_LIGHT); r(1, 3, 30, 1, P.CREAM); r(1, 9, 30, 1, lo); r(1, 11, 4, 5, OUT); r(2, 11, 2, 4, P.WOOD_DARK); r(27, 11, 4, 5, OUT); r(28, 11, 2, 4, P.WOOD_DARK);
      r(5, 3, 10, 6, OUT); r(6, 4, 8, 4, P.WHITE); r(7, 5, 6, 1, P.ROCK); r(7, 7, 4, 1, P.ROCK); r(18, 2, 8, 5, OUT); r(19, 3, 6, 3, P.ROCK); r(20, 4, 2, 1, P.ROCK_LIGHT); break;
    case 'crates':
      r(1, 2, 14, 14, OUT); r(2, 3, 12, 12, P.WOOD); r(2, 3, 12, 1, P.WOOD_LIGHT); r(2, 8, 12, 1, P.WOOD_DARK); r(8, 3, 1, 12, P.WOOD_DARK); r(2, 14, 12, 1, lo); r(4, 5, 3, 2, hi); break;
    case 'sacks':
      r(1, 3, 14, 13, OUT); r(2, 4, 12, 11, P.CREAM); r(2, 4, 12, 1, P.WHITE); r(5, 1, 6, 4, OUT); r(6, 2, 4, 2, P.WOOD); r(3, 9, 10, 1, P.GRAVEL); r(4, 11, 8, 1, P.GRAVEL); r(2, 14, 12, 1, lo); break;
  }
  tex.refresh();
  return key;
}

// ---------------------------------------------------------------------------
// Portraits for the dialogue box: 48x48 head-and-shoulders in the chibi style. Transparent
// background; the box behind supplies the speaker colour.
// ---------------------------------------------------------------------------
export interface PortraitLook {
  skin: string;
  hair: string;
  /** short, long, bun, braid, cap (wool cap), bald, hat (brimmed), scarf (headscarf) */
  style: 'short' | 'long' | 'bun' | 'braid' | 'cap' | 'bald' | 'hat' | 'scarf';
  coat: string;
  glasses?: boolean;
  beard?: boolean;
  blush?: boolean;
  /** Colour for a cap, hat or scarf. */
  headwear?: string;
  /** Alien: no hair, antennae, big dark eyes. */
  alien?: boolean;
}

export function makePortrait(scene: Phaser.Scene, key: string, look: PortraitLook): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 48, 48);
  if (!tex) return;
  const ctx = tex.getContext();
  const OUT = P.OUTLINE;
  const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const skin = snap(look.skin);
  const hair = snap(look.hair);
  const coat = snap(look.coat);
  const hi = alpha(P.WHITE, 0.3);
  const lo = alpha(P.OUTLINE, 0.25);
  // shoulders and coat
  r(6, 36, 36, 12, OUT); r(7, 37, 34, 11, coat); r(7, 37, 34, 2, hi); r(22, 37, 4, 11, lo); r(20, 37, 1, 11, hi); r(27, 37, 1, 11, hi);
  // neck
  r(19, 30, 10, 8, OUT); r(20, 31, 8, 7, skin); r(20, 31, 8, 2, lo);
  // head: a rounded block
  r(11, 8, 26, 26, OUT); r(12, 9, 24, 24, skin); r(10, 11, 1, 20, OUT); r(37, 11, 1, 20, OUT); r(11, 10, 1, 22, skin); r(36, 10, 1, 22, skin);
  r(12, 9, 24, 2, hi); r(13, 31, 22, 2, lo);
  if (look.alien) {
    r(11, 8, 26, 26, OUT); r(12, 9, 24, 24, P.TEAL); r(12, 9, 24, 3, hi); r(13, 30, 22, 3, P.TEAL_DARK);
    r(16, 0, 2, 9, OUT); r(30, 0, 2, 9, OUT); r(15, -1, 4, 4, P.LIGHT); r(29, -1, 4, 4, P.LIGHT);
    r(15, 15, 7, 8, OUT); r(26, 15, 7, 8, OUT); r(17, 17, 2, 2, P.WHITE); r(28, 17, 2, 2, P.WHITE); r(20, 26, 8, 2, OUT); r(22, 27, 4, 1, P.WHITE);
    r(19, 30, 10, 8, OUT); r(20, 31, 8, 7, P.TEAL);
  } else {
    // eyes, brows, mouth
    r(16, 18, 4, 5, OUT); r(28, 18, 4, 5, OUT); r(17, 19, 1, 1, P.WHITE); r(29, 19, 1, 1, P.WHITE);
    r(15, 15, 6, 1, alpha(OUT, 0.5)); r(27, 15, 6, 1, alpha(OUT, 0.5));
    r(22, 27, 4, 1, OUT);
    if (look.blush) { r(13, 23, 4, 2, alpha(P.BLUSH, 0.6)); r(31, 23, 4, 2, alpha(P.BLUSH, 0.6)); }
    if (look.glasses) { r(14, 16, 8, 8, OUT); r(15, 17, 6, 6, alpha(P.WATER_LIGHT, 0.5)); r(26, 16, 8, 8, OUT); r(27, 17, 6, 6, alpha(P.WATER_LIGHT, 0.5)); r(22, 19, 4, 1, OUT); r(16, 18, 1, 1, P.WHITE); r(28, 18, 1, 1, P.WHITE); }
    if (look.beard) { r(12, 26, 24, 8, OUT); r(13, 27, 22, 6, hair); r(21, 27, 6, 2, skin); r(13, 24, 2, 3, hair); r(33, 24, 2, 3, hair); }
    // hair
    const hw = look.headwear ? snap(look.headwear) : hair;
    switch (look.style) {
      case 'bald': r(12, 9, 24, 3, hi); break;
      case 'short': r(10, 5, 28, 8, OUT); r(11, 6, 26, 6, hair); r(11, 12, 3, 6, hair); r(34, 12, 3, 6, hair); r(13, 6, 22, 1, hi); break;
      case 'long': r(9, 5, 30, 10, OUT); r(10, 6, 28, 8, hair); r(9, 13, 5, 22, OUT); r(34, 13, 5, 22, OUT); r(10, 14, 3, 20, hair); r(35, 14, 3, 20, hair); r(13, 6, 22, 1, hi); break;
      case 'bun': r(10, 5, 28, 8, OUT); r(11, 6, 26, 6, hair); r(19, 0, 10, 7, OUT); r(20, 1, 8, 5, hair); r(21, 1, 6, 1, hi); r(11, 12, 2, 5, hair); r(35, 12, 2, 5, hair); break;
      case 'braid': r(10, 5, 28, 8, OUT); r(11, 6, 26, 6, hair); r(33, 12, 6, 24, OUT); r(34, 13, 4, 22, hair); for (let y = 15; y < 34; y += 4) r(34, y, 4, 1, lo); r(11, 12, 2, 6, hair); break;
      case 'cap': r(9, 3, 30, 11, OUT); r(10, 4, 28, 9, hw); r(10, 11, 28, 2, alpha(OUT, 0.3)); r(12, 4, 24, 1, hi); r(20, 0, 8, 4, OUT); r(21, 1, 6, 2, hw); r(10, 13, 3, 4, hair); r(35, 13, 3, 4, hair); break;
      case 'hat': r(10, 5, 28, 6, OUT); r(11, 6, 26, 4, hair); r(6, 9, 36, 4, OUT); r(7, 10, 34, 2, hw); r(12, 0, 24, 10, OUT); r(13, 1, 22, 9, hw); r(13, 7, 22, 2, lo); r(14, 1, 20, 1, hi); break;
      case 'scarf': r(9, 4, 30, 10, OUT); r(10, 5, 28, 8, hw); r(12, 5, 24, 1, hi); r(9, 13, 4, 20, OUT); r(10, 14, 2, 18, hw); r(35, 13, 4, 20, OUT); r(36, 14, 2, 18, hw); r(13, 12, 22, 2, hair); break;
    }
  }
  tex.refresh();
}

/** Every portrait the dialogue box can show: the townspeople, the professor, the alien, the disguises. */
export function makePortraits(scene: Phaser.Scene): void {
  const coat = (id: string) => content.npcs[id]?.coat ?? P.NAVY;
  const looks: Record<string, PortraitLook> = {
    sigrun: { skin: P.SKIN, hair: P.STONE_PALE, style: 'bun', coat: coat('sigrun'), glasses: true },
    gunnar: { skin: P.SKIN, hair: P.WOOD_DARK, style: 'cap', headwear: P.NAVY, coat: coat('gunnar'), beard: true },
    halldora: { skin: P.SKIN, hair: P.ROCK_DARK, style: 'bun', coat: coat('halldora'), glasses: true },
    asta: { skin: P.SKIN, hair: P.WOOD, style: 'scarf', headwear: P.YELLOW, coat: coat('asta'), blush: true },
    kari: { skin: P.SKIN, hair: P.YELLOW_DARK, style: 'short', coat: coat('kari'), blush: true },
    einar: { skin: P.SKIN, hair: P.WOOD_DARK, style: 'cap', headwear: P.ORANGE, coat: coat('einar') },
    hrafnhildur: { skin: P.SKIN, hair: P.WOOD, style: 'braid', coat: coat('hrafnhildur'), blush: true },
    teacher: { skin: P.SKIN, hair: P.ROCK_DARK, style: 'long', coat: content.teacher.color, glasses: true },
    alien: { skin: P.TEAL, hair: P.TEAL, style: 'bald', coat: P.TEAL, alien: true },
    'player.a': { skin: PLAYER_LOOK.skin, hair: PLAYER_LOOK.hair, style: 'hat', headwear: PLAYER_LOOK.hat ?? P.NAVY, coat: PLAYER_LOOK.coat },
    'player.b': { skin: DISGUISES.b.skin, hair: DISGUISES.b.hair, style: 'long', coat: DISGUISES.b.coat, blush: true },
  };
  for (const [id, look] of Object.entries(looks)) makePortrait(scene, `portrait.${id}`, look);
}
