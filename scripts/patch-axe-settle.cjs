// Одноразовый патч: перед проверкой доступности ждём окончания конечных анимаций (иначе контраст считается по полупрозрачным элементам).
const fs = require('fs');
fs.writeFileSync(
  'tests/helpers.ts',
  `import type { Page } from '@playwright/test';

/** Ждёт завершения конечных анимаций и переходов: бесконечные декоративные анимации не учитываются. */
export async function settle(page: Page) {
  await page.waitForFunction(
    () =>
      document.getAnimations().every((a) => {
        const iterations = a.effect?.getTiming().iterations;
        return a.playState === 'finished' || a.playState === 'idle' || iterations === Infinity;
      }),
    undefined,
    { timeout: 10_000 },
  );
}
`,
);
for (const f of fs.readdirSync('tests').filter((x) => x.endsWith('.spec.ts'))) {
  const p = 'tests/' + f;
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('new AxeBuilder')) continue;
  s = s.replace(/(\n\s*)(const|let) res = await new AxeBuilder/g, '$1await settle(page);$1$2 res = await new AxeBuilder');
  s = s.replace(/(\n\s*)res = await new AxeBuilder/g, '$1await settle(page);$1res = await new AxeBuilder');
  if (!s.includes("from './helpers'")) s = s.replace("import { expect, test } from '@playwright/test';", "import { expect, test } from '@playwright/test';\nimport { settle } from './helpers';");
  fs.writeFileSync(p, s);
  console.log('patched', f);
}
