import { expect, test } from '@playwright/test';

test('название сайта: «Психотесты NoNinaaao»', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Психотесты NoNinaaao/);
  await expect(page.getByRole('link', { name: 'Психотесты NoNinaaao' }).first()).toBeVisible();
  await page.goto('/about');
  await expect(page).toHaveTitle(/· Психотесты NoNinaaao$/);
});

test('главная: раздел справочных карточек известных методик', async ({ page }) => {
  await page.goto('/');
  const section = page.getByRole('heading', { name: /Известные методики: ссылки и открытые аналоги/ });
  await expect(section).toBeVisible();
  await expect(page.getByRole('link', { name: /MMPI-2/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /BDI-II/ })).toBeVisible();
  // справочные карточки не входят в число доступных тестов
  await page.getByLabel('Поиск по тестам').fill('Бека');
  await expect(page.getByRole('link', { name: /BDI-II/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /BAI/ })).toBeVisible();
});

test('справочная карточка: ссылка на источник и открытые аналоги', async ({ page }) => {
  await page.goto('/tests/bdi-ii');
  await expect(page.getByRole('heading', { name: /Справочная карточка/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Официальный источник/ })).toHaveAttribute('href', /pearsonassessments\.com/);
  const analogs = page.getByRole('region', { name: 'Открытые аналоги на сайте' });
  await expect(analogs.getByRole('link', { name: /CES-D/ })).toBeVisible();
  await expect(analogs.getByRole('link', { name: /PHQ-9/ })).toBeVisible();
  // кнопки прохождения нет
  await expect(page.getByRole('link', { name: 'Начать' })).toHaveCount(0);
  // прохождение справочной карточки перенаправляет на описание
  await page.goto('/tests/bdi-ii/run');
  await expect(page).toHaveURL(/\/tests\/bdi-ii$/);
});

test('справочная карточка без аналога сообщает об этом', async ({ page }) => {
  await page.goto('/tests/rorschach');
  await expect(page.getByText(/Открытого аналога на сайте пока нет/)).toBeVisible();
});

test('тест с ограничениями показывает открытые аналоги (HEXACO-60)', async ({ page }) => {
  await page.goto('/tests/hexaco-60');
  await expect(page.getByRole('heading', { name: 'Другие открытые тесты по теме' })).toBeVisible();
});

test('новые тесты проходятся: CES-D и SCS-SF', async ({ page }) => {
  await page.goto('/tests/cesd/run');
  await expect(page.getByText('Вопрос 1 из 20')).toBeVisible();
  for (let i = 0; i < 20; i++) await page.keyboard.press('1');
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByText('Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.')).toBeVisible();
  await expect(page.getByText(/Ниже порога скрининга|Умеренная выраженность симптомов|Выраженные симптомы/).first()).toBeVisible();

  await page.goto('/tests/scs-sf/run');
  await expect(page.getByText('Вопрос 1 из 12')).toBeVisible();
  for (let i = 0; i < 12; i++) await page.keyboard.press('3');
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByText('Умеренное самосострадание')).toBeVisible();
});

test('кнопка остановки анимаций сохраняется', async ({ page }) => {
  await page.goto('/');
  const btn = page.getByRole('button', { name: 'Остановить анимации' });
  await btn.click();
  await expect(page.locator('html')).toHaveClass(/no-anim/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/no-anim/);
  await expect(page.getByRole('button', { name: 'Включить анимации' })).toHaveAttribute('aria-pressed', 'true');
});
