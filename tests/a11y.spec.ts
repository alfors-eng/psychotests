import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['/', '/tests/phq-9', '/tests/hexaco-60', '/about', '/contribute', '/results'];

for (const theme of ['light', 'dark'] as const) {
  for (const path of pages) {
    test(`axe: ${path} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('pt:theme', t), theme);
      await page.goto(path);
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^(?!.*dark)/);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
    });
  }
}

test('axe: прохождение и результат (тёмная тема)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pt:theme', 'dark'));
  await page.goto('/tests/phq-9/run');
  let res = await new AxeBuilder({ page }).analyze();
  expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
  await expect(page.getByText('Вопрос 1 из 9')).toBeVisible();
  for (let i = 0; i < 8; i++) await page.keyboard.press('1');
  await page.keyboard.press('2');
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByRole('heading', { name: /не нужно справляться/ })).toBeVisible();
  res = await new AxeBuilder({ page }).analyze();
  expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
});
