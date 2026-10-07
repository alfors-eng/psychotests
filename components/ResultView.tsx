'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { RadarChart, ScaleBar } from '@/components/Charts';
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
  const dominant = result.scales.filter((s) => result.dominant.includes(s.id));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-muted">{date}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{test.title}</h1>
      </header>

      {/* Дисклеймер — обязательно на каждой странице результата. */}
      <p role="note" className="rounded-xl2 bg-accent-soft p-4 text-[15px] font-medium">
        Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.
      </p>

      {safety.showHelp && <HelpBlock crisis={safety.crisis} />}

      {dominant.length > 0 && test.scoring.method === 'typeMax' && (
        <section className="card">
          <h2 className="text-sm font-medium text-muted">Преобладающий тип</h2>
          <p className="mt-1 text-2xl font-semibold">{dominant.map((s) => s.title).join(' + ')}</p>
        </section>
      )}

      <section aria-labelledby="scores" className="space-y-6">
        <h2 id="scores" className="text-xl font-semibold">
          Ваши баллы
        </h2>
        {multi && <RadarChart scales={result.scales} />}
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

      <div className="flex flex-wrap gap-3 print:hidden">
        <Link href={`/tests/${test.id}/run?fresh=1`} onClick={() => clearProgress(test.id)} className="btn btn-primary">
          Пройти заново
        </Link>
        <button type="button" className="btn btn-ghost" onClick={() => downloadResultPng(test, result, date)}>
          Скачать PNG
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          Скачать PDF
        </button>
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
