import type { Metadata } from 'next';
import HistoryList from '@/components/HistoryList';

export const metadata: Metadata = { title: 'Мои результаты', robots: { index: false } };

export default function ResultsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Мои результаты</h1>
      <p className="text-muted">
        История хранится только в этом браузере (localStorage). Если очистить данные сайта или сменить
        устройство, она исчезнет.
      </p>
      <HistoryList />
    </div>
  );
}
