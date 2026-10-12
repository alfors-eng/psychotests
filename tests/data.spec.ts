import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { decryptTransfer, encryptTransfer, extractToken, TransferError } from '../lib/transfer';
import { settle } from './helpers';

const seed = () => {
  const day = 86_400_000;
  const mk = (id: string, testId: string, ago: number, answers: Record<string, number>) => ({
    id,
    testId,
    testTitle: testId === 'who-5' ? 'WHO-5 — Индекс благополучия' : testId,
    completedAt: new Date(Date.now() - ago * day).toISOString(),
    answers,
  });
  const range = (p: string, n: number, v: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`${p}${i + 1}`, v]));
  localStorage.setItem('pt:history', JSON.stringify([mk('s2', 'who-5', 1, range('q', 5, 3)), mk('s1', 'who-5', 20, range('q', 5, 2))]));
};

test.describe('шифрование переноса', () => {
  const data = { app: 'psychotests', version: 2, entries: [{ id: 'a', testId: 'phq-9', answers: { q1: 1 } }], notes: [] };

  test('круговой обмен, неверный пароль и поврежденная ссылка', async () => {
    const token = await encryptTransfer(data, 'правильный пароль');
    expect(token.startsWith('v1.')).toBe(true);
    expect(token).not.toContain('phq-9');
    expect(await decryptTransfer(token, 'правильный пароль')).toEqual(data);
    await expect(decryptTransfer(token, 'другой пароль')).rejects.toMatchObject({ code: 'bad-passphrase' });
    await expect(decryptTransfer(token.slice(0, 40), 'правильный пароль')).rejects.toBeInstanceOf(TransferError);
    await expect(decryptTransfer('xyz', 'x')).rejects.toMatchObject({ code: 'bad-format' });
  });

  test('токен находится в ссылке и во фрагменте', async () => {
    const token = await encryptTransfer(data, 'пароль-12345');
    expect(extractToken(`https://example.org/data#${token}`)).toBe(token);
    expect(extractToken(`#${token}`)).toBe(token);
    expect(extractToken(`  ${token}\n`)).toBe(token);
    expect(extractToken('https://example.org/data')).toBeNull();
  });

  test('одинаковые данные дают разные токены (случайные соль и вектор)', async () => {
    const a = await encryptTransfer(data, 'пароль-12345');
    const b = await encryptTransfer(data, 'пароль-12345');
    expect(a).not.toBe(b);
  });
});

test('перенос: ссылка с первого устройства открывается на втором и добавляет результаты', async ({ page, browser }) => {
  await page.addInitScript(seed);
  await page.goto('/data');
  await page.getByLabel(/Придумайте пароль/).fill('мой секретный пароль');
  await page.getByLabel('Повторите пароль').fill('мой секретный пароль');
  await page.getByRole('button', { name: 'Создать ссылку' }).click();
  const link = await page.getByLabel('Ссылка для переноса').inputValue();
  expect(link).toContain('/data#v1.');
  await expect(page.getByRole('img', { name: /QR-код/ })).toBeVisible();

  // второе устройство: чистый контекст без данных
  const ctx = await browser.newContext();
  const page2 = await ctx.newPage();
  await page2.goto(link);
  await expect(page2.getByRole('heading', { name: 'Получить данные по ссылке' })).toBeVisible();
  await page2.getByLabel(/Пароль, который вы задали/).fill('не тот пароль');
  await page2.getByRole('button', { name: 'Расшифровать и добавить' }).click();
  await expect(page2.locator('p[role=alert]')).toContainText('Неверный пароль');
  await page2.getByLabel(/Пароль, который вы задали/).fill('мой секретный пароль');
  await page2.getByRole('button', { name: 'Расшифровать и добавить' }).click();
  await expect(page2.getByText('Добавлено результатов: 2.')).toBeVisible();
  await page2.goto('/results');
  await expect(page2.getByRole('link', { name: 'Открыть' })).toHaveCount(2);
  await ctx.close();
});

test('перенос: короткий пароль и несовпадение паролей не принимаются', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/data');
  await page.getByLabel(/Придумайте пароль/).fill('abc');
  await page.getByLabel('Повторите пароль').fill('abc');
  await page.getByRole('button', { name: 'Создать ссылку' }).click();
  await expect(page.locator('p[role=alert]')).toContainText('не короче 8');
  await page.getByLabel(/Придумайте пароль/).fill('длинный пароль 1');
  await page.getByLabel('Повторите пароль').fill('длинный пароль 2');
  await page.getByRole('button', { name: 'Создать ссылку' }).click();
  await expect(page.locator('p[role=alert]')).toContainText('не совпадают');
});

test('напоминание о резервной копии: показывается, откладывается и исчезает после сохранения', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/results');
  const banner = page.getByRole('complementary', { name: 'Резервная копия' });
  await expect(banner).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Сохранить в файл' }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Открыть' }).first()).toBeVisible();
  await expect(banner).toHaveCount(0);
});

test('запасная копия: данные восстанавливаются из IndexedDB, если пропало основное хранилище', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(seed);
  await page.goto('/results'); // DataGuard записывает копию в IndexedDB
  await expect(page.getByRole('link', { name: 'Открыть' })).toHaveCount(2);
  await page.waitForTimeout(500);
  await page.evaluate(() => localStorage.removeItem('pt:history'));
  await page.reload(); // восстановление и автоматическая перезагрузка
  await expect(page.getByRole('link', { name: 'Открыть' })).toHaveCount(2, { timeout: 10_000 });
  await expect(page.getByText(/восстановили результаты/)).toBeVisible();
});

test('удалённые результаты не воскресают из запасной копии', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(seed);
  await page.goto('/results');
  await expect(page.getByRole('link', { name: 'Открыть' })).toHaveCount(2);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Удалить всё' }).click();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByText('Пока нет сохранённых результатов.')).toBeVisible();
});

test('манифест приложения и значки доступны', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('Психотесты NoNinaaao');
  expect(m.display).toBe('standalone');
  for (const icon of m.icons) expect((await request.get(icon.src)).ok()).toBe(true);
});

test('страница «Конфиденциальность» на месте', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Конфиденциальность и данные' })).toBeVisible();
  await expect(page.getByText('Не использует аналитику, рекламу, трекеры и cookie.')).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  for (const path of ['/data', '/privacy']) {
    test(`axe: ${path} (${theme})`, async ({ page }) => {
      await page.addInitScript(seed);
      await page.addInitScript((t) => localStorage.setItem('pt:theme', t), theme);
      await page.goto(path);
      await settle(page);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(res.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
    });
  }
}

for (const path of ['/data', '/privacy', '/results', '/profile']) {
  test(`без ошибок в консоли: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.addInitScript(seed);
    await page.goto(path);
    await settle(page);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
}
