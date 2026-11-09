// Headless browser check for the game.
// Usage: node scripts/shot.mjs <out.png> [keys...]
//   keys: a sequence like "ArrowRight:800 ArrowDown:400" = hold key for ms.
// Loads http://localhost:5173/, waits for Phaser to boot, optionally presses
// keys, saves a screenshot, and prints any console errors or page errors.
import { chromium } from 'playwright';

const out = process.argv[2] ?? 'shot.png';
const keys = process.argv.slice(3);
const url = process.env.GAME_URL ?? 'http://localhost:5173/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
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
  const [key, ms = '300'] = k.split(':');
  await page.keyboard.down(key);
  await page.waitForTimeout(Number(ms));
  await page.keyboard.up(key);
  await page.waitForTimeout(100);
}

await page.screenshot({ path: out });
const state = await page.evaluate(() => window.__debug ?? null).catch(() => null);
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
