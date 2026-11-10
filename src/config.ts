// Internal resolution from GAME_PLAN.md: 480x270, scaled up in whole-number
// steps so pixels stay sharp.
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

/**
 * The canvas is drawn at RENDER_SCALE times the game size and every camera is zoomed by the
 * same amount, so sprites still land on whole game pixels while text (rendered at
 * resolution 2) gets strokes half a game pixel wide: taller, thinner, still perfectly sharp.
 */
export const RENDER_SCALE = 2;
