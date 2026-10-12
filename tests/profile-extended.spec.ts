import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { classifyChange, polarity } from '../lib/trends';
import { settle } from './helpers';

// PHQ-9 дважды (15 → 8), GAD-7 выше порога (20 дней назад: период 14 дней прошёл), PC-PTSD-5 с тремя «да» без PCL-5, одна заметка.
const seed = () => {
  const day = 86_400_000;
  const mk = (id: string, testId: string, ago: number, answers: Record<string, number>, durationSec?: number) => ({
    id,
    testId,
    testTitle: testId,
    completedAt: new Date(Date.now() - ago * day).toISOString(),
    answers,
    durationSec,
  });
  const range = (p: string, n: number, f: (i: number) => number) =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [`${p}${i + 1}`, f(i)]));
  const phqFirst = range('q', 9, (i) => (i < 6 ? 2 : 1)); // 12 + 3 = 15
  const phqLast = range('q', 9, (i) => (i < 8 ? 1 : 0)); // 8, пункт 9 = 0
  localStorage.setItem(
    'pt:history',
    JSON.stringify([
      mk('h3', 'phq-9', 1, phqLast, 40),
      mk('h1', 'phq-9', 30, phqFirst, 60),
      mk('h2', 'gad-7', 20, range('q', 7, (i) => (i < 5 ? 2 : 1)), 12),
      mk('h4', 'pc-ptsd-5', 3, range('q', 5, (i) => (i < 3 ? 1 : 0))),
    ]),
  );
  localStorage.setItem('pt:notes', JSON.stringify([{ id: 'n1', date: new Date(Date.now() - 15 * day).toISOString().slice(0, 10), text: 'Начал терапию' }]));
};

test('динамика: PHQ-9 улучшился, есть заметка и сравнение пунктов', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Динамика' }).click();
  await expect(page.getByRole('combobox', { name: 'Тест' })).toContainText('PHQ-9');
  await expect(page.getByRole('img', { name: /График результатов/ })).toBeVisible();
  // 15 → 8: изменение −7, порог PHQ-9 = 5
  await expect(page.getByText('Улучшение').first()).toBeVisible();
  await expect(page.getByText(/Löwe/).first()).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Начал терапию' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Что изменилось в ответах' })).toBeVisible();
  // новая заметка
  await page.getByLabel('Что произошло').fill('Сменил работу');
  await page.getByRole('button', { name: 'Добавить' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Сменил работу' })).toBeVisible();
  await page.getByRole('button', { name: /Удалить заметку: Сменил работу/ }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Сменил работу' })).toHaveCount(0);
});

test('скрининги: порог GAD-7 и PC-PTSD-5, рекомендация PCL-5, план повторов', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Скрининги и шаги' }).click();
  await expect(page.getByRole('heading', { name: /Достигнут порог скрининга \(2\)/ })).toBeVisible();
  await expect(page.getByText('Подробно о последствиях травмы')).toBeVisible();
  await expect(page.getByRole('link', { name: 'PCL-5' }).first()).toBeVisible();
  const retest = page.getByRole('table', { name: 'План повторных прохождений' });
  await expect(retest).toBeVisible();
  await expect(retest.getByText('Можно сейчас').first()).toBeVisible(); // GAD-7 пройден 20 дней назад, период теста 14 дней
});

test('отчёт: таблица, CSV и JSON скачиваются', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Отчёт и данные' }).click();
  await expect(page.getByRole('heading', { name: 'Сводка результатов для специалиста' })).toBeVisible();
  const table = page.getByRole('table', { name: 'Последние результаты по каждому тесту' });
  await expect(table.getByText(/PHQ-9/).first()).toBeVisible();
  await expect(table.getByText('достигнут порог скрининга').first()).toBeVisible();
  const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Таблица CSV' }).click()]);
  expect(csv.suggestedFilename()).toMatch(/^psychotests-report-.*\.csv$/);
  const [json] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Сохранить все данные/ }).click()]);
  expect(json.suggestedFilename()).toMatch(/^psychotests-backup-.*\.json$/);
});

test('время прохождения сохраняется и показывается в аналитике ответов', async ({ page }) => {
  await page.goto('/tests/who-5/run');
  await expect(page.getByText('Вопрос 1 из 5')).toBeVisible();
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(`Вопрос ${i} из 5`)).toBeVisible();
    await page.keyboard.press('3');
  }
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByText(/Время прохождения:/)).toBeVisible();
  // 5 ответов подряд за доли секунды: быстрее двух секунд на пункт
  await expect(page.getByText(/меньше 2 с на пункт/)).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  for (const tab of ['Динамика', 'Скрининги и шаги', 'Отчёт и данные']) {
    test(`axe: профиль, ${tab} (${theme})`, async ({ page }) => {
      await page.addInitScript(seed);
      await page.addInitScript((t) => localStorage.setItem('pt:theme', t), theme);
      await page.goto('/profile');
      await page.getByRole('tab', { name: tab }).click();
      await settle(page);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
    });
  }
}

test.describe('логика динамики', () => {
  const s = (id: string, min: number, max: number) => ({ id, min, max });
  test('PHQ-9: порог 5 баллов; направление «лучше» — вниз', () => {
    expect(classifyChange('phq-9', s('total', 0, 27), 15, 8).kind).toBe('better');
    expect(classifyChange('phq-9', s('total', 0, 27), 8, 13).kind).toBe('worse');
    expect(classifyChange('phq-9', s('total', 0, 27), 8, 12).kind).toBe('stable');
  });
  test('WHO-5: 10 процентных пунктов = 2,5 балла, лучше — вверх', () => {
    expect(classifyChange('who-5', s('total', 0, 25), 10, 13).kind).toBe('better');
    expect(classifyChange('who-5', s('total', 0, 25), 10, 12).kind).toBe('stable');
  });
  test('PCL-5: 10 баллов — клинически значимое изменение', () => {
    const c = classifyChange('pcl-5', s('total', 0, 80), 50, 38);
    expect(c.kind).toBe('better');
    expect(c.strong).toBe(true);
    expect(classifyChange('pcl-5', s('total', 0, 80), 50, 44).strong).toBe(false);
  });
  test('черты личности: изменение без оценки «лучше/хуже», порог 10 % диапазона', () => {
    expect(classifyChange('ipip-big5-50', s('E', 10, 50), 20, 30).kind).toBe('changed');
    expect(classifyChange('ipip-big5-50', s('E', 10, 50), 20, 23).kind).toBe('stable');
  });
  test('SPANE: отрицательные переживания — вниз, положительные — вверх', () => {
    expect(polarity('spane', 'N')).toBe('down');
    expect(polarity('spane', 'P')).toBe('up');
  });
});
