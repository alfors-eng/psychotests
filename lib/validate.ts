import type { TestDef } from './types';

/** Проверка целостности JSON: ловит опечатки в новых тестах на этапе сборки. */
export function validateTest(t: TestDef, file: string): string[] {
  const errs: string[] = [];
  const e = (m: string) => errs.push(`${file}: ${m}`);
  if (t.id + '.json' !== file) e(`id «${t.id}» должен совпадать с именем файла`);
  for (const k of ['title', 'shortDescription', 'category', 'author', 'source', 'license'] as const)
    if (!t[k]) e(`нет поля ${k}`);
  if (t.status === 'draft') return errs;

  const ids = new Set<string>();
  for (const q of t.questions) {
    if (ids.has(q.id)) e(`повторяющийся id вопроса ${q.id}`);
    ids.add(q.id);
  }
  if (t.questions.length !== t.questionCount)
    e(`questionCount=${t.questionCount}, а вопросов ${t.questions.length}`);
  if (t.scale.options.length < 2) e('в scale меньше двух вариантов');
  const m = t.scoring.method;
  const subIds = new Set((t.scoring.subscales ?? []).map((s) => s.id));
  if (m === 'subscales' || m === 'typeMax') {
    if (!subIds.size) e('для subscales/typeMax нужны scoring.subscales');
    for (const q of t.questions.filter((x) => !x.filler))
      if (!q.subscale || !subIds.has(q.subscale)) e(`вопрос ${q.id}: неизвестная подшкала «${q.subscale}»`);
  }
  const scaleIds = m === 'sum' || m === 'average' ? ['total'] : [...subIds];
  for (const id of scaleIds) if (!t.interpretation[id]?.length) e(`нет interpretation для «${id}»`);
  for (const k of Object.keys(t.interpretation)) if (!scaleIds.includes(k)) e(`interpretation: лишний ключ «${k}»`);
  if (t.safety) {
    for (const c of t.safety.crisisQuestions ?? []) if (!ids.has(c.questionId)) e(`safety: нет вопроса ${c.questionId}`);
    for (const r of t.safety.helpAboveScore ? [t.safety.helpAboveScore].flat() : []) {
      if (!scaleIds.includes(r.scale)) e(`safety: неизвестная шкала «${r.scale}»`);
      if (r.min === undefined && r.max === undefined) e('safety: у правила нужен min или max');
    }
  }
  if (t.plane) {
    for (const id of [t.plane.x, t.plane.y]) if (!scaleIds.includes(id)) e(`plane: неизвестная шкала «${id}»`);
    if (t.plane.quadrants.length !== 4) e('plane: нужно ровно 4 квадранта');
  }
  return errs;
}
