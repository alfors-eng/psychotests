import type { CategoryId } from './types';

export interface RoseItem {
  label: string;
  percent: number;
  category: CategoryId;
}

export interface RoseWedge {
  d: string;
  category: CategoryId;
  mid: number; // угол середины сектора, рад
}

export interface RoseGroup {
  category: CategoryId;
  mid: number;
  count: number;
}

/** Геометрия круговой карты: лепесток на характеристику, длина лепестка — процент по шкале. */
export function roseGeometry(items: RoseItem[], cx: number, cy: number, r0: number, R: number) {
  const n = items.length;
  const step = (Math.PI * 2) / Math.max(n, 1);
  const gap = Math.min(0.035, step * 0.12);
  const pt = (a: number, r: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const wedges: RoseWedge[] = items.map((it, i) => {
    const a0 = -Math.PI / 2 + i * step + gap;
    const a1 = -Math.PI / 2 + (i + 1) * step - gap;
    const ro = r0 + Math.max(3, ((R - r0) * Math.max(0, Math.min(100, it.percent))) / 100);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M ${pt(a0, r0)} L ${pt(a0, ro)} A ${ro} ${ro} 0 ${large} 1 ${pt(a1, ro)} L ${pt(a1, r0)} A ${r0} ${r0} 0 ${large} 0 ${pt(a0, r0)} Z`;
    return { d, category: it.category, mid: (a0 + a1) / 2 };
  });
  const groups: RoseGroup[] = [];
  items.forEach((it, i) => {
    const last = groups[groups.length - 1];
    if (last && last.category === it.category) {
      last.count += 1;
      last.mid = (last.mid * (last.count - 1) + wedges[i].mid) / last.count;
    } else groups.push({ category: it.category, mid: wedges[i].mid, count: 1 });
  });
  return { wedges, groups, pt };
}
