'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { addHistory } from '@/lib/storage';
import type { TestDef } from '@/lib/types';

/** Разбор строки с ответами: числа через пробел, запятую, точку с запятой или перенос строки. */
export function parseAnswers(raw: string, test: TestDef): { values?: number[]; error?: string } {
  const tokens = raw.split(/[\s,;]+/).filter(Boolean);
  const allowed = new Set(test.scale.options.map((o) => o.value));
  const total = test.questions.length;
  const nums = tokens.map(Number);
  if (tokens.length !== total) return { error: `Найдено значений: ${tokens.length}, а нужно ${total}.` };
  const bad = nums.findIndex((n) => !Number.isInteger(n) || !allowed.has(n));
  if (bad >= 0) return { error: `Пункт ${bad + 1}: «${tokens[bad]}» — недопустимое значение.` };
  return { values: nums };
}

export default function ExternalEntry({ test }: { test: TestDef }) {
  const router = useRouter();
  const ext = test.external!;
  const fileRef = useRef<HTMLInputElement>(null);
  const [answers, setAnswers] = useState<(number | '')[]>(() => test.questions.map(() => ''));
  const [paste, setPaste] = useState('');
  const [message, setMessage] = useState('');

  const filled = answers.filter((a) => a !== '').length;
  const done = filled === test.questions.length;

  const applyText = (raw: string) => {
    const r = parseAnswers(raw, test);
    if (r.error || !r.values) {
      setMessage(r.error ?? 'Не удалось разобрать ответы.');
      return;
    }
    setAnswers(r.values);
    setMessage('Ответы заполнены. Проверьте их и нажмите «Посчитать результат».');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setPaste(text);
    applyText(text);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = () => {
    const map: Record<string, number> = {};
    test.questions.forEach((q, i) => {
      map[q.id] = answers[i] as number;
    });
    const entry = addHistory({ testId: test.id, testTitle: test.title, answers: map });
    router.push(`/tests/${test.id}/result?r=${entry.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href={`/tests/${test.id}`} className="text-sm text-accent underline-offset-4 hover:underline">
        ← К описанию
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">{test.title}: ввод ответов</h1>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">1. Пройдите тест на сайте оригинала</h2>
        <p className="text-[15px]">{ext.note}</p>
        <a href={ext.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          {ext.urlLabel} ↗
        </a>
      </section>

      <section className="space-y-3" aria-labelledby="legend">
        <h2 id="legend" className="text-lg font-semibold">
          2. Введите свои ответы
        </h2>
        <p className="text-[15px] text-muted">
          Для каждого пункта выберите тот вариант, который вы отметили на сайте оригинала. Нумерация пунктов —
          как в оригинале. Ответы считаются только в вашем браузере.
        </p>
        <ul className="grid gap-1 rounded-xl2 bg-accent-soft p-4 text-sm sm:grid-cols-2">
          {test.scale.options.map((o) => (
            <li key={o.value}>
              <span className="font-semibold">{o.value}</span> — {o.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="quick">
        <h3 id="quick" className="font-semibold">
          Быстрый ввод
        </h3>
        <label htmlFor="paste" className="block text-sm text-muted">
          Вставьте {test.questions.length} чисел подряд (через пробел, запятую или с новой строки) или загрузите
          текстовый файл (.txt, .csv).
        </label>
        <textarea
          id="paste"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-line bg-surface p-3 text-base"
          placeholder="например: 3 4 2 5 1 …"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => applyText(paste)}>
            Заполнить из текста
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            Загрузить файл
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            className="sr-only"
            tabIndex={-1}
            aria-label="Файл с ответами"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
        <p role="status" className="text-sm">
          {message}
        </p>
      </section>

      <section aria-labelledby="grid" className="space-y-3">
        <h3 id="grid" className="font-semibold">
          Ответы по пунктам ({filled} из {test.questions.length})
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {test.questions.map((q, i) => (
            <li key={q.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2">
              <label htmlFor={`a-${q.id}`} className="text-[15px]">
                Пункт {i + 1}
              </label>
              <select
                id={`a-${q.id}`}
                value={answers[i]}
                onChange={(e) => {
                  const v = e.target.value === '' ? '' : Number(e.target.value);
                  setAnswers((a) => a.map((x, j) => (j === i ? v : x)));
                }}
                className="min-h-[40px] rounded-lg border border-line bg-bg px-2"
              >
                <option value="">—</option>
                {test.scale.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.value} — {o.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary disabled:opacity-40" disabled={!done} onClick={submit}>
          Посчитать результат
        </button>
        {!done && <span className="text-sm text-muted">Заполните все пункты.</span>}
      </div>
    </div>
  );
}
