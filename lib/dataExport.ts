import { formatValue } from './engine';
import { formatDay } from './format';
import { formatDuration } from './quality';
import { classifyChange, CHANGE_LABEL, type TestSeries } from './trends';
import type { Note } from './types';

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
const num = (n: number) => formatValue(n).replace('.', ',');

/** CSV для Excel (разделитель «;», кодировка UTF-8 с BOM): одна строка — одна шкала одного прохождения. */
export function buildCsv(series: TestSeries[]): string {
  const rows: string[] = [['Дата', 'Тест', 'Шкала', 'Балл', 'Минимум', 'Максимум', 'Положение на шкале, %', 'Уровень', 'Время, с'].join(';')];
  for (const s of series) {
    for (const p of s.points) {
      for (const sc of p.scales) {
        rows.push(
          [
            q(p.entry.completedAt.slice(0, 19).replace('T', ' ')),
            q(s.test.title),
            q(sc.id === 'total' ? s.test.scoring.totalTitle ?? 'Общий балл' : sc.title),
            num(sc.value),
            num(sc.min),
            num(sc.max),
            Math.round(sc.percent).toString(),
            q(sc.range?.title ?? ''),
            p.entry.durationSec?.toString() ?? '',
          ].join(';'),
        );
      }
    }
  }
  return '﻿' + rows.join('\r\n') + '\r\n';
}

/** Краткое текстовое резюме для письма или чата. */
export function buildSummaryText(series: TestSeries[], notes: Note[]): string {
  const lines: string[] = ['Сводка результатов (Психотесты NoNinaaao). Это не диагноз.', ''];
  for (const s of series) {
    const last = s.points[s.points.length - 1];
    const prev = s.points.length > 1 ? s.points[s.points.length - 2] : null;
    for (const sc of last.scales) {
      const label = sc.id === 'total' ? s.test.title : `${s.test.title} — ${sc.title}`;
      let line = `${label}: ${formatValue(sc.value)} из ${formatValue(sc.max)}${sc.range ? ` (${sc.range.title})` : ''}, ${formatDay(last.entry.completedAt)}`;
      const before = prev?.scales.find((x) => x.id === sc.id);
      if (before) {
        const ch = classifyChange(s.test.id, sc, before.value, sc.value);
        line += `; с ${formatDay(prev!.entry.completedAt)}: ${CHANGE_LABEL[ch.kind].toLowerCase()} (${ch.delta > 0 ? '+' : ch.delta < 0 ? '−' : ''}${formatValue(Math.abs(ch.delta))})`;
      }
      if (last.entry.durationSec !== undefined) line += `; время ${formatDuration(last.entry.durationSec)}`;
      lines.push(line);
    }
  }
  if (notes.length) {
    lines.push('', 'Заметки:');
    for (const n of notes) lines.push(`${formatDay(n.date)}: ${n.text}`);
  }
  return lines.join('\n');
}

export function downloadText(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
