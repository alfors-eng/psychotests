'use client';
import type { Answers, HistoryEntry } from './types';

// Всё хранится только в localStorage этого браузера и никуда не отправляется.
const PROGRESS = (id: string) => `pt:progress:${id}`;
const HISTORY = 'pt:history';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим или переполнение — работаем без сохранения */
  }
}

export interface Progress {
  answers: Answers;
  index: number;
}

export const loadProgress = (testId: string) => read<Progress | null>(PROGRESS(testId), null);
export const saveProgress = (testId: string, p: Progress) => write(PROGRESS(testId), p);
export function clearProgress(testId: string) {
  try {
    localStorage.removeItem(PROGRESS(testId));
  } catch {
    /* ignore */
  }
}

export const loadHistory = () => read<HistoryEntry[]>(HISTORY, []);

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'completedAt'>): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    completedAt: new Date().toISOString(),
  };
  write(HISTORY, [full, ...loadHistory()]);
  return full;
}

export const deleteHistory = (id: string) => write(HISTORY, loadHistory().filter((h) => h.id !== id));
export const clearHistory = () => write(HISTORY, []);

export interface HistoryExport {
  app: 'psychotests';
  version: 1;
  exportedAt: string;
  entries: HistoryEntry[];
}

export const buildExport = (): HistoryExport => ({
  app: 'psychotests',
  version: 1,
  exportedAt: new Date().toISOString(),
  entries: loadHistory(),
});

const isEntry = (e: unknown): e is HistoryEntry => {
  const x = e as HistoryEntry;
  return (
    !!x &&
    typeof x.id === 'string' &&
    typeof x.testId === 'string' &&
    typeof x.testTitle === 'string' &&
    typeof x.completedAt === 'string' &&
    !Number.isNaN(Date.parse(x.completedAt)) &&
    !!x.answers &&
    typeof x.answers === 'object' &&
    Object.values(x.answers).every((v) => typeof v === 'number')
  );
};

/** Добавляет записи из файла; повторяющиеся id пропускает. Возвращает число добавленных. */
export function importHistory(raw: unknown): number {
  const entries = (raw as HistoryExport | null)?.entries;
  if (!Array.isArray(entries)) throw new Error('Неверный формат файла');
  const current = loadHistory();
  const known = new Set(current.map((h) => h.id));
  const fresh = entries.filter((e) => isEntry(e) && !known.has(e.id));
  write(
    HISTORY,
    [...current, ...fresh].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
  );
  return fresh.length;
}
