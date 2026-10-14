'use client';
import { useEffect, useMemo, useState } from 'react';
import { buildCsv, buildSummaryText, downloadText } from '@/lib/dataExport';
import { formatValue } from '@/lib/engine';
import { formatDay, signed } from '@/lib/format';
import { formatDuration, timeQuality } from '@/lib/quality';
import { buildExport, loadNotes } from '@/lib/storage';
import { buildScreenings, buildSeries, CHANGE_LABEL, classifyChange } from '@/lib/trends';
import type { HistoryEntry, Note, TestDef } from '@/lib/types';

export default function ReportView({ tests, history }: { tests: TestDef[]; history: HistoryEntry[] }) {
  const series = useMemo(() => buildSeries(tests, history), [tests, history]);
  const screenings = useMemo(() => buildScreenings(series), [series]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => setNotes(loadNotes()), []);

  if (!series.length) {
    return <p className="card text-ui text-muted">Отчёт появится, когда вы пройдёте хотя бы один тест.</p>;
  }

  const flaggedIds = new Set(screenings.filter((s) => s.flagged).map((s) => s.test.id));
  const ordered = [...series].sort((a, b) => Number(b.test.isClinical) - Number(a.test.isClinical) || a.test.title.localeCompare(b.test.title, 'ru'));
  const today = formatDay(new Date().toISOString());

  const slowTests = ordered
    .map((s) => ({ s, q: timeQuality(s.points[s.points.length - 1].entry.durationSec, s.test.questions.filter((x) => !x.filler).length) }))
    .filter((x) => x.q?.tooFast);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText(series, notes));
      setMessage('Резюме скопировано в буфер обмена.');
    } catch {
      setMessage('Не удалось скопировать: сохраните отчёт в PDF или CSV.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 print:hidden">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Скачать PDF
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => downloadText(`psychotests-report-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(series), 'text/csv;charset=utf-8')}>
          Таблица CSV
        </button>
        <button type="button" className="btn btn-ghost" onClick={copy}>
          Копировать резюме
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => downloadText(`psychotests-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(buildExport(), null, 2), 'application/json')}>
          Сохранить все данные (JSON)
        </button>
      </div>
      <p role="status" className="text-sm print:hidden">
        {message}
      </p>

      <article className="space-y-6" aria-labelledby="report-title">
        <header className="space-y-2 border-b border-line pb-4">
          <h3 id="report-title" className="text-xl font-semibold">
            Сводка результатов для специалиста
          </h3>
          <p className="text-sm text-muted">
            Составлена {today}. Источник: «Психотесты NoNinaaao», результаты хранятся только в браузере владельца. Тесты — это
            скрининг и самоотчёт, а не диагноз; оценку состояния проводит специалист. Нормативных выборок для русскоязычного
            населения на сайте нет, поэтому результаты не сопоставляются с «нормой».
          </p>
        </header>

        <div className="overflow-x-auto" tabIndex={0} role="group" aria-label="Таблица, при необходимости прокручивается">
          <table className="w-full min-w-[40rem] border-collapse text-left text-ui">
            <caption className="sr-only">Последние результаты по каждому тесту</caption>
            <thead>
              <tr className="border-b border-line text-sm text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">Тест, дата</th>
                <th scope="col" className="py-2 pr-3 font-medium">Шкала</th>
                <th scope="col" className="py-2 pr-3 font-medium">Результат</th>
                <th scope="col" className="py-2 pr-3 font-medium">Уровень</th>
                <th scope="col" className="py-2 font-medium">Изменение с прошлого раза</th>
              </tr>
            </thead>
            <tbody>
              {ordered.flatMap((s) => {
                const last = s.points[s.points.length - 1];
                const prev = s.points.length > 1 ? s.points[s.points.length - 2] : null;
                return last.scales.map((sc, i) => {
                  const before = prev?.scales.find((x) => x.id === sc.id);
                  const ch = before ? classifyChange(s.test.id, sc, before.value, sc.value) : null;
                  return (
                    <tr key={`${s.test.id}:${sc.id}`} className="border-b border-line align-top">
                      <td className="py-2 pr-3">
                        {i === 0 && (
                          <>
                            <span className="font-medium">{s.test.title}</span>
                            <span className="block text-sm text-muted">
                              {formatDay(last.entry.completedAt)}
                              {s.points.length > 1 ? `, прохождений: ${s.points.length}` : ''}
                              {last.entry.durationSec !== undefined ? `, ${formatDuration(last.entry.durationSec)}` : ''}
                            </span>
                            {flaggedIds.has(s.test.id) && <span className="mt-1 inline-block rounded-full bg-warm-soft px-2.5 py-0.5 text-xs font-medium">достигнут порог скрининга</span>}
                          </>
                        )}
                      </td>
                      <td className="py-2 pr-3">{sc.id === 'total' ? s.test.scoring.totalTitle ?? 'Общий балл' : sc.title}</td>
                      <td className="py-2 pr-3 tabular-nums">{formatValue(sc.value)} из {formatValue(sc.max)}</td>
                      <td className="py-2 pr-3">{sc.range?.title ?? '—'}</td>
                      <td className="py-2">{ch ? `${CHANGE_LABEL[ch.kind]} (${signed(ch.delta)})` : '—'}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {notes.length > 0 && (
          <section aria-labelledby="rep-notes">
            <h4 id="rep-notes" className="font-semibold">Заметки о событиях</h4>
            <ul className="mt-2 space-y-1 text-ui">
              {notes.map((n) => (
                <li key={n.id}>
                  <span className="font-medium">{formatDay(n.date)}</span> — {n.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {slowTests.length > 0 && (
          <section aria-labelledby="rep-quality" className="rounded-control bg-warm-soft p-4 text-ui">
            <h4 id="rep-quality" className="font-semibold">Качество ответов</h4>
            <p className="mt-1">
              В тестах {slowTests.map((x) => x.s.test.title.split(' — ')[0]).join(', ')} ответы были даны очень быстро (меньше
              2 секунд на пункт), поэтому результат может быть неточным.
            </p>
          </section>
        )}

        <p className="text-xs text-muted">
          Пороги изменений: PHQ-9 — 5 баллов (Löwe и др., 2004); GAD-7 — 4 (Toussaint и др., 2020); PCL-5 — 5 и 10 (Национальный
          центр по изучению ПТСР); WHO-5 — 10 процентных пунктов; для остальных шкал условно 10 % диапазона шкалы.
        </p>
      </article>
    </div>
  );
}
