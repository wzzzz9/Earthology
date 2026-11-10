import { content } from '../content';
import type { ClassDef, TaskDef } from '../content/types';
import { state } from './state';
import { evaluate, bandFor } from './rubric';
import { bus, EV } from './events';
import { saveNow } from './save';

/** One thing the professor says in the morning, or a page of the final result. */
export type Notice = { lines: string[]; note?: string };

const fmt = (tpl: string, vars: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
const exploredPct = () => Math.round((state.explored.length / Math.max(1, state.mapTiles)) * 100);

export function classOnDay(day: number): ClassDef | undefined {
  if (state.retake) return undefined;
  return content.classes.classes.find((c) => c.day === day);
}

export function classToday(): ClassDef | undefined {
  const c = classOnDay(state.day);
  return c && !state.classesAttended.includes(c.id) && !state.classesMissed.includes(c.id) ? c : undefined;
}

export function taskSatisfied(t: TaskDef): boolean {
  const s = t.satisfiedBy;
  if ('identifiedCount' in s) return state.identifiedCount >= s.identifiedCount;
  if ('scannedCount' in s) return state.scannedCount >= s.scannedCount;
  if ('talkEntries' in s) return state.talkEntries >= s.talkEntries;
  if ('exploredPct' in s) return exploredPct() >= s.exploredPct;
  if ('factLearned' in s) return state.factsLearned.includes(s.factLearned);
  return false;
}

export function taskFor(id: string): TaskDef | undefined {
  return content.classes.classes.map((c) => c.task).find((t) => t.id === id);
}

/** Called whenever state changes: marks open tasks done and tells the player. */
export function checkTasks(): void {
  for (const [id, ts] of Object.entries(state.tasks)) {
    if (ts.status !== 'open' && ts.status !== 'graced') continue;
    const def = taskFor(id);
    if (def && taskSatisfied(def)) {
      ts.status = 'done';
      bus.emit(EV.toast, fmt(content.classes.lines.taskDone, { task: def.text }));
      saveNow();
    }
  }
}

/** Attending a class: lesson pages, facts learned, task set. Returns the pages to show. */
export function attendClass(c: ClassDef): Notice[] {
  state.classesAttended.push(c.id);
  for (const f of c.teaches) state.learnFact(f);
  state.tasks[c.task.id] = { status: 'open', due: c.task.due };
  const pages: Notice[] = c.lesson.map((p) => ({ lines: p.lines, note: p.note }));
  pages.push({ lines: [fmt(content.classes.lines.taskSet, { task: c.task.text, due: c.task.due })], note: `Task: ${c.task.text}` });
  bus.emit(EV.stateChanged);
  saveNow();
  return pages;
}

/**
 * Runs when a new day starts (after sleeping). Handles yesterday's missed class,
 * task deadlines with one grace extension, reminders, class-today notice, and
 * the end of the class at the deadline. Returns what the professor says.
 */
export function onNewDay(): Notice[] {
  const L = content.classes.lines;
  const out: Notice[] = [];
  const yesterday = state.day - 1;

  // Missed class yesterday: you still get the notes (facts) and the task, but it is on record.
  const missed = classOnDay(yesterday);
  if (missed && !state.classesAttended.includes(missed.id) && !state.classesMissed.includes(missed.id)) {
    state.classesMissed.push(missed.id);
    for (const f of missed.teaches) state.learnFact(f);
    state.tasks[missed.task.id] = { status: 'open', due: missed.task.due };
    out.push({ lines: [L.classMissed, fmt(L.taskSet, { task: missed.task.text, due: missed.task.due })], note: `Missed class: ${missed.title}` });
  }

  // Tasks: anything open whose due day has passed.
  checkTasks();
  for (const [id, ts] of Object.entries(state.tasks)) {
    const def = taskFor(id);
    if (!def || ts.status === 'done' || ts.status === 'missed') continue;
    if (state.day > ts.due) {
      if (ts.status === 'open') {
        ts.status = 'graced';
        ts.due = ts.due + def.graceDays;
        out.push({ lines: [fmt(L.taskGrace, { day: state.day, due: ts.due })], note: `One more chance: ${def.text} by day ${ts.due}` });
      } else {
        ts.status = 'missed';
        out.push({ lines: [fmt(L.taskMissed, { day: state.day, task: def.text })], note: `Task missed: ${def.text}` });
      }
    }
  }

  // End of the class: the day after the deadline, the best report counts.
  const deadline = content.classes.deadlineDay;
  if (!state.retake && !state.finalResult && state.day > deadline) {
    const score = Math.max(state.bestScore, evaluate().score);
    const passed = score >= content.rubric.passMark;
    state.finalResult = { score, passed, day: state.day, attempt: state.attempt };
    if (!passed) {
      state.retake = true;
      state.attempt += 1;
    }
    const tpl = passed ? L.finalPass : L.finalFail;
    out.push({ lines: tpl.map((l) => fmt(l, { score })), note: passed ? 'Class passed.' : 'Class failed. Retake: discovery only.' });
  } else if (!state.retake && !state.finalResult && [30, 7, 1, 0].includes(deadline - state.day)) {
    out.push({ lines: [fmt(L.deadlineSoon, { due: deadline, left: deadline - state.day })] });
  }

  const today = classToday();
  if (today) out.push({ lines: [fmt(L.classToday, { day: state.day })], note: `Class today: ${today.title}` });

  bus.emit(EV.stateChanged);
  saveNow();
  return out;
}

/** A retake ends the moment a report passes. */
export function checkRetakePass(score: number): Notice[] {
  if (!state.retake || score < content.rubric.passMark) return [];
  state.retake = false;
  state.finalResult = { score, passed: true, day: state.day, attempt: state.attempt };
  saveNow();
  return [{ lines: content.classes.lines.retakePass.map((l) => l.replace('{score}', String(score))), note: 'Retake passed.' }];
}

export function gradeLabel(): string {
  if (!state.finalResult) return '';
  const b = bandFor(state.finalResult.score);
  return `${state.finalResult.passed ? 'PASS' : 'FAIL'} · ${b.name}`;
}
