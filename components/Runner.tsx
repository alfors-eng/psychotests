'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
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
      go(Math.min(p.index, total - 1));
    }
    setReady(true);
  }, [test.id, total, go]);

  useEffect(() => {
    if (ready) saveProgress(test.id, { answers, index });
  }, [ready, answers, index, test.id]);

  useEffect(() => () => void (advance.current && clearTimeout(advance.current)), []);

  const q = test.questions[index];
  const options = test.scale.options;
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
    const entry = addHistory({ testId: test.id, testTitle: test.title, answers });
    clearProgress(test.id);
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
        const opt = options[Number(e.key) - 1];
        if (opt) choose(opt.value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, choose, back]);

  if (!ready || !q) return <p className="text-muted" role="status">Загрузка…</p>;

  const pct = Math.round((answeredCount / total) * 100);

  return (
    <div className={`cat-${test.category} mx-auto max-w-2xl space-y-8`}>
      <h1 className="sr-only">{test.title}</h1>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted">
          <Link href={`/tests/${test.id}`} className="underline-offset-4 hover:underline">
            ← К описанию
          </Link>
          <span aria-live="polite">
            Вопрос {index + 1} из {total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Прогресс прохождения"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-2 overflow-hidden rounded-full bg-line"
        >
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {index === 0 && <p className="text-[15px] text-muted">{test.instructions}</p>}

      <fieldset key={q.id} className="anim-question space-y-6">
        <legend className="font-display flex items-start gap-4 text-2xl font-medium leading-snug sm:text-3xl" id="qtext">
          <span aria-hidden="true" className="cat-bubble mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg">
            {index + 1}
          </span>
          <span>{q.text}</span>
        </legend>
        <div role="radiogroup" aria-labelledby="qtext" className="grid gap-3">
          {options.map((o, i) => {
            const selected = current === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(o.value)}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl2 border px-4 py-3 text-left text-base transition-colors ${
                  selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${
                    selected ? 'border-accent bg-accent text-accent-fg' : 'border-line text-muted'
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

      <div className="space-y-2 text-center text-sm text-muted">
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
