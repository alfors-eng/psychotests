'use client';
import Link from 'next/link';
import qrcode from 'qrcode-generator';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  backupFileName,
  chooseBackupFile,
  fileBackupSupported,
  forgetBackupFile,
  isFirefox,
  isStandalone,
  lastBackup,
  markBackup,
  requestPersistence,
  storageStatus,
  writeBackupFile,
  type StorageStatus,
} from '@/lib/backup';
import { formatDay } from '@/lib/format';
import { buildExport, importHistory, loadHistory, loadNotes } from '@/lib/storage';
import { decryptTransfer, encryptTransfer, extractToken, MIN_PASSPHRASE, TransferError } from '@/lib/transfer';

const mb = (n?: number) =>
  n === undefined
    ? '—'
    : n < 1024 * 1024
      ? `${Math.max(1, Math.round(n / 1024))} КБ`
      : n < 1024 ** 3
        ? `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`
        : `${(n / 1024 ** 3).toFixed(1).replace('.', ',')} ГБ`;

function Qr({ text }: { text: string }) {
  const svg = useMemo(() => {
    try {
      const q = qrcode(0, 'L');
      q.addData(text);
      q.make();
      return q.createSvgTag({ cellSize: 3, margin: 4, scalable: true });
    } catch {
      return null; // данных слишком много для QR-кода
    }
  }, [text]);
  if (!svg) {
    return <p className="text-sm text-muted">Данных слишком много для QR-кода: используйте ссылку или файл.</p>;
  }
  return (
    <div
      role="img"
      aria-label="QR-код со ссылкой для переноса данных"
      className="w-56 max-w-full rounded-control bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Receive({ initialToken, onDone }: { initialToken: string; onDone: () => void }) {
  const [input, setInput] = useState(initialToken);
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDone('');
    const token = extractToken(input);
    if (!token) return setError('Не нашли в тексте ссылку переноса. Вставьте ссылку целиком или код, который начинается с «v1.».');
    setBusy(true);
    try {
      const data = await decryptTransfer(token, pass);
      const added = importHistory(data);
      markBackup();
      setDone(added ? `Добавлено результатов: ${added}.` : 'Все результаты из ссылки уже есть на этом устройстве, новых нет.');
      setPass('');
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch {
        /* ignore */
      }
      onDone();
    } catch (err) {
      setError(
        err instanceof TransferError && err.code === 'bad-passphrase'
          ? 'Неверный пароль, либо ссылка повреждена. Проверьте пароль и раскладку клавиатуры.'
          : err instanceof TransferError && err.code === 'unsupported'
            ? 'Этот браузер не поддерживает шифрование. Используйте файл.'
            : 'Не удалось прочитать ссылку: она неполная или повреждена. Попросите создать ссылку заново или используйте файл.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Ссылка переноса (или её часть после «#»)</span>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full rounded-control border border-line-strong bg-surface p-3 font-mono text-xs"
          spellCheck={false}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Пароль, который вы задали при создании ссылки</span>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="off"
          className="min-h-[44px] w-full max-w-sm rounded-control border border-line-strong bg-surface px-3 text-base"
        />
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy || !input.trim() || !pass}>
        {busy ? 'Расшифровываем…' : 'Расшифровать и добавить'}
      </button>
      <p role="status" className="text-sm">
        {done}
      </p>
      {error && (
        <p role="alert" className="rounded-control bg-warm-soft p-3 text-ui">
          {error}
        </p>
      )}
      {done && (
        <Link href="/results" className="btn btn-ghost">
          Открыть «Мои результаты»
        </Link>
      )}
    </form>
  );
}

function CreateLink({ disabled, onCreated }: { disabled: boolean; onCreated: () => void }) {
  const [pass, setPass] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLink('');
    setCopied('');
    if (pass.length < MIN_PASSPHRASE) return setError(`Пароль должен быть не короче ${MIN_PASSPHRASE} символов.`);
    if (pass !== again) return setError('Пароли не совпадают.');
    setBusy(true);
    try {
      const token = await encryptTransfer(buildExport(), pass);
      setLink(`${window.location.origin}/data#${token}`);
      markBackup();
      onCreated();
    } catch {
      setError('Этот браузер не поддерживает шифрование. Используйте файл.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied('Ссылка скопирована.');
    } catch {
      setCopied('Не удалось скопировать: выделите ссылку вручную.');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <label className="space-y-1 text-sm">
            <span className="block text-muted">Придумайте пароль (от {MIN_PASSPHRASE} символов)</span>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" className="min-h-[44px] w-64 max-w-full rounded-control border border-line-strong bg-surface px-3 text-base" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="block text-muted">Повторите пароль</span>
            <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" className="min-h-[44px] w-64 max-w-full rounded-control border border-line-strong bg-surface px-3 text-base" />
          </label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || disabled}>
          {busy ? 'Шифруем…' : 'Создать ссылку'}
        </button>
        {disabled && <p className="text-sm text-muted">Пока нечего переносить: пройдите хотя бы один тест.</p>}
      </form>
      {error && (
        <p role="alert" className="rounded-control bg-warm-soft p-3 text-ui">
          {error}
        </p>
      )}
      {link && (
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="text-muted">Ссылка для переноса ({link.length.toLocaleString('ru-RU')} символов)</span>
            <textarea readOnly value={link} rows={4} aria-label="Ссылка для переноса" className="w-full rounded-control border border-line-strong bg-surface p-3 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          </label>
          {link.length > 8000 && (
            <p className="rounded-control bg-warm-soft p-3 text-sm">
              Ссылка длинная: некоторые мессенджеры могут её обрезать. Надёжнее перенести данные файлом.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" onClick={copy}>
              Копировать ссылку
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button type="button" className="btn btn-ghost" onClick={() => navigator.share({ url: link }).catch(() => undefined)}>
                Поделиться
              </button>
            )}
          </div>
          <p role="status" className="text-sm">
            {copied}
          </p>
          <Qr text={link} />
          <p className="text-sm text-muted">
            Откройте ссылку на другом устройстве и введите пароль. Данные внутри ссылки зашифрованы, а сама ссылка (после «#») не
            отправляется на сервер сайта. Не пересылайте пароль в том же сообщении, что и ссылку.
          </p>
        </div>
      )}
    </div>
  );
}

function Box({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="card space-y-4">
      <h2 id={id} className="t-h3">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DataCenter() {
  const [counts, setCounts] = useState({ results: 0, notes: 0 });
  const [backupAt, setBackupAt] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [persistMsg, setPersistMsg] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMsg, setFileMsg] = useState('');
  const [token, setToken] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [standalone, setStandalone] = useState(false);
  const [canFile, setCanFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setCounts({ results: loadHistory().length, notes: loadNotes().length });
    setBackupAt(lastBackup());
    setStorage(await storageStatus());
    setFileName(await backupFileName());
  }, []);

  useEffect(() => {
    setToken(extractToken(window.location.hash) ?? '');
    setStandalone(isStandalone());
    setCanFile(fileBackupSupported());
    void refresh();
  }, [refresh]);

  const persist = async () => {
    const ok = await requestPersistence();
    setPersistMsg(ok ? 'Готово: браузер не будет удалять данные сайта автоматически.' : 'Браузер не дал разрешения. Часто помогает добавить сайт в закладки или установить его как приложение.');
    void refresh();
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `psychotests-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    markBackup();
    void refresh();
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const added = importHistory(JSON.parse(await file.text()));
      setImportMsg(added ? `Добавлено результатов: ${added}.` : 'Новых результатов в файле нет.');
    } catch {
      setImportMsg('Не удалось прочитать файл: это не резервная копия из «Психотестов».');
    }
    if (fileRef.current) fileRef.current.value = '';
    void refresh();
  };

  const pickFile = async () => {
    const name = await chooseBackupFile();
    if (!name) return;
    const r = await writeBackupFile(JSON.stringify(buildExport(), null, 2), true);
    setFileMsg(r === 'ok' ? 'Файл выбран, копия записана. Дальше она обновляется после каждого результата.' : 'Файл выбран, но записать не удалось: разрешите доступ к файлу.');
    void refresh();
  };

  const saveNow = async () => {
    const r = await writeBackupFile(JSON.stringify(buildExport(), null, 2), true);
    setFileMsg(r === 'ok' ? 'Копия записана в файл.' : r === 'no-permission' ? 'Нет доступа к файлу: разрешите его в окне браузера.' : 'Не удалось записать файл.');
    void refresh();
  };

  return (
    <div className="space-y-8">
      <p className="rounded-control bg-accent-soft p-4 text-ui">
        Ваши результаты хранятся только в этом браузере: на сайте нет аккаунтов, и сервер их не получает. Поэтому важно
        подстраховаться на случай, если браузер очистит данные сайта. Здесь собраны все способы, от самого простого до самого
        надёжного.
      </p>

      {token && (
        <Box id="recv-title" title="Получить данные по ссылке">
          <Receive initialToken={token} onDone={() => void refresh()} />
        </Box>
      )}

      <Box id="state-title" title="Состояние">
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            ['Сохранено результатов', String(counts.results)],
            ['Заметок', String(counts.notes)],
            ['Последняя резервная копия', backupAt ? formatDay(backupAt) : 'ещё не делали'],
            [
              'Защита от автоочистки',
              !storage ? '…' : storage.persisted ? 'включена' : storage.supported ? 'не включена' : 'не поддерживается браузером',
            ],
            ['Занято в браузере', storage ? `${mb(storage.usage)} из ${mb(storage.quota)}` : '…'],
            ['Установлено как приложение', standalone ? 'да' : 'нет'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {storage?.supported && !storage.persisted && (
          <div className="space-y-2">
            <button type="button" className="btn btn-ghost" onClick={persist}>
              Включить защиту от автоочистки
            </button>
            {isFirefox() && <p className="text-sm text-muted">Firefox спросит разрешение в отдельном окне.</p>}
          </div>
        )}
        <p role="status" className="text-sm">
          {persistMsg}
        </p>
        <p className="text-sm text-muted">
          Запасная копия внутри браузера (IndexedDB) создаётся автоматически и восстанавливает данные, если пропало только основное хранилище.
          От команды «очистить все данные сайта» она не защищает: для этого нужны способы ниже.
        </p>
      </Box>

      <Box id="link-title" title="Перенос на другое устройство: зашифрованная ссылка или QR-код">
        <p className="text-ui text-muted">
          Данные шифруются в вашем браузере вашим паролем. Ссылку можно отправить себе в мессенджер или показать QR-код телефону.
          Результаты при этом остаются и на этом устройстве.
        </p>
        <CreateLink disabled={counts.results === 0 && counts.notes === 0} onCreated={() => void refresh()} />
        {!token && (
          <details className="rounded-control border border-line p-4">
            <summary className="cursor-pointer font-medium">У меня есть ссылка или код переноса</summary>
            <div className="mt-4">
              <Receive initialToken="" onDone={() => void refresh()} />
            </div>
          </details>
        )}
      </Box>

      {canFile && (
        <Box id="auto-title" title="Автокопия в файл (Chrome, Edge, Яндекс Браузер)">
          <p className="text-ui text-muted">
            Выберите файл на компьютере (лучше в папке, которую вы синхронизируете с облаком). Копия будет обновляться после каждого
            пройденного теста. Эти данные переживут очистку браузера.
          </p>
          {fileName ? (
            <div className="space-y-3">
              <p className="text-ui">
                Файл: <span className="font-medium">{fileName}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost" onClick={saveNow}>
                  Сохранить сейчас
                </button>
                <button type="button" className="btn btn-ghost" onClick={async () => { await forgetBackupFile(); setFileMsg('Автокопия отключена.'); void refresh(); }}>
                  Отключить
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-primary" onClick={pickFile}>
              Выбрать файл для автокопии
            </button>
          )}
          <p role="status" className="text-sm">
            {fileMsg}
          </p>
          <p className="text-sm text-muted">Браузер может раз за сессию спросить разрешение на запись в файл: это нормально.</p>
        </Box>
      )}

      <Box id="file-title" title="Резервная копия вручную: файл">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" disabled={counts.results === 0 && counts.notes === 0} onClick={exportFile}>
            Сохранить в файл
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            Загрузить из файла
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-label="Файл с резервной копией" onChange={(e) => onImport(e.target.files?.[0])} />
        </div>
        <p role="status" className="text-sm">
          {importMsg}
        </p>
        <p className="text-sm text-muted">Файл содержит ваши ответы, поэтому храните его так же бережно, как личные документы.</p>
      </Box>

      <Box id="install-title" title="Установить сайт как приложение">
        <p className="text-ui text-muted">
          Установленное приложение браузеры считают более «своим» и реже удаляют его данные; на iPhone это защищает от очистки,
          которую Safari делает для сайтов, которые давно не открывали.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-ui">
          <li>iPhone и iPad (Safari): «Поделиться» → «На экран “Домой”».</li>
          <li>Android (Chrome, Яндекс Браузер): меню → «Установить приложение» или «Добавить на главный экран».</li>
          <li>Компьютер (Chrome, Edge): значок установки в адресной строке или меню → «Установить Психотесты».</li>
        </ul>
      </Box>

      <p className="text-sm text-muted">
        Подробнее о том, какие данные сайт получает и где что хранится: <Link href="/privacy" className="underline underline-offset-4">конфиденциальность и данные</Link>.
      </p>
    </div>
  );
}
