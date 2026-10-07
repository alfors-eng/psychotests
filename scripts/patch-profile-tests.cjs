// Одноразовый патч: старые тесты профиля теперь переключаются на вкладку «Диаграммы».
const fs = require('fs');
let s = fs.readFileSync('tests/profile.spec.ts', 'utf8');
const rep = (a, b) => {
  if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 60));
  s = s.replace(a, b);
};
rep(
  "  await page.goto('/profile');\n  // 5 шкал",
  "  await page.goto('/profile');\n  await page.getByRole('tab', { name: 'Диаграммы' }).click();\n  // 5 шкал",
);
rep(
  "  await page.goto('/profile');\n  await page.getByRole('button', { name: 'Полосы' }).click();",
  "  await page.goto('/profile');\n  await page.getByRole('tab', { name: 'Диаграммы' }).click();\n  await page.getByRole('button', { name: 'Полосы' }).click();",
);
rep(
  "  await page.reload();\n  await expect(page.getByRole('heading', { name: 'Диаграмма (2)' })).toBeVisible();",
  "  await page.reload();\n  await page.getByRole('tab', { name: 'Диаграммы' }).click();\n  await expect(page.getByRole('heading', { name: 'Диаграмма (2)' })).toBeVisible();",
);
rep(
  "    await page.goto('/profile');\n    await expect(page.getByRole('heading', { name: /Диаграмма/ })).toBeVisible();",
  "    await page.goto('/profile');\n    await expect(page.getByRole('heading', { name: /Целостная картина/ })).toBeVisible();",
);
fs.writeFileSync('tests/profile.spec.ts', s);
console.log('ok');
