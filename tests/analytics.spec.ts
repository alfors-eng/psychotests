import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { settle } from './helpers';

const DISCLAIMER = 'Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.';

test('PHQ-9: после прохождения показана аналитика с графиками', async ({ page }) => {
  await page.goto('/tests/phq-9/run');
  await expect(page.getByText('Вопрос 1 из 9')).toBeVisible();
  // ответы: 1,2,3,4,1,2,3,4,1 → есть разные варианты
  for (const k of ['1', '2', '3', '4', '1', '2', '3', '4', '1']) await page.keyboard.press(k);
  await page.getByRole('button', { name: 'Показать результат' }).click();

  await expect(page.getByText(DISCLAIMER)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Аналитика ваших ответов' })).toBeVisible();

  // 1) распределение: «Совсем нет» выбрано 3 раза из 9
  const dist = page.getByRole('list', { name: 'Сколько раз выбран каждый вариант ответа' });
  await expect(dist).toBeVisible();
  await expect(dist.getByText('3 · 33 %').first()).toBeVisible();

  // 2) график по ходу теста
  await expect(page.getByRole('img', { name: /График ответов по ходу теста: 9 пунктов/ })).toBeVisible();

  // 3) вклад пунктов: 9 полос, переключение порядка
  await expect(page.getByRole('meter', { name: /Пункт \d+: вклад в шкалу/ })).toHaveCount(9);
  await page.getByRole('button', { name: 'По вкладу' }).click();
  await expect(page.getByRole('button', { name: 'По вкладу' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/Чаще всего вы выбирали вариант/)).toBeVisible();
});

test('одинаковые ответы: предупреждение о возможной неточности', async ({ page }) => {
  await page.goto('/tests/gad-7/run');
  await expect(page.getByText('Вопрос 1 из 7')).toBeVisible();
  for (let i = 0; i < 7; i++) await page.keyboard.press('2');
  await page.getByRole('button', { name: 'Показать результат' }).click();
  await expect(page.getByText(/Все ответы одинаковы/)).toBeVisible();
});

test('длинный тест (RIASEC): матрица вклада пунктов и тёмная тема без нарушений доступности', async ({ page }) => {
  await page.addInitScript(() => {
    const keys = ['r', 'i', 'a', 's', 'e', 'c'].flatMap((t) => Array.from({ length: 10 }, (_, i) => `${t}${i + 1}`));
    localStorage.setItem(
      'pt:history',
      JSON.stringify([
        {
          id: 'h1',
          testId: 'riasec',
          testTitle: 'RIASEC',
          completedAt: new Date().toISOString(),
          answers: Object.fromEntries(keys.map((k, i) => [k, i % 3 === 0 ? 1 : 0])),
        },
      ]),
    );
    localStorage.setItem('pt:theme', 'dark');
  });
  await page.goto('/tests/riasec/result?r=h1');
  await expect(page.getByRole('heading', { name: 'Аналитика ваших ответов' })).toBeVisible();
  const matrix = page.getByRole('list', { name: /Вклад каждого пункта/ });
  await expect(matrix.first()).toBeVisible();
  await expect(matrix.first().getByRole('listitem')).toHaveCount(10);
  await settle(page);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
});

test('режим ввода ответов (AQ-10): аналитика тоже показывается', async ({ page }) => {
  await page.goto('/tests/aq-10/run');
  await page.getByLabel(/Вставьте 10 чисел/).fill('1 4 4 4 4 4 1 1 4 1');
  await page.getByRole('button', { name: 'Заполнить из текста' }).click();
  await page.getByRole('button', { name: 'Посчитать результат' }).click();
  await expect(page.getByRole('heading', { name: 'Аналитика ваших ответов' })).toBeVisible();
  await expect(page.getByRole('meter', { name: /Пункт \d+: вклад в шкалу/ })).toHaveCount(10);
});

// ---- Все готовые тесты: на странице результата есть аналитика и нет ошибок в консоли ----
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'data', 'tests');
const ready = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
  .filter((t) => t.status !== 'draft' && t.status !== 'reference');

for (const t of ready) {
  test(`аналитика на результате: ${t.id}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const values: number[] = t.scale.options.map((o: { value: number }) => o.value);
    // разнообразные ответы: по кругу по вариантам шкалы
    const answers = Object.fromEntries(t.questions.map((q: { id: string }, i: number) => [q.id, values[i % values.length]]));
    await page.addInitScript(
      ([id, title, ans]) => {
        localStorage.setItem('pt:history', JSON.stringify([{ id: 'h1', testId: id, testTitle: title, completedAt: new Date().toISOString(), answers: ans }]));
      },
      [t.id, t.title, answers] as const,
    );
    await page.goto(`/tests/${t.id}/result?r=h1`);
    await expect(page.getByText(DISCLAIMER)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Аналитика ваших ответов' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Сколько раз выбран каждый вариант ответа' }).getByRole('listitem')).toHaveCount(values.length);
    if (t.questions.length > 1) await expect(page.getByRole('img', { name: /График ответов по ходу теста/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('PNG результата скачивается (с графиком распределения ответов)', async ({ page }) => {
  await page.goto('/tests/swls/run');
  await expect(page.getByText('Вопрос 1 из 5')).toBeVisible();
  for (const k of ['7', '5', '6', '4', '7']) await page.keyboard.press(k);
  await page.getByRole('button', { name: 'Показать результат' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Скачать PNG' }).click()]);
  expect(download.suggestedFilename()).toBe('swls-result.png');
  const p = await download.path();
  expect(fs.statSync(p!).size).toBeGreaterThan(20_000);
});
