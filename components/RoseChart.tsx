import { CATEGORY_SHORT, categoryTitle } from '@/lib/categories';
import { roseGeometry, type RoseItem } from '@/lib/rose';
import { formatValue } from '@/lib/engine';

export interface RoseDatum extends RoseItem {
  value: number;
  max: number;
  source: string;
}

/**
 * Круговая карта: все выбранные характеристики на одной диаграмме.
 * Лепесток = одна шкала, длина = положение на шкале теста (0–100 %), цвет = категория.
 */
export default function RoseChart({ items }: { items: RoseDatum[] }) {
  const cx = 250;
  const cy = 250;
  const r0 = 38;
  const R = 170;
  const { wedges, groups } = roseGeometry(items, cx, cy, r0, R);
  const summary = groups
    .map((g) => `${categoryTitle(g.category)}: ${g.count}`)
    .join(', ');

  return (
    <svg
      viewBox="-90 0 680 500"
      role="img"
      aria-label={`Круговая карта: ${items.length} характеристик. ${summary}. Точные значения — в таблице ниже.`}
      className="mx-auto h-auto w-full max-w-xl"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <circle key={f} cx={cx} cy={cy} r={r0 + (R - r0) * f} fill="none" className="stroke-line" strokeWidth={1} strokeDasharray={f === 1 ? undefined : '3 4'} />
      ))}
      {wedges.map((w, i) => (
        <path key={i} d={w.d} style={{ fill: `rgb(var(--c-${w.category}) / 0.85)` }} className="stroke-surface" strokeWidth={1}>
          <title>
            {`${items[i].label} (${items[i].source}): ${formatValue(items[i].value)} из ${formatValue(items[i].max)}`}
          </title>
        </path>
      ))}
      <circle cx={cx} cy={cy} r={r0 - 6} className="fill-accent-soft" />
      <text x={cx} y={cy + 5} textAnchor="middle" className="fill-ink text-[16px] font-semibold">
        {items.length}
      </text>
      {groups.map((g) => {
        const lx = cx + (R + 22) * Math.cos(g.mid);
        const ly = cy + (R + 22) * Math.sin(g.mid);
        const anchor = Math.cos(g.mid) < -0.2 ? 'end' : Math.cos(g.mid) > 0.2 ? 'start' : 'middle';
        return (
          <text key={g.category} x={lx} y={ly + 4} textAnchor={anchor} style={{ fill: `rgb(var(--c-${g.category}))` }} className="text-[13px] font-semibold">
            {CATEGORY_SHORT[g.category]}
          </text>
        );
      })}
    </svg>
  );
}
