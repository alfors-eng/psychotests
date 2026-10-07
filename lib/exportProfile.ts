import { CATEGORY_SHORT } from './categories';
import { drawRadar } from './exportRadar';
import { roseGeometry } from './rose';
import { formatValue } from './engine';
import type { CategoryId, ScoreResult } from './types';

const COLORS: Record<CategoryId, string> = {
  personality: '#705fa8',
  emotional: '#b05c60',
  wellbeing: '#c48a1c',
  relationships: '#b85480',
  eq: '#28768e',
  career: '#3864aa',
  neurodiversity: '#4c843c',
  values: '#965830',
};

export interface ExportItem {
  label: string;
  sub: string;
  percent: number;
  value: number;
  max: number;
  category: CategoryId;
}

/** Рисует профиль (радар или полосы) на canvas и скачивает PNG. Всё локально. */
export function downloadProfilePng(items: ExportItem[], view: 'radar' | 'map' | 'bars', date: string) {
  const W = 1080;
  const pad = 64;
  const inner = W - pad * 2;
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const radar = view === 'radar';
  const map = view === 'map';
  const rowH = 64;
  const bodyH = radar || map ? 720 : items.length * rowH + 20;
  const H = pad + 120 + bodyH + 130;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#faf8f4';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#262a33';
  ctx.font = `600 40px ${font}`;
  ctx.fillText('Мой психологический профиль', pad, pad + 40);
  ctx.fillStyle = '#626a76';
  ctx.font = `400 22px ${font}`;
  ctx.fillText(`${date} · характеристик: ${items.length}`, pad, pad + 78);

  let y = pad + 120;
  if (map) {
    const { wedges, groups } = roseGeometry(items, W / 2, y + 340, 56, 250);
    ctx.strokeStyle = '#e2ded6';
    ctx.lineWidth = 2;
    for (const f of [0.25, 0.5, 0.75, 1]) {
      ctx.beginPath();
      ctx.arc(W / 2, y + 340, 56 + (250 - 56) * f, 0, Math.PI * 2);
      ctx.stroke();
    }
    wedges.forEach((w) => {
      ctx.fillStyle = COLORS[w.category];
      ctx.globalAlpha = 0.88;
      ctx.fill(new Path2D(w.d));
    });
    ctx.globalAlpha = 1;
    ctx.font = `600 22px ${font}`;
    for (const g of groups) {
      const lx = W / 2 + 276 * Math.cos(g.mid);
      const ly = y + 340 + 276 * Math.sin(g.mid);
      ctx.fillStyle = COLORS[g.category];
      ctx.textAlign = Math.cos(g.mid) < -0.2 ? 'right' : Math.cos(g.mid) > 0.2 ? 'left' : 'center';
      ctx.fillText(CATEGORY_SHORT[g.category], lx, ly + 6);
    }
    ctx.textAlign = 'left';
    y += bodyH;
  } else if (radar) {
    const scales = items.map((i) => ({ title: i.label, percent: i.percent })) as unknown as ScoreResult['scales'];
    drawRadar(ctx, W / 2, y + 290, 200, scales, font);
    y += bodyH;
  } else {
    for (const it of items) {
      ctx.fillStyle = '#262a33';
      ctx.font = `600 24px ${font}`;
      ctx.fillText(it.label.length > 46 ? it.label.slice(0, 45) + '…' : it.label, pad, y + 20);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#626a76';
      ctx.font = `400 22px ${font}`;
      ctx.fillText(`${formatValue(it.value)} / ${formatValue(it.max)}`, W - pad, y + 20);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e5e1d8';
      ctx.beginPath();
      ctx.roundRect(pad, y + 30, inner, 14, 7);
      ctx.fill();
      ctx.fillStyle = COLORS[it.category];
      ctx.beginPath();
      ctx.roundRect(pad, y + 30, Math.max(14, (inner * it.percent) / 100), 14, 7);
      ctx.fill();
      y += rowH;
    }
    y += 20;
  }

  ctx.fillStyle = '#626a76';
  ctx.font = `400 22px ${font}`;
  ctx.fillText('Длина полосы — положение на шкале каждого теста, а не норма и не сравнение между тестами.', pad, y + 30);
  ctx.fillText('Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.', pad, y + 62);

  const a = document.createElement('a');
  a.download = 'psychotests-profile.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}
