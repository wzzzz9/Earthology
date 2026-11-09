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

// ---- shared content: facts, samples, tests, key ----
const facts = read(join(root, 'facts.json'));
const samples = read(join(root, 'samples.json'));
const tests = read(join(root, 'tests.json'));
const key = read(join(root, 'key.json'));
console.log('Shared content');
const unverified = [];
for (const [id, f] of Object.entries(facts)) {
  if (![1, 2, 3].includes(f.tier)) fail(`fact ${id}: bad tier`);
  if (!f.source) fail(`fact ${id}: no source`);
  if (!f.fieldNote) fail(`fact ${id}: no fieldNote`);
  if (f.fieldNote.length > MAX_CHARS) fail(`fact ${id}: fieldNote too long (${f.fieldNote.length})`);
  if (!f.verified) unverified.push(id);
}
for (const [id, smp] of Object.entries(samples)) {
  for (const t of Object.keys(tests)) if (!smp.tests?.[t]) fail(`sample ${id}: missing test result for ${t}`);
  for (const t of Object.keys(smp.tests ?? {})) if (!tests[t]) fail(`sample ${id}: unknown test ${t}`);
  for (const f of smp.facts ?? []) if (!facts[f]) fail(`sample ${id}: unknown fact ${f}`);
  if (!smp.look || smp.look.length > MAX_CHARS) fail(`sample ${id}: look missing or too long`);
}
const visitKey = (id, seen = new Set()) => {
  if (seen.has(id)) return fail(`key: loop at ${id}`);
  seen.add(id);
  const n = key.nodes[id];
  if (!n) return fail(`key: unknown node ${id}`);
  if (!tests[n.test]) fail(`key ${id}: unknown test ${n.test}`);
  for (const side of ['yes', 'no']) {
    const leaf = n[side];
    if (!leaf) { fail(`key ${id}: missing ${side}`); continue; }
    if ('node' in leaf) visitKey(leaf.node, new Set(seen));
    else if (!samples[leaf.sample]) console.log(`  ! key ${id}: ${side} names sample "${leaf.sample}" that has no entry yet (ok until that rock exists)`);
  }
};
visitKey(key.start);
for (const id of Object.keys(samples)) {
  // Every sample must be reachable as a leaf of the key.
  const leaves = Object.values(key.nodes).flatMap((n) => [n.yes, n.no]).filter((l) => 'sample' in l).map((l) => l.sample);
  if (!leaves.includes(id)) fail(`sample ${id} is not a leaf of the identification key`);
}
if (unverified.length) console.log(`  ! ${unverified.length} unverified fact(s): ${unverified.join(', ')}`);

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

  // ---- classes ----
  if (existsSync(join(dir, 'classes.json'))) {
    const cl = read(join(dir, 'classes.json'));
    const seenDays = new Set();
    for (const c of cl.classes) {
      if (seenDays.has(c.day)) fail(`class ${c.id}: two classes on day ${c.day}`);
      seenDays.add(c.day);
      if (c.day >= cl.deadlineDay) fail(`class ${c.id}: day ${c.day} is not before the deadline ${cl.deadlineDay}`);
      for (const f of c.teaches) if (!facts[f]) fail(`class ${c.id}: unknown fact ${f}`);
      c.lesson.forEach((pg, i) => checkNode(`class ${c.id} page ${i}`, pg));
      if (c.task.due <= c.day) fail(`class ${c.id}: task due day ${c.task.due} is not after the class`);
      if (c.task.due + c.task.graceDays > cl.deadlineDay) fail(`class ${c.id}: task grace runs past the deadline`);
      if (c.task.text.length > MAX_CHARS) fail(`class ${c.id}: task text too long`);
    }
    for (const [k, v] of Object.entries(cl.lines)) {
      const arr = Array.isArray(v) ? v : [v];
      if (arr.length > MAX_LINES) fail(`classes.lines.${k}: ${arr.length} lines`);
      for (const l of arr) if (l.length > MAX_CHARS + 20) fail(`classes.lines.${k}: line too long (${l.length})`);
    }
  }

  // ---- rubric ----
  if (existsSync(join(dir, 'rubric.json'))) {
    const rubric = read(join(dir, 'rubric.json'));
    const teacher = existsSync(join(dir, 'teacher.json')) ? read(join(dir, 'teacher.json')) : null;
    if (!teacher) fail('rubric without teacher.json');
    let total = 0;
    let needsFriend = 0; // weight only reachable above Acquaintance
    const ids = new Set();
    for (const it of rubric.items) {
      if (ids.has(it.id)) fail(`rubric ${it.id}: duplicate id`);
      ids.add(it.id);
      total += it.weight;
      if (!Array.isArray(it.hints) || it.hints.length !== 3) fail(`rubric ${it.id}: needs exactly 3 hints (nudge, clue, answer)`);
      for (const h of it.hints ?? []) if (h.length > MAX_CHARS * 2) fail(`rubric ${it.id}: hint too long (${h.length})`);
      const sb = it.satisfiedBy ?? {};
      if ('scanned' in sb && !scannables[sb.scanned]) fail(`rubric ${it.id}: unknown scannable ${sb.scanned}`);
      if ('identified' in sb && !samples[sb.identified]) fail(`rubric ${it.id}: unknown sample ${sb.identified}`);
      if ('factLearned' in sb && !facts[sb.factLearned]) fail(`rubric ${it.id}: unknown fact ${sb.factLearned}`);
      if ('relationshipAtLeast' in sb) {
        if (!npcs[sb.relationshipAtLeast.npc]) fail(`rubric ${it.id}: unknown npc`);
        if (sb.relationshipAtLeast.level > 1) needsFriend += it.weight;
      }
      if ('entry' in sb) {
        const [npcId, topicId] = sb.entry.split('.');
        const topic = dialogue[npcId]?.[topicId];
        if (!topic) fail(`rubric ${it.id}: entry ${sb.entry} matches no dialogue topic`);
        else if ((topic.requires?.level ?? 0) > 1) needsFriend += it.weight;
      }
    }
    if (total !== 100) fail(`rubric weights sum to ${total}, expected 100`);
    const pass = rubric.passMark ?? 60;
    if (100 - needsFriend < pass) fail(`a plot-skipper (never above Acquaintance) can only reach ${100 - needsFriend}, below the pass mark ${pass}`);
    else console.log(`  ok: a player who never goes above Acquaintance can reach ${100 - needsFriend}/100 (pass mark ${pass})`);
    if (teacher) {
      for (const b of teacher.bands) for (const l of b.lines) if (l.length > MAX_CHARS) fail(`teacher band ${b.name}: line too long: "${l}"`);
      if (teacher.spam.length !== 3) fail('teacher.spam must have 3 lines');
    }
  }
}

if (errors) { console.log(`\n${errors} problem(s).`); process.exit(1); }
console.log('\nContent OK.');
