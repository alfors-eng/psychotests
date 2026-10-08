
/** Иллюстрация главной: радар, который один раз рисуется при загрузке. Декоративная. */
export default function HeroArt({ className = '' }: { className?: string }) {
  const R = 96;
  const cx = 200;
  const cy = 200;
  const vals = [0.82, 0.55, 0.9, 0.46, 0.7, 0.64];
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / vals.length - Math.PI / 2;
    return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)] as const;
  };
  const poly = (f: (i: number) => number) => vals.map((_, i) => pt(i, f(i)).map((n) => n.toFixed(1)).join(',')).join(' ');

  return (
    <div aria-hidden="true" className={`relative mx-auto aspect-square w-full max-w-md ${className}`}>

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" focusable="false">
        {[0.33, 0.66, 1].map((k) => (
          <polygon key={k} points={poly(() => k)} fill="none" stroke="rgb(var(--border))" strokeWidth="1.5" />
        ))}
        {vals.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgb(var(--border))" strokeWidth="1.5" />;
        })}
        <polygon points={poly((i) => vals[i])} fill="rgb(var(--accent) / 0.26)" stroke="rgb(var(--accent))" strokeWidth="3.5" strokeLinejoin="round" className="anim-draw" style={{ ['--len' as string]: 1000 }} />
        {vals.map((v, i) => {
          const [x, y] = pt(i, v);
          return <circle key={i} cx={x} cy={y} r="6" fill="rgb(var(--accent))" className="anim-pop" style={{ ['--d' as string]: `${1.2 + i * 0.12}s`, transformBox: 'fill-box', transformOrigin: 'center' }} />;
        })}
        <circle cx={cx} cy={cy} r="7" fill="rgb(var(--accent))" />
      </svg>

    </div>
  );
}
