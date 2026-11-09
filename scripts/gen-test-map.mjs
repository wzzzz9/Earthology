// Generates public/assets/maps/test-field.json, a Tiled-format map used for
// M2 (walking + collisions). Deterministic, so the output can be committed.
// Real maps will be drawn in Tiled; this one just gives us ground to walk on.
import { writeFileSync } from 'node:fs';

const W = 40, H = 30, T = 16;
// Tile ids (gid, 1-based). 0 = empty.
const GRASS = 1, GRASS2 = 2, PATH = 3, WATER = 4, ROCK = 5, MOSSROCK = 6, SAND = 7;
const SOLID = [WATER, ROCK, MOSSROCK];

// Tiny seeded random so the map is the same every run.
let seed = 20934;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const ground = new Array(W * H).fill(GRASS);
const walls = new Array(W * H).fill(0);
const at = (x, y) => y * W + x;

for (let i = 0; i < ground.length; i++) if (rnd() < 0.18) ground[i] = GRASS2;

// A lake in the north-east with a sand shore.
for (let y = 3; y < 10; y++) for (let x = 27; x < 37; x++) {
  const dx = (x - 32) / 5, dy = (y - 6.5) / 3.5;
  const d = dx * dx + dy * dy;
  if (d < 0.75) ground[at(x, y)] = WATER;
  else if (d < 1.1) ground[at(x, y)] = SAND;
}
// A dirt path from the west edge to the lake.
for (let x = 0; x < 28; x++) { ground[at(x, 14)] = PATH; ground[at(x, 15)] = PATH; }
for (let y = 9; y < 15; y++) { ground[at(26, y)] = PATH; ground[at(27, y)] = PATH; }

// Rock border around the whole map so the player cannot leave.
for (let x = 0; x < W; x++) { walls[at(x, 0)] = ROCK; walls[at(x, H - 1)] = ROCK; }
for (let y = 0; y < H; y++) { walls[at(0, y)] = ROCK; walls[at(W - 1, y)] = ROCK; }
// Scattered rocks, never on the path.
for (let i = 0; i < 45; i++) {
  const x = 2 + Math.floor(rnd() * (W - 4)), y = 2 + Math.floor(rnd() * (H - 4));
  if (ground[at(x, y)] === PATH || ground[at(x, y)] === WATER) continue;
  walls[at(x, y)] = rnd() < 0.3 ? MOSSROCK : ROCK;
}
// A rock wall with one gap, to test collisions properly.
for (let y = 18; y < 28; y++) if (y !== 22 && y !== 23) walls[at(14, y)] = ROCK;

// Point object at the centre of a tile.
const pt = (id, name, type, tx, ty) => ({ id, name, type, x: tx * T + T / 2, y: ty * T + T / 2, width: 0, height: 0, point: true, visible: true, rotation: 0 });

const tiles = [];
for (let id = 1; id <= 8; id++) tiles.push({ id: id - 1, properties: [{ name: 'collides', type: 'bool', value: SOLID.includes(id) }] });

const map = {
  type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down',
  width: W, height: H, tilewidth: T, tileheight: T, infinite: false, nextlayerid: 4, nextobjectid: 10,
  tilesets: [{ firstgid: 1, name: 'placeholder', tilewidth: T, tileheight: T, tilecount: 8, columns: 8, image: 'placeholder.png', imagewidth: 128, imageheight: 16, margin: 0, spacing: 0, tiles }],
  layers: [
    { id: 1, type: 'tilelayer', name: 'ground', width: W, height: H, x: 0, y: 0, visible: true, opacity: 1, data: ground },
    { id: 2, type: 'tilelayer', name: 'walls', width: W, height: H, x: 0, y: 0, visible: true, opacity: 1, data: walls },
    { id: 3, type: 'objectgroup', name: 'objects', visible: true, opacity: 1, x: 0, y: 0, draworder: 'topdown',
      objects: [
        pt(1, 'spawn', 'spawn', 5, 14),
        pt(2, 'ship', 'ship', 3, 12),
        pt(3, 'signpost', 'scan', 8, 13),
        pt(4, 'cairn', 'scan', 20, 10),
        pt(5, 'lake', 'scan', 27, 7),
        pt(6, 'sigrun', 'npc', 24, 13),
        pt(7, 'basalt', 'sample', 10, 8),
        pt(8, 'obsidian', 'sample', 18, 24),
        pt(9, 'pumice', 'sample', 33, 10),
      ] },
  ],
};
writeFileSync(new URL('../public/assets/maps/test-field.json', import.meta.url), JSON.stringify(map));
console.log(`wrote test-field.json (${W}x${H})`);
