// Одноразовый генератор справочных карточек (status: reference): известные методики, которые нельзя
// воспроизводить, с официальной ссылкой и открытыми аналогами на сайте. Запуск: node scripts/gen-reference.cjs
const fs = require('fs');
const P = (id) => `data/tests/${id}.json`;
const base = (o) => ({
  status: 'reference',
  tags: [],
  popular: false,
  instructions: '',
  scale: { type: 'likert', options: [{ value: 0, label: '—' }, { value: 1, label: '—' }] },
  questions: [],
  scoring: { method: 'sum' },
  interpretation: {},
  disclaimer: 'Справочная карточка. Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.',
  isClinical: false,
  fullDescription: '',
  ...o,
});

const cards = [
  base({
    id: 'mmpi-2', title: 'MMPI-2 — Миннесотский многоаспектный личностный опросник', category: 'personality',
    shortDescription: 'Самый известный клинический опросник личности: 567 утверждений, десять клинических шкал и шкалы достоверности.',
    fullDescription: 'MMPI создан в 1940-х годах (Hathaway и McKinley), MMPI-2 вышел в 1989 году. Он широко применяется в клинической, судебной и профессиональной диагностике. Результат интерпретирует обученный специалист: онлайн-версия без профессионала не заменяет обследование.',
    tags: ['клиническая диагностика', 'личность', 'психопатология'], duration: 90, questionCount: 567,
    author: 'S. R. Hathaway, J. C. McKinley; J. N. Butcher и др.', year: 1989,
    source: 'https://upress.umn.edu/test-division/mmpi-2', officialUrl: 'https://upress.umn.edu/test-division/mmpi-2',
    license: 'Проприетарная методика (University of Minnesota Press; распространяется через правообладателей).',
    restriction: 'Закрытая методика: продаётся и применяется только квалифицированными специалистами. Тексты вопросов и ключи на нашем сайте не воспроизводятся.',
    analogs: ['ipip-big5-50', 'dass-21', 'sd3'],
  }),
  base({
    id: 'mbti', title: 'MBTI — индикатор типов Майерс—Бриггс', category: 'personality',
    shortDescription: 'Популярная типология из 16 типов по четырём дихотомиям, основанная на идеях Юнга.',
    fullDescription: 'MBTI — самый распространённый в корпоративной среде тест типов личности. В научной психологии его критикуют за низкую надёжность и дихотомическое деление непрерывных черт; для описания личности чаще используют модель «Большой пятёрки».',
    tags: ['типология', 'Юнг', 'карьера'], duration: 25, questionCount: 93,
    author: 'Isabel Briggs Myers, Katharine C. Briggs', year: 1943,
    source: 'https://www.themyersbriggs.com/', officialUrl: 'https://www.themyersbriggs.com/',
    license: 'Проприетарная методика (The Myers-Briggs Company).',
    restriction: 'Платная лицензия, официальная версия доступна только через сертифицированных специалистов. На сайте нет её копий; открытая альтернатива типологии — OEJTS (см. ссылку), а надёжнее — тесты Большой пятёрки.',
    analogs: ['ipip-big5-50', 'mini-ipip', 'tipi'],
  }),
  base({
    id: 'neo-pi-r', title: 'NEO-PI-R — личностный опросник NEO', category: 'personality',
    shortDescription: 'Эталонный тест Большой пятёрки: 240 пунктов, пять доменов и 30 граней.',
    fullDescription: 'NEO PI-R (Costa и McCrae, 1992) — «золотой стандарт» измерения Большой пятёрки с оценкой 30 граней. Открытые аналоги строятся на банке IPIP: они проверены научно и не требуют лицензии.',
    tags: ['большая пятёрка', 'грани', 'эталонный тест'], duration: 40, questionCount: 240,
    author: 'Paul T. Costa Jr., Robert R. McCrae', year: 1992,
    source: 'https://www.parinc.com/', officialUrl: 'https://www.parinc.com/',
    license: 'Проприетарная методика (PAR Inc.).',
    restriction: 'Платная лицензия, ключи не публикуются. Вместо него на сайте можно пройти открытые тесты IPIP, измеряющие те же пять доменов.',
    analogs: ['ipip-big5-50', 'mini-ipip', 'hexaco-60'],
  }),
  base({
    id: '16pf', title: '16PF — шестнадцатифакторный личностный опросник Кеттелла', category: 'personality',
    shortDescription: 'Классический тест по 16 первичным факторам и пяти глобальным; часто применяется в профотборе.',
    fullDescription: '16PF создан Раймондом Кеттеллом на основе факторного анализа лексики личности. Пятое издание содержит 185 пунктов. В России известна по адаптациям, но официальные версии платные.',
    tags: ['профотбор', 'факторы личности'], duration: 40, questionCount: 185,
    author: 'Raymond B. Cattell, Herbert W. Eber, Maurice M. Tatsuoka', year: 1949,
    source: 'https://www.hogrefe.com/', officialUrl: 'https://www.hogrefe.com/',
    license: 'Проприетарная методика (IPAT / Hogrefe).',
    restriction: 'Платная методика с закрытым ключом. Открытые аналоги — тесты Большой пятёрки и HEXACO (шкалы близки к глобальным факторам 16PF).',
    analogs: ['ipip-big5-50', 'hexaco-60'],
  }),
  base({
    id: 'epq-r', title: 'EPQ-R — личностный опросник Айзенка', category: 'personality',
    shortDescription: 'Три фактора личности по Айзенку: экстраверсия, нейротизм, психотизм (плюс шкала лжи).',
    fullDescription: 'Опросник Ганса и Сибиллы Айзенков (EPQ-R, 100 пунктов) распространён в клинической и образовательной практике. Экстраверсия и нейротизм хорошо соответствуют двум чертам Большой пятёрки.',
    tags: ['Айзенк', 'нейротизм', 'экстраверсия'], duration: 15, questionCount: 100,
    author: 'Hans J. Eysenck, Sybil B. G. Eysenck', year: 1991,
    source: 'https://www.hogrefe.com/', officialUrl: 'https://www.hogrefe.com/',
    license: 'Проприетарная методика (правообладатель — издатель опросника).',
    restriction: 'Лицензируемая методика; бесплатной публичной версии с ключами нет. Для измерения экстраверсии и нейротизма можно пройти открытые тесты Большой пятёрки.',
    analogs: ['ipip-big5-50', 'mini-ipip', 'sd3'],
  }),
  base({
    id: 'bdi-ii', title: 'BDI-II — шкала депрессии Бека', category: 'emotional', isClinical: true,
    shortDescription: 'Один из самых используемых опросников депрессии: 21 пункт, оценка тяжести симптомов.',
    fullDescription: 'BDI-II (Beck, Steer и Brown, 1996) — стандартный инструмент оценки тяжести депрессии в клинической практике и исследованиях. Пользоваться им и интерпретировать результат должен специалист.',
    tags: ['депрессия', 'Бек', 'клиническая практика'], duration: 10, questionCount: 21,
    author: 'Aaron T. Beck, Robert A. Steer, Gregory K. Brown', year: 1996,
    source: 'https://www.pearsonassessments.com/', officialUrl: 'https://www.pearsonassessments.com/',
    license: 'Проприетарная методика (Pearson).',
    restriction: 'Платная методика Pearson, воспроизводить и распространять нельзя. Открытые аналоги — CES-D, PHQ-9 и шкала депрессии DASS-21.',
    analogs: ['cesd', 'phq-9', 'dass-21'],
  }),
  base({
    id: 'bai', title: 'BAI — шкала тревоги Бека', category: 'emotional', isClinical: true,
    shortDescription: 'Опросник из 21 симптома тревоги: физиологические и когнитивные проявления за последнюю неделю.',
    fullDescription: 'BAI (Beck и др., 1988) — один из самых распространённых клинических опросников тревоги.',
    tags: ['тревога', 'Бек', 'клиническая практика'], duration: 10, questionCount: 21,
    author: 'Aaron T. Beck, Norman Epstein, Gary Brown, Robert A. Steer', year: 1988,
    source: 'https://www.pearsonassessments.com/', officialUrl: 'https://www.pearsonassessments.com/',
    license: 'Проприетарная методика (Pearson).',
    restriction: 'Платная методика Pearson. Открытые аналоги — GAD-7, PHQ-4 и шкала тревоги DASS-21.',
    analogs: ['gad-7', 'phq-4', 'dass-21'],
  }),
  base({
    id: 'stai', title: 'STAI — шкала тревоги Спилбергера (реактивная и личностная)', category: 'emotional', isClinical: true,
    shortDescription: 'Измеряет тревогу как состояние и как устойчивую черту, 40 пунктов (в России — адаптация Ханина).',
    fullDescription: 'STAI (Spielberger, 1983, форма Y) — один из самых цитируемых опросников тревоги. Различает «тревогу здесь и сейчас» и склонность к тревожности как черте.',
    tags: ['тревога', 'Спилбергер', 'Ханин'], duration: 10, questionCount: 40,
    author: 'Charles D. Spielberger и др.', year: 1983,
    source: 'https://www.mindgarden.com/', officialUrl: 'https://www.mindgarden.com/',
    license: 'Проприетарная методика (Mind Garden).',
    restriction: 'Платная методика Mind Garden. Для оценки тревоги как состояния подойдут GAD-7 и DASS-21, как черты — шкала нейротизма Большой пятёрки.',
    analogs: ['gad-7', 'dass-21', 'phq-4', 'ipip-big5-50'],
  }),
  base({
    id: 'scl-90-r', title: 'SCL-90-R — опросник выраженности психопатологической симптоматики', category: 'emotional', isClinical: true,
    shortDescription: '90 вопросов о симптомах за последнюю неделю по девяти шкалам — от соматизации до психотизма.',
    fullDescription: 'SCL-90-R (Derogatis) широко используется для скрининга общего психологического неблагополучия и динамики лечения. В России известен благодаря адаптации Н. В. Тарабриной.',
    tags: ["симптомы", "Derogatis", "скрининг"], duration: 15, questionCount: 90,
    author: 'Leonard R. Derogatis', year: 1977,
    source: 'https://www.pearsonassessments.com/', officialUrl: 'https://www.pearsonassessments.com/',
    license: 'Проприетарная методика (Pearson).',
    restriction: 'Платная методика Pearson. Открытые аналоги для общего дистресса — K6, DASS-21 и PHQ-4.',
    analogs: ['k6', 'dass-21', 'phq-4'],
  }),
  base({
    id: 'mbi', title: 'MBI — опросник профессионального выгорания Маслач', category: 'emotional', isClinical: true,
    shortDescription: 'Классический опросник выгорания: эмоциональное истощение, деперсонализация и редукция достижений.',
    fullDescription: 'Maslach Burnout Inventory (Maslach и Jackson, 1981) — самый распространённый инструмент измерения выгорания. В России применяется адаптация Н. Е. Водопьяновой.',
    tags: ['выгорание', 'работа', 'Маслач'], duration: 10, questionCount: 22,
    author: 'Christina Maslach, Susan E. Jackson', year: 1981,
    source: 'https://www.mindgarden.com/', officialUrl: 'https://www.mindgarden.com/',
    license: 'Проприетарная методика (Mind Garden).',
    restriction: 'Платная лицензия Mind Garden. Открытая современная альтернатива — BAT-12 (ввод ответов с сайта авторов).',
    analogs: ['bat-12'],
  }),
  base({
    id: 'rorschach', title: 'Тест Роршаха', category: 'personality',
    shortDescription: 'Проективная методика: интерпретация десяти чернильных пятен; результат оценивает обученный специалист.',
    fullDescription: 'Тест Роршаха (1921) — старейшая проективная методика. Современные системы кодирования (комплексная система Экснера, R-PAS) требуют профессионального обучения. Автоматизированная онлайн-оценка невозможна и не заменяет специалиста.',
    tags: ['проективная методика'], duration: 60, questionCount: 10,
    author: 'Hermann Rorschach', year: 1921,
    source: 'https://www.r-pas.org/', officialUrl: 'https://www.r-pas.org/',
    license: 'Стимульный материал и системы кодирования защищены правами; применяется только обученными специалистами.',
    restriction: 'Методика не подходит для самостоятельного онлайн-прохождения: требует очной работы с обученным специалистом. Мы не размещаем стимулы и интерпретации.',
    analogs: [],
  }),
  base({
    id: 'wais-iv', title: 'WAIS-IV — шкала интеллекта Векслера для взрослых', category: 'personality',
    shortDescription: 'Эталонный тест интеллекта: 15 субтестов, общий IQ и четыре индекса.',
    fullDescription: 'Шкалы Векслера — самые используемые инструменты оценки интеллекта. Проводятся и интерпретируются только обученными психологами в очном формате; онлайн-тесты «на IQ» не равноценны этому обследованию.',
    tags: ['интеллект', 'IQ', 'Векслер'], duration: 90, questionCount: 15,
    author: 'David Wechsler', year: 2008,
    source: 'https://www.pearsonassessments.com/', officialUrl: 'https://www.pearsonassessments.com/',
    license: 'Проприетарная методика (Pearson).',
    restriction: 'Закрытая методика, доступна только квалифицированным специалистам.',
    analogs: [],
  }),
];
for (const c of cards) fs.writeFileSync(P(c.id), JSON.stringify(c, null, 2) + '\n');

// Существующие заготовки → справочные карточки
const patch = (id, o) => {
  const t = JSON.parse(fs.readFileSync(P(id), 'utf8'));
  Object.assign(t, o, { status: 'reference' });
  delete t.todo;
  fs.writeFileSync(P(id), JSON.stringify(t, null, 2) + '\n');
};
patch('teique-sf', {
  officialUrl: 'https://www.psychometriclab.com/',
  restriction: 'Бесплатно только для академических некоммерческих исследований; условия публичного воспроизведения не подтверждены, поэтому вопросы здесь не показываются. Для эмоционального интеллекта и регуляции эмоций доступны открытые тесты.',
  analogs: ['erq', 'scs-sf', 'brief-cope'],
});
patch('schwartz-pvq', {
  officialUrl: 'https://www.europeansocialsurvey.org/',
  restriction: 'Публикация опросника на публичных сайтах требует разрешения автора (Shalom Schwartz). Версия PVQ входит в Европейское социальное исследование (ESS), материалы доступны на сайте проекта.',
  analogs: [],
});
patch('oejts', {
  officialUrl: 'https://openpsychometrics.org/tests/OEJTS/',
  restriction: 'Открытая альтернатива MBTI (лицензия CC BY-NC-SA 4.0) доступна для прохождения на сайте Open-Source Psychometrics Project; формулы подсчёта на нашем сайте пока не реализованы.',
  analogs: ['ipip-big5-50', 'mini-ipip'],
});
patch('cbi', {
  officialUrl: 'https://nfa.dk/',
  restriction: 'Опросник Copenhagen Burnout Inventory свободен для использования, но проверяемый текст пунктов и ключи мы получить не смогли, поэтому показываем ссылку. Рекомендуем BAT-12.',
  analogs: ['bat-12'],
});
patch('ipip-neo-120', {
  officialUrl: 'https://ipip.ori.org/',
  restriction: 'Тест на банке IPIP (общественное достояние), но проверяемый текст 120 пунктов и ключей мы получить не смогли. Рядом доступны версии на 50 и 20 вопросов.',
  analogs: ['ipip-big5-50', 'mini-ipip'],
});

// Аналоги для ready-тестов с ограничениями (показываются на странице теста)
const analogs = {
  'hexaco-60': ['ipip-big5-50', 'sd3'],
  'pss-10': ['dass-21', 'k6'],
  'aq-10': [],
  'asrs-v1-1': [],
};
for (const [id, a] of Object.entries(analogs)) {
  const t = JSON.parse(fs.readFileSync(P(id), 'utf8'));
  t.analogs = a;
  fs.writeFileSync(P(id), JSON.stringify(t, null, 2) + '\n');
}
console.log('reference cards:', cards.length + 5);
