import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const DISCLAIMER = 'Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.';

test('карточка external-теста ведёт к вводу ответов и не показывает вопросов', async ({ page }) => {
  await page.goto('/tests/hexaco-60');
  await expect(page.getByText('Как это работает')).toBeVisible();
  await page.getByRole('link', { name: 'Ввести ответы' }).click();
  await expect(page).toHaveURL(/\/tests\/hexaco-60\/run$/);
  await expect(page.getByRole('link', { name: /Открыть HEXACO-60 на сайте авторов/ })).toHaveAttribute('href', /hexaco\.org/);
  await expect(page.getByText('Пункт 60')).toBeVisible();
});

test('HEXACO-60: ввод строкой считает шесть шкал', async ({ page }) => {
  await page.goto('/tests/hexaco-60/run');
  await page.getByLabel(/Вставьте 60 чисел/).fill(Array(60).fill(5).join(' '));
  await page.getByRole('button', { name: 'Заполнить из текста' }).click();
  await expect(page.getByText('Ответы по пунктам (60 из 60)')).toBeVisible();
  await page.getByRole('button', { name: 'Посчитать результат' }).click();
  await expect(page).toHaveURL(/\/tests\/hexaco-60\/result\?r=/);
  await expect(page.getByText(DISCLAIMER)).toBeVisible();
  await expect(page.getByText('Честность–скромность').first()).toBeVisible();
  // Все ответы «5»: у факторов с 6 обратными пунктами среднее 2,6, с 4 обратными — 3,4
  await expect(page.getByRole('meter', { name: 'Честность–скромность' })).toHaveAttribute('aria-valuenow', '2.6');
  await expect(page.getByRole('meter', { name: 'Эмоциональность' })).toHaveAttribute('aria-valuenow', '3.4');
});

test('неверное количество или значение — понятная ошибка', async ({ page }) => {
  await page.goto('/tests/aq-10/run');
  await page.getByLabel(/Вставьте 10 чисел/).fill('1 2 3');
  await page.getByRole('button', { name: 'Заполнить из текста' }).click();
  await expect(page.getByText('Найдено значений: 3, а нужно 10.')).toBeVisible();
  await page.getByLabel(/Вставьте 10 чисел/).fill('1 2 3 4 1 2 3 4 1 9');
  await page.getByRole('button', { name: 'Заполнить из текста' }).click();
  await expect(page.getByText(/Пункт 10: «9» — недопустимое значение/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Посчитать результат' })).toBeDisabled();
});

test('AQ-10: загрузка файла и результат по ключу', async ({ page }) => {
  await page.goto('/tests/aq-10/run');
  // Ключевые ответы: пункты 1, 7, 8, 10 — «согласен» (1), остальные — «не согласен» (4) → 10 баллов
  const csv = [1, 4, 4, 4, 4, 4, 1, 1, 4, 1].join(',');
  await page.locator('input[type=file]').setInputFiles({ name: 'answers.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.getByText('Ответы по пунктам (10 из 10)')).toBeVisible();
  await page.getByRole('button', { name: 'Посчитать результат' }).click();
  await expect(page.getByText('На уровне или выше порога скрининга')).toBeVisible();
  await expect(page.getByText(DISCLAIMER)).toBeVisible();
});

test('ручной выбор по пунктам (ASRS, часть A)', async ({ page }) => {
  await page.goto('/tests/asrs-v1-1/run');
  for (let i = 1; i <= 6; i++) await page.locator(`#a-q${i}`).selectOption('4');
  await page.getByRole('button', { name: 'Посчитать результат' }).click();
  await expect(page.getByText('На уровне или выше порога скрининга')).toBeVisible();
});

test('axe: страница ввода ответов', async ({ page }) => {
  await page.goto('/tests/hexaco-60/run');
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
});
