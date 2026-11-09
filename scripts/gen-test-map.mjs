// Generates public/assets/maps/test-field.json, a Tiled-format map used for
// M2 (walking + collisions). Deterministic, so the output can be committed.
// Real maps will be drawn in Tiled; this one just gives us ground to walk on.
import { writeFileSync } from 'node:fs';

const W = 40, H = 30, T = 16;
// Tile ids (gid, 1-based). 0 = empty.
const GRASS = 1, GRASS2 = 2, PATH = 3, WATER = 4, ROCK = 5, MOSSROCK = 6, BLACKSAND = 7, MOSSLAVA = 9, MOSSLAVA2 = 10, ICE = 11, SHALLOW = 12, MOSSLAVA3 = 13, MOSSLAVA4 = 14;
const MOSS = [MOSSLAVA, MOSSLAVA2, MOSSLAVA3, MOSSLAVA4];
const SOLID = [WATER, ROCK, MOSSROCK];
const TILECOUNT = 14;

// Tiny seeded random so the map is the same every run.
let seed = 20934;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const ground = new Array(W * H).fill(GRASS);
const walls = new Array(W * H).fill(0);
const at = (x, y) => y * W + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

for (let i = 0; i < ground.length; i++) if (rnd() < 0.22) ground[i] = GRASS2;

// Blob helper: fill an ellipse with a tile, optionally with a softer rim tile.
const blob = (cx, cy, rx, ry, tile, rimTile = null, rim = 0.35) => {
  for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
    if (!inMap(x, y)) continue;
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d < 1) ground[at(x, y)] = tile;
    else if (rimTile !== null && d < 1 + rim) ground[at(x, y)] = rimTile;
  }
};

// A moss-covered lava field across the west and north (classic Iceland).
blob(7, 5, 7, 4, MOSSLAVA, MOSSLAVA2, 0.5);
blob(16, 4, 6, 3, MOSSLAVA2, MOSSLAVA, 0.4);
blob(5, 22, 5, 5, MOSSLAVA, MOSSLAVA2, 0.5);
blob(30, 24, 7, 4, MOSSLAVA2, MOSSLAVA, 0.4);
// Randomise the moss-lava variants so the field looks organic, not gridded.
for (let i = 0; i < ground.length; i++) if (MOSS.includes(ground[i])) ground[i] = MOSS[Math.floor(rnd() * MOSS.length)];
// Old snow patches in the far north-west.
blob(3, 2, 3, 1.5, ICE); blob(12, 1, 3, 1.2, ICE);

// A glacial lake in the north-east with shallow edge and black-sand shore.
blob(32, 6.5, 5, 3.5, WATER, SHALLOW, 0.25);
for (let y = 1; y < 12; y++) for (let x = 25; x < 39; x++) {
  const d = ((x - 32) / 5) ** 2 + ((y - 6.5) / 3.5) ** 2;
  if (d >= 1.25 && d < 1.7) ground[at(x, y)] = BLACKSAND;
}
// A gravel track from the west edge to the lake.
for (let x = 0; x < 28; x++) { ground[at(x, 14)] = PATH; ground[at(x, 15)] = PATH; }
for (let y = 9; y < 15; y++) { ground[at(26, y)] = PATH; ground[at(27, y)] = PATH; }

// Tiles that must stay walkable because an object sits there.
const reserved = new Set([[5, 14], [3, 12], [8, 13], [20, 10], [27, 7], [24, 13], [10, 8], [18, 24], [33, 10],
  [12, 11], [16, 17], [22, 7], [30, 16], [6, 18], [36, 12], [24, 3], [9, 25], [35, 20]].map(([x, y]) => at(x, y)));

// Basalt border around the whole map so the player cannot leave.
for (let x = 0; x < W; x++) { walls[at(x, 0)] = ROCK; walls[at(x, H - 1)] = ROCK; }
for (let y = 0; y < H; y++) { walls[at(0, y)] = ROCK; walls[at(W - 1, y)] = ROCK; }
// Scattered boulders, denser on the lava fields, never on the track or water or objects.
for (let i = 0; i < 70; i++) {
  const x = 2 + Math.floor(rnd() * (W - 4)), y = 2 + Math.floor(rnd() * (H - 4));
  const g = ground[at(x, y)];
  if (g === PATH || g === WATER || g === SHALLOW || reserved.has(at(x, y))) continue;
  const onLava = MOSS.includes(g);
  if (!onLava && rnd() < 0.55) continue;
  walls[at(x, y)] = rnd() < 0.4 ? MOSSROCK : ROCK;
}
// A basalt ridge with one gap, to test collisions properly.
for (let y = 18; y < 28; y++) if (y !== 22 && y !== 23) walls[at(14, y)] = ROCK;
for (const r of reserved) walls[r] = 0;

// Point object at the centre of a tile.
const pt = (id, name, type, tx, ty) => ({ id, name, type, x: tx * T + T / 2, y: ty * T + T / 2, width: 0, height: 0, point: true, visible: true, rotation: 0 });

const tiles = [];
for (let id = 1; id <= TILECOUNT; id++) tiles.push({ id: id - 1, properties: [{ name: 'collides', type: 'bool', value: SOLID.includes(id) }] });

const map = {
  type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down',
  width: W, height: H, tilewidth: T, tileheight: T, infinite: false, nextlayerid: 4, nextobjectid: 19,
  tilesets: [{ firstgid: 1, name: 'placeholder', tilewidth: T, tileheight: T, tilecount: TILECOUNT, columns: TILECOUNT, image: 'placeholder.png', imagewidth: T * TILECOUNT, imageheight: 16, margin: 0, spacing: 0, tiles }],
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
        // a few small trees: birch and rowan near the track, willow bushes by the water
        pt(10, 'birch', 'tree', 12, 11), pt(11, 'rowan', 'tree', 16, 17), pt(12, 'birch', 'tree', 22, 7),
        pt(13, 'rowan', 'tree', 30, 16), pt(14, 'birch', 'tree', 6, 18), pt(15, 'willow', 'tree', 36, 12),
        pt(16, 'willow', 'tree', 24, 3), pt(17, 'rowan', 'tree', 9, 25), pt(18, 'birch', 'tree', 35, 20),
      ] },
  ],
};
writeFileSync(new URL('../public/assets/maps/test-field.json', import.meta.url), JSON.stringify(map));
console.log(`wrote test-field.json (${W}x${H})`);
