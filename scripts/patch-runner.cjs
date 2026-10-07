const fs = require('fs');
let s = fs.readFileSync('components/Runner.tsx', 'utf8');
const rep = (a, b) => {
  if (!s.includes(a)) throw new Error('не найдено: ' + a.slice(0, 50));
  s = s.replace(a, b);
};
rep(
  "  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);",
  "  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);\n  // Актуальный индекс вопроса, чтобы быстрые нажатия не перезаписывали один и тот же вопрос.\n  const idxRef = useRef(0);\n  const go = useCallback((i: number) => {\n    idxRef.current = i;\n    setIndex(i);\n  }, []);",
);
rep("      setIndex(Math.min(p.index, total - 1));", "      go(Math.min(p.index, total - 1));");
rep("  }, [test.id, total]);", "  }, [test.id, total, go]);");
rep(
  /      if \(!q\) return;[\s\S]*?    \[q, index, total\],/.exec(s)[0],
  `      // Если предыдущий автопереход ещё не сработал, выполняем его сразу.
      if (advance.current) {
        clearTimeout(advance.current);
        advance.current = null;
        go(Math.min(idxRef.current + 1, total - 1));
      }
      const cur = test.questions[idxRef.current];
      if (!cur) return;
      setAnswers((a) => ({ ...a, [cur.id]: value }));
      if (idxRef.current < total - 1) {
        advance.current = setTimeout(() => {
          advance.current = null;
          go(Math.min(idxRef.current + 1, total - 1));
        }, 220);
      }
    },
    [test.questions, total, go],`,
);
rep(
  "    if (advance.current) clearTimeout(advance.current);\n    setIndex((i) => Math.max(0, i - 1));\n  }, []);",
  "    if (advance.current) {\n      clearTimeout(advance.current);\n      advance.current = null;\n    }\n    go(Math.max(0, idxRef.current - 1));\n  }, [go]);",
);
s = s.replace(/onClick=\{\(\) => setIndex\(\(i\) => Math\.min\(i \+ 1, total - 1\)\)\}/, 'onClick={() => go(Math.min(idxRef.current + 1, total - 1))}');
s = s.replace(/onClick=\{\(\) => setIndex\(test\.questions\.findIndex\(\(x\) => answers\[x\.id\] === undefined\)\)\}/, 'onClick={() => go(test.questions.findIndex((x) => answers[x.id] === undefined))}');
fs.writeFileSync('components/Runner.tsx', s);
console.log('ok');
