// Headless browser check for the game.
// Usage: node scripts/shot.mjs <out.png> [keys...]
//   keys: a sequence like "ArrowRight:800 ArrowDown:400" = hold key for ms.
//   a step starting with "js:" runs that code in the page, e.g. js:__debug.teleport(100,200)
//   a step "wait:500" just waits.
// Loads http://localhost:5173/, waits for Phaser to boot, optionally presses
// keys, saves a screenshot, and prints any console errors or page errors.
import { chromium } from 'playwright';

const out = process.argv[2] ?? 'shot.png';
const keys = process.argv.slice(3);
const url = process.env.GAME_URL ?? 'http://localhost:5173/';

const browser = await chromium.launch();
// SHOT_SCALE=4 renders at 1920x1080 (4x game pixels); CLIP="x,y,w,h" crops the screenshot (in screen px).
const scale = Number(process.env.SHOT_SCALE ?? 2);
const page = await browser.newPage({ viewport: { width: 480 * scale, height: 270 * scale } });
const clip = process.env.CLIP ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(process.env.CLIP.split(',').map(Number)) : undefined;
const problems = [];
page.on('console', (m) => {
  if (m.text().includes('GL Driver Message')) return; // software-GL noise in headless Chromium
  if (m.type() === 'error' || m.type() === 'warning') problems.push(`[console.${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 10000 });
await page.waitForTimeout(600);

for (const k of keys) {
  if (k.startsWith('js:')) { await page.evaluate(k.slice(3)); await page.waitForTimeout(150); continue; }
  if (k.startsWith('wait:')) { await page.waitForTimeout(Number(k.slice(5))); continue; }
  if (k === 'reload') { await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('canvas'); await page.waitForTimeout(600); continue; }
  const [key, ms = '300'] = k.split(':');
  await page.keyboard.down(key);
  await page.waitForTimeout(Number(ms));
  await page.keyboard.up(key);
  await page.waitForTimeout(100);
}

await page.screenshot({ path: out, clip });
const state = await page.evaluate(() => {
  const d = window.__debug;
  if (!d) return null;
  return { player: d.player, state: d.state, dialogue: d.dialogue, submit: d.submit ?? undefined, notebook: d.notebook ?? undefined, lab: d.lab ?? undefined, map: d.map ?? undefined };
}).catch(() => null);
await browser.close();

console.log(`screenshot: ${out}`);
if (state) console.log('debug:', JSON.stringify(state));
if (problems.length) {
  console.log('PROBLEMS:');
  for (const p of problems) console.log('  ' + p);
  process.exitCode = 1;
} else {
  console.log('no console errors');
}
