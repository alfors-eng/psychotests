'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { backupAdvice, snoozeBackupReminder, type BackupAdvice } from '@/lib/backup';
import { loadHistory } from '@/lib/storage';

/** Напоминание о резервной копии: результаты живут только в этом браузере и могут пропасть при очистке данных сайта. */
export default function BackupReminder() {
  const [advice, setAdvice] = useState<BackupAdvice>('none');

  useEffect(() => setAdvice(backupAdvice(loadHistory())), []);

  if (advice === 'none') return null;
  return (
    <aside aria-label="Резервная копия" className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-line bg-warm-soft p-4 text-[15px] print:hidden">
      <p className="min-w-[14rem] flex-1">
        {advice === 'first'
          ? 'Результаты хранятся только в этом браузере и пропадут, если очистить данные сайта. Сделайте резервную копию: это занимает полминуты.'
          : 'С последней резервной копии появились новые результаты. Обновите копию, чтобы не потерять их.'}
      </p>
      <div className="flex gap-2">
        <Link href="/data" className="btn btn-primary !min-h-[44px] text-sm">
          Резервные копии
        </Link>
        <button
          type="button"
          className="btn btn-ghost !min-h-[44px] text-sm"
          onClick={() => {
            snoozeBackupReminder();
            setAdvice('none');
          }}
        >
          Позже
        </button>
      </div>
    </aside>
  );
}
