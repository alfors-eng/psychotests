const fs = require('fs');
const rw = (p, f) => { const s = fs.readFileSync(p, 'utf8'); const t = f(s); if (s === t) console.log('NO CHANGE', p); fs.writeFileSync(p, t); };

// Hero: только радар
rw('components/Hero.tsx', (s) => {
  s = s.replace(/import CategoryIcon[^\n]*\n/, '').replace(/import \{ CATEGORIES \}[^\n]*\n/, '');
  s = s.replace(/const CHIPS = \[[\s\S]*?\];\n\n/, '');
  s = s.replace(/\n      <div className="anim-drift[^\n]*\n[^\n]*\n[^\n]*\n/, '\n');
  s = s.replace(/\n      <div className="anim-orbit[\s\S]*?\n      <\/div>\n\n      \{CHIPS[\s\S]*?\n      \)\)\}\n/, '\n');
  s = s.replace('радар, который рисуется при загрузке, орбита категорий и плавающие «карточки результатов». Декоративная.', 'радар, который один раз рисуется при загрузке. Декоративная.');
  return s;
});

// Ложное предупреждение о крайних ответах: только для шкал от 5 вариантов
rw('lib/analytics.ts', (s) => s.replace('} else if (ends && extremeShare >= 0.7) {', '} else if (opts.length >= 5 && extremeShare >= 0.7) {'));

// Тон выводов: точка вместо толстой левой полосы
for (const p of ['components/DeepView.tsx', 'components/IntegratedView.tsx']) {
  rw(p, (s) => {
    s = s.replace("'border-l-accent'", "'bg-accent'").replace("'border-l-[rgb(var(--c-neurodiversity))]'", "'bg-[rgb(var(--c-neurodiversity))]'").replace("'border-l-warm'", "'bg-warm'");
    s = s.replace('className={`card border-l-4 ${TONE[i.tone]} space-y-1 p-4`}', 'className="card space-y-1 p-4"');
    s = s.replace('<p className="text-xs font-medium uppercase tracking-wide text-muted">{TONE_LABEL[i.tone]}</p>', '<p className="flex items-center gap-2 text-xs font-medium text-muted"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${TONE[i.tone]}`} />{TONE_LABEL[i.tone]}</p>');
    return s;
  });
}

// Результат
rw('components/ResultView.tsx', (s) => {
  s = s.replace('className="card border-l-4 border-l-[rgb(var(--cat)/0.8)]"', 'className="card"');
  s = s.replace('        <span aria-hidden="true" className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[rgb(var(--cat)/0.16)]" />\n', '');
  s = s.replace('      <AnswerAnalytics test={test} answers={entry.answers} scales={result.scales} />',
`      {safety.showHelp ? (
        <details className="card">
          <summary className="cursor-pointer text-[15px] font-medium">Подробная аналитика ответов</summary>
          <div className="mt-6">
            <AnswerAnalytics test={test} answers={entry.answers} scales={result.scales} />
          </div>
        </details>
      ) : (
        <AnswerAnalytics test={test} answers={entry.answers} scales={result.scales} />
      )}`);
  return s;
});

// Анимации и декор
rw('app/globals.css', (s) => {
  s = s.replace('cubic-bezier(0.2, 0.8, 0.3, 1.3)', 'cubic-bezier(0.16, 1, 0.3, 1)');
  s = s.replace(/\.cat-card::after \{[\s\S]*?\n\}\n/, '');
  s = s.replace(/\.intent:hover \.intent-icon[^\n]*\n/, '');
  s = s.replace('.cat-card:hover .cat-bubble, .intent:hover .cat-bubble { transform: rotate(-6deg) scale(1.08); }', '.cat-card:hover .cat-bubble { transform: scale(1.06); }');
  return s;
});

// Каркас: без декоративных пятен, крупные цели в подвале
rw('app/layout.tsx', (s) => {
  s = s.replace(/        <div aria-hidden="true" className="bg-decor[^\n]*\n/, '');
  s = s.replace(/className="underline-offset-4 hover:underline"/g, 'className="inline-flex min-h-[44px] items-center underline-offset-4 hover:underline"');
  s = s.replace('gap-x-6 gap-y-2 text-sm md:justify-end', 'gap-x-6 text-sm md:justify-end');
  return s;
});

// Прохождение
rw('components/Runner.tsx', (s) => {
  s = s.replace('h-2 overflow-hidden rounded-full bg-accent-soft', 'h-2 overflow-hidden rounded-full bg-line');
  s = s.replace(/      <p className="hidden text-center text-sm text-muted sm:block">[\s\S]*?<\/p>/,
`      <div className="space-y-2 text-center text-sm text-muted">
        <p>Прогресс сохраняется в этом браузере.</p>
        <p className="hidden sm:block">Подсказка: нажимайте цифры 1–{options.length} для ответа, «←» — назад.</p>
        {answeredCount > 0 && (
          <button
            type="button"
            onClick={() => {
              if (advance.current) clearTimeout(advance.current);
              advance.current = null;
              clearProgress(test.id);
              setAnswers({});
              go(0);
            }}
            className="inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-ink"
          >
            Начать заново
          </button>
        )}
      </div>`);
  return s;
});

// Навигация: во время теста — только название
rw('components/SiteNav.tsx', (s) => {
  s = s.replace("  const active = (href: string)", "  const inRun = /^\/tests\/[^/]+\/run/.test(path);\n  const active = (href: string)");
  s = s.replace("  return (\n    <header className=\"sticky", "  if (inRun) {\n    return (\n      <header className=\"px-4 pt-5 print:hidden\">\n        <Link href=\"/\" className=\"mx-auto flex max-w-2xl items-center gap-2 text-[15px] text-muted hover:text-ink\">\n          <Logo />\n          <span className=\"font-display\">Психотесты NoNinaaao</span>\n        </Link>\n      </header>\n    );\n  }\n\n  return (\n    <header className=\"sticky");
  s = s.replace('rounded-full px-4 py-2 transition-colors', 'rounded-full px-4 py-2.5 transition-colors');
  return s;
});
