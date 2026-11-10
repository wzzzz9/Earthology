/**
 * The one palette for the Iceland region. Owned by the Art session (docs/TEAM.md).
 *
 * Forty colours in the chibi 16-bit pastel style: soft, slightly desaturated, warm
 * greens, one outline colour. Every sprite and tile in src/systems/placeholders.ts
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
export const GRAVEL = '#9b9283';

// Greens: ochre tundra grass (yellow side), moss (blue side), one leaf highlight.
export const GRASS_DARK = '#6f7e47';
export const GRASS = '#88985c';
export const GRASS_LIGHT = '#a4b26c';
export const MOSS_DARK = '#5b7845';
export const MOSS = '#759b58';
export const MOSS_LIGHT = '#98b96e';
export const LEAF_LIGHT = '#bccb7e';

// Water and ice: glacial blue, then ice, warm white and cream.
export const WATER_DEEP = '#4b7e9a';
export const WATER = '#619db7';
export const WATER_LIGHT = '#8fc4d6';
export const ICE = '#dce8ec';
export const WHITE = '#f7f3ea';
export const CREAM = '#ebe2cd';

// Wood and earth.
export const WOOD_DARK = '#5f4432';
export const WOOD = '#8b6641';
export const WOOD_LIGHT = '#b9936b';

// Skin.
export const SKIN = '#f1cfb0';
export const BLUSH = '#e69f8b';

// Accents: houses, coats, flowers, lights, the two aliens.
export const RED = '#c8584b';
export const RED_DARK = '#99413a';
export const ORANGE = '#de7b4f';
export const YELLOW = '#e7c56f';
export const YELLOW_DARK = '#c3a053';
export const LIGHT = '#f7dd92';
export const BLUE = '#5e87b8';
export const BLUE_DARK = '#44668f';
export const NAVY = '#363b53';
export const TEAL = '#6dc2ae';
export const TEAL_DARK = '#499a8a';
export const VIOLET = '#9d83cb';
export const VIOLET_DARK = '#705b9d';
export const LILAC = '#d6c0ed';
export const PINK = '#eda1b8';

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
