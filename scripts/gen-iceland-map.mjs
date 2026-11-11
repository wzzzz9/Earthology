// Generates public/assets/maps/iceland.json: one connected region with a harbour town in
// the middle and five famous places around it, stylised and close together. Deterministic.
import { writeFileSync } from 'node:fs';

const W = 80, H = 60, T = 16;
const GRASS = 1, GRASS2 = 2, PATH = 3, WATER = 4, ROCK = 5, MOSSROCK = 6, BLACKSAND = 7, MOSSLAVA = 9, MOSSLAVA2 = 10, ICE = 11, SHALLOW = 12, MOSSLAVA3 = 13, MOSSLAVA4 = 14, CHASM = 15, HOTPOOL = 16, STONES = 17;
const MOSS = [MOSSLAVA, MOSSLAVA2, MOSSLAVA3, MOSSLAVA4];
const SOLID = [WATER, ROCK, MOSSROCK, CHASM, HOTPOOL];
const TILECOUNT = 17;

let seed = 20934;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const ground = new Array(W * H).fill(GRASS);
const walls = new Array(W * H).fill(0);
const at = (x, y) => y * W + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const setG = (x, y, t) => { if (inMap(x, y)) ground[at(x, y)] = t; };

for (let i = 0; i < ground.length; i++) if (rnd() < 0.22) ground[i] = GRASS2;

const blob = (cx, cy, rx, ry, tile, rimTile = null, rim = 0.35) => {
  for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
    if (!inMap(x, y)) continue;
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d < 1) ground[at(x, y)] = tile;
    else if (rimTile !== null && d < 1 + rim) ground[at(x, y)] = rimTile;
  }
};
const line = (x0, y0, x1, y1, tile, width = 2) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
    for (let dx = 0; dx < width; dx++) for (let dy = 0; dy < width; dy++) setG(x + dx, y + dy, tile);
  }
};

// ---- the sea along the south, with a black-sand beach to the south-east ----
for (let y = 54; y < H; y++) for (let x = 0; x < W; x++) ground[at(x, y)] = WATER;
for (let x = 0; x < W; x++) ground[at(x, 53)] = SHALLOW;
for (let y = 50; y < 53; y++) for (let x = 44; x < W; x++) ground[at(x, y)] = BLACKSAND;
for (let x = 44; x < W; x++) ground[at(x, 53)] = BLACKSAND;
// harbour basin west of the pier, calmer water, and a stone harbour wall
for (let y = 50; y < 54; y++) for (let x = 24; x < 40; x++) ground[at(x, y)] = y === 50 ? SHALLOW : WATER;
for (let x = 20; x < 24; x++) for (let y = 50; y < 54; y++) ground[at(x, y)] = BLACKSAND;

// ---- moss-lava fields, snow, ice ----
blob(22, 14, 9, 5, MOSSLAVA, MOSSLAVA2, 0.4);
blob(50, 46, 5, 2.5, MOSSLAVA2, MOSSLAVA, 0.4);
blob(6, 36, 4, 6, MOSSLAVA, MOSSLAVA2, 0.4);
for (let i = 0; i < ground.length; i++) if (MOSS.includes(ground[i])) ground[i] = MOSS[Math.floor(rnd() * MOSS.length)];
blob(4, 3, 3, 1.5, ICE); blob(40, 2, 4, 1.3, ICE); blob(76, 20, 3, 2, ICE);
// glacier in the north-east: a big ice tongue coming down from the top edge
blob(62, 3, 10, 5, ICE); blob(62, 8, 7, 3, ICE);

// ---- the rift (Þingvellir): a chasm running north-south in the west, cliffs of rock west of it ----
line(7, 8, 9, 30, CHASM, 3);
for (let y = 8; y < 31; y++) { if (rnd() < 0.25) walls[at(6 + Math.floor(rnd() * 1), y)] = ROCK; if (rnd() < 0.25) walls[at(12, y)] = ROCK; }
for (let y = 6; y < 33; y++) for (let x = 2; x < 8; x++) if (rnd() < 0.35) walls[at(x, y)] = ROCK;

// ---- geyser field north of town: hot pools ----
for (const [x, y, rx, ry] of [[33, 11, 2, 1.2], [38, 9, 1.5, 1], [41, 13, 2, 1.2], [36, 16, 1.2, 1]]) blob(x, y, rx, ry, HOTPOOL, BLACKSAND, 0.5);

// ---- the lake east of town ----
blob(56, 32, 6, 3.5, WATER, SHALLOW, 0.25);
for (let y = 26; y < 38; y++) for (let x = 48; x < 66; x++) { const d = ((x - 56) / 6) ** 2 + ((y - 32) / 3.5) ** 2; if (d >= 1.25 && d < 1.7) ground[at(x, y)] = BLACKSAND; }

// ---- the river: from the glacier down the east side to the sea, with a waterfall cliff ----
line(68, 10, 70, 20, WATER, 2); line(70, 20, 70, 53, WATER, 2);
for (let x = 64; x < 78; x++) if (x < 70 || x > 71) { walls[at(x, 21)] = ROCK; }
for (let y = 10; y < 54; y += 1) for (const x of [69, 72]) if (ground[at(x, y)] !== WATER && rnd() < 0.3) ground[at(x, y)] = SHALLOW;

// ---- gravel tracks: ship -> town -> places ----
// The main street is two tiles wide (about two people side by side); every other track is one.
line(18, 44, 46, 44, PATH, 2);                 // main street through town
line(12, 45, 18, 45, STONES, 1);               // from the ship to the street
line(32, 18, 32, 44, STONES, 1);               // north to the geysers
line(47, 45, 50, 45, STONES, 1); line(50, 36, 50, 45, STONES, 1); line(50, 36, 53, 36, STONES, 1); // to the lake shore
line(50, 45, 66, 45, STONES, 1); line(66, 24, 66, 45, STONES, 1); // east, then north along the river to the fall
line(47, 46, 56, 50, STONES, 1);               // south-east down to the beach
line(12, 31, 12, 45, STONES, 1);               // north from the ship to the rift
line(60, 12, 60, 26, STONES, 1); line(53, 26, 60, 26, STONES, 1); // from the lake north to the glacier
line(32, 46, 32, 50, PATH, 1);                 // down to the pier

// ---- objects ----
const objs = [];
let oid = 1;
const pt = (name, type, tx, ty, props) => objs.push({ id: oid++, name, type, x: tx * T + T / 2, y: ty * T + T / 2, width: 0, height: 0, point: true, visible: true, rotation: 0, ...(props ? { properties: Object.entries(props).map(([name, value]) => ({ name, type: 'string', value })) } : {}) });
pt('spawn', 'spawn', 14, 45);
pt('ship', 'ship', 11, 42);
pt('signpost', 'scan', 16, 43);
// town buildings (footprint 3x2 tiles above the point) and the church
// packed along the street: one tile between houses
// each house belongs to someone (houses.json); you may enter once they count you as a friend
pt('house-red', 'building', 21, 42, { house: 'asta' }); pt('house-yellow', 'building', 25, 42, { house: 'kari' }); pt('house-blue', 'building', 29, 42, { house: 'halldora' }); pt('house-green', 'building', 35, 42, { house: 'einar' }); pt('house-red', 'building', 39, 42, { house: 'sigrun' });
pt('house-blue', 'building', 23, 48, { house: 'gunnar' }); pt('house-green', 'building', 27, 48, { house: 'hrafnhildur' }); pt('house-yellow', 'building', 37, 48, { house: 'summer' });
pt('church', 'building', 44, 41);
pt('church', 'scan', 44, 42);
// fenced back yards behind the north-side houses, each with something in it
const yard = (hx, hy, inside) => {
  const top = hy - 4; // fence line two rows behind the roof
  for (let dx = -1; dx <= 1; dx++) pt('fence-h', 'deco', hx + dx, top);
  pt('fence-v', 'deco', hx - 1.4, top + 1); pt('fence-v', 'deco', hx + 1.4, top + 1);
  pt(inside, 'deco', hx, top + 1);
};
yard(21, 42, 'woodpile'); yard(25, 42, 'planter'); yard(29, 42, 'barrel'); yard(35, 42, 'planter'); yard(39, 42, 'woodpile');
// every door gets a stepping-stone path to the street, a window box on one side and a lantern
// or mailbox on the other; the gaps between houses get a barrel or a woodpile
const NORTH = [21, 25, 29, 35, 39];
const SOUTH = [23, 27, 37];
for (const [i, hx] of NORTH.entries()) {
  ground[at(hx, 43)] = STONES;
  pt('planter', 'deco', hx - 1.3, 43.1);
  pt(i % 2 ? 'mailbox' : 'lantern', 'deco', hx + 1.3, 43.1);
}
for (const [i, hx] of SOUTH.entries()) {
  ground[at(hx, 49)] = STONES;
  pt('planter', 'deco', hx - 1.3, 49.1);
  pt(i % 2 ? 'mailbox' : 'lantern', 'deco', hx + 1.3, 49.1);
}
for (const [n, x, y] of [['barrel', 32, 42.6], ['woodpile', 33, 46.2], ['barrel', 25.4, 46.3], ['bench', 31, 46.3], ['woodpile', 19.4, 46.3], ['bench', 47, 42.5], ['barrel', 41.6, 46.3]]) pt(n, 'deco', x, y);
// the well is the village square: benches and flowers round it, a lantern for the evenings
pt('well', 'deco', 44, 46.3);
pt('bench', 'deco', 42.4, 46.8); pt('bench', 'deco', 45.6, 46.8);
pt('planter', 'deco', 43, 47.6); pt('planter', 'deco', 45, 47.6); pt('lantern', 'deco', 44, 47.9);
// the church: a path to its door and a lantern each side
ground[at(44, 43)] = STONES; pt('lantern', 'deco', 42.7, 43.1); pt('lantern', 'deco', 45.3, 43.1);
// a low fence along the harbour front, with gaps at the pier, the slipway and the south doors
for (let x = 24; x < 40; x++) if (![32, 33, ...SOUTH].includes(x)) pt('fence-h', 'deco', x, 49.4);
// harbour clutter on the black sand west of the basin
pt('barrel', 'deco', 20.6, 49.3); pt('barrel', 'deco', 21.5, 49.6); pt('woodpile', 'deco', 22.6, 50.4);
pt('racks', 'prop', 18, 48); pt('fish-racks', 'scan', 18, 49);
pt('pipe', 'prop', 48, 42); pt('hot-pipe', 'scan', 48, 43);
pt('pen', 'prop', 15, 36); pt('sheep-pen', 'scan', 15, 38);
for (let y = 50; y < 54; y++) pt('pier', 'pier', 32, y);
pt('boat', 'scanwater', 34, 53);
pt('harbour-wall', 'scan', 41, 50);
// people
pt('sigrun', 'npc', 52, 37); pt('gunnar', 'npc', 33, 52); pt('halldora', 'npc', 40, 49); pt('asta', 'npc', 26, 43);
pt('kari', 'npc', 26, 46); pt('einar', 'npc', 46, 43); pt('hrafnhildur', 'npc', 16, 37);
// famous places
pt('rift', 'scan', 11, 20);
pt('geyser', 'fx', 36, 13); pt('geysir', 'scan', 36, 15);
for (const [x, y] of [[33, 12], [41, 14], [38, 10]]) pt('steam', 'fx', x, y);
pt('hot-pool', 'scan', 34, 13);
// field-trip puzzle objects: <puzzle>.<object>, see classes.json
pt('geyser.blocked', 'puzzle', 38, 11); pt('geyser.still', 'puzzle', 41, 15);
pt('waterfall', 'fx', 70, 21); // drawn 32 wide, centred between the two river tiles
pt('waterfall', 'scan', 67, 23);
pt('flood.table', 'puzzle', 63, 24);
pt('columns-wall', 'prop', 60, 49); pt('columns', 'scan', 60, 50);
pt('glacier-face', 'prop', 60, 10); pt('glacier', 'scan', 60, 12);
pt('lake', 'scan', 53, 35); pt('cairn', 'scan', 48, 30);
// rocks to pick up
pt('basalt', 'sample', 10, 32); pt('obsidian', 'sample', 24, 18); pt('pumice', 'sample', 56, 52);
// trees in small clusters: behind the houses, along the river and lake, by the ship
for (const [n, x, y] of [
  ['birch', 19, 36], ['rowan', 23, 35], ['birch', 31, 36], ['rowan', 36, 35], ['birch', 42, 36], ['willow', 46, 38],
  ['willow', 54, 29], ['birch', 58, 28], ['willow', 62, 34], ['rowan', 60, 40], ['birch', 63, 41],
  ['birch', 64, 30], ['rowan', 64, 36], ['willow', 68, 40], ['birch', 64, 48],
  ['rowan', 16, 50], ['birch', 14, 48], ['willow', 10, 46], ['birch', 9, 40],
  ['rowan', 30, 51], ['willow', 22, 51], ['birch', 46, 48], ['rowan', 52, 48],
  ['birch', 28, 24], ['willow', 36, 24], ['birch', 44, 20], ['rowan', 14, 34],
]) pt(n, 'tree', x, y);
// low plants everywhere the ground is plain grass: lupine near water and the town, cotton grass on wet ground, shrubs and tufts elsewhere
// clusters: pick seeds, then sprinkle around each so plants gather in drifts
const seeds = [];
for (let i = 0; i < 140; i++) seeds.push([2 + rnd() * (W - 4), 2 + rnd() * (H - 4)]);
let planted = 0;
const taken = new Set(objs.filter((o) => o.type !== 'deco').map((o) => at(Math.floor(o.x / T), Math.floor(o.y / T))));
for (let i = 0; i < 9000 && planted < 950; i++) {
  const [sx, sy] = seeds[Math.floor(rnd() * seeds.length)];
  const x = Math.round(sx + (rnd() - 0.5) * 7), y = Math.round(sy + (rnd() - 0.5) * 7);
  if (!inMap(x, y)) continue;
  const g = ground[at(x, y)];
  if (![GRASS, GRASS2].includes(g) || walls[at(x, y)] || taken.has(at(x, y))) continue;
  taken.add(at(x, y));
  const nearWater = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => inMap(x + dx, y + dy) && [WATER, SHALLOW].includes(ground[at(x + dx, y + dy)]));
  const nearTown = x > 16 && x < 50 && y > 36 && y < 52;
  const roll = rnd();
  const name = nearWater ? (roll < 0.5 ? 'cotton' : 'lupine') : nearTown ? (roll < 0.3 ? 'lupine' : roll < 0.55 ? 'flowers' : roll < 0.8 ? 'tuft' : 'shrub') : roll < 0.3 ? 'shrub' : roll < 0.65 ? 'tuft' : roll < 0.8 ? 'stones' : roll < 0.9 ? 'flowers' : 'lupine';
  pt(name, 'plant', x, y);
  planted++;
}

// tiles under objects stay walkable; building footprints become solid
const reserved = new Set(objs.map((o) => at(Math.floor(o.x / T), Math.floor(o.y / T))));
for (const o of objs) {
  const tx = Math.floor(o.x / T), ty = Math.floor(o.y / T);
  if (o.type === 'building') {
    const w = o.name === 'church' ? 3 : 3, h = o.name === 'church' ? 3 : 2;
    for (let dy = 0; dy < h; dy++) for (let dx = -1; dx < w - 1; dx++) { if (inMap(tx + dx, ty - dy)) { walls[at(tx + dx, ty - dy)] = 0; ground[at(tx + dx, ty - dy)] = GRASS; } }
  }
  if (o.type === 'pier') ground[at(tx, ty)] = PATH;
  if (o.type === 'scan' || o.type === 'npc' || o.type === 'sample' || o.type === 'spawn') {
    if (SOLID.includes(ground[at(tx, ty)])) ground[at(tx, ty)] = ground[at(tx, ty)] === WATER || ground[at(tx, ty)] === SHALLOW ? BLACKSAND : GRASS;
  }
}
// harbour wall: a line of boulders east of the basin running into the sea
for (let y = 49; y < 56; y++) walls[at(41, y)] = ROCK;
for (let y = 49; y < 52; y++) walls[at(42, y)] = ROCK;
// border
for (let x = 0; x < W; x++) { walls[at(x, 0)] = ROCK; walls[at(x, H - 1)] = ROCK; }
for (let y = 0; y < H; y++) { walls[at(0, y)] = ROCK; walls[at(W - 1, y)] = ROCK; }
// scattered boulders, denser on lava and by the rift, never on tracks, water, sand or objects
for (let i = 0; i < 160; i++) {
  const x = 2 + Math.floor(rnd() * (W - 4)), y = 2 + Math.floor(rnd() * (H - 4));
  const g = ground[at(x, y)];
  if ([PATH, WATER, SHALLOW, BLACKSAND, CHASM, HOTPOOL, ICE].includes(g) || reserved.has(at(x, y)) || walls[at(x, y)]) continue;
  const onLava = MOSS.includes(g);
  if (!onLava && rnd() < 0.7) continue;
  walls[at(x, y)] = rnd() < 0.4 ? MOSSROCK : ROCK;
}
for (const r of reserved) walls[r] = 0;
// keep every track clear of boulders
for (let i = 0; i < ground.length; i++) if (ground[i] === PATH) walls[i] = 0;

const tiles = [];
for (let id = 1; id <= TILECOUNT; id++) tiles.push({ id: id - 1, properties: [{ name: 'collides', type: 'bool', value: SOLID.includes(id) }] });

const map = {
  type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down',
  width: W, height: H, tilewidth: T, tileheight: T, infinite: false, nextlayerid: 4, nextobjectid: oid,
  properties: [{ name: 'title', type: 'string', value: 'Iceland · the south coast' }],
  tilesets: [{ firstgid: 1, name: 'placeholder', tilewidth: T, tileheight: T, tilecount: TILECOUNT, columns: TILECOUNT, image: 'placeholder.png', imagewidth: T * TILECOUNT, imageheight: 16, margin: 0, spacing: 0, tiles }],
  layers: [
    { id: 1, type: 'tilelayer', name: 'ground', width: W, height: H, x: 0, y: 0, visible: true, opacity: 1, data: ground },
    { id: 2, type: 'tilelayer', name: 'walls', width: W, height: H, x: 0, y: 0, visible: true, opacity: 1, data: walls },
    { id: 3, type: 'objectgroup', name: 'objects', visible: true, opacity: 1, x: 0, y: 0, draworder: 'topdown', objects: objs },
  ],
};
writeFileSync(new URL('../public/assets/maps/iceland.json', import.meta.url), JSON.stringify(map));
console.log(`wrote iceland.json (${W}x${H}, ${objs.length} objects)`);
