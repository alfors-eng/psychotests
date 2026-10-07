// Проверка всех JSON в data/tests. Запуск: npm run validate (нужен Node 22.18+).
import fs from 'node:fs';
import path from 'node:path';
import { validateTest } from '../lib/validate.ts';

const dir = path.join(process.cwd(), 'data', 'tests');
let errors = [];
let ready = 0;
let drafts = 0;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const t = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  errors = errors.concat(validateTest(t, file));
  t.status === 'draft' ? drafts++ : ready++;
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK: готовых тестов — ${ready}, заготовок — ${drafts}`);

// ---- Проверка соответствий конструктов (data/constructs.json) ----
const cons = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'constructs.json'), 'utf8'));
const tests = Object.fromEntries(
  fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    const t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return [t.id, t];
  }),
);
const cerrs = [];
const domainIds = new Set(cons.domains.map((d) => d.id));
const seen = new Set();
for (const c of cons.constructs) {
  if (seen.has(c.id)) cerrs.push(`constructs: повторяющийся id ${c.id}`);
  seen.add(c.id);
  if (!domainIds.has(c.domain)) cerrs.push(`constructs ${c.id}: неизвестная область ${c.domain}`);
  if (!c.sources.length) cerrs.push(`constructs ${c.id}: нет источников`);
  for (const s of c.sources) {
    const t = tests[s.test];
    if (!t) { cerrs.push(`constructs ${c.id}: нет теста ${s.test}`); continue; }
    if (t.status === 'draft') cerrs.push(`constructs ${c.id}: тест ${s.test} — заготовка`);
    const scaleIds = t.scoring.method === 'sum' || t.scoring.method === 'average' ? ['total'] : (t.scoring.subscales ?? []).map((x) => x.id);
    if (!scaleIds.includes(s.scale)) cerrs.push(`constructs ${c.id}: у теста ${s.test} нет шкалы ${s.scale}`);
    if (!(s.weight > 0 && s.weight <= 1)) cerrs.push(`constructs ${c.id}: вес ${s.weight} вне (0; 1]`);
  }
}
if (cerrs.length) {
  console.error(cerrs.join('\n'));
  process.exit(1);
}
console.log(`OK: конструктов — ${cons.constructs.length}, соответствий проверено`);
