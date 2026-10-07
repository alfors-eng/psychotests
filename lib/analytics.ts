import { keyedValue, scaleBounds } from './engine';
import type { Answers, ScaleResult, TestDef } from './types';

export interface DistributionBin {
  value: number;
  label: string;
  count: number;
  percent: number;
}

export interface ItemStat {
  id: string;
  index: number; // номер пункта, с 1
  text: string;
  raw: number;
  answerLabel: string;
  /** Вклад пункта в шкалу с учётом ключа, 0–100 % (для дихотомических ключей — 0 или 100). */
  percent: number;
  scaleId: string;
  scaleTitle: string;
  reversed: boolean;
  counted: boolean; // входит ли пункт в подсчёт (не «филлер»)
}

export interface Analytics {
  total: number;
  distribution: DistributionBin[];
  /** Ответы по порядку: значения вариантов. */
  sequence: { index: number; raw: number }[];
  items: ItemStat[];
  mean: number;
  extremeShare: number;
  neutralShare: number | null;
  straightLine: boolean;
  topValue: DistributionBin;
  insights: string[];
  external: boolean;
}

const pct = (n: number) => Math.round(n * 100);

export function analyzeAnswers(test: TestDef, answers: Answers, scales: ScaleResult[]): Analytics {
  const { min: smin, max: smax } = scaleBounds(test);
  const opts = test.scale.options;
  const external = test.mode === 'external';
  const scaleTitle = new Map(scales.map((s) => [s.id, s.title]));
  const defaultScale = test.scoring.method === 'sum' || test.scoring.method === 'average' ? 'total' : '';

  const answered = test.questions.filter((q) => answers[q.id] !== undefined);
  const total = answered.length;

  const items: ItemStat[] = answered.map((q) => {
    const raw = answers[q.id];
    const keyed = keyedValue(test, q.id, raw);
    const percent = q.scoreWhen ? keyed * 100 : smax === smin ? 0 : ((keyed - smin) / (smax - smin)) * 100;
    const sid = q.subscale ?? defaultScale;
    return {
      id: q.id,
      index: test.questions.indexOf(q) + 1,
      text: q.text,
      raw,
      answerLabel: opts.find((o) => o.value === raw)?.label ?? String(raw),
      percent: Math.max(0, Math.min(100, percent)),
      scaleId: sid,
      scaleTitle: scaleTitle.get(sid) ?? '',
      reversed: !!q.reversed,
      counted: !q.filler,
    };
  });

  const distribution: DistributionBin[] = opts.map((o) => {
    const count = answered.filter((q) => answers[q.id] === o.value).length;
    return { value: o.value, label: o.label, count, percent: total ? (count / total) * 100 : 0 };
  });

  const sequence = answered.map((q) => ({ index: test.questions.indexOf(q) + 1, raw: answers[q.id] }));
  const mean = total ? answered.reduce((a, q) => a + answers[q.id], 0) / total : 0;
  const ends = opts.length >= 3;
  const extremeShare = total && ends ? answered.filter((q) => answers[q.id] === smin || answers[q.id] === smax).length / total : 0;
  const mid = opts.length >= 3 && opts.length % 2 === 1 ? (smin + smax) / 2 : null;
  const neutralShare = mid !== null && total ? answered.filter((q) => answers[q.id] === mid).length / total : null;
  const straightLine = total >= 5 && new Set(answered.map((q) => answers[q.id])).size === 1;
  const topValue = distribution.reduce((a, b) => (b.count > a.count ? b : a), distribution[0]);

  const insights: string[] = [];
  if (total) {
    insights.push(`Чаще всего вы выбирали вариант «${topValue.label}»: ${topValue.count} из ${total} ответов (${pct(topValue.count / total)} %).`);
  }
  if (straightLine) {
    insights.push('Все ответы одинаковы. Если вы не отвечали механически, результат может быть неточным: такой тест лучше пройти заново, вчитываясь в каждый пункт.');
  } else if (ends && extremeShare >= 0.7) {
    insights.push(`Крайние варианты составили ${pct(extremeShare)} % ответов. Склонность к крайним оценкам может сдвигать результат — учитывайте это при интерпретации.`);
  } else if (neutralShare !== null && neutralShare >= 0.5) {
    insights.push(`Нейтральный вариант выбран в ${pct(neutralShare)} % случаев. Когда сомнений много, результат получается «средним» — возможно, часть утверждений была вам не вполне понятна.`);
  }

  // Пункты о самоповреждении не цитируем в текстовых выводах, чтобы не выделять их без нужды.
  const sensitive = new Set((test.safety?.crisisQuestions ?? []).map((c) => c.questionId));
  const counted = items.filter((i) => i.counted && !sensitive.has(i.id));
  if (!external && counted.length >= 4) {
    const sorted = [...counted].sort((a, b) => b.percent - a.percent || a.index - b.index);
    const hi = sorted[0];
    const lo = sorted[sorted.length - 1];
    if (hi.percent !== lo.percent) {
      const cut = (t: string) => (t.length > 90 ? t.slice(0, 89) + '…' : t);
      insights.push(`Сильнее всего к высокому баллу привёл пункт ${hi.index}: «${cut(hi.text)}» (${Math.round(hi.percent)} % от максимума по этому пункту).`);
      insights.push(`Меньше всего вклад у пункта ${lo.index}: «${cut(lo.text)}» (${Math.round(lo.percent)} %).`);
    }
  }
  if (test.questions.some((q) => q.reversed) && total) {
    const rev = items.filter((i) => i.reversed).length;
    insights.push(`В тесте ${rev} обратных пунктов: для них балл считается наоборот (ответ «согласен» уменьшает итог). Эти пункты помогают отсеять формальные ответы.`);
  }

  return { total, distribution, sequence, items, mean, extremeShare, neutralShare, straightLine, topValue, insights, external };
}
