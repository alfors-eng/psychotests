'use client';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

// useLayoutEffect на сервере выдаёт предупреждение — подменяем на useEffect
const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Плавное появление блока при прокрутке. Без JS и при «меньше движения» контент виден сразу.
 * Состояния: idle (серверная отрисовка, виден) → pending (скрыт до появления в окне) → in (виден с анимацией).
 */
export default function Reveal({
  children,
  delay = 0,
  as,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<'idle' | 'pending' | 'in'>('idle');

  useIso(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    setState('pending');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('in');
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = state === 'idle' ? '' : state === 'pending' ? 'reveal' : 'reveal in';
  return (
    <Tag ref={ref} className={`${cls} ${className}`.trim()} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
