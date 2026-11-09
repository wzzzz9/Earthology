// Content validator. Fails if ids point to things that do not exist, if dialogue
// pages are longer than 3 lines, or if a line is too long for the box.
// Run: npm run check
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../content/', import.meta.url).pathname;
const MAX_LINES = 3;
const MAX_CHARS = 60;
let errors = 0;
const fail = (msg) => { errors++; console.log('  ✗ ' + msg); };
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

for (const country of readdirSync(join(root, 'countries'))) {
  const dir = join(root, 'countries', country);
  console.log(`Country: ${country}`);
  const scannables = existsSync(join(dir, 'scannables.json')) ? read(join(dir, 'scannables.json')) : {};
  const npcs = existsSync(join(dir, 'npcs.json')) ? read(join(dir, 'npcs.json')) : {};
  const dialogue = existsSync(join(dir, 'dialogue.json')) ? read(join(dir, 'dialogue.json')) : {};

  for (const [id, s] of Object.entries(scannables)) {
    if (!['land', 'rocks', 'earth', 'sky', 'people', 'sketches'].includes(s.section)) fail(`scannable ${id}: bad section ${s.section}`);
    if (s.line.length > MAX_CHARS * 2) fail(`scannable ${id}: line too long (${s.line.length})`);
  }

  const checkNode = (where, node) => {
    if (!Array.isArray(node.lines) || !node.lines.length) fail(`${where}: no lines`);
    if (node.lines.length > MAX_LINES) fail(`${where}: ${node.lines.length} lines (max ${MAX_LINES})`);
    for (const l of node.lines) if (l.length > MAX_CHARS) fail(`${where}: line too long (${l.length}): "${l}"`);
    for (const c of node.choices ?? []) {
      if (c.reply.length > MAX_LINES) fail(`${where} choice "${c.text}": reply has ${c.reply.length} lines`);
      for (const l of c.reply) if (l.length > MAX_CHARS) fail(`${where} choice reply too long: "${l}"`);
    }
  };

  for (const [npcId, topics] of Object.entries(dialogue)) {
    if (!npcs[npcId]) fail(`dialogue for unknown npc ${npcId}`);
    if (!topics.greet) fail(`npc ${npcId}: no greet topic`);
    for (const [topicId, t] of Object.entries(topics)) {
      const where = `${npcId}.${topicId}`;
      if (t.requires?.scanned && !scannables[t.requires.scanned]) fail(`${where}: requires unknown scannable ${t.requires.scanned}`);
      if (!t.byLevel || !Object.keys(t.byLevel).length) fail(`${where}: no byLevel nodes`);
      for (const [lvl, node] of Object.entries(t.byLevel ?? {})) checkNode(`${where}@${lvl}`, node);
    }
  }
  for (const npcId of Object.keys(npcs)) if (!dialogue[npcId]) fail(`npc ${npcId} has no dialogue`);
}

if (errors) { console.log(`\n${errors} problem(s).`); process.exit(1); }
console.log('\nContent OK.');
