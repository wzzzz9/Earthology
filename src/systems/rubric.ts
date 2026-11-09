import { content } from '../content';
import type { RubricItem, Section, Band } from '../content/types';
import { state } from './state';
import { levelOf } from './relationships';
import { bus, EV } from './events';
import { saveNow } from './save';

export interface SectionScore {
  section: Section;
  got: number;
  total: number;
}

export interface Evaluation {
  score: number;
  satisfied: Set<string>;
  sections: SectionScore[];
  total: number;
}

export function isSatisfied(item: RubricItem): boolean {
  const s = item.satisfiedBy;
  if ('scanned' in s) return state.hasScanned(s.scanned);
  if ('identified' in s) return state.hasIdentified(s.identified);
  if ('factLearned' in s) return state.factsLearned.includes(s.factLearned);
  if ('entry' in s) return state.hasEntry(s.entry);
  if ('testsRun' in s) return state.testsRun >= s.testsRun;
  if ('relationshipAtLeast' in s) return levelOf(s.relationshipAtLeast.npc) >= s.relationshipAtLeast.level;
  return false;
}

/** Marks the notebook against the rubric. Generic: knows nothing about Iceland. */
export function evaluate(): Evaluation {
  const items = content.rubric.items;
  const satisfied = new Set<string>();
  const bySection = new Map<Section, SectionScore>();
  let got = 0;
  let total = 0;
  for (const it of items) {
    const ok = isSatisfied(it);
    if (ok) satisfied.add(it.id);
    total += it.weight;
    if (ok) got += it.weight;
    const sec = bySection.get(it.section) ?? { section: it.section, got: 0, total: 0 };
    sec.total += it.weight;
    if (ok) sec.got += it.weight;
    bySection.set(it.section, sec);
  }
  const score = total ? Math.round((got / total) * 100) : 0;
  return { score, satisfied, sections: [...bySection.values()], total };
}

export function bandFor(score: number): Band {
  const bands = [...content.teacher.bands].sort((a, b) => a.min - b.min);
  let best = bands[0];
  for (const b of bands) if (score >= b.min) best = b;
  return best;
}

export interface Feedback {
  kind: 'marked' | 'locked';
  score: number;
  band: Band;
  pages: string[][];
  /** True the first time this submission reaches 100. */
  revealed: boolean;
}

const fingerprint = (ev: Evaluation) => [...ev.satisfied].sort().join(',') + `|${state.thingsCount}`;

/** Which item to hint about: the weakest section (lowest ratio), then its heaviest unmet item. */
function pickHintItem(ev: Evaluation): RubricItem | null {
  const unmet = content.rubric.items.filter((it) => !ev.satisfied.has(it.id));
  if (!unmet.length) return null;
  const ratio = new Map(ev.sections.map((s) => [s.section, s.total ? s.got / s.total : 1]));
  unmet.sort((a, b) => (ratio.get(a.section) ?? 1) - (ratio.get(b.section) ?? 1) || b.weight - a.weight);
  return unmet[0];
}

function sectionLine(s: SectionScore): string {
  const t = content.teacher;
  const r = s.total ? s.got / s.total : 0;
  const tpl = r >= 0.85 ? t.sectionLines.strong : r >= 0.5 ? t.sectionLines.ok : r > 0 ? t.sectionLines.thin : t.sectionLines.empty;
  return tpl.replace('{section}', t.sectionNames[s.section]);
}

/** The player hands in the notebook. Returns everything the submission screen shows. */
export function submit(): Feedback {
  const t = content.teacher;
  const ev = evaluate();
  const band = bandFor(ev.score);

  // Locked: the teacher refuses until enough new things exist.
  if (state.lockBaseline !== null) {
    const need = state.lockBaseline + t.unlockNeeded - state.thingsCount;
    if (need > 0) {
      return { kind: 'locked', score: ev.score, band, revealed: false, pages: [[t.locked.replace('{n}', String(need))]] };
    }
    state.lockBaseline = null;
    state.identicalStreak = 0;
  }

  const fp = fingerprint(ev);
  const last = state.submissions[state.submissions.length - 1];
  const identical = !!last && last.fingerprint === fp;
  const pages: string[][] = [];

  if (identical) {
    state.identicalStreak += 1;
    const n = Math.min(state.identicalStreak, t.spam.length);
    pages.push([t.spam[n - 1]]);
    if (state.identicalStreak >= t.spam.length) {
      state.lockBaseline = state.thingsCount;
      state.submissions.push({ day: state.day, score: ev.score, fingerprint: fp });
      saveNow();
      bus.emit(EV.stateChanged);
      return { kind: 'locked', score: ev.score, band, revealed: false, pages };
    }
  } else {
    state.identicalStreak = 0;
  }

  // The mark and the band.
  pages.push([`Mark: ${ev.score} / 100`, `Grade: ${band.name}`]);
  pages.push(band.lines);
  // One line per section that has rubric items.
  pages.push(ev.sections.map(sectionLine).slice(0, 3));
  if (ev.sections.length > 3) pages.push(ev.sections.map(sectionLine).slice(3, 6));

  // The hint ladder for the weakest part.
  const item = pickHintItem(ev);
  if (item) {
    const n = state.hintProgress[item.id] ?? 0;
    const hint = item.hints[Math.min(n, item.hints.length - 1)];
    state.hintProgress[item.id] = n + 1;
    pages.push([t.hintIntro.replace('{section}', t.sectionNames[item.section]), hint]);
  }

  let revealed = false;
  if (ev.score >= 100 && !state.rubricRevealed) {
    state.rubricRevealed = true;
    revealed = true;
    pages.push([t.reveal]);
  }

  state.bestScore = Math.max(state.bestScore, ev.score);
  state.submissions.push({ day: state.day, score: ev.score, fingerprint: fp });
  saveNow();
  bus.emit(EV.stateChanged);
  return { kind: 'marked', score: ev.score, band, pages, revealed };
}
