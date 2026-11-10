/**
 * Pixel fonts. Both render pixel-perfect at these sizes (every glyph pixel lands on one game
 * pixel, no anti-aliasing), so text stays sharp after the whole-number zoom.
 *
 *  - body:  Tiny5 at 8px (or 16px/24px for headings). Narrow, has lowercase.
 *  - retro: Press Start 2P at 8px (or 16px). Chunky terminal look; the space computer and titles.
 *
 * Any other size blurs. Files live in public/fonts (SIL Open Font License, see OFL-*.txt).
 */
export const FONT = {
  body: 'Tiny5',
  retro: 'PressStart2P',
} as const;

const FILES: Record<string, string> = {
  Tiny5: 'fonts/Tiny5.ttf',
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
