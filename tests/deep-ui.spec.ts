import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { settle } from './helpers';

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
      mk('h10', 'phq-9', range('q', 9, () => 2)),
      mk('h11', 'dass-21', range('q', 21, () => 1)),
    ]),
  );
};

test('глубинный анализ: покрытие, выводы, структура и характеристики', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Глубинный анализ' }).click();
  await expect(page.getByRole('heading', { name: 'Как работает глубинный анализ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Включить скрининги' })).toBeVisible();

  // покрытие: все учтённые пункты входят в модель
  const cov = page.getByLabel('Покрытие анализа');
  await expect(cov.getByText('Пунктов вне модели').locator('xpath=following-sibling::p')).toHaveText('0');

  // расходящиеся тесты по экстраверсии → карточка с I², подробности и лес-диаграмма
  const card = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Экстраверсия', exact: true }) });
  await expect(card.getByText(/расхождение между тестами I² \d+ %/)).toBeVisible();
  await card.getByRole('button', { name: /Подробности и пункты/ }).click();
  await expect(card.getByRole('img', { name: /Оценки по тестам:/ })).toBeVisible();
  await expect(card.getByText('Пункты, подтверждающие итог')).toBeVisible();
  await expect(card.getByText('Пункты, идущие против итога')).toBeVisible();

  // метачерты и интересы/круг (круг требует агентность и коммуналность → есть E и A)
  await expect(page.getByRole('heading', { name: 'Метачерты: стабильность и пластичность' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Межличностный круг' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Тесты по-разному оценивают часть характеристик/ })).toBeVisible();

  // литература
  await expect(page.getByRole('heading', { name: 'Научная основа' })).toBeVisible();
  await expect(page.getByText(/Higher-order factors of the Big Five/).first()).toBeVisible();
});

test('включение скринингов добавляет эмоциональные измерения', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Глубинный анализ' }).click();
  // «Тревожное возбуждение» оценивается только скрининговыми шкалами
  const ar = () => page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Тревожное возбуждение и напряжение' }) });
  await expect(ar().getByText('нет данных')).toBeVisible();
  await page.getByRole('button', { name: 'Включить скрининги' }).click();
  await expect(page.getByRole('button', { name: 'Включить скрининги' })).toHaveCount(0);
  await expect(ar().getByText(/пунктов из \d+ тест/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Структура эмоционального состояния' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`axe: глубинный анализ (${theme})`, async ({ page }) => {
    await page.addInitScript(seed);
    await page.addInitScript((t) => localStorage.setItem('pt:theme', t), theme);
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Выбрать всё' }).click();
    await page.getByRole('tab', { name: 'Глубинный анализ' }).click();
    const openers = page.getByRole('button', { name: /Подробности и пункты/ });
    while ((await openers.count()) > 0) await openers.first().click();
    await settle(page);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
  });
}
