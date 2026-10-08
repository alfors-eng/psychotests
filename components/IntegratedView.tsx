'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import OverlayRadar from '@/components/OverlayRadar';
import { buildInsights } from '@/lib/insights';
import { DOMAINS, domainOf, type Integrated } from '@/lib/integrate';
import type { Characteristic } from '@/lib/profile';

const TONE: Record<string, string> = {
  info: 'bg-accent',
  positive: 'bg-[rgb(var(--c-neurodiversity))]',
  attention: 'bg-warm',
};
const TONE_LABEL: Record<string, string> = { info: 'К сведению', positive: 'Ресурс', attention: 'Обратите внимание' };

const stripParens = (s: string) => s.replace(/\s*\(.*\)$/, '');

export default function IntegratedView({
  items,
  uncoveredChars,
  testTitles,
}: {
  items: Integrated[];
  uncoveredChars: Characteristic[];
  testTitles: Record<string, string>;
}) {
  const insights = useMemo(() => buildInsights(items, testTitles), [items, testTitles]);
  const withData = items.filter((i) => i.score !== null);
  const multi = items.filter((i) => new Set(i.sources.map((s) => s.char.testId)).size >= 2).length;
  const testsUsed = new Set(withData.flatMap((i) => i.sources.map((s) => s.char.testId))).size;

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-3" aria-label="Полнота профиля">
        {[
          { k: 'Характеристик в сводке', v: `${withData.length} из ${items.length}` },
          { k: 'Тестов использовано', v: String(testsUsed) },
          { k: 'Подтверждены 2+ тестами', v: String(multi) },
        ].map((s) => (
          <div key={s.k} className="card p-4">
            <p className="text-sm text-muted">{s.k}</p>
            <p className="text-2xl font-semibold tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      {insights.length > 0 && (
        <section aria-labelledby="ins-title" className="space-y-3">
          <h3 id="ins-title" className="text-lg font-semibold">
            Что показывает сочетание тестов
          </h3>
          <ul className="space-y-3">
            {insights.map((i) => (
              <li key={i.id} className="card space-y-1 p-4">
                <p className="flex items-center gap-2 text-xs font-medium text-muted"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${TONE[i.tone]}`} />{TONE_LABEL[i.tone]}</p>
                <h4 className="font-semibold">{i.title}</h4>
                <p className="text-[15px]">{i.text}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            Выводы строятся по простым открытым правилам из положения на шкалах тестов. Они описывают ваши ответы,
            а не ставят диагноз. Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.
          </p>
        </section>
      )}

      <section aria-labelledby="ov-title" className="space-y-6">
        <div>
          <h3 id="ov-title" className="text-lg font-semibold">
            Наложение тестов
          </h3>
          <p className="text-sm text-muted">
            Жирный контур — итог по всем тестам. Пунктирные контуры — отдельные тесты: чем ближе они друг к другу,
            тем увереннее показатель. Тесты можно скрывать и показывать кнопками под диаграммой.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
          {DOMAINS.map((d) => {
            const rows = items.filter((i) => i.def.domain === d.id && i.score !== null);
            if (rows.length < 3) {
              return (
                <div key={d.id} className={`cat-${d.category} card space-y-2`}>
                  <h4 className="font-semibold">{d.title}</h4>
                  <p className="text-sm text-muted">
                    {rows.length
                      ? `Для диаграммы нужно минимум 3 характеристики, сейчас ${rows.length}: ${rows.map((r) => r.def.title.toLowerCase()).join(', ')}.`
                      : 'Пока нет данных в этой области. Пройдите тесты из раздела ниже или включите скрининги справа.'}
                  </p>
                </div>
              );
            }
            const testIds = [...new Set(rows.flatMap((r) => r.sources.map((s) => s.char.testId)))];
            const series = testIds.map((t) => ({
              id: t,
              name: rows.flatMap((r) => r.sources).find((s) => s.char.testId === t)!.char.short,
              values: rows.map((r) => {
                const ss = r.sources.filter((s) => s.char.testId === t);
                if (!ss.length) return null;
                const w = ss.reduce((a, s) => a + s.weight, 0);
                return ss.reduce((a, s) => a + s.oriented * s.weight, 0) / w;
              }),
            }));
            return (
              <div key={d.id} className={`cat-${d.category} card`}>
                <OverlayRadar
                  title={d.title}
                  axes={rows.map((r) => stripParens(r.def.title))}
                  total={rows.map((r) => r.score)}
                  series={series}
                />
              </div>
            );
          })}
        </div>
      </section>

      {items.some((i) => i.score === null && i.missingTests.length > 0) && (
        <section aria-labelledby="cov-title" className="space-y-3">
          <h3 id="cov-title" className="text-lg font-semibold">
            Что пройти, чтобы дополнить картину
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {items
              .filter((i) => i.score === null && i.missingTests.length > 0)
              .map((i) => (
                <li key={i.def.id} className={`cat-${domainOf(i.def.domain).category} card space-y-2 p-4`}>
                  <p className="font-medium">{i.def.title}</p>
                  <ul className="flex flex-wrap gap-2">
                    {i.missingTests.map((t) => (
                      <li key={t}>
                        <Link href={`/tests/${t}`} className="inline-flex min-h-[36px] items-center rounded-full border border-line px-3 text-sm hover:bg-accent-soft">
                          {testTitles[t] ?? t}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        </section>
      )}

      {uncoveredChars.length > 0 && (
        <section aria-labelledby="unc-title" className="space-y-2">
          <h3 id="unc-title" className="text-lg font-semibold">
            Показатели, не вошедшие в сводку
          </h3>
          <p className="text-sm text-muted">Эти шкалы не сопоставляются с другими тестами. Их можно посмотреть на вкладке «Диаграммы» и в таблицах.</p>
          <ul className="flex flex-wrap gap-2">
            {uncoveredChars.map((c) => (
              <li key={c.key} className="rounded-full border border-line px-3 py-1 text-sm">
                {c.title} <span className="text-muted">· {c.short}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
