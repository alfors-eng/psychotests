// Быстрая проверка движка на крайних ответах. Запуск: node scripts/engine-check.mjs
import fs from 'node:fs';
import { scoreTest, evaluateSafety } from '../lib/engine.ts';

const load = (id) => JSON.parse(fs.readFileSync(`data/tests/${id}.json`, 'utf8'));
const all = (t, v) => Object.fromEntries(t.questions.map((q) => [q.id, v]));
const eq = (a, b, m) => { if (a !== b) { console.error('FAIL', m, a, b); process.exitCode = 1; } else console.log('ok  ', m); };

const phq = load('phq-9');
let r = scoreTest(phq, all(phq, 3));
eq(r.scales[0].value, 27, 'PHQ-9 максимум = 27');
eq(r.scales[0].range.level, 'severe', 'PHQ-9 27 → тяжёлые');
eq(scoreTest(phq, all(phq, 0)).scales[0].range.title, 'Минимальные симптомы', 'PHQ-9 0 → минимальные');
// q9 > 0 при малом общем балле → crisis
const a = all(phq, 0); a.q9 = 1;
r = scoreTest(phq, a);
let s = evaluateSafety(phq, a, r);
eq(s.crisis && s.showHelp, true, 'PHQ-9 q9=1, итог 1 → блок помощи');
const b = all(phq, 0);
s = evaluateSafety(phq, b, scoreTest(phq, b));
eq(s.crisis || s.showHelp, false, 'PHQ-9 все «ни разу» → без блока');
const c = all(phq, 0); c.q1 = c.q2 = c.q3 = c.q4 = c.q5 = 2;
s = evaluateSafety(phq, c, scoreTest(phq, c));
eq(s.showHelp && !s.crisis, true, 'PHQ-9 10 баллов → мягкий блок, не crisis');

const ros = load('rosenberg-self-esteem');
eq(scoreTest(ros, all(ros, 3)).scales[0].value, 15, 'Розенберг: все «3» → 5×3 + 5×0 = 15');
const best = Object.fromEntries(ros.questions.map((q) => [q.id, q.reversed ? 0 : 3]));
eq(scoreTest(ros, best).scales[0].value, 30, 'Розенберг максимум = 30');

const big = load('ipip-big5-50');
// Обратные пункты: E 5, A 4, C 4, N 2, O 3 (по ключу Goldberg) → при всех «5» суммы 30/34/34/42/38.
r = scoreTest(big, all(big, 5));
eq(r.scales.map((x) => x.value).join(','), '30,34,34,42,38', 'IPIP: все «5» → 30,34,34,42,38');
eq(big.questions.filter((q) => q.reversed).length, 18, 'IPIP: 18 обратных пунктов');
