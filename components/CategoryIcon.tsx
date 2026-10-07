import type { CategoryId } from '@/lib/types';

/** Декоративные иконки категорий (stroke, 24×24). Всегда aria-hidden: смысл несёт текст рядом. */
const PATHS: Record<CategoryId, React.ReactNode> = {
  personality: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20c.6-3.8 3.1-6 6.5-6s5.9 2.2 6.5 6" />
      <path d="M12 2.2v1.4M4.8 4.6l1 1M19.2 4.6l-1 1" />
    </>
  ),
  emotional: (
    <>
      <path d="M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10-7.5 10Z" />
      <path d="M8.6 12.4h2l1-2 1.6 3.4 1-1.4h1.2" />
    </>
  ),
  wellbeing: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </>
  ),
  relationships: (
    <>
      <circle cx="8.6" cy="12" r="5" />
      <circle cx="15.4" cy="12" r="5" />
    </>
  ),
  eq: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M8.4 14c.9 1.5 2.1 2.2 3.6 2.2s2.7-.7 3.6-2.2" />
      <circle cx="9.2" cy="9.8" r=".7" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="9.8" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  career: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.4 8.6-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  neurodiversity: (
    <>
      <path d="M12 12c0-2.6-1.7-4.6-3.8-4.6S4.4 9.2 4.4 12s1.7 4.6 3.8 4.6c2.6 0 3.8-4.6 7.6-4.6 2.1 0 3.8 1.8 3.8 4.6" opacity="0" />
      <path d="M12 12c-1.5-2.3-2.8-4-4.6-4a4 4 0 0 0 0 8c1.8 0 3.1-1.7 4.6-4s2.8-4 4.6-4a4 4 0 0 1 0 8c-1.8 0-3.1-1.7-4.6-4Z" />
    </>
  ),
  values: (
    <>
      <path d="M12 3.2 20 12l-8 8.8L4 12l8-8.8Z" />
      <path d="M4 12h16M12 3.2 8.8 12 12 20.8 15.2 12 12 3.2Z" />
    </>
  ),
};

export default function CategoryIcon({ id, className = 'h-6 w-6' }: { id: CategoryId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[id]}
    </svg>
  );
}
