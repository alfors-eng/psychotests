import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { settle } from './helpers';

// Тесты, измеряющие одни и те же черты: Big Five (50), Mini-IPIP, TIPI, плюс эмоциональные и ресурсные шкалы.
const seed = () => {
  const mk = (id: string, testId: string, answers: Record<string, number>) => ({
    id,
    testId,
    testTitle: testId,
    completedAt: new Date().toISOString(),
    answers,
  });
  const range = (p: string, n: number, f: (i: number) => number) =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [`${p}${i + 1}`, f(i)]));
  const big = Object.fromEntries(
    ['e', 'a', 'c', 'n', 'o'].flatMap((t) => Array.from({ length: 10 }, (_, i) => [`${t}${i + 1}`, 3])),
  );
  // Mini-IPIP: пункты экстраверсии ведут к максимуму (q1 и q11 прямые = 5, q6 и q16 обратные = 1)
  const mini = { ...range('q', 20, () => 3), q1: 5, q6: 1, q11: 5, q16: 1 };
  localStorage.setItem(
    'pt:history',
    JSON.stringify([
      mk('h1', 'ipip-big5-50', big),
      mk('h2', 'mini-ipip', mini),
      mk('h3', 'tipi', range('q', 10, () => 4)),
      mk('h4', 'rosenberg-self-esteem', range('q', 10, () => 2)),
      mk('h5', 'swls', range('q', 5, () => 4)),
      mk('h6', 'who-5', range('q', 5, () => 3)),
      mk('h7', 'brs', range('q', 6, () => 3)),
      mk('h8', 'gse', range('q', 10, () => 3)),
      mk('h9', 'lot-r', range('q', 10, () => 2)),
      mk('h10', 'phq-9', range('q', 9, () => 1)),
      mk('h11', 'dass-21', range('q', 21, () => 1)),
    ]),
  );
};

test('целостная картина: сводка, наложение тестов и выводы', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await expect(page.getByRole('tab', { name: 'Целостная картина' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Наложение тестов' })).toBeVisible();
  // личностные черты: радар с наложением нескольких тестов
  await expect(page.getByRole('img', { name: /Личностные черты\. Итог:/ })).toBeVisible();
  // кнопки тестов под радаром включают и выключают контуры
  const tipi = page.getByRole('button', { name: 'TIPI' }).first();
  await expect(tipi).toHaveAttribute('aria-pressed', 'true');
  await tipi.click();
  await expect(tipi).toHaveAttribute('aria-pressed', 'false');
  // расхождение Mini-IPIP и Big Five по экстраверсии попадает в выводы
  await expect(page.getByRole('heading', { name: /Тесты расходятся: экстраверсия/ })).toBeVisible();
  await expect(page.getByText(/Тест не является диагнозом/).first()).toBeVisible();
});

test('сводные таблицы: итог, разброс, детали и сортировка', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Сводные таблицы' }).click();

  const table = page.getByRole('table', { name: /Сводные показатели/ });
  const row = table.getByRole('row', { name: /Экстраверсия/ });
  await expect(row).toBeVisible();
  await expect(row.getByText('Тесты расходятся')).toBeVisible();
  await expect(row.getByText(/разброс \d+ п\. п\./)).toBeVisible();

  await row.getByRole('button', { name: /Подробнее/ }).click();
  await expect(page.getByText('Низкий итог')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Вес' })).toBeVisible();

  // скрининги выключены по умолчанию: «Сниженное настроение» без данных, пока не включим показ
  await expect(table.getByRole('row', { name: /Сниженное настроение/ })).toHaveCount(0);
  await page.getByLabel('Показывать без данных').check();
  await expect(table.getByRole('row', { name: /Сниженное настроение/ })).toBeVisible();

  // матрица тест × характеристика
  const matrix = page.getByRole('table', { name: /Положение на шкале \(в процентах\)/ });
  await expect(matrix).toBeVisible();
  await expect(matrix.getByRole('columnheader', { name: 'TIPI' })).toBeVisible();

  // сортировка полной таблицы
  const all = page.getByRole('table', { name: /Все выбранные характеристики/ });
  const pos = all.getByRole('columnheader', { name: /Положение/ });
  await pos.getByRole('button').click();
  await expect(pos).toHaveAttribute('aria-sort', 'ascending');
  await pos.getByRole('button').click();
  await expect(pos).toHaveAttribute('aria-sort', 'descending');
});

test('включение скринингов добавляет эмоциональную область и сводку', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Выбрать всё' }).click();
  await expect(page.getByRole('img', { name: /Эмоциональное состояние\. Итог:/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Сводные таблицы' }).click();
  const table = page.getByRole('table', { name: /Сводные показатели/ });
  const dep = table.getByRole('row', { name: /Сниженное настроение/ });
  await expect(dep).toBeVisible();
  // PHQ-9 и DASS-21 дают источники для одного показателя
  await expect(dep.getByText(/PHQ-9/).first()).toBeVisible();
});

test('PNG целостного профиля скачивается', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Скачать PNG' }).first().click()]);
  expect(download.suggestedFilename()).toBe('psychotests-profile.png');
});

for (const theme of ['light', 'dark'] as const) {
  for (const tab of ['Целостная картина', 'Сводные таблицы', 'Диаграммы']) {
    test(`axe: профиль, ${tab} (${theme})`, async ({ page }) => {
      await page.addInitScript(seed);
      await page.addInitScript((t) => localStorage.setItem('pt:theme', t), theme);
      await page.goto('/profile');
      await page.getByRole('button', { name: 'Выбрать всё' }).click();
      await page.getByRole('tab', { name: tab }).click();
      await settle(page);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
    });
  }
}
