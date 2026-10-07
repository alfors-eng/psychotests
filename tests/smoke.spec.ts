import { expect, test } from '@playwright/test';

const DISCLAIMER = 'Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.';

test('каталог: поиск и категории', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Психологические тесты');
  await page.getByLabel('Поиск по тестам').fill('тревога');
  await expect(page.getByRole('link', { name: /GAD-7/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Розенберг/ })).toHaveCount(0);
});

test('PHQ-9: ответ на 9-й вопрос всегда показывает блок экстренной помощи', async ({ page }) => {
  await page.goto('/tests/phq-9/run');
  await expect(page.getByText('Вопрос 1 из 9')).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('1'); // «Совсем нет»
    await expect(page.getByText(`Вопрос ${i + 2} из 9`)).toBeVisible();
  }
  await page.keyboard.press('2'); // 9-й вопрос: «В течение нескольких дней»
  await page.getByRole('button', { name: 'Показать результат' }).click();

  await expect(page).toHaveURL(/\/tests\/phq-9\/result\?r=/);
  await expect(page.getByText(DISCLAIMER)).toBeVisible();
  await expect(page.getByRole('heading', { name: /не нужно справляться/ })).toBeVisible();
  await expect(page.getByText('112', { exact: true })).toBeVisible();
  await expect(page.getByText('Минимальные симптомы')).toBeVisible();
});

test('PHQ-9: нулевые ответы не показывают блок помощи', async ({ page }) => {
  await page.goto('/tests/phq-9/run');
  await expect(page.getByText('Вопрос 1 из 9')).toBeVisible();
  for (let i = 0; i < 9; i++) await page.keyboard.press('1');
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByText(DISCLAIMER)).toBeVisible();
  await expect(page.getByRole('heading', { name: /специалистом|справляться/ })).toHaveCount(0);
});

test('прогресс сохраняется при перезагрузке', async ({ page }) => {
  await page.goto('/tests/rosenberg-self-esteem/run');
  await expect(page.getByText('Вопрос 1 из 10')).toBeVisible();
  await page.keyboard.press('3');
  await expect(page.getByText('Вопрос 2 из 10')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Вопрос 2 из 10')).toBeVisible();
});

test('история: результат попадает в «Мои результаты» и удаляется', async ({ page }) => {
  await page.goto('/tests/swls/run');
  await expect(page.getByText('Вопрос 1 из 5')).toBeVisible();
  for (let i = 0; i < 5; i++) await page.keyboard.press('7');
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByText(DISCLAIMER)).toBeVisible();
  await page.goto('/results');
  await expect(page.getByText(/Шкала удовлетворённости жизнью/)).toBeVisible();
  await page.getByRole('button', { name: /^Удалить результат/ }).click();
  await expect(page.getByText('Пока нет сохранённых результатов.')).toBeVisible();
});

test('тёмная тема переключается и запоминается', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Включить тёмную тему' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('заготовка теста не запускается', async ({ page }) => {
  await page.goto('/tests/teique-sf/run');
  await expect(page).toHaveURL(/\/tests\/teique-sf$/);
  await expect(page.getByRole('heading', { name: /Справочная карточка/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Официальный источник/ })).toBeVisible();
});
