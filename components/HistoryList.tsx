'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import BackupReminder from '@/components/BackupReminder';
import { markBackup } from '@/lib/backup';
import { formatDate } from '@/lib/format';
import { buildExport, clearHistory, deleteHistory, importHistory, loadHistory } from '@/lib/storage';
import type { HistoryEntry } from '@/lib/types';

export default function HistoryList() {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  const [message, setMessage] = useState('');
  const [undo, setUndo] = useState<HistoryEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setItems(loadHistory()), []);

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `psychotests-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    markBackup();
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

  const undoBar = undo && (
    <p role="status" className="flex flex-wrap items-center gap-3 rounded-control bg-accent-soft p-3 text-ui">
      Результат удалён.
      <button
        type="button"
        className="inline-flex min-h-[44px] items-center font-medium underline underline-offset-4"
        onClick={() => {
          importHistory({ entries: [undo] });
          setUndo(null);
          setItems(loadHistory());
        }}
      >
        Вернуть
      </button>
    </p>
  );

  const transfer = (
    <div className="space-y-2 border-t border-line pt-4">
      <p className="text-sm text-muted">
        Файл с результатами можно сохранить и загрузить на другом устройстве. Он хранится только у вас и
        содержит ваши ответы — берегите его. Перенос зашифрованной ссылкой или QR-кодом и автокопия в файл — на странице{' '}
        <Link href="/data" className="underline underline-offset-4">«Мои данные»</Link>.
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
        {undoBar}
        <p className="text-muted">Пока нет сохранённых результатов.</p>
        <Link href="/" className="btn btn-primary">
          Выбрать тест
        </Link>
        {transfer}
      </div>
    );

  return (
    <div className="space-y-4">
      <BackupReminder />
      <ul className="divide-y divide-line border-y border-line">
        {items.map((h) => (
          <li key={h.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <div className="min-w-0">
              <p className="font-medium">{h.testTitle}</p>
              <p className="text-ui text-muted">{formatDate(h.completedAt)}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link href={`/tests/${h.testId}/result?r=${h.id}`} className="btn btn-ghost">
                Открыть
              </Link>
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center rounded-control px-3 text-ui text-muted underline-offset-4 transition-colors hover:text-warm hover:underline"
                aria-label={`Удалить результат: ${h.testTitle}, ${formatDate(h.completedAt)}`}
                onClick={() => {
                  deleteHistory(h.id);
                  setUndo(h);
                  setItems(loadHistory());
                }}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
      {undoBar}
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
