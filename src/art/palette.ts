/**
 * The one palette for the Iceland region. Owned by the Art session (docs/TEAM.md).
 *
 * Forty colours in the chibi 16-bit pastel style: bright and cheerful, light rather than
 * dark, warm greens, one outline colour. Every sprite and tile in src/systems/placeholders.ts
 * draws with these names and nothing else. Reasoning and swatches: docs/art/palette.md.
 *
 * Colours that arrive from content JSON (sample colours, NPC coats, sketch colours)
 * are passed through snap() so they land on the nearest palette colour.
 */

// Darks: one outline for everything, one near-black for the void.
export const OUTLINE = '#2a2630';
export const VOID = '#15131c';

// Stone: black lava and basalt, three tones, plus pale stone and warm gravel.
export const ROCK_DARK = '#3b3944';
export const ROCK = '#5a5866';
export const ROCK_LIGHT = '#7f7d8a';
export const STONE_PALE = '#aaa7ae';
export const GRAVEL = '#a89a84';

// Greens: fresh spring grass (yellow side), moss (blue side), one leaf highlight.
export const GRASS_DARK = '#5e9a46';
export const GRASS = '#7fc25a';
export const GRASS_LIGHT = '#9fd96e';
export const MOSS_DARK = '#3f8a4e';
export const MOSS = '#5aae63';
export const MOSS_LIGHT = '#82cc7a';
export const LEAF_LIGHT = '#c9ec86';

// Water and ice: glacial blue, then ice, warm white and cream.
export const WATER_DEEP = '#3b86b4';
export const WATER = '#52aad4';
export const WATER_LIGHT = '#86d6ea';
export const ICE = '#dff1f5';
export const WHITE = '#f7f3ea';
export const CREAM = '#ebe2cd';

// Wood and earth.
export const WOOD_DARK = '#5f4432';
export const WOOD = '#966a40';
export const WOOD_LIGHT = '#c69a6a';

// Skin.
export const SKIN = '#f6d3b4';
export const BLUSH = '#f2a08e';

// Accents: houses, coats, flowers, lights, the two aliens.
export const RED = '#e05a4e';
export const RED_DARK = '#ad3f3a';
export const ORANGE = '#f08350';
export const YELLOW = '#f5cf5e';
export const YELLOW_DARK = '#cfa63e';
export const LIGHT = '#ffe68a';
export const BLUE = '#5b93d6';
export const BLUE_DARK = '#3f6fae';
export const NAVY = '#3a4068';
export const TEAL = '#5fd3bb';
export const TEAL_DARK = '#3fa896';
export const VIOLET = '#a98ae0';
export const VIOLET_DARK = '#7a5fb5';
export const LILAC = '#dcc5f5';
export const PINK = '#f7a3c0';

/** Every palette colour by name, in the order above. */
export const PALETTE: Record<string, string> = {
  OUTLINE, VOID,
  ROCK_DARK, ROCK, ROCK_LIGHT, STONE_PALE, GRAVEL,
  GRASS_DARK, GRASS, GRASS_LIGHT, MOSS_DARK, MOSS, MOSS_LIGHT, LEAF_LIGHT,
  WATER_DEEP, WATER, WATER_LIGHT, ICE, WHITE, CREAM,
  WOOD_DARK, WOOD, WOOD_LIGHT,
  SKIN, BLUSH,
  RED, RED_DARK, ORANGE, YELLOW, YELLOW_DARK, LIGHT, BLUE, BLUE_DARK, NAVY,
  TEAL, TEAL_DARK, VIOLET, VIOLET_DARK, LILAC, PINK,
};

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** A palette colour as an rgba() string, for shadows, glows and steam. */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** A palette colour as the number Phaser Graphics wants (0xrrggbb). */
export function num(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/** The nearest palette colour to any hex colour, so content colours stay on the palette. */
export function snap(hex: string): string {
  const [r, g, b] = rgb(hex);
  let best = OUTLINE;
  let bestD = Infinity;
  for (const c of Object.values(PALETTE)) {
    const [cr, cg, cb] = rgb(c);
    // Weighted so the eye's greater sensitivity to green counts for more.
    const d = 2 * (r - cr) ** 2 + 4 * (g - cg) ** 2 + 3 * (b - cb) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// Transparent shades used under sprites. Tinted with the outline colour, not pure black,
// so shadows sit in the same family as the lines.
export const SHADOW = alpha(OUTLINE, 0.3);
export const SHADOW_SOFT = alpha(OUTLINE, 0.22);
