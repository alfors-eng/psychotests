import type { Metadata } from 'next';
import ProfileView from '@/components/ProfileView';
import { getAllTests, isReady, toScoringDef } from '@/lib/tests';

export const metadata: Metadata = {
  title: 'Мой профиль',
  description: 'Профиль по результатам тестов: диаграммы, динамика, скрининги и отчёт для специалиста. Данные хранятся только в вашем браузере.',
  robots: { index: false },
};

export default function ProfilePage() {
  const tests = getAllTests().filter(isReady).map((t) => toScoringDef(t, true));
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Мой профиль</h1>
        <p className="max-w-2xl text-lg text-muted">
          Результаты всех ваших тестов в одном месте: целостная картина и диаграммы, динамика с оценкой значимости
          изменений, сводка по скринингам со следующими шагами и отчёт для специалиста.
        </p>
      </header>
      <ProfileView tests={tests} />
    </div>
  );
}
