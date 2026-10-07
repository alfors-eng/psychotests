// Одноразовый патч моделей: подключает CES-D, PHQ-4, BAT-12, Brief COPE и SCS-SF к глубинному анализу и к сводным показателям.
const fs = require('fs');

// ---- валидатор: готовые тесты = не draft и не reference
let v = fs.readFileSync('scripts/validate-tests.mjs', 'utf8');
v = v.split("t.status === 'draft'").join("(t.status === 'draft' || t.status === 'reference')");
v = v.split("t.status !== 'draft'").join("(t.status !== 'draft' && t.status !== 'reference')");
fs.writeFileSync('scripts/validate-tests.mjs', v);

// ---- dimensions.json
const f = 'data/dimensions.json';
const m = JSON.parse(fs.readFileSync(f, 'utf8'));
const dim = (id) => m.dimensions.find((d) => d.id === id);
const add = (id, ...ls) => dim(id).loadings.push(...ls);
const L = (t, s, l, b) => ({ t, s, l, b });

m.references.push(
  { id: 'radloff1977', cite: 'Radloff, L. S. (1977). The CES-D scale: A self-report depression scale for research in the general population. Applied Psychological Measurement, 1, 385–401.', use: 'Шкала CES-D: симптомы депрессии, включая положительные пункты (обратный ключ).' },
  { id: 'kroenke2009', cite: 'Kroenke, K., Spitzer, R. L., Williams, J. B. W., & Löwe, B. (2009). An ultra-brief screening scale for anxiety and depression: The PHQ-4. Psychosomatics, 50, 613–621.', use: 'PHQ-4: два пункта тревоги и два — депрессии, общая основа дистресса.' },
  { id: 'schaufeli2020', cite: 'Schaufeli, W. B., Desart, S., & De Witte, H. (2020). Burnout Assessment Tool (BAT)—Development, validity, and reliability. International Journal of Environmental Research and Public Health, 17(24), 9495. https://doi.org/10.3390/ijerph17249495', use: 'Выгорание как состояние истощения, психологической дистанции и эмоционального и когнитивного сбоя.' },
  { id: 'carver1997', cite: 'Carver, C. S. (1997). You want to measure coping but your protocol\'s too long: Consider the Brief COPE. International Journal of Behavioral Medicine, 4(1), 92–100. https://doi.org/10.1207/s15327558ijbm0401_6', use: '14 стратегий совладания; здесь сгруппированы в проблемно-ориентированные, эмоционально-ориентированные и избегающие.' },
  { id: 'raes2011', cite: 'Raes, F., Pommier, E., Neff, K. D., & Van Gucht, D. (2011). Construction and factorial validation of a short form of the Self-Compassion Scale. Clinical Psychology & Psychotherapy, 18, 250–255. https://doi.org/10.1002/cpp.702', use: 'Самосострадание связано с меньшей тревогой и депрессией и большим благополучием.' },
);

add('DIST', L('cesd', 'total', 1, 'def'), L('phq-4', 'anx', 1, 'def'), L('phq-4', 'dep', 1, 'def'), L('bat-12', 'total', 0.7, 'lit'), L('scs-sf', 'total', -0.5, 'lit'));
add('LOWPA', L('cesd', 'total', 0.7, 'def'), L('phq-4', 'dep', 0.8, 'def'));
add('AROUSAL', L('phq-4', 'anx', 0.8, 'def'), L('bat-12', 'total', 0.4, 'lit'));
add('WB', L('cesd', 'total', -0.4, 'lit'), L('bat-12', 'total', -0.4, 'lit'), L('scs-sf', 'total', 0.5, 'lit'));
add('ES', L('cesd', 'total', -0.3, 'lit'), L('phq-4', 'anx', -0.3, 'lit'), L('phq-4', 'dep', -0.3, 'lit'));
add('CSE', L('scs-sf', 'total', 0.6, 'lit'), L('brief-cope', 'sb', -0.4, 'lit'));
add('RES', L('scs-sf', 'total', 0.4, 'lit'), L('brief-cope', 'pr', 0.5, 'lit'), L('brief-cope', 'ap', 0.3, 'lit'), L('brief-cope', 'hu', 0.3, 'cnt'));
add('CONN', L('brief-cope', 'es', 0.4, 'cnt'), L('brief-cope', 'is', 0.4, 'cnt'));
add('C', L('brief-cope', 'ac', 0.3, 'lit'), L('brief-cope', 'pl', 0.3, 'lit'));
add('REAPP', L('scs-sf', 'total', 0.3, 'cnt'));
dim('DIST').refs.push('radloff1977', 'kroenke2009', 'schaufeli2020');
dim('LOWPA').refs.push('radloff1977');

const copeIds = { PF: ['ac', 'pl', 'is'], EF: ['es', 'pr', 'ap', 'hu', 'rl'], AV: ['dn', 'bd', 'su', 'sd', 've', 'sb'] };
const copeLoad = (ids, l) => ids.map((s) => L('brief-cope', s, s === 'sd' ? 0.7 : s === 've' || s === 'sb' ? 0.6 : l, 'def'));
m.dimensions.push(
  { id: 'SC', group: 'self', title: 'Самосострадание', low: 'самокритика, чувство изоляции и застревание на неудаче', high: 'доброта к себе, чувство общности с другими людьми, взвешенное отношение к переживаниям', refs: ['raes2011'], loadings: [L('scs-sf', 'total', 1, 'def'), L('rosenberg-self-esteem', 'total', 0.3, 'lit')] },
  { id: 'COPE_PF', group: 'regulation', title: 'Совладание: решение проблемы (активное, планирование, помощь)', low: 'реже действует и планирует при стрессе', high: 'активно действует, планирует и ищет практическую помощь', refs: ['carver1997'], loadings: copeLoad(copeIds.PF, 1) },
  { id: 'COPE_EF', group: 'regulation', title: 'Совладание: работа с переживаниями (поддержка, переоценка, принятие)', low: 'реже опирается на поддержку, переоценку и принятие', high: 'опирается на поддержку, переоценку, принятие, юмор и веру', refs: ['carver1997'], loadings: copeLoad(copeIds.EF, 1) },
  { id: 'COPE_AV', group: 'regulation', title: 'Совладание: избегание (отрицание, отвлечение, самообвинение)', low: 'избегание в стрессе применяется редко', high: 'в стрессе чаще избегает, отвлекается, отрицает или обвиняет себя', refs: ['carver1997'], loadings: copeLoad(copeIds.AV, 1) },
);
m.itemLoadings.push(
  { t: 'cesd', i: 'q4', d: 'LOWPA', l: 1, b: 'cnt', why: 'Положительные пункты CES-D (с обратным ключом) — сниженная позитивность.' },
  { t: 'cesd', i: 'q8', d: 'LOWPA', l: 1, b: 'cnt', why: 'Надежда на будущее — позитивное переживание (обратный пункт).' },
  { t: 'cesd', i: 'q12', d: 'LOWPA', l: 1, b: 'cnt', why: 'Ощущение счастья — позитивное переживание (обратный пункт).' },
  { t: 'cesd', i: 'q16', d: 'LOWPA', l: 1, b: 'cnt', why: 'Удовольствие от жизни — позитивное переживание (обратный пункт).' },
  { t: 'cesd', i: 'q14', d: 'CONN', l: -0.7, b: 'cnt', why: 'Чувство одиночества.' },
  { t: 'cesd', i: 'q15', d: 'CONN', l: -0.4, b: 'cnt', why: 'Люди воспринимаются как недружелюбные.' },
  { t: 'cesd', i: 'q19', d: 'CONN', l: -0.5, b: 'cnt', why: 'Ощущение, что не нравишься людям.' },
  { t: 'cesd', i: 'q9', d: 'CSE', l: -0.5, b: 'cnt', why: 'Мысли, что жизнь не удалась — самооценка.' },
  { t: 'cesd', i: 'q10', d: 'AROUSAL', l: 0.6, b: 'cnt', why: 'Страх — тревожное возбуждение.' },
);
fs.writeFileSync(f, JSON.stringify(m, null, 2) + '\n');

// ---- constructs.json (сводные показатели)
const cf = 'data/constructs.json';
const c = JSON.parse(fs.readFileSync(cf, 'utf8'));
const con = (id) => c.constructs.find((x) => x.id === id);
con('depression').sources.push({ test: 'cesd', scale: 'total', weight: 1 }, { test: 'phq-4', scale: 'dep', weight: 1 });
con('anxiety').sources.push({ test: 'phq-4', scale: 'anx', weight: 1 });
con('stress').sources.push({ test: 'bat-12', scale: 'total', weight: 0.7 });
con('coping').sources.push({ test: 'scs-sf', scale: 'total', weight: 0.6 });
fs.writeFileSync(cf, JSON.stringify(c, null, 2) + '\n');
console.log('ok');
