'use client';
import { useMemo, useState } from 'react';
import CategoryIcon from '@/components/CategoryIcon';
import { CiBar, CircumplexChart, ForestPlot } from '@/components/DeepCharts';
import PlaneChart from '@/components/PlaneChart';
import { computeDeep, GROUPS, levelOf, REFERENCES, type DimEstimate, type ItemEvidence } from '@/lib/deep';
import { buildDeepInsights } from '@/lib/deepInsights';
import type { HistoryEntry, Plane, TestDef } from '@/lib/types';

const TONE: Record<string, string> = { info: 'border-l-accent', positive: 'border-l-[rgb(var(--c-neurodiversity))]', attention: 'border-l-warm' };
const TONE_LABEL: Record<string, string> = { info: 'К сведению', positive: 'Ресурс', attention: 'Обратите внимание' };
const PRECISION: Record<string, string> = { none: 'нет данных', low: 'низкая точность', medium: 'средняя точность', high: 'высокая точность' };
const LEVEL: Record<string, string> = { low: 'ниже середины', mid: 'около середины', high: 'выше середины' };

const BIG_TWO: Plane = {
  x: 'plasticity', y: 'stability', xLabel: 'Пластичность', yLabel: 'Стабильность', split: 50,
  quadrants: [
    { name: '', description: '' }, { name: '', description: '' }, { name: '', description: '' }, { name: '', description: '' },
  ],
};
const INTERESTS: Plane = { ...BIG_TWO, x: 'ideas', y: 'people', xLabel: 'Идеи (против данных)', yLabel: 'Люди (против вещей)' };

function Evidence({ list, title, empty }: { list: ItemEvidence[]; title: string; empty: string }) {
  return (
    <div className="space-y-2">
      <h5 className="text-sm font-semibold">{title}</h5>
      {list.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((e) => (
            <li key={`${e.testId}:${e.qid}`} className="rounded-xl border border-line bg-surface p-3 text-sm">
              <p>{e.text || `Пункт ${e.index}`}</p>
              <p className="mt-1 text-xs text-muted">
                {e.short}, пункт {e.index} · ответ: {e.answerLabel} · вклад в направлении измерения {Math.round(e.o)} %
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DimCard({ d }: { d: DimEstimate }) {
  const [open, setOpen] = useState(false);
  const empty = d.theta === null;
  const level = !empty ? levelOf(d.theta!) : null;
  return (
    <li className={`card space-y-3 p-4 ${empty ? 'border-dashed' : ''}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-semibold">{d.def.title}</h4>
        {empty ? (
          <span className="text-sm text-muted">нет данных</span>
        ) : (
          <span className="tabular-nums">
            <span className="text-xl font-semibold">{Math.round(d.theta!)} %</span>{' '}
            <span className="text-sm text-muted">· {LEVEL[level!]}</span>
          </span>
        )}
      </div>
      {!empty && (
        <>
          <CiBar lo={d.lo!} hi={d.hi!} theta={d.theta!} label={d.def.title} />
          <ul className="flex flex-wrap gap-1.5 text-xs">
            <li className="rounded-full border border-line px-2 py-0.5">
              {d.k} пунктов из {d.tests} {d.tests === 1 ? 'теста' : 'тестов'}
            </li>
            <li className="rounded-full border border-line px-2 py-0.5">интервал {Math.round(d.lo!)}–{Math.round(d.hi!)} %</li>
            <li className="rounded-full border border-line px-2 py-0.5">{PRECISION[d.precision]}</li>
            {d.i2 !== null && (
              <li className={`rounded-full border px-2 py-0.5 ${d.i2 >= 50 && Math.sqrt(d.tau2) >= 10 ? 'border-warm text-warm' : 'border-line'}`}>
                расхождение между тестами I² {Math.round(d.i2)} %
              </li>
            )}
            {d.indirect && <li className="rounded-full border border-warm px-2 py-0.5 text-warm">косвенная оценка</li>}
          </ul>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="min-h-[36px] rounded-full border border-line px-3 text-sm hover:bg-accent-soft"
          >
            {open ? 'Скрыть подробности' : 'Подробности и пункты'}
            <span className="sr-only"> — {d.def.title}</span>
          </button>
          {open && (
            <div className="space-y-4 rounded-xl bg-accent-soft/50 p-3">
              <p className="text-sm">
                <span className="font-medium">Низкий итог:</span> {d.def.low}. <span className="font-medium">Высокий:</span> {d.def.high}.
              </p>
              <ForestPlot d={d} />
              <p className="text-xs text-muted">
                Точки — оценки отдельных тестов (линии — интервалы), ромб — итог по всем тестам. Итог по пунктам без
                деления на тесты: {Math.round(d.pooled!)} %.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Evidence list={d.support} title="Пункты, подтверждающие итог" empty="Нет выраженных подтверждающих пунктов." />
                <Evidence list={d.tension} title="Пункты, идущие против итога" empty="Противоречащих пунктов нет." />
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
}

export default function DeepView({
  tests,
  history,
  include,
  screeningsOff,
  onEnableScreenings,
}: {
  tests: TestDef[];
  history: HistoryEntry[];
  include: (key: string) => boolean;
  screeningsOff: boolean;
  onEnableScreenings: () => void;
}) {
  const r = useMemo(() => computeDeep({ tests, history, include }), [tests, history, include]);
  const insights = useMemo(() => buildDeepInsights(r), [r]);
  const estimated = r.dims.filter((d) => d.theta !== null).length;
  const cov = r.coverage;
  const stability = r.bigTwo.stability;
  const plasticity = r.bigTwo.plasticity;
  const people = r.by.PEOPLE.theta;
  const ideas = r.by.IDEAS.theta;
  const tri = ['DIST', 'LOWPA', 'AROUSAL'].map((id) => r.by[id]).filter((d) => d.theta !== null);

  return (
    <div className="space-y-10">
      <section aria-labelledby="deep-method" className="space-y-3">
        <h3 id="deep-method" className="text-lg font-semibold">
          Как работает глубинный анализ
        </h3>
        <p className="text-[15px]">
          Здесь учитываются <strong>все пункты всех пройденных тестов</strong>, а не только итоговые баллы. Каждая
          шкала связана с несколькими скрытыми характеристиками (например, «Эмоциональная устойчивость» оценивают
          нейротизм из трёх тестов и близкие по смыслу шкалы стресса и самооценки). Пункты разных тестов объединяются
          по этим связям, а между тестами итог считается по модели случайных эффектов (как в метаанализе). Мера
          расхождения тестов — I².
        </p>
        <details className="rounded-xl2 border border-line bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-medium">Ограничения метода</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Связи шкал с характеристиками назначены по определениям, литературе и содержанию пунктов, а не оценены по вашим данным: по ответам одного человека факторный анализ невозможен.</li>
            <li>Проценты — положение на шкале, а не нормы. Интервалы — прикидочные и не заменяют психометрическую оценку.</li>
            <li>Скрининговые шкалы описывают состояние за короткий период, а черты — устойчивые склонности; их объединение — гипотеза о связи, а не доказательство.</li>
            <li>Выводы не являются диагнозом. Для оценки состояния обратитесь к специалисту.</li>
          </ul>
        </details>
      </section>

      {screeningsOff && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 bg-warm-soft p-4 text-[15px]">
          <p>Скрининги (тревога, депрессия, стресс и т. п.) в анализ не включены, поэтому группа «Эмоциональные переживания» пуста или неполна.</p>
          <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 text-sm" onClick={onEnableScreenings}>
            Включить скрининги
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Покрытие анализа">
        {[
          { k: 'Тестов в анализе', v: String(cov.testsUsed) },
          { k: 'Пунктов учтено', v: `${cov.itemsUsed} из ${cov.itemsAnswered}` },
          { k: 'Измерений оценено', v: `${estimated} из ${r.dims.length}` },
          { k: 'Пунктов вне модели', v: String(cov.unmapped.length) },
        ].map((s) => (
          <div key={s.k} className="card p-4">
            <p className="text-sm text-muted">{s.k}</p>
            <p className="text-2xl font-semibold tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      {insights.length > 0 && (
        <section aria-labelledby="deep-ins" className="space-y-3">
          <h3 id="deep-ins" className="text-lg font-semibold">
            Что показывает совокупность ответов
          </h3>
          <ul className="space-y-3">
            {insights.map((i) => (
              <li key={i.id} className={`card border-l-4 ${TONE[i.tone]} space-y-1 p-4`}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{TONE_LABEL[i.tone]}</p>
                <h4 className="font-semibold">{i.title}</h4>
                <p className="text-[15px]">{i.text}</p>
                {i.refs.length > 0 && (
                  <p className="text-xs text-muted">
                    Основа:{' '}
                    {i.refs
                      .map((id) => REFERENCES.find((x) => x.id === id)?.cite.split('(')[0].trim())
                      .filter(Boolean)
                      .join('; ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="deep-struct" className="space-y-4">
        <h3 id="deep-struct" className="text-lg font-semibold">
          Структура профиля
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {stability !== null && plasticity !== null && (
            <div className="cat-personality card space-y-2">
              <h4 className="font-semibold">Метачерты: стабильность и пластичность</h4>
              <PlaneChart plane={BIG_TWO} xValue={plasticity} yValue={stability} min={0} max={100} />
              <p className="text-sm text-muted">Стабильность — среднее по устойчивости, доброжелательности и добросовестности; пластичность — по экстраверсии и открытости (Digman, 1997; DeYoung и др., 2002).</p>
            </div>
          )}
          {r.circumplex && (
            <div className="cat-relationships card space-y-2">
              <h4 className="font-semibold">Межличностный круг</h4>
              <CircumplexChart agency={r.circumplex.agency} communion={r.circumplex.communion} octant={r.circumplex.octant?.index ?? null} />
              <p className="text-sm text-muted">
                {r.circumplex.octant ? `Сектор: ${r.circumplex.octant.label} (${r.circumplex.octant.code}).` : 'Точка близка к центру: выраженного уклона нет.'} Модель Виггинса (1979).
              </p>
            </div>
          )}
          {tri.length > 0 && (
            <div className="cat-emotional card space-y-3">
              <h4 className="font-semibold">Структура эмоционального состояния</h4>
              <ul className="space-y-3">
                {tri.map((d) => (
                  <li key={d.def.id} className="space-y-1">
                    <p className="text-sm font-medium">{d.def.title}</p>
                    <CiBar lo={d.lo!} hi={d.hi!} theta={d.theta!} label={d.def.title} />
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted">Трёхфакторная модель: общий дистресс, сниженное положительное переживание (депрессия) и тревожное возбуждение (Clark & Watson, 1991).</p>
            </div>
          )}
          {people !== null && ideas !== null && (
            <div className="cat-career card space-y-2">
              <h4 className="font-semibold">Оси интересов</h4>
              <PlaneChart plane={INTERESTS} xValue={ideas} yValue={people} min={0} max={100} />
              <p className="text-sm text-muted">Две оси по Prediger (1982): данные–идеи и вещи–люди.</p>
            </div>
          )}
        </div>
        {!(stability !== null || r.circumplex || tri.length || people !== null) && (
          <p className="card text-muted">Для структурных диаграмм нужно больше данных: пройдите тесты Большой пятёрки, шкалы эмоционального состояния или RIASEC.</p>
        )}
      </section>

      <section aria-labelledby="deep-dims" className="space-y-6">
        <h3 id="deep-dims" className="text-lg font-semibold">
          Скрытые характеристики
        </h3>
        {GROUPS.map((g) => {
          const list = r.dims.filter((d) => d.def.group === g.id);
          return (
            <div key={g.id} className={`cat-${g.category} space-y-3`}>
              <h4 className="flex items-center gap-3 text-base font-semibold">
                <span className="cat-bubble inline-flex h-8 w-8 items-center justify-center rounded-lg">
                  <CategoryIcon id={g.category} className="h-5 w-5" />
                </span>
                {g.title}
                <span className="text-sm font-normal text-muted">
                  {list.filter((d) => d.theta !== null).length} из {list.length}
                </span>
              </h4>
              <ul className="grid gap-3 xl:grid-cols-2">
                {list.map((d) => (
                  <DimCard key={d.def.id} d={d} />
                ))}
              </ul>
            </div>
          );
        })}
        <p className="text-xs text-muted">
          Полоса: тёмная метка — итог, закрашенная часть — интервал. Интервал объединяет случайную погрешность
          пунктов и расхождение между тестами.
        </p>
      </section>

      <section aria-labelledby="deep-refs" className="space-y-3">
        <h3 id="deep-refs" className="text-lg font-semibold">
          Научная основа
        </h3>
        <ol className="space-y-3 text-sm">
          {REFERENCES.map((x) => (
            <li key={x.id} className="rounded-xl border border-line bg-surface p-3">
              <p>{x.cite}</p>
              <p className="mt-1 text-muted">Как используется: {x.use}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
