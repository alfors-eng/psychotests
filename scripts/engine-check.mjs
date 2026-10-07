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

// --- Проверки новых тестов ---
const aq = load('aq-10');
const aqAns = Object.fromEntries(aq.questions.map((q) => [q.id, q.scoreWhen.includes(1) ? 1 : 4]));
eq(scoreTest(aq, aqAns).scales[0].value, 10, 'AQ-10: все ключевые ответы → 10');
eq(scoreTest(aq, all(aq, 1)).scales[0].value, 4, 'AQ-10: везде «определённо согласен» → 4 (пункты 1,7,8,10)');
eq(scoreTest(aq, all(aq, 4)).scales[0].value, 6, 'AQ-10: везде «определённо не согласен» → 6 (пункты 2–6,9)');

const grit = load('grit-s');
eq(scoreTest(grit, all(grit, 5)).scales.map((x) => x.value).join(','), '1,5'.replace('1,5', '1,5'), 'Grit-S: все «5» → CI=1 (4 обратных), PE=5');

const ecr = load('ecr-r');
const chris = [1,2,2,1,3,2,2,2,1,1,6,2,2,2,3,2,5,1,2,5,2,5,2,4,2,6,6,7,7,5,6,2,6,6,6,6];
const ca = Object.fromEntries(chris.map((v, i) => [`q${i + 1}`, v]));
const cr = scoreTest(ecr, ca).scales.map((x) => x.value.toFixed(2));
eq(cr.join(','), '2.33,2.17', 'ECR-R: пример с сайта Fraley (тревожность 2.33, избегание 2.17)');

const ri = load('riasec');
const rr = Object.fromEntries(ri.questions.map((q) => [q.id, q.subscale === 'S' || q.subscale === 'A' ? 1 : 0]));
r = scoreTest(ri, rr);
eq(r.dominant.sort().join(''), 'AS', 'RIASEC: максимум у A и S');
eq(r.scales.find((x) => x.id === 'S').value, 10, 'RIASEC: 10 пунктов на тип');

// --- Раунд 4: новые тесты ---
const help = (t, v) => { const a = all(t, v); return evaluateSafety(t, a, scoreTest(t, a)).showHelp; };
const dass = load('dass-21');
eq(scoreTest(dass, all(dass, 3)).scales.map((x) => x.value).join(','), '21,21,21', 'DASS-21: все «3» → по 21');
eq(scoreTest(dass, all(dass, 3)).scales[0].range.level, 'severe', 'DASS-21: депрессия 21 → крайне тяжёлая');
eq(help(dass, 3) && !help(dass, 0), true, 'DASS-21: помощь при высоких баллах, не при нулях');
const mi = load('mini-ipip');
eq(scoreTest(mi, all(mi, 5)).scales.map((x) => x.value).join(','), '12,12,12,12,8', 'Mini-IPIP: все «5» → 12,12,12,12,8');
eq(mi.questions.filter((x) => x.reversed).length, 11, 'Mini-IPIP: 11 обратных пунктов (E2, A2, C2, N2, O3)');
const brs = load('brs');
eq(scoreTest(brs, all(brs, 5)).scales[0].value, 3, 'BRS: все «5» → 3 (3 обратных пункта)');
const w5 = load('who-5');
eq(help(w5, 0) && !help(w5, 5), true, 'WHO-5: помощь при низких баллах (≤12), не при высоких');
eq(scoreTest(w5, all(w5, 5)).scales[0].value, 25, 'WHO-5 максимум = 25');
const pcl = load('pcl-5');
eq(scoreTest(pcl, all(pcl, 4)).scales[0].value, 80, 'PCL-5 максимум = 80');
eq(help(pcl, 4) && !help(pcl, 1), true, 'PCL-5: помощь при ≥31');
const k6 = load('k6');
eq(help(k6, 4) && !help(k6, 0), true, 'K6: помощь при ≥13');
const gse = load('gse');
eq(scoreTest(gse, all(gse, 4)).scales[0].value, 40, 'GSE максимум = 40');
const ucla = load('ucla-3');
eq(scoreTest(ucla, all(ucla, 3)).scales[0].range.level, 'high', 'UCLA-3: 9 → выраженное одиночество');

// --- Раунд 5 ---
const lot = load('lot-r');
eq(scoreTest(lot, all(lot, 4)).scales[0].value, 12, 'LOT-R: все «4» → 12 (3 прямых + 3 обратных = 12; филлеры не считаются)');
eq(lot.questions.filter((x) => x.filler).length, 4, 'LOT-R: 4 филлера');
const sd3 = load('sd3');
eq(scoreTest(sd3, all(sd3, 5)).scales.map((x) => x.value.toFixed(2)).join(','), '5.00,3.67,4.11', 'SD3: все «5» → 5.00, 3.67, 4.11');
const tipi = load('tipi');
eq(scoreTest(tipi, all(tipi, 7)).scales.map((x) => x.value).join(','), '4,4,4,4,4', 'TIPI: все «7» → по 4 (прямой 7 + обратный 1)');
const fl = load('flourishing');
eq(scoreTest(fl, all(fl, 7)).scales[0].value, 56, 'Flourishing максимум = 56');
const erq = load('erq');
eq(scoreTest(erq, all(erq, 7)).scales.map((x) => x.value).join(','), '7,7', 'ERQ: все «7» → 7,7');
const oci = load('oci-r');
eq(scoreTest(oci, all(oci, 4)).scales[0].value, 72, 'OCI-R максимум = 72');
eq(help(oci, 4) && !help(oci, 0), true, 'OCI-R: помощь при ≥21');
