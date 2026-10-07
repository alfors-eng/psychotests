import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const seed = () => {
  const mk = (id: string, testId: string, title: string, keys: string[], v: number) => ({
    id,
    testId,
    testTitle: title,
    completedAt: new Date().toISOString(),
    answers: Object.fromEntries(keys.map((k) => [k, v])),
  });
  const big = ['e', 'a', 'c', 'n', 'o'].flatMap((t) => Array.from({ length: 10 }, (_, i) => `${t}${i + 1}`));
  const q = (n: number) => Array.from({ length: n }, (_, i) => `q${i + 1}`);
  localStorage.setItem(
    'pt:history',
    JSON.stringify([
      mk('h1', 'ipip-big5-50', 'Большая пятёрка (IPIP, 50 вопросов)', big, 3),
      mk('h2', 'rosenberg-self-esteem', 'Шкала самооценки Розенберга', q(10), 2),
      mk('h3', 'swls', 'Шкала удовлетворённости жизнью (SWLS)', q(5), 4),
      mk('h4', 'phq-9', 'PHQ-9', q(9), 1),
    ]),
  );
};

test('пустой профиль предлагает пройти тест', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Профиль пока пуст' })).toBeVisible();
});

test('профиль: радар из выбранных характеристик, скрининги по умолчанию выключены', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Диаграммы' }).click();
  // 5 шкал Big Five + самооценка + удовлетворённость жизнью = 7 (PHQ-9 — скрининг, выключен)
  await expect(page.getByRole('heading', { name: 'Диаграмма (7)' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Круговая карта: 7 характеристик/ })).toBeVisible();
  await page.getByRole('button', { name: 'Радар' }).click();
  await expect(page.getByRole('img', { name: /Радарная диаграмма/ })).toBeVisible();
  const phq = page.getByRole('checkbox', { name: /Выраженность депрессивных симптомов/ });
  await expect(phq).not.toBeChecked();

  await phq.check();
  await expect(page.getByRole('heading', { name: 'Диаграмма (8)' })).toBeVisible();

  // Сбросить → пустая диаграмма; выбрать две → радар недоступен, показаны полосы
  await page.getByRole('button', { name: 'Сбросить' }).click();
  await expect(page.getByText('Отметьте характеристики справа')).toBeVisible();
  await page.getByRole('checkbox', { name: /Экстраверсия/ }).check();
  await page.getByRole('checkbox', { name: /Самооценка/ }).check();
  await expect(page.getByText(/Для радара выберите минимум 3/)).toBeVisible();
  await expect(page.getByRole('meter', { name: /Экстраверсия/ })).toBeVisible();

  // Выбор сохраняется после перезагрузки
  await page.reload();
  await page.getByRole('tab', { name: 'Диаграммы' }).click();
  await expect(page.getByRole('heading', { name: 'Диаграмма (2)' })).toBeVisible();
});

test('профиль: полосы по категориям, таблица и скачивание PNG', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Диаграммы' }).click();
  await page.getByRole('button', { name: 'Полосы' }).click();
  await expect(page.getByRole('meter', { name: /Экстраверсия/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Сводные таблицы' }).click();
  await expect(page.getByRole('table', { name: /Все выбранные характеристики/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Диаграммы' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Скачать PNG' }).click()]);
  expect(download.suggestedFilename()).toBe('psychotests-profile.png');
});

for (const theme of ['light', 'dark'] as const) {
  test(`axe: профиль (${theme})`, async ({ page }) => {
    await page.addInitScript(seed);
    await page.addInitScript((t) => localStorage.setItem('pt:theme', t), theme);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /Целостная картина/ })).toBeVisible();
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
  });
}
