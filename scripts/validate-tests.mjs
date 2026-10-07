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
  (t.status === 'draft' || t.status === 'reference') ? drafts++ : ready++;
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
    if ((t.status === 'draft' || t.status === 'reference')) cerrs.push(`constructs ${c.id}: тест ${s.test} — заготовка`);
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

// ---- Проверка модели глубинного анализа (data/dimensions.json) ----
const model = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'dimensions.json'), 'utf8'));
const derrs = [];
const groupIds = new Set(model.groups.map((g) => g.id));
const refIds = new Set(model.references.map((r) => r.id));
const dimIds = new Set();
const readyTests = Object.values(tests).filter((t) => (t.status !== 'draft' && t.status !== 'reference'));
const scaleKeys = (t) => (t.scoring.method === 'sum' || t.scoring.method === 'average' ? ['total'] : (t.scoring.subscales ?? []).map((x) => x.id));
const covered = new Set();
for (const d of model.dimensions) {
  if (dimIds.has(d.id)) derrs.push(`dimensions: повторяющийся id ${d.id}`);
  dimIds.add(d.id);
  if (!groupIds.has(d.group)) derrs.push(`dimensions ${d.id}: неизвестная группа ${d.group}`);
  for (const r of d.refs) if (!refIds.has(r)) derrs.push(`dimensions ${d.id}: нет источника ${r}`);
  if (!d.composite && !d.loadings.some((x) => x.b === 'def')) derrs.push(`dimensions ${d.id}: нет ни одной прямой (def) нагрузки`);
  for (const x of d.loadings) {
    const t = tests[x.t];
    if (!t) { derrs.push(`dimensions ${d.id}: нет теста ${x.t}`); continue; }
    if ((t.status === 'draft' || t.status === 'reference')) derrs.push(`dimensions ${d.id}: тест ${x.t} — заготовка`);
    if (!scaleKeys(t).includes(x.s)) derrs.push(`dimensions ${d.id}: у теста ${x.t} нет шкалы ${x.s}`);
    if (!(Math.abs(x.l) > 0 && Math.abs(x.l) <= 1)) derrs.push(`dimensions ${d.id}: нагрузка ${x.l} вне (0; 1]`);
    if (!['def', 'lit', 'cnt'].includes(x.b)) derrs.push(`dimensions ${d.id}: неизвестное основание ${x.b}`);
    covered.add(`${x.t}:${x.s}`);
  }
}
for (const x of model.itemLoadings) {
  const t = tests[x.t];
  if (!t) { derrs.push(`itemLoadings: нет теста ${x.t}`); continue; }
  if (!t.questions.some((q) => q.id === x.i)) derrs.push(`itemLoadings: у ${x.t} нет пункта ${x.i}`);
  if (!dimIds.has(x.d)) derrs.push(`itemLoadings: нет измерения ${x.d}`);
  if (!x.why) derrs.push(`itemLoadings ${x.t}:${x.i}: нужно пояснение why`);
}
// каждый пункт каждого готового теста должен попадать хотя бы в одно измерение
for (const t of readyTests) {
  for (const s of scaleKeys(t)) if (!covered.has(`${t.id}:${s}`)) derrs.push(`dimensions: шкала ${t.id}:${s} не входит ни в одно измерение`);
}
if (derrs.length) {
  console.error(derrs.join('\n'));
  process.exit(1);
}
console.log(`OK: измерений — ${model.dimensions.length}, все шкалы ${readyTests.length} готовых тестов покрыты`);
