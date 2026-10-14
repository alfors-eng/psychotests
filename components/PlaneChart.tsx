import { formatValue } from '@/lib/engine';
import type { Plane } from '@/lib/types';

/** Точка на плоскости двух шкал с четырьмя квадрантами (например, ECR-R). */
export default function PlaneChart({
  plane,
  xValue,
  yValue,
  min,
  max,
}: {
  plane: Plane;
  xValue: number;
  yValue: number;
  min: number;
  max: number;
}) {
  const S = 300;
  const o = 50;
  const pos = (v: number) => ((v - min) / (max - min)) * S;
  const px = o + pos(xValue);
  const py = o + S - pos(yValue);
  const sx = o + pos(plane.split);
  const sy = o + S - pos(plane.split);
  return (
    <div className="overflow-x-auto" tabIndex={0} role="group" aria-label="Диаграмма, при необходимости прокручивается"><svg
      viewBox="0 0 400 400"
      role="img"
      aria-label={`${plane.xLabel}: ${formatValue(xValue)}, ${plane.yLabel}: ${formatValue(yValue)}`}
      className="mx-auto h-auto w-full max-w-sm min-w-[21rem]"
    >
      <rect x={o} y={o} width={S} height={S} className="fill-surface stroke-line" strokeWidth={1} />
      <line x1={sx} y1={o} x2={sx} y2={o + S} className="stroke-line" strokeDasharray="4 4" />
      <line x1={o} y1={sy} x2={o + S} y2={sy} className="stroke-line" strokeDasharray="4 4" />
      <circle cx={px} cy={py} r={9} className="fill-accent stroke-surface" strokeWidth={3} />
      <text x={o + S / 2} y={o + S + 32} textAnchor="middle" className="fill-ink text-meta">
        {plane.xLabel} →
      </text>
      <text
        x={16}
        y={o + S / 2}
        textAnchor="middle"
        transform={`rotate(-90 16 ${o + S / 2})`}
        className="fill-ink text-meta"
      >
        {plane.yLabel} →
      </text>
    </svg></div>
  );
}
