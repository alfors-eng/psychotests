import type { Page } from '@playwright/test';

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
