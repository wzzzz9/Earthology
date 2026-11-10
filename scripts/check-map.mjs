// Reachability check: from the spawn, can the player walk to within one tile of every
// scannable, person, rock and the ship? Uses the generated map's collision property.
import { readFileSync } from 'node:fs';
const map = JSON.parse(readFileSync(new URL('../public/assets/maps/iceland.json', import.meta.url)));
const { width: W, height: H } = map;
const solidGid = new Set(map.tilesets[0].tiles.filter((t) => t.properties.some((p) => p.name === 'collides' && p.value)).map((t) => t.id + 1));
const ground = map.layers.find((l) => l.name === 'ground').data;
const walls = map.layers.find((l) => l.name === 'walls').data;
const objs = map.layers.find((l) => l.name === 'objects').objects;
const blocked = new Array(W * H).fill(false);
for (let i = 0; i < W * H; i++) if (solidGid.has(ground[i]) || walls[i]) blocked[i] = true;
const tile = (o) => [Math.floor(o.x / 16), Math.floor(o.y / 16)];
for (const o of objs) {
  const [tx, ty] = tile(o);
  if (o.type === 'building') { const h = o.name === 'church' ? 3 : 2; for (let dy = 0; dy < h; dy++) for (let dx = -1; dx < 2; dx++) blocked[(ty - dy) * W + tx + dx] = true; }
  if (o.type === 'prop' || o.type === 'deco' || (o.type === 'fx' && o.name === 'geyser')) blocked[ty * W + tx] = true;
  if (o.type === 'tree') blocked[ty * W + tx] = true;
}
const spawn = objs.find((o) => o.name === 'spawn');
const [sx, sy] = tile(spawn);
const seen = new Array(W * H).fill(false);
const q = [[sx, sy]]; seen[sy * W + sx] = true;
while (q.length) {
  const [x, y] = q.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const i = ny * W + nx;
    if (seen[i] || blocked[i]) continue;
    seen[i] = true; q.push([nx, ny]);
  }
}
let reachable = 0; for (const s of seen) if (s) reachable++;
console.log(`walkable+reachable tiles: ${reachable} of ${W * H} (${Math.round((reachable / (W * H)) * 100)}%)`);
let bad = 0;
for (const o of objs) {
  if (!['scan', 'scanwater', 'npc', 'sample', 'ship'].includes(o.type)) continue;
  const [tx, ty] = tile(o);
  let ok = false;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = tx + dx, y = ty + dy; if (x >= 0 && y >= 0 && x < W && y < H && seen[y * W + x]) ok = true; }
  if (!ok) { bad++; console.log(`  ✗ ${o.type} ${o.name} at tile ${tx},${ty} is not reachable`); }
}
console.log(bad ? `${bad} unreachable target(s).` : 'All targets reachable.');
process.exit(bad ? 1 : 0);
