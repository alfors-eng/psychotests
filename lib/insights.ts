import type { Integrated } from './integrate';

export interface Insight {
  id: string;
  tone: 'info' | 'positive' | 'attention';
  title: string;
  text: string;
  /** id конструктов, на которых основан вывод. */
  basis: string[];
}

const HIGH = 65;
const LOW = 35;
const pct = (n: number) => `${Math.round(n)} %`;

/**
 * Выводы по сочетаниям показателей из разных тестов. Это описание ответов, а не диагноз:
 * формулировки осторожные («может», «часто»), правила простые и открытые.
 */
export function buildInsights(items: Integrated[], testTitles: Record<string, string> = {}): Insight[] {
  const by = new Map(items.map((i) => [i.def.id, i]));
  const s = (id: string) => by.get(id)?.score ?? null;
  const title = (id: string) => by.get(id)?.def.title ?? id;
  const out: Insight[] = [];
  const hi = (id: string) => (s(id) ?? -1) >= HIGH;
  const lo = (id: string) => (s(id) ?? 101) <= LOW;

  // 1. Общая картина личностных черт
  const pers = items.filter((i) => i.def.domain === 'personality' && i.score !== null);
  if (pers.length >= 3) {
    const sorted = [...pers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const top = sorted.filter((i) => (i.score ?? 0) >= 55).slice(0, 2);
    const bottom = [...sorted].reverse().filter((i) => (i.score ?? 0) <= 45).slice(0, 2);
    if (top.length || bottom.length) {
      const parts: string[] = [];
      if (top.length) parts.push(`наиболее выражены: ${top.map((i) => `${i.def.title.toLowerCase()} (${pct(i.score!)})`).join(', ')}`);
      if (bottom.length) parts.push(`менее выражены: ${bottom.map((i) => `${i.def.title.toLowerCase()} (${pct(i.score!)})`).join(', ')}`);
      out.push({
        id: 'overview',
        tone: 'info',
        title: 'Общая картина личностных черт',
        text: `По совокупности пройденных тестов ${parts.join('; ')}. Это положение на шкалах тестов, а не оценка «хорошо/плохо».`,
        basis: [...top, ...bottom].map((i) => i.def.id),
      });
    }
  }

  // 2. Сочетания показателей
  if (lo('emotional_stability') && hi('anxiety')) {
    out.push({ id: 'stab-anx', tone: 'attention', title: 'Чувствительность к стрессу и тревога совпадают', basis: ['emotional_stability', 'anxiety'],
      text: 'Низкая эмоциональная устойчивость и выраженная тревога указывают в одну сторону: вы, вероятно, остро реагируете на напряжение. Помогают регулярный сон, движение, техники расслабления; если тревога мешает жить, обсудите её со специалистом.' });
  } else if (lo('emotional_stability') && !hi('anxiety') && s('anxiety') !== null) {
    out.push({ id: 'stab-noanx', tone: 'info', title: 'Чувствительность без выраженной тревоги', basis: ['emotional_stability', 'anxiety'],
      text: 'Вы описываете себя как человека, который остро реагирует на эмоции, но выраженной тревоги сейчас нет. Это сочетание часто встречается: черта характера не всегда превращается в симптомы.' });
  }
  if (lo('wellbeing') && hi('depression')) {
    out.push({ id: 'wb-dep', tone: 'attention', title: 'Сниженное благополучие и сниженное настроение', basis: ['wellbeing', 'depression'],
      text: 'Низкое самочувствие и выраженные симптомы сниженного настроения согласуются между собой. Это не диагноз, но повод поговорить с врачом или психотерапевтом.' });
  }
  if (hi('stress') && hi('coping')) {
    out.push({ id: 'stress-coping-hi', tone: 'positive', title: 'Высокая нагрузка при хороших ресурсах', basis: ['stress', 'coping'],
      text: 'Вы ощущаете напряжение, но у вас сильные ресурсы совладания (устойчивость, вера в свои силы, оптимизм). Полезно беречь эти ресурсы: отдых и поддержка помогают не истощить их.' });
  }
  if (hi('stress') && lo('coping')) {
    out.push({ id: 'stress-coping-lo', tone: 'attention', title: 'Высокая нагрузка при ограниченных ресурсах', basis: ['stress', 'coping'],
      text: 'Напряжение выражено, а ресурсы совладания сейчас невысоки. В такой ситуации особенно важны поддержка близких, снижение нагрузки там, где это возможно, и при необходимости помощь специалиста.' });
  }
  if (lo('extraversion') && lo('social_connection')) {
    out.push({ id: 'ext-social', tone: 'attention', title: 'Сдержанность и нехватка связей', basis: ['extraversion', 'social_connection'],
      text: 'Сдержанность в общении сочетается с ощущением нехватки связей. Интроверсия сама по себе не проблема, но если одиночество тяготит, можно искать небольшие форматы общения: группы по интересам, регулярные встречи один на один.' });
  } else if (lo('extraversion') && hi('social_connection')) {
    out.push({ id: 'ext-social-ok', tone: 'positive', title: 'Сдержанность без одиночества', basis: ['extraversion', 'social_connection'],
      text: 'Вы не склонны к шумному общению, но чувствуете близость и поддержку: для вас важнее качество связей, чем их количество.' });
  }
  if (lo('self_esteem') && lo('wellbeing')) {
    out.push({ id: 'se-wb', tone: 'attention', title: 'Самооценка и самочувствие снижены вместе', basis: ['self_esteem', 'wellbeing'],
      text: 'Критичное отношение к себе часто идёт вместе со сниженным самочувствием. Помогают внимание к своим сильным сторонам, посильные цели и поддерживающее окружение.' });
  }
  if (hi('conscientiousness') && hi('stress')) {
    out.push({ id: 'cons-stress', tone: 'info', title: 'Высокая требовательность к себе и напряжение', basis: ['conscientiousness', 'stress'],
      text: 'Высокая добросовестность иногда сочетается с ощущением перегрузки: когда стандарты высоки, сложнее отдыхать. Попробуйте заранее планировать паузы так же серьёзно, как задачи.' });
  }
  if (hi('honesty_humility') && hi('agreeableness')) {
    out.push({ id: 'h-a', tone: 'info', title: 'Честность и доброжелательность', basis: ['honesty_humility', 'agreeableness'],
      text: 'Высокая честность и доброжелательность вместе описывают человека, который склонен к сотрудничеству; иногда таким людям трудно отстаивать свои границы.' });
  }
  if (hi('openness') && lo('conscientiousness')) {
    out.push({ id: 'o-c', tone: 'info', title: 'Любознательность и гибкость', basis: ['openness', 'conscientiousness'],
      text: 'Любознательность при невысокой добросовестности — типичное сочетание «исследователя»: много идей, труднее с рутиной. Помогают внешние рамки и небольшие регулярные шаги.' });
  }

  // 3. Расхождения между тестами
  for (const i of items) {
    if (i.consistency === 'divergent' && i.min !== null && i.max !== null) {
      const names = [...new Set(i.sources.map((x) => x.char.short))].join(', ');
      out.push({ id: `div-${i.def.id}`, tone: 'attention', title: `Тесты расходятся: ${i.def.title.toLowerCase()}`, basis: [i.def.id],
        text: `Результаты (${names}) лежат в диапазоне от ${pct(i.min)} до ${pct(i.max)}. Так бывает из-за разных формулировок и периода оценки (неделя, две недели, «вообще»). Ориентируйтесь на общее направление, а не на точное число.` });
    }
  }

  // 4. Полнота профиля
  const empty = items.filter((i) => i.score === null && i.missingTests.length);
  if (empty.length) {
    const tests = [...new Set(empty.flatMap((i) => i.missingTests))].slice(0, 4).map((t) => testTitles[t] ?? t);
    out.push({ id: 'coverage', tone: 'info', title: 'Профиль можно дополнить', basis: empty.map((i) => i.def.id),
      text: `Нет данных по темам: ${empty.map((i) => i.def.title.toLowerCase()).join('; ')}. Чтобы закрыть пробелы, пройдите, например: ${tests.join('; ')}. Скрининговые тесты по умолчанию выключены в профиле — их можно включить отдельно.` });
  }
  return out;
}
