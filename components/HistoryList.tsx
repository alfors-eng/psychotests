'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatDate } from '@/lib/format';
import { buildExport, clearHistory, deleteHistory, importHistory, loadHistory } from '@/lib/storage';
import type { HistoryEntry } from '@/lib/types';

export default function HistoryList() {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setItems(loadHistory()), []);

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `psychotests-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const added = importHistory(JSON.parse(await file.text()));
      setItems(loadHistory());
      setMessage(added ? `Добавлено результатов: ${added}.` : 'Новых результатов в файле нет.');
    } catch {
      setMessage('Не удалось прочитать файл: это не экспорт из «Психотестов».');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  if (items === null) return <p className="text-muted" role="status">Загрузка…</p>;

  const transfer = (
    <div className="space-y-2 border-t border-line pt-4">
      <p className="text-sm text-muted">
        Файл с результатами можно сохранить и загрузить на другом устройстве. Он хранится только у вас и
        содержит ваши ответы — берегите его.
      </p>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={exportFile}>
            Сохранить в файл
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          Загрузить из файла
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Файл с результатами"
          onChange={(e) => onImport(e.target.files?.[0])}
        />
      </div>
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  );

  if (!items.length)
    return (
      <div className="space-y-4">
        <svg viewBox="0 0 160 110" className="h-28 w-40" fill="none" aria-hidden="true" focusable="false">
          <rect x="22" y="14" width="116" height="82" rx="14" className="fill-accent-soft" />
          <rect x="38" y="34" width="52" height="8" rx="4" className="fill-accent" opacity="0.6" />
          <rect x="38" y="52" width="84" height="8" rx="4" className="fill-accent" opacity="0.3" />
          <rect x="38" y="70" width="64" height="8" rx="4" className="fill-accent" opacity="0.3" />
          <circle cx="132" cy="22" r="10" className="fill-bg stroke-accent" strokeWidth="3" />
        </svg>
        <p className="text-muted">Пока нет сохранённых результатов.</p>
        <Link href="/" className="btn btn-primary">
          Выбрать тест
        </Link>
        {transfer}
      </div>
    );

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((h) => (
          <li key={h.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{h.testTitle}</p>
              <p className="text-sm text-muted">{formatDate(h.completedAt)}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/tests/${h.testId}/result?r=${h.id}`} className="btn btn-ghost">
                Открыть
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={`Удалить результат: ${h.testTitle}, ${formatDate(h.completedAt)}`}
                onClick={() => {
                  deleteHistory(h.id);
                  setItems(loadHistory());
                }}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          if (window.confirm('Удалить все результаты из этого браузера?')) {
            clearHistory();
            setItems([]);
          }
        }}
      >
        Удалить всё
      </button>
      {transfer}
    </div>
  );
}
