'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { autoBackup } from '@/lib/autoBackup';
import { isFirefox, requestPersistence } from '@/lib/backup';
import { questionOptions } from '@/lib/engine';
import { addHistory, clearProgress, loadProgress, saveProgress } from '@/lib/storage';
import type { Answers, TestDef } from '@/lib/types';

export default function Runner({ test }: { test: TestDef }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Актуальный индекс вопроса, чтобы быстрые нажатия не перезаписывали один и тот же вопрос.
  const idxRef = useRef(0);
  const startedRef = useRef<number | undefined>(undefined);
  const go = useCallback((i: number) => {
    idxRef.current = i;
    setIndex(i);
  }, []);
  const total = test.questions.length;

  // Восстанавливаем прогресс.
  useEffect(() => {
    const p = loadProgress(test.id);
    if (p) {
      setAnswers(p.answers);
      startedRef.current = p.startedAt;
      go(Math.min(p.index, total - 1));
    }
    setReady(true);
  }, [test.id, total, go]);

  useEffect(() => {
    if (ready) saveProgress(test.id, { answers, index, startedAt: startedRef.current });
  }, [ready, answers, index, test.id]);

  useEffect(() => () => void (advance.current && clearTimeout(advance.current)), []);

  const q = test.questions[index];
  const options = q ? questionOptions(test, q) : test.scale.options;
  const current = q ? answers[q.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const allDone = answeredCount >= total;

  const choose = useCallback(
    (value: number) => {
      // Если предыдущий автопереход ещё не сработал, выполняем его сразу.
      if (advance.current) {
        clearTimeout(advance.current);
        advance.current = null;
        go(Math.min(idxRef.current + 1, total - 1));
      }
      const cur = test.questions[idxRef.current];
      if (!cur) return;
      if (startedRef.current === undefined) startedRef.current = Date.now();
      setAnswers((a) => ({ ...a, [cur.id]: value }));
      if (idxRef.current < total - 1) {
        advance.current = setTimeout(() => {
          advance.current = null;
          go(Math.min(idxRef.current + 1, total - 1));
        }, 220);
      }
    },
    [test.questions, total, go],
  );

  const back = useCallback(() => {
    if (advance.current) {
      clearTimeout(advance.current);
      advance.current = null;
    }
    go(Math.max(0, idxRef.current - 1));
  }, [go]);

  const finish = () => {
    const elapsed = startedRef.current === undefined ? undefined : (Date.now() - startedRef.current) / 1000;
    // Если тест прерывали надолго, время ничего не говорит о качестве ответов — не сохраняем.
    const durationSec = elapsed !== undefined && elapsed > 0 && elapsed <= 3 * 3600 ? Math.round(elapsed) : undefined;
    const entry = addHistory({ testId: test.id, testTitle: test.title, answers, durationSec });
    clearProgress(test.id);
    // Просим браузер не удалять данные сайта (Firefox спросил бы пользователя, поэтому там — только на странице «Мои данные»)
    // и обновляем автокопию в файл, если она настроена: клик по кнопке даёт право запросить доступ к файлу.
    if (!isFirefox()) void requestPersistence();
    void autoBackup();
    router.push(`/tests/${test.id}/result?r=${entry.id}`);
  };

  // Клавиатура: цифры — ответ, ← — назад.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') return back();
      if (/^[0-9]$/.test(e.key)) {
        const cur = test.questions[idxRef.current];
        const opt = cur ? questionOptions(test, cur)[Number(e.key) - 1] : undefined;
        if (opt) choose(opt.value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [test, choose, back]);

  if (!ready || !q) return <p className="text-muted" role="status">Загрузка…</p>;

  const pct = Math.round((answeredCount / total) * 100);

  return (
    <div className={`cat-${test.category} mx-auto max-w-2xl space-y-8`}>
      <h1 className="sr-only">{test.title}</h1>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-ui text-muted">
          <Link href={`/tests/${test.id}`} className="inline-flex min-h-[44px] items-center underline-offset-4 hover:underline">
            ← К описанию
          </Link>
          <span aria-live="polite" className="tabular-nums">
            Вопрос {index + 1} из {total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Прогресс прохождения"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-1.5 overflow-hidden rounded-full bg-line-strong/50"
        >
          <div className="h-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
      </div>

      {index === 0 && <p className="text-ui text-muted">{test.instructions}</p>}

      <fieldset key={q.id} className="anim-question space-y-6">
        <legend className="font-display text-2xl font-medium leading-snug sm:text-3xl" id="qtext">
          {q.text}
        </legend>
        <div role="radiogroup" aria-labelledby="qtext" className="grid gap-2.5">
          {options.map((o, i) => {
            const selected = current === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(o.value)}
                className={`flex min-h-[52px] items-center gap-3 rounded-control border px-4 py-3 text-left text-base transition-colors ${
                  selected ? 'border-accent bg-accent-soft ring-1 ring-accent' : 'border-line-strong bg-surface hover:border-accent'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${
                    selected ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong text-muted'
                  }`}
                >
                  {i + 1}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={back} disabled={index === 0} className="btn btn-ghost disabled:opacity-40">
          Назад
        </button>
        {index === total - 1 && allDone ? (
          <button type="button" onClick={finish} className="btn btn-primary">
            Показать результат
          </button>
        ) : index === total - 1 && current !== undefined ? (
          <button
            type="button"
            onClick={() => go(test.questions.findIndex((x) => answers[x.id] === undefined))}
            className="btn btn-primary"
          >
            К первому неотвеченному ({total - answeredCount})
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(Math.min(idxRef.current + 1, total - 1))}
            disabled={current === undefined || index === total - 1}
            className="btn btn-ghost disabled:opacity-40"
          >
            Далее
          </button>
        )}
      </div>

      <div className="space-y-2 text-center text-ui text-muted">
        <p>Прогресс сохраняется в этом браузере.</p>
        <p className="hidden sm:block">Подсказка: нажимайте цифры 1–{options.length} для ответа, «←» — назад.</p>
        {answeredCount > 0 && (
          <button
            type="button"
            onClick={() => {
              if (advance.current) clearTimeout(advance.current);
              advance.current = null;
              clearProgress(test.id);
              setAnswers({});
              go(0);
            }}
            className="inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-ink"
          >
            Начать заново
          </button>
        )}
      </div>
    </div>
  );
}
