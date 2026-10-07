import type { ScoreResult } from './types';

/** Рисует радар на canvas (для PNG-карточки результата). */
export function drawRadar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  scales: ScoreResult['scales'],
  font: string,
) {
  const n = scales.length;
  const pt = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = (f: (i: number) => number) => {
    ctx.beginPath();
    scales.forEach((_, i) => {
      const [x, y] = pt(i, R * f(i));
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
  };
  ctx.strokeStyle = '#e2ded6';
  ctx.lineWidth = 2;
  for (const f of [0.25, 0.5, 0.75, 1]) {
    poly(() => f);
    ctx.stroke();
  }
  scales.forEach((_, i) => {
    const [x, y] = pt(i, R);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
  poly((i) => scales[i].percent / 100);
  ctx.fillStyle = 'rgba(66,108,96,0.25)';
  ctx.fill();
  ctx.strokeStyle = '#426c60';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#262a33';
  ctx.font = `400 22px ${font}`;
  scales.forEach((s, i) => {
    const [x, y] = pt(i, R + 28);
    ctx.textAlign = x < cx - 8 ? 'right' : x > cx + 8 ? 'left' : 'center';
    const label = s.title.replace(/\s*\(.*\)$/, '');
    ctx.fillText(label.length > 22 ? label.slice(0, 21) + '…' : label, x, y + 6);
  });
  ctx.textAlign = 'left';
}
