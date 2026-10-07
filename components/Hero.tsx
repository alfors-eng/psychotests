/** Иллюстрация для главной: мягкие формы и радар в палитре категорий. Чисто декоративная. */
export default function HeroArt({ className = '' }: { className?: string }) {
  const R = 84;
  const cx = 200;
  const cy = 190;
  const pts = (f: number[]) =>
    f
      .map((v, i) => {
        const a = (Math.PI * 2 * i) / f.length - Math.PI / 2;
        return `${(cx + R * v * Math.cos(a)).toFixed(1)},${(cy + R * v * Math.sin(a)).toFixed(1)}`;
      })
      .join(' ');
  return (
    <svg viewBox="0 0 400 380" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id="hg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.28" />
          <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path
        d="M60 210c-28-70 22-150 100-168s170 6 196 78-8 150-86 176-182 14-210-86Z"
        fill="url(#hg1)"
      />
      <circle cx="338" cy="58" r="30" fill="rgb(var(--c-wellbeing) / 0.35)" />
      <circle cx="58" cy="318" r="22" fill="rgb(var(--c-relationships) / 0.30)" />
      <circle cx="352" cy="316" r="14" fill="rgb(var(--c-eq) / 0.35)" />
      <path d="M26 96c16-12 30 12 46 0s30 12 46 0" fill="none" stroke="rgb(var(--c-personality) / 0.55)" strokeWidth="3" strokeLinecap="round" />
      {[0.33, 0.66, 1].map((k) => (
        <polygon key={k} points={pts([k, k, k, k, k, k])} fill="none" stroke="rgb(var(--border))" strokeWidth="1.5" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke="rgb(var(--border))" strokeWidth="1.5" />
        );
      })}
      <polygon points={pts([0.82, 0.5, 0.9, 0.42, 0.7, 0.62])} fill="rgb(var(--accent) / 0.28)" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinejoin="round" />
      {[0.82, 0.5, 0.9, 0.42, 0.7, 0.62].map((v, i) => {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        return <circle key={i} cx={cx + R * v * Math.cos(a)} cy={cy + R * v * Math.sin(a)} r="5" fill="rgb(var(--accent))" />;
      })}
      <rect x="40" y="248" width="120" height="14" rx="7" fill="rgb(var(--accent) / 0.2)" />
      <rect x="40" y="248" width="82" height="14" rx="7" fill="rgb(var(--accent))" />
      <rect x="40" y="274" width="120" height="14" rx="7" fill="rgb(var(--c-career) / 0.2)" />
      <rect x="40" y="274" width="54" height="14" rx="7" fill="rgb(var(--c-career))" />
    </svg>
  );
}
