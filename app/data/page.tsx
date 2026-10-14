import type { Metadata } from 'next';
import DataCenter from '@/components/DataCenter';

export const metadata: Metadata = {
  title: 'Мои данные и резервные копии',
  description: 'Как не потерять результаты тестов: резервная копия, перенос на другое устройство зашифрованной ссылкой, автокопия в файл.',
  robots: { index: false },
};

export default function DataPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="t-h1">Мои данные</h1>
        <p className="text-lg text-muted">Резервные копии и перенос результатов на другое устройство без регистрации.</p>
      </header>
      <DataCenter />
    </div>
  );
}
