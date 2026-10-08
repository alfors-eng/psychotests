'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AnswerAnalytics from '@/components/AnswerAnalytics';
import CategoryIcon from '@/components/CategoryIcon';
import { RadarChart, ScaleBar, ScoreRing } from '@/components/Charts';
import PlaneChart from '@/components/PlaneChart';
import HelpBlock from '@/components/HelpBlock';
import { evaluateSafety, scoreTest } from '@/lib/engine';
import { downloadResultPng } from '@/lib/exportPng';
import { formatDate } from '@/lib/format';
import { clearProgress, loadHistory } from '@/lib/storage';
import type { HistoryEntry, TestDef } from '@/lib/types';

export default function ResultView({ test }: { test: TestDef }) {
  const rid = useSearchParams().get('r');
  const [entry, setEntry] = useState<HistoryEntry | null | undefined>(undefined);

  useEffect(() => {
    const all = loadHistory();
    setEntry(all.find((h) => h.id === rid && h.testId === test.id) ?? null);
  }, [rid, test.id]);

  const computed = useMemo(() => {
    if (!entry) return null;
    const result = scoreTest(test, entry.answers);
    return { result, safety: evaluateSafety(test, entry.answers, result) };
  }, [entry, test]);

  if (entry === undefined) return <p className="text-muted" role="status">Загрузка…</p>;
  if (!entry || !computed) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Результат не найден</h1>
        <p className="text-muted">
          Результаты хранятся только в этом браузере. Возможно, он был удалён или открыт на другом устройстве.
        </p>
        <Link href={`/tests/${test.id}`} className="btn btn-primary">
          Пройти тест
        </Link>
      </div>
    );
  }

  const { result, safety } = computed;
  const multi = result.scales.length >= 3;
  const date = formatDate(entry.completedAt);
  const plane = test.plane;
  const px = plane && result.scales.find((x) => x.id === plane.x);
  const py = plane && result.scales.find((x) => x.id === plane.y);
  const quadrant =
    plane && px && py ? plane.quadrants[(py.value >= plane.split ? 2 : 0) + (px.value >= plane.split ? 1 : 0)] : null;
  const ranked = [...result.scales].sort((a, b) => b.value - a.value);
  const dominant = ranked.slice(0, 3);

  return (
    <div className={`cat-${test.category} mx-auto max-w-2xl space-y-8`}>
      <header className="relative overflow-hidden rounded-xl2 border border-line bg-[rgb(var(--cat)/0.10)] p-6">
        <div className="relative flex items-start gap-4">
          <span className="cat-bubble inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface">
            <CategoryIcon id={test.category} className="h-7 w-7" />
          </span>
          <div className="space-y-1">
            <p className="text-sm text-muted">{date}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{test.title}</h1>
          </div>
        </div>
      </header>

      {/* Дисклеймер — обязательно на каждой странице результата. */}
      <p role="note" className="rounded-xl2 bg-accent-soft p-4 text-[15px] font-medium">
        Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.
      </p>

      {safety.showHelp && <HelpBlock crisis={safety.crisis} />}

      {dominant.length > 0 && test.scoring.method === 'typeMax' && (
        <section className="card">
          <h2 className="text-sm font-medium text-muted">Ведущие типы (по убыванию баллов)</h2>
          <p className="mt-1 text-2xl font-semibold">{dominant.map((s) => s.title).join(' + ')}</p>
        </section>
      )}

      {plane && px && py && quadrant && (
        <section className="card space-y-3" aria-labelledby="plane-title">
          <h2 id="plane-title" className="text-xl font-semibold">
            {quadrant.name}
          </h2>
          <PlaneChart plane={plane} xValue={px.value} yValue={py.value} min={px.min} max={px.max} />
          <p className="text-[15px]">{quadrant.description}</p>
        </section>
      )}

      <section aria-labelledby="scores" className="space-y-6">
        <h2 id="scores" className="text-xl font-semibold">
          Ваши баллы
        </h2>
        {multi && <RadarChart scales={result.scales} />}
        {result.scales.length === 1 && <ScoreRing s={result.scales[0]} />}
        <div className="space-y-5">
          {result.scales.map((s) => (
            <ScaleBar key={s.id} s={s} />
          ))}
        </div>
      </section>

      <section aria-labelledby="interp" className="space-y-4">
        <h2 id="interp" className="text-xl font-semibold">
          Что это значит
        </h2>
        {result.scales.map((s) => (
          <article key={s.id} className="card">
            {result.scales.length > 1 && <p className="text-sm text-muted">{s.title}</p>}
            <h3 className="text-lg font-semibold">{s.range?.title ?? 'Без интерпретации'}</h3>
            {s.range && <p className="mt-1 text-[15px]">{s.range.description}</p>}
          </article>
        ))}
        {test.disclaimer && <p className="text-sm text-muted">{test.disclaimer}</p>}
      </section>

      {safety.crisis ? (
        <details className="card">
          <summary className="cursor-pointer text-[15px] font-medium">Подробная аналитика ответов</summary>
          <div className="mt-6">
            <AnswerAnalytics test={test} answers={entry.answers} scales={result.scales} />
          </div>
        </details>
      ) : (
        <AnswerAnalytics test={test} answers={entry.answers} scales={result.scales} />
      )}

      <div className="flex flex-wrap gap-3 print:hidden">
        <Link href={`/tests/${test.id}/run?fresh=1`} onClick={() => clearProgress(test.id)} className="btn btn-primary">
          Пройти заново
        </Link>
        <button type="button" className="btn btn-ghost" onClick={() => downloadResultPng(test, result, date, entry.answers)}>
          Скачать PNG
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          Скачать PDF
        </button>
        <Link href="/profile" className="btn btn-ghost">
          Мой профиль
        </Link>
        <Link href="/results" className="btn btn-ghost">
          Мои результаты
        </Link>
      </div>
      <p className="text-sm text-muted print:hidden">
        Для PDF в окне печати выберите «Сохранить как PDF». Результат остаётся только в вашем браузере.
      </p>
    </div>
  );
}
