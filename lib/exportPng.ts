import { analyzeAnswers } from './analytics';
import { formatValue } from './engine';
import { drawRadar } from './exportRadar';
import type { Answers, ScoreResult, TestDef } from './types';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Рисует карточку результата на canvas и скачивает PNG. Всё локально, без внешних библиотек. */
export function downloadResultPng(test: TestDef, result: ScoreResult, date: string, answers?: Answers) {
  const W = 1080;
  const pad = 64;
  const inner = W - pad * 2;
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = `400 26px ${font}`;

  // Предварительный расчёт высоты.
  const radar = result.scales.length >= 3;
  const radarH = radar ? 520 : 0;
  let h = pad + 44 + 40 + 32 + radarH;
  const blocks = result.scales.map((s) => {
    const desc = s.range ? wrap(measure, s.range.description, inner) : [];
    return { s, desc };
  });
  for (const b of blocks) h += 36 + 24 + 20 + (b.s.range ? 36 : 0) + b.desc.length * 34 + 28;
  const disclaimer = wrap(measure, 'Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.', inner);
  const dist = answers ? analyzeAnswers(test, answers, result.scales).distribution : null;
  if (dist) h += 90 + dist.length * 46;
  h += 20 + disclaimer.length * 34 + pad;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#faf8f4';
  ctx.fillRect(0, 0, W, h);

  let y = pad + 36;
  ctx.fillStyle = '#262a33';
  ctx.font = `600 38px ${font}`;
  for (const l of wrap(ctx, test.title, inner)) {
    ctx.fillText(l, pad, y);
    y += 46;
  }
  ctx.fillStyle = '#626a76';
  ctx.font = `400 22px ${font}`;
  ctx.fillText(date, pad, y);
  y += 56;

  if (radar) {
    drawRadar(ctx, W / 2, y + 250, 170, result.scales, font);
    y += radarH;
  }

  for (const { s, desc } of blocks) {
    ctx.fillStyle = '#262a33';
    ctx.font = `600 26px ${font}`;
    ctx.fillText(s.title, pad, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#626a76';
    ctx.font = `400 24px ${font}`;
    ctx.fillText(`${formatValue(s.value)} / ${formatValue(s.max)}`, W - pad, y);
    ctx.textAlign = 'left';
    y += 20;
    ctx.fillStyle = '#e5f0ec';
    ctx.beginPath();
    ctx.roundRect(pad, y, inner, 18, 9);
    ctx.fill();
    ctx.fillStyle = '#426c60';
    ctx.beginPath();
    ctx.roundRect(pad, y, Math.max(18, (inner * s.percent) / 100), 18, 9);
    ctx.fill();
    y += 54;
    if (s.range) {
      ctx.fillStyle = '#262a33';
      ctx.font = `600 26px ${font}`;
      ctx.fillText(s.range.title, pad, y);
      y += 36;
      ctx.font = `400 26px ${font}`;
      ctx.fillStyle = '#626a76';
      for (const l of desc) {
        ctx.fillText(l, pad, y);
        y += 34;
      }
    }
    y += 28;
  }

  if (dist) {
    ctx.fillStyle = '#262a33';
    ctx.font = `600 28px ${font}`;
    ctx.fillText('Распределение ответов', pad, y + 10);
    y += 40;
    const maxCount = Math.max(1, ...dist.map((b) => b.count));
    for (const b of dist) {
      ctx.fillStyle = '#262a33';
      ctx.font = `400 22px ${font}`;
      ctx.fillText(b.label.length > 44 ? b.label.slice(0, 43) + '…' : b.label, pad, y + 16);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#626a76';
      ctx.fillText(`${b.count} · ${Math.round(b.percent)} %`, W - pad, y + 16);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e5f0ec';
      ctx.beginPath();
      ctx.roundRect(pad, y + 24, inner, 12, 6);
      ctx.fill();
      ctx.fillStyle = '#426c60';
      ctx.beginPath();
      ctx.roundRect(pad, y + 24, b.count ? Math.max(12, (inner * b.count) / maxCount) : 0, 12, 6);
      ctx.fill();
      y += 46;
    }
    y += 30;
  }

  ctx.fillStyle = '#626a76';
  ctx.font = `400 26px ${font}`;
  y += 4;
  for (const l of disclaimer) {
    ctx.fillText(l, pad, y);
    y += 34;
  }

  const a = document.createElement('a');
  a.download = `${test.id}-result.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}
