'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/format';
import { clearHistory, deleteHistory, loadHistory } from '@/lib/storage';
import type { HistoryEntry } from '@/lib/types';

export default function HistoryList() {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);

  useEffect(() => setItems(loadHistory()), []);

  if (items === null) return <p className="text-muted" role="status">Загрузка…</p>;
  if (!items.length)
    return (
      <div className="space-y-4">
        <p className="text-muted">Пока нет сохранённых результатов.</p>
        <Link href="/" className="btn btn-primary">
          Выбрать тест
        </Link>
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
    </div>
  );
}
