'use client';
import { useEffect, useState } from 'react';
import { syncMirror } from '@/lib/backup';

/**
 * Работает на каждой странице: подстраховывает данные. Если браузер потерял основное хранилище, но запасная копия
 * в IndexedDB цела, восстанавливает результаты и один раз перезагружает страницу, чтобы все разделы увидели данные.
 */
export default function DataGuard() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { restored } = await syncMirror();
      if (!alive) return;
      try {
        if (restored.length) {
          sessionStorage.setItem('pt:restored', '1');
          window.location.reload();
          return;
        }
        if (sessionStorage.getItem('pt:restored')) {
          sessionStorage.removeItem('pt:restored');
          setMessage('Браузер потерял часть данных сайта, и мы восстановили результаты из запасной копии. Сделайте резервную копию на странице «Мои данные».');
        }
      } catch {
        /* sessionStorage недоступен */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!message) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-[15px] shadow-lg print:hidden">
      <p className="flex-1">{message}</p>
      <button type="button" className="shrink-0 underline underline-offset-4" onClick={() => setMessage('')}>
        Закрыть
      </button>
    </div>
  );
}
