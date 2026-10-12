// Подключает «Мои данные», напоминания о копии и защитный слой к существующим файлам. Запуск: node scripts/patch-data-center.cjs
const fs = require('fs');
const rw = (p, f) => { const s = fs.readFileSync(p, 'utf8'); const t = f(s); if (s === t) console.log('NO CHANGE', p); fs.writeFileSync(p, t); };
const rep = (s, a, b) => { if (!s.includes(a)) { console.log('NOT FOUND:', a.slice(0, 70)); return s; } return s.replace(a, b); };

rw('app/sitemap.ts', (s) => rep(s, "    { url: `${base}/contribute` },", "    { url: `${base}/contribute` },\n    { url: `${base}/privacy` },"));

rw('app/layout.tsx', (s) => {
  s = rep(s, "import SiteNav from '@/components/SiteNav';", "import DataGuard from '@/components/DataGuard';\nimport SiteNav from '@/components/SiteNav';");
  s = rep(s, "        <SiteNav />\n", "        <SiteNav />\n        <DataGuard />\n");
  const link = (href, label) => `              <Link href="${href}" className="inline-flex min-h-[44px] items-center underline-offset-4 hover:underline">${label}</Link>`;
  s = rep(s, link('/profile', 'Профиль'), link('/profile', 'Профиль') + '\n' + link('/data', 'Мои данные') + '\n' + link('/privacy', 'Конфиденциальность'));
  s = rep(s, "  twitter: { card: 'summary_large_image', images: ['/og.png'] },", "  twitter: { card: 'summary_large_image', images: ['/og.png'] },\n  appleWebApp: { capable: true, title: 'Психотесты', statusBarStyle: 'default' },");
  return s;
});

rw('components/ProfileView.tsx', (s) => {
  s = rep(s, "import CategoryIcon from '@/components/CategoryIcon';", "import BackupReminder from '@/components/BackupReminder';\nimport CategoryIcon from '@/components/CategoryIcon';");
  s = rep(s, "    <div className=\"space-y-10\">\n      <p className=\"rounded-xl2 bg-accent-soft p-4 text-[15px]\">\n        Профиль строится", "    <div className=\"space-y-10\">\n      <BackupReminder />\n      <p className=\"rounded-xl2 bg-accent-soft p-4 text-[15px]\">\n        Профиль строится");
  return s;
});

rw('components/HistoryList.tsx', (s) => {
  s = rep(s, "import { formatDate } from '@/lib/format';", "import BackupReminder from '@/components/BackupReminder';\nimport { markBackup } from '@/lib/backup';\nimport { formatDate } from '@/lib/format';");
  s = rep(s, "    a.click();\n    URL.revokeObjectURL(a.href);\n  };", "    a.click();\n    URL.revokeObjectURL(a.href);\n    markBackup();\n  };");
  s = rep(s, "  return (\n    <div className=\"space-y-4\">\n      <ul className=\"space-y-3\">", "  return (\n    <div className=\"space-y-4\">\n      <BackupReminder />\n      <ul className=\"space-y-3\">");
  s = rep(s, "содержит ваши ответы — берегите его.", "содержит ваши ответы — берегите его. Перенос зашифрованной ссылкой или QR-кодом и автокопия в файл — на странице{' '}\n        <Link href=\"/data\" className=\"underline underline-offset-4\">«Мои данные»</Link>.");
  return s;
});
