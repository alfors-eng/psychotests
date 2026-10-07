// Одноразовый патч тестов глубинного анализа.
const fs = require('fs');
let s = fs.readFileSync('tests/deep-ui.spec.ts', 'utf8');
const rep = (a, b) => {
  if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 60));
  s = s.split(a).join(b);
};
rep(
  "  await expect(page.getByText('Скрининги (тревога, депрессия')).toBeVisible();\n\n  // покрытие",
  "  await expect(page.getByRole('button', { name: 'Включить скрининги' })).toBeVisible();\n\n  // покрытие",
);
rep(
  "  const dist = () => page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Общий эмоциональный дистресс' }) });\n  await expect(dist().getByText('нет данных').first()).toBeVisible();\n  await page.getByRole('button', { name: 'Включить скрининги' }).click();\n  await expect(page.getByText('Скрининги (тревога, депрессия')).toHaveCount(0);\n  await expect(dist().getByText(/пунктов из \\d+ тест/)).toBeVisible();",
  "  // «Тревожное возбуждение» оценивается только скрининговыми шкалами\n  const ar = () => page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Тревожное возбуждение и напряжение' }) });\n  await expect(ar().getByText('нет данных')).toBeVisible();\n  await page.getByRole('button', { name: 'Включить скрининги' }).click();\n  await expect(page.getByRole('button', { name: 'Включить скрининги' })).toHaveCount(0);\n  await expect(ar().getByText(/пунктов из \\d+ тест/)).toBeVisible();",
);
rep(
  "    for (const b of await page.getByRole('button', { name: /Подробности и пункты/ }).all()) await b.click();",
  "    const openers = page.getByRole('button', { name: /Подробности и пункты/ });\n    while ((await openers.count()) > 0) await openers.first().click();",
);
fs.writeFileSync('tests/deep-ui.spec.ts', s);
console.log('ok');
