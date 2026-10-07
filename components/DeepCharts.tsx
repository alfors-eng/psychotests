import { OCTANTS, type DimEstimate } from '@/lib/deep';

/** Полоса с итогом и доверительным интервалом. */
export function CiBar({ lo, hi, theta, label }: { lo: number; hi: number; theta: number; label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${Math.round(theta)} %, интервал от ${Math.round(lo)} до ${Math.round(hi)} %`}
      className="relative h-4 w-full rounded-full bg-[rgb(var(--cat)/0.12)]"
    >
      <span aria-hidden="true" className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-[rgb(var(--cat)/0.4)]" style={{ left: `${lo}%`, width: `${Math.max(1.5, hi - lo)}%` }} />
      <span aria-hidden="true" className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" style={{ left: `${theta}%` }} />
    </div>
  );
}

/**
 * Лес-диаграмма (как в метаанализе): точки — оценки отдельных тестов с интервалами,
 * ромб — итог по всем тестам.
 */
export function ForestPlot({ d }: { d: DimEstimate }) {
  if (d.theta === null) return null;
  const rowH = 30;
  const left = 96;
  const right = 24;
  const W = 520;
  const H = (d.byTest.length + 1) * rowH + 40;
  const x = (v: number) => left + (v / 100) * (W - left - right);
  const ci = (t: DimEstimate['byTest'][number]) => {
    const e = 1.96 * Math.sqrt(t.v);
    return [Math.max(0, t.theta - e), Math.min(100, t.theta + e)] as const;
  };
  const rows = d.byTest;
  const yPooled = rows.length * rowH + 22;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Оценки по тестам: ${rows.map((t) => `${t.short} ${Math.round(t.theta)} %`).join(', ')}. Итог ${Math.round(d.theta)} % (интервал ${Math.round(d.lo!)}–${Math.round(d.hi!)}).`}
      className="h-auto w-full"
    >
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={8} y2={H - 26} className="stroke-line" strokeDasharray={v === 50 ? undefined : '3 4'} />
          <text x={x(v)} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">
            {v}
          </text>
        </g>
      ))}
      {rows.map((t, i) => {
        const [a, b] = ci(t);
        const y = 22 + i * rowH;
        return (
          <g key={t.testId} style={{ color: 'rgb(var(--cat))' }}>
            <text x={left - 10} y={y + 4} textAnchor="end" className="fill-ink text-[12px]">
              {t.short.length > 12 ? t.short.slice(0, 11) + '…' : t.short}
            </text>
            <line x1={x(a)} x2={x(b)} y1={y} y2={y} stroke="currentColor" strokeWidth={2.5} opacity={0.55} />
            <circle cx={x(t.theta)} cy={y} r={5.5} fill="currentColor" />
          </g>
        );
      })}
      <g>
        <text x={left - 10} y={yPooled + 4} textAnchor="end" className="fill-ink text-[12px] font-semibold">
          Итог
        </text>
        <polygon
          points={`${x(d.lo!)},${yPooled} ${x(d.theta)},${yPooled - 9} ${x(d.hi!)},${yPooled} ${x(d.theta)},${yPooled + 9}`}
          className="fill-accent stroke-accent"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Круг межличностных отношений Виггинса: ось X — теплота (коммуналность), ось Y — доминантность (агентность). */
export function CircumplexChart({ agency, communion, octant }: { agency: number; communion: number; octant: number | null }) {
  const cx = 160;
  const cy = 160;
  const R = 120;
  const px = cx + ((communion - 50) / 50) * R;
  const py = cy - ((agency - 50) / 50) * R;
  const wedge = (i: number) => {
    const a0 = ((i * 45 - 22.5) * Math.PI) / 180;
    const a1 = ((i * 45 + 22.5) * Math.PI) / 180;
    const p = (a: number) => `${(cx + R * Math.cos(a)).toFixed(1)} ${(cy - R * Math.sin(a)).toFixed(1)}`;
    return `M ${cx} ${cy} L ${p(a0)} A ${R} ${R} 0 0 0 ${p(a1)} Z`;
  };
  return (
    <svg
      viewBox="-30 0 380 330"
      role="img"
      aria-label={`Межличностный круг: теплота ${Math.round(communion)} %, доминантность ${Math.round(agency)} %${octant !== null ? `, сектор ${OCTANTS[octant].label}` : ''}`}
      className="mx-auto h-auto w-full max-w-sm"
    >
      {OCTANTS.map((o) => (
        <path key={o.code} d={wedge(o.index)} className={o.index === octant ? 'fill-accent/25 stroke-accent' : 'fill-none stroke-line'} strokeWidth={o.index === octant ? 2 : 1} />
      ))}
      <circle cx={cx} cy={cy} r={R} className="fill-none stroke-line" />
      <circle cx={cx} cy={cy} r={R / 2} className="fill-none stroke-line" strokeDasharray="3 4" />
      {OCTANTS.map((o) => {
        const a = (o.index * 45 * Math.PI) / 180;
        const lx = cx + (R + 16) * Math.cos(a);
        const ly = cy - (R + 16) * Math.sin(a);
        const anchor = Math.cos(a) < -0.3 ? 'end' : Math.cos(a) > 0.3 ? 'start' : 'middle';
        return (
          <text key={o.code} x={lx} y={ly + 4} textAnchor={anchor} className={`text-[11px] ${o.index === octant ? 'fill-ink font-semibold' : 'fill-muted'}`}>
            {o.code}
          </text>
        );
      })}
      <text x={cx} y={14} textAnchor="middle" className="fill-muted text-[11px]">
        доминантность ↑
      </text>
      <text x={cx + R + 20} y={cy + 28} textAnchor="end" className="fill-muted text-[11px]">
        теплота →
      </text>
      <circle cx={px} cy={py} r={8} className="fill-accent stroke-surface" strokeWidth={3} />
    </svg>
  );
}
