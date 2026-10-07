import fs from 'node:fs';
import path from 'node:path';
import type { TestDef, TestSummary } from './types';
import { validateTest } from './validate';

const DIR = path.join(process.cwd(), 'data', 'tests');

export function getAllTests(): TestDef[] {
  const tests = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((file) => {
      const t = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as TestDef;
      const errs = validateTest(t, file);
      if (errs.length) throw new Error('Ошибка в данных теста:\n' + errs.join('\n'));
      return t;
    });
  // готовые — первыми
  return tests.sort(
    (a, b) => Number(isReady(b)) - Number(isReady(a)) || a.title.localeCompare(b.title, 'ru'),
  );
}

export const getTest = (id: string) => getAllTests().find((t) => t.id === id);

export function toSummary(t: TestDef): TestSummary {
  const { questions, interpretation, fullDescription, instructions, scale, scoring, ...rest } = t;
  void questions, interpretation, fullDescription, instructions, scale, scoring;
  return rest;
}

export function isReady(t: { status?: string }) {
  return t.status !== 'draft';
}

/** Облегчённое описание для подсчёта в браузере: без текстов вопросов и описаний. */
export function toScoringDef(t: TestDef): TestDef {
  return {
    ...t,
    fullDescription: '',
    shortDescription: '',
    instructions: '',
    translationNote: undefined,
    license: '',
    todo: undefined,
    questions: t.questions.map((q) => ({ ...q, text: '' })),
  };
}
