import { expect, test } from '@playwright/test';

const DISCLAIMER = 'Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.';

test('AUDIT: у вопросов свои варианты ответа, результат считается по ним', async ({ page }) => {
  await page.goto('/tests/audit/run');
  await expect(page.getByText('Вопрос 1 из 10')).toBeVisible();
  // Вопрос 1 — «Никогда … 4 и более раза в неделю» (5 вариантов)
  await expect(page.getByRole('radio')).toHaveCount(5);
  await page.keyboard.press('5');
  await expect(page.getByText('Вопрос 2 из 10')).toBeVisible();
  await expect(page.getByRole('radio', { name: /10 и более/ })).toBeVisible();
  await page.keyboard.press('5');
  for (let i = 3; i <= 8; i++) {
    await expect(page.getByText(`Вопрос ${i} из 10`)).toBeVisible();
    await page.keyboard.press('5');
  }
  // Вопросы 9 и 10 — три варианта: «Нет», «Да, но не в последний год», «Да, в течение последнего года»
  await expect(page.getByText('Вопрос 9 из 10')).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(3);
  await page.keyboard.press('3');
  await expect(page.getByText('Вопрос 10 из 10')).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(3);
  await page.keyboard.press('3');
  await page.getByRole('button', { name: 'Показать результат' }).click();

  await expect(page).toHaveURL(/\/tests\/audit\/result\?r=/);
  await expect(page.getByText(DISCLAIMER)).toBeVisible();
  // 4 + 4 + 6·4 + 4 + 4 = 40 → зона IV
  await expect(page.getByRole('heading', { name: /Зона IV/ })).toBeVisible();
});

test('AUDIT: «никогда» везде — зона I, без блока помощи', async ({ page }) => {
  await page.goto('/tests/audit/run');
  await expect(page.getByText('Вопрос 1 из 10')).toBeVisible();
  for (let i = 1; i <= 10; i++) {
    await expect(page.getByText(`Вопрос ${i} из 10`)).toBeVisible();
    await page.keyboard.press('1');
  }
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByRole('heading', { name: /Зона I:/ })).toBeVisible();
});

test('GDS-15: ответы «нет» по обратным пунктам не дают баллов', async ({ page }) => {
  await page.goto('/tests/gds-15/run');
  await expect(page.getByText('Вопрос 1 из 15')).toBeVisible();
  // «Нет» (клавиша 1) на всё: набирают только пять обратных пунктов → 5 баллов
  for (let i = 1; i <= 15; i++) {
    await expect(page.getByText(`Вопрос ${i} из 15`)).toBeVisible();
    await page.keyboard.press('1');
  }
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByRole('heading', { name: 'Возможна депрессия' })).toBeVisible();
});
