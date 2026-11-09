import scannablesJson from '../../content/countries/iceland/scannables.json';
import npcsJson from '../../content/countries/iceland/npcs.json';
import dialogueJson from '../../content/countries/iceland/dialogue.json';
import factsJson from '../../content/facts.json';
import samplesJson from '../../content/samples.json';
import testsJson from '../../content/tests.json';
import keyJson from '../../content/key.json';
import rubricJson from '../../content/countries/iceland/rubric.json';
import teacherJson from '../../content/countries/iceland/teacher.json';
import introJson from '../../content/countries/iceland/intro.json';
import classesJson from '../../content/countries/iceland/classes.json';
import type { Scannable, NpcDef, NpcDialogue, Fact, SampleDef, TestDef, TestId, IdKey, Rubric, TeacherDef, IntroDef, ClassesDef } from './types';

/** All game content, bundled at build time. Never hard-code facts in src/. */
export const content = {
  scannables: scannablesJson as Record<string, Scannable>,
  npcs: npcsJson as Record<string, NpcDef>,
  dialogue: dialogueJson as Record<string, NpcDialogue>,
  facts: factsJson as Record<string, Fact>,
  samples: samplesJson as Record<string, SampleDef>,
  tests: testsJson as Record<TestId, TestDef>,
  key: keyJson as IdKey,
  rubric: rubricJson as Rubric,
  teacher: teacherJson as TeacherDef,
  intro: introJson as IntroDef,
  classes: classesJson as ClassesDef,
};

export const TEST_ORDER: TestId[] = ['lens', 'water', 'magnet', 'acid', 'streak', 'scratch'];
