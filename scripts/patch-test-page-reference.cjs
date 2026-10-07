// Одноразовый патч страницы теста: справочные карточки и открытые аналоги.
const fs = require('fs');
const file = 'app/tests/[id]/page.tsx';
let s = fs.readFileSync(file, 'utf8');
const rep = (a, b) => {
  if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70));
  s = s.replace(a, b);
};

rep("import { getAllTests, getTest, isReady } from '@/lib/tests';", "import { getAllTests, getTest, isReady, isReference } from '@/lib/tests';");
rep(
  "  const ready = isReady(t);\n\n  const facts: [string, string][] = [\n    ['Время', `≈ ${t.duration} мин`],\n    ['Вопросов', `${t.questionCount}`],\n    ['Автор', t.author],\n    ['Год', `${t.year}`],\n  ];",
  `  const ready = isReady(t);
  const ref = isReference(t);
  const analogs = (t.analogs ?? [])
    .map((id) => getTest(id))
    .filter((x): x is NonNullable<typeof x> => !!x && isReady(x));

  const facts: [string, string][] = ref
    ? [
        ['Пунктов в оригинале', \`\${t.questionCount}\`],
        ['Автор', t.author],
        ['Год', \`\${t.year}\`],
        ['Доступ', 'по лицензии'],
      ]
    : [
        ['Время', \`≈ \${t.duration} мин\`],
        ['Вопросов', \`\${t.questionCount}\`],
        ['Автор', t.author],
        ['Год', \`\${t.year}\`],
      ];`,
);
rep(
  "      ) : (\n        <div className=\"card border-warm bg-warm-soft\" role=\"note\">",
  `      ) : ref ? (
        <section className="card space-y-4 border-warm bg-warm-soft" aria-labelledby="ref-title">
          <h2 id="ref-title" className="text-lg font-semibold">
            Справочная карточка: методика недоступна для прохождения на сайте
          </h2>
          <p className="text-[15px]">{t.restriction}</p>
          <a href={t.officialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Официальный источник ↗
          </a>
        </section>
      ) : (
        <div className="card border-warm bg-warm-soft" role="note">`,
);
rep(
  "      {t.isClinical && (",
  `      {analogs.length > 0 && (
        <section className="space-y-3" aria-labelledby="analogs-title">
          <h2 id="analogs-title" className="text-xl font-semibold">
            {ref ? 'Открытые аналоги на сайте' : 'Другие открытые тесты по теме'}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {analogs.map((a) => (
              <li key={a.id} className={\`cat-\${a.category}\`}>
                <Link href={\`/tests/\${a.id}\`} className="card cat-card flex h-full flex-col gap-1 p-4 hover:border-accent">
                  <span className="font-semibold">{a.title}</span>
                  <span className="text-sm text-muted">{a.shortDescription}</span>
                  <span className="mt-1 text-xs text-muted">
                    ≈ {a.duration} мин · {a.questionCount} {a.mode === 'external' ? 'пунктов (ввод ответов)' : 'вопросов'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ref && analogs.length === 0 && (
        <p className="rounded-xl2 bg-accent-soft p-4 text-[15px]">
          Открытого аналога на сайте пока нет. Для такой методики лучше обратиться к специалисту, который имеет
          право её проводить.
        </p>
      )}

      {t.isClinical && !ref && (`,
);
fs.writeFileSync(file, s);

// Тест «заготовка не запускается» теперь про справочную карточку
let sm = fs.readFileSync('tests/smoke.spec.ts', 'utf8');
sm = sm.replace("await expect(page.getByText('Этот тест ещё в подготовке')).toBeVisible();", "await expect(page.getByRole('heading', { name: /Справочная карточка/ })).toBeVisible();\n  await expect(page.getByRole('link', { name: /Официальный источник/ })).toBeVisible();");
fs.writeFileSync('tests/smoke.spec.ts', sm);
console.log('ok');
