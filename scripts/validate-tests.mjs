// Проверка всех JSON в data/tests. Запуск: npm run validate (нужен Node 22.18+).
import fs from 'node:fs';
import path from 'node:path';
import { validateTest } from '../lib/validate.ts';

const dir = path.join(process.cwd(), 'data', 'tests');
let errors = [];
let ready = 0;
let drafts = 0;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const t = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  errors = errors.concat(validateTest(t, file));
  t.status === 'draft' ? drafts++ : ready++;
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK: готовых тестов — ${ready}, заготовок — ${drafts}`);
