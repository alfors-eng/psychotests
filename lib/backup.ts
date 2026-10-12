/**
 * Меры против потери данных. Данные хранятся в localStorage; здесь — запасные копии, которые не покидают устройство:
 * копия в IndexedDB, запрос «постоянного» хранилища, автокопия в файл (Chromium) и напоминания о резервной копии.
 * Ничего из этого не отправляется на сервер.
 */
import type { HistoryEntry } from './types';

/** Ключи localStorage, которые стоит беречь (прогресс незавершённых тестов не копируем). */
export const PERSISTENT_KEYS = ['pt:history', 'pt:notes', 'pt:profile-overrides'] as const;

const LAST = 'pt:last-backup';
const SNOOZE = 'pt:backup-snooze';
const DAY = 86_400_000;

// ---------- Напоминания ----------
export const lastBackup = (): string | null => {
  try {
    return localStorage.getItem(LAST);
  } catch {
    return null;
  }
};

export function markBackup() {
  try {
    localStorage.setItem(LAST, new Date().toISOString());
    localStorage.removeItem(SNOOZE);
  } catch {
    /* ignore */
  }
}

export function snoozeBackupReminder() {
  try {
    localStorage.setItem(SNOOZE, new Date(Date.now() + 7 * DAY).toISOString());
  } catch {
    /* ignore */
  }
}

export type BackupAdvice = 'none' | 'first' | 'stale';

/** Нужно ли напомнить о резервной копии: копии ещё не было, либо с неё прошло ≥ 14 дней и появились новые результаты. */
export function backupAdvice(history: HistoryEntry[], now = Date.now()): BackupAdvice {
  if (!history.length) return 'none';
  try {
    const snooze = localStorage.getItem(SNOOZE);
    if (snooze && Date.parse(snooze) > now) return 'none';
  } catch {
    /* ignore */
  }
  const last = lastBackup();
  if (!last) return 'first';
  const lastMs = Date.parse(last);
  const newest = Math.max(...history.map((h) => Date.parse(h.completedAt)));
  return newest > lastMs && now - lastMs >= 14 * DAY ? 'stale' : 'none';
}

// ---------- IndexedDB ----------
const DB = 'psychotests';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no-idb'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('kv');
      req.result.createObjectStore('fs');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(store: 'kv' | 'fs', mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = f(tx.objectStore(store));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** Копия значения localStorage в IndexedDB (ошибки игнорируются: это запасной путь). */
export async function mirrorPut(key: string, value: string): Promise<void> {
  try {
    await idb('kv', 'readwrite', (s) => s.put(value, key));
  } catch {
    /* IndexedDB недоступен (например, приватный режим) */
  }
}

const mirrorGet = async (key: string): Promise<string | undefined> => {
  try {
    return await idb<string | undefined>('kv', 'readonly', (s) => s.get(key));
  } catch {
    return undefined;
  }
};

/**
 * При запуске: если ключа нет в localStorage, но есть копия в IndexedDB — восстанавливаем; если ключ есть — обновляем копию.
 * localStorage всегда главный: удаление пользователем записывается в него и в копию.
 */
export async function syncMirror(): Promise<{ restored: string[] }> {
  const restored: string[] = [];
  for (const key of PERSISTENT_KEYS) {
    let current: string | null = null;
    try {
      current = localStorage.getItem(key);
    } catch {
      continue;
    }
    if (current !== null) {
      if ((await mirrorGet(key)) !== current) await mirrorPut(key, current);
    } else {
      const copy = await mirrorGet(key);
      if (copy) {
        try {
          localStorage.setItem(key, copy);
          restored.push(key);
        } catch {
          /* ignore */
        }
      }
    }
  }
  return { restored };
}

// ---------- Постоянное хранилище ----------
export interface StorageStatus {
  supported: boolean;
  persisted: boolean;
  usage?: number;
  quota?: number;
}

export async function storageStatus(): Promise<StorageStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage) return { supported: false, persisted: false };
  try {
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    const est = navigator.storage.estimate ? await navigator.storage.estimate() : {};
    return { supported: !!navigator.storage.persist, persisted, usage: est.usage, quota: est.quota };
  } catch {
    return { supported: false, persisted: false };
  }
}

/** Просит браузер не удалять данные сайта автоматически. Chrome и Edge решают сами, Firefox спросит пользователя. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export const isFirefox = () => typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

// ---------- Автокопия в файл (File System Access API, Chromium) ----------
type FsHandle = {
  name: string;
  queryPermission(o: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(o: { mode: 'readwrite' }): Promise<PermissionState>;
  createWritable(): Promise<{ write(d: string): Promise<void>; close(): Promise<void> }>;
};

export const fileBackupSupported = () => typeof window !== 'undefined' && 'showSaveFilePicker' in window;

export async function chooseBackupFile(): Promise<string | null> {
  try {
    const handle = await (window as unknown as { showSaveFilePicker(o: unknown): Promise<FsHandle> }).showSaveFilePicker({
      suggestedName: 'psychotests-backup.json',
      types: [{ description: 'Резервная копия', accept: { 'application/json': ['.json'] } }],
    });
    await idb('fs', 'readwrite', (s) => s.put(handle, 'backup'));
    return handle.name;
  } catch {
    return null; // отменено пользователем
  }
}

export async function backupFileName(): Promise<string | null> {
  try {
    const h = await idb<FsHandle | undefined>('fs', 'readonly', (s) => s.get('backup'));
    return h?.name ?? null;
  } catch {
    return null;
  }
}

export async function forgetBackupFile() {
  try {
    await idb('fs', 'readwrite', (s) => s.delete('backup'));
  } catch {
    /* ignore */
  }
}

export type FileWriteResult = 'ok' | 'no-file' | 'no-permission' | 'error';

/** Записывает копию в выбранный файл. `interactive` — вызывать из обработчика клика: браузер может спросить разрешение. */
export async function writeBackupFile(json: string, interactive: boolean): Promise<FileWriteResult> {
  let handle: FsHandle | undefined;
  try {
    handle = await idb<FsHandle | undefined>('fs', 'readonly', (s) => s.get('backup'));
  } catch {
    return 'error';
  }
  if (!handle) return 'no-file';
  try {
    let perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted' && interactive) perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return 'no-permission';
    const w = await handle.createWritable();
    await w.write(json);
    await w.close();
    markBackup();
    return 'ok';
  } catch {
    return 'error';
  }
}
