'use client';
import { useEffect, useState } from 'react';

/** Кнопка «остановить анимации»: для тех, кому движение мешает (хранится в localStorage). */
export default function MotionToggle() {
  const [off, setOff] = useState(false);

  useEffect(() => {
    setOff(document.documentElement.classList.contains('no-anim'));
  }, []);

  const toggle = () => {
    const next = !off;
    setOff(next);
    document.documentElement.classList.toggle('no-anim', next);
    try {
      localStorage.setItem('pt:motion', next ? 'off' : 'on');
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={off}
      aria-label={off ? 'Включить анимации' : 'Остановить анимации'}
      title={off ? 'Включить анимации' : 'Остановить анимации'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-accent-soft"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {off ? <path d="M8 5v14l11-7z" /> : <path d="M9 5v14M15 5v14" />}
      </svg>
    </button>
  );
}
