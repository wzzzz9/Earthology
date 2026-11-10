import { RENDER_SCALE } from '../config';

/**
 * Pixel fonts, drawn on the double-resolution canvas (see RENDER_SCALE). Every text style
 * must pass `resolution: TEXT_RES` and one of the SIZE values: at those sizes each glyph pixel
 * lands exactly on canvas pixels, so text is sharp with strokes half a game pixel wide.
 *
 *  - body:  Jersey 15. Tall, thin, has lowercase. Crisp at 13.5 and 27 game px.
 *  - retro: Press Start 2P. Chunky terminal look for the space computer and titles. 8 or 16 px.
 *
 * Files live in public/fonts (SIL Open Font License, see OFL-*.txt).
 */
export const FONT = {
  body: 'Jersey15',
  retro: 'PressStart2P',
} as const;

export const TEXT_RES = RENDER_SCALE;

export const SIZE = {
  body: '13.5px',
  big: '27px',
  retro: '8px',
  retroBig: '16px',
} as const;

const FILES: Record<string, string> = {
  Jersey15: 'fonts/Jersey15.ttf',
  PressStart2P: 'fonts/PressStart2P.ttf',
};

/** Loads the fonts so Phaser's text canvas can use them. Falls back silently if one fails. */
export async function loadFonts(): Promise<void> {
  if (typeof FontFace === 'undefined') return;
  const base = import.meta.env.BASE_URL;
  await Promise.all(
    Object.entries(FILES).map(async ([family, file]) => {
      try {
        const face = new FontFace(family, `url(${base}${file})`);
        await face.load();
        document.fonts.add(face);
      } catch (err) {
        console.warn(`font ${family} failed to load`, err);
      }
    }),
  );
}
