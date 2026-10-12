'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { formatValue } from '@/lib/engine';
import { formatDay } from '@/lib/format';
import { buildRecommendations, buildRetestPlan, buildScreenings, buildSeries } from '@/lib/trends';
import type { HistoryEntry, TestDef } from '@/lib/types';

const LEVEL_STYLE: Record<string, string> = {
  low: 'bg-[rgb(var(--c-neurodiversity)/0.22)]',
  mid: 'bg-accent-soft',
  high: 'bg-warm-soft',
  severe: 'bg-warm-soft font-medium',
};

export default function ScreeningView({ tests, history }: { tests: TestDef[]; history: HistoryEntry[] }) {
  const series = useMemo(() => buildSeries(tests, history), [tests, history]);
  const rows = useMemo(() => buildScreenings(series), [series]);
  const recs = useMemo(() => buildRecommendations(tests, rows, series), [tests, rows, series]);
  const plan = useMemo(() => buildRetestPlan(series), [series]);
  const flagged = rows.filter((r) => r.flagged);
  const calm = rows.filter((r) => !r.flagged);
  const crisis = rows.filter((r) => r.crisis);

  if (!rows.length) {
    return (
      <div className="card space-y-3 text-[15px]">
        <p>Скринингов пока нет. Пройдите, например, PHQ-4 (минута), WHO-5 или GAD-7: здесь появится сводка по порогам и следующие шаги.</p>
        <div className="flex flex-wrap gap-2">
          {['phq-4', 'who-5', 'gad-7'].map((id) => (
            <Link key={id} href={`/tests/${id}`} className="btn btn-ghost">
              {id.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const Row = ({ r }: { r: (typeof rows)[number] }) => (
    <li className={`cat-${r.test.category} card space-y-2`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{r.test.title}</p>
          <p className="text-sm text-muted">{formatDay(r.entry.completedAt)}</p>
        </div>
        <Link href={`/tests/${r.test.id}/result?r=${r.entry.id}`} className="btn btn-ghost !min-h-[40px] !px-4 text-sm">
          Открыть результат
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2 text-sm">
        {r.scales.map((s) => (
          <li key={s.id} className={`rounded-full px-3 py-1 ${LEVEL_STYLE[s.range?.level ?? 'mid'] ?? 'bg-accent-soft'}`}>
            {r.scales.length > 1 ? `${s.title}: ` : ''}
            <span className="tabular-nums">{formatValue(s.value)}</span> из {formatValue(s.max)}
            {s.range ? ` · ${s.range.title}` : ''}
          </li>
        ))}
      </ul>
    </li>
  );

  return (
    <div className="space-y-10">
      <p className="rounded-xl2 bg-accent-soft p-4 text-[15px]">
        Здесь собраны скрининговые тесты (депрессия, тревога, травма, зависимость и др.). Достижение порога — повод подробнее
        разобраться и поговорить со специалистом, а не диагноз. Рекомендации ниже строятся по правилам авторов тестов:
        короткий скрининг, подробный тест, специалист.
      </p>

      {crisis.length > 0 && (
        <section role="alert" className="card space-y-2 border-warm bg-warm-soft">
          <h3 className="font-semibold">Вам может быть тяжело</h3>
          <p className="text-[15px]">
            В тесте «{crisis[0].test.title}» вы отметили ответ, на который стоит обратить внимание. Вы не должны справляться с этим в одиночку. Откройте результат: там собраны контакты помощи. Если опасность близко, звоните по единому номеру экстренной помощи 112.
          </p>
          <Link href={`/tests/${crisis[0].test.id}/result?r=${crisis[0].entry.id}`} className="btn btn-ghost">
            Открыть результат
          </Link>
        </section>
      )}

      <section aria-labelledby="flag-title" className="space-y-4">
        <h3 id="flag-title" className="text-lg font-semibold">
          Достигнут порог скрининга ({flagged.length})
        </h3>
        {flagged.length ? (
          <ul className="space-y-4">{flagged.map((r) => <Row key={r.test.id} r={r} />)}</ul>
        ) : (
          <p className="text-[15px] text-muted">Ни один пройденный скрининг не достиг порога. Если вас что-то беспокоит, это можно обсудить со специалистом и без тестов.</p>
        )}
      </section>

      <section aria-labelledby="next-title" className="space-y-4">
        <h3 id="next-title" className="text-lg font-semibold">
          Что делать дальше
        </h3>
        {recs.length ? (
          <ul className="space-y-4">
            {recs.map((r) => (
              <li key={r.id} className="card space-y-3">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="mt-1 text-[15px]">{r.text}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.tests.map((id) => {
                    const t = tests.find((x) => x.id === id);
                    return (
                      <Link key={id} href={`/tests/${id}`} className="btn btn-primary !min-h-[40px] text-sm">
                        {t ? t.title.split(' — ')[0] : id}
                      </Link>
                    );
                  })}
                </div>
                <p className="text-sm text-muted">Основание: {r.basis}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-muted">Дополнительных тестов по вашим результатам не требуется. Если появятся новые, они будут показаны здесь.</p>
        )}
        {flagged.length > 0 && (
          <p className="rounded-xl bg-accent-soft p-3 text-[15px]">
            Если порог достигнут в нескольких тестах или состояние держится больше двух недель, запишитесь к врачу или
            психотерапевту и возьмите с собой сводку из вкладки «Отчёт».
          </p>
        )}
      </section>

      {calm.length > 0 && (
        <section aria-labelledby="calm-title" className="space-y-4">
          <h3 id="calm-title" className="text-lg font-semibold">
            Ниже порога ({calm.length})
          </h3>
          <ul className="space-y-4">{calm.map((r) => <Row key={r.test.id} r={r} />)}</ul>
        </section>
      )}

      <section aria-labelledby="retest-title" className="space-y-4">
        <h3 id="retest-title" className="text-lg font-semibold">
          Когда пройти снова
        </h3>
        <p className="text-sm text-muted">
          Каждый тест спрашивает о конкретном периоде (например, о последних двух неделях). Повторять его раньше, чем период
          сменится, нет смысла: вы отвечаете про те же дни.
        </p>
        {plan.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-[15px]">
              <caption className="sr-only">План повторных прохождений</caption>
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">Тест</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Последний раз</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Период теста</th>
                  <th scope="col" className="py-2 font-medium">Повторить</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((p) => (
                  <tr key={p.test.id} className="border-b border-line">
                    <td className="py-2 pr-3">
                      <Link href={`/tests/${p.test.id}`} className="underline underline-offset-4">
                        {p.test.title.split(' — ')[0]}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{formatDay(p.last)}</td>
                    <td className="py-2 pr-3 tabular-nums">{p.recallDays} дн.</td>
                    <td className="py-2">{p.daysLeft <= 0 ? 'Можно сейчас' : `с ${formatDay(p.availableAt.toISOString())} (через ${p.daysLeft} дн.)`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[15px] text-muted">Для пройденных тестов повторять нужно только по желанию: черты личности меняются медленно.</p>
        )}
      </section>

      <details className="rounded-xl2 border border-line bg-surface p-4 text-sm text-muted">
        <summary className="cursor-pointer font-medium text-ink">На чём основаны правила</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Kroenke, K., Spitzer, R. L., Williams, J. B. W., & Löwe, B. (2009). An ultra-brief screening scale for anxiety and depression: The PHQ-4. Psychosomatics, 50, 613–621.</li>
          <li>Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2002). The PHQ-15. Psychosomatic Medicine, 64, 258–266.</li>
          <li>Kessler, R. C., и др. (2003). Screening for serious mental illness in the general population. Archives of General Psychiatry, 60, 184–189.</li>
          <li>Hayes, S. C., Luoma, J. B., Bond, F. W., Masuda, A., & Lillis, J. (2006). Acceptance and Commitment Therapy: Model, processes and outcomes. Behaviour Research and Therapy, 44, 1–25.</li>
          <li>Boden, J. M., & Fergusson, D. M. (2011). Alcohol and depression. Addiction, 106, 906–914.</li>
          <li>Wood, A. M., & Tarrier, N. (2010). Positive clinical psychology. Clinical Psychology Review, 30, 819–829.</li>
          <li>Руководства по WHO-5 (ВОЗ) и PC-PTSD-5 (Национальный центр по изучению ПТСР, США).</li>
        </ul>
      </details>
    </div>
  );
}
