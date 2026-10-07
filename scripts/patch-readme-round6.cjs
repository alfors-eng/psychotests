// Одноразовый патч README: новые тесты, справочные карточки, анимации.
const fs = require('fs');
let r = fs.readFileSync('README.md', 'utf8');
const set = (a, b) => {
  if (!r.includes(a)) throw new Error('нет: ' + a.slice(0, 60));
  r = r.replace(a, b);
};
set('Готовы 26 тестов (22 проходятся на сайте, 4 — в режиме ввода ответов):', 'Готовы 31 тест (26 проходятся на сайте, 5 — в режиме ввода ответов) и 17 справочных карточек:');
set('- Эмоциональное состояние: PHQ-9, GAD-7, DASS-21, K6, PCL-5, OCI-R', '- Эмоциональное состояние: PHQ-9, PHQ-4, GAD-7, DASS-21, CES-D, K6, PCL-5, OCI-R, Brief COPE');
set('- Самооценка и благополучие: Розенберг, SWLS, WHO-5, Flourishing, Grit-S, BRS, GSE, LOT-R', '- Самооценка и благополучие: Розенберг, SWLS, WHO-5, Flourishing, Grit-S, BRS, GSE, LOT-R, SCS-SF (самосострадание)');
set('- Ввод ответов с сайта оригинала: HEXACO-60, AQ-10, PSS-10, ASRS (часть A)', '- Ввод ответов с сайта оригинала: HEXACO-60, AQ-10, PSS-10, ASRS (часть A), BAT-12 (выгорание)');
const i = r.indexOf('## Заготовки (status: draft)');
const j = r.indexOf('Идеи, которые упираются');
if (i < 0 || j < 0) throw new Error('раздел заготовок не найден');
const block = `## Справочные карточки (status: reference)

Методики, которые нельзя воспроизводить (закрытая лицензия или условия не подтверждены), остаются в каталоге как справочные карточки: описание, причина ограничения (\`restriction\`), ссылка на официальный источник (\`officialUrl\`) и открытые аналоги на сайте (\`analogs\`). Прохождения у них нет. Сейчас так оформлены MMPI-2, MBTI, NEO-PI-R, 16PF, EPQ-R, BDI-II, BAI, STAI, SCL-90-R, MBI, тест Роршаха, WAIS-IV, TEIQue-SF, Schwartz PVQ, OEJTS, CBI и IPIP-NEO-120. У тестов с ограничениями на странице тоже есть блок «Другие открытые тесты по теме» (HEXACO-60, PSS-10).

Чтобы добавить карточку, создайте \`data/tests/<id>.json\` с \`"status": "reference"\`, \`officialUrl\`, \`restriction\` и \`analogs\` (id готовых тестов) — образец \`mmpi-2.json\`. Скрипт \`npm run validate\` проверяет обязательные поля.

`;
r = r.slice(0, i) + block + r.slice(j);
set('## Аналитика ответов', '## Анимации\n\nДекоративные анимации (появление блоков при прокрутке, орбита категорий, набегающие числа, рисование графиков) отключаются настройкой системы «меньше движения» и кнопкой «Остановить анимации» в шапке сайта (выбор сохраняется). Компоненты: `Reveal`, `CountUp`, `MotionToggle`, классы `anim-*` в `app/globals.css`.\n\n## Аналитика ответов');
fs.writeFileSync('README.md', r);
console.log('ok');
