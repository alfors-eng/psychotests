import type { Metadata } from 'next';
import ProfileView from '@/components/ProfileView';
import { getAllTests, isReady, toScoringDef } from '@/lib/tests';

export const metadata: Metadata = {
  title: 'Мой профиль',
  description: 'Диаграмма всех ваших характеристик по пройденным тестам. Данные хранятся только в вашем браузере.',
  robots: { index: false },
};

export default function ProfilePage() {
  const tests = getAllTests().filter(isReady).map(toScoringDef);
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Мой профиль</h1>
        <p className="max-w-2xl text-lg text-muted">
          Все ваши характеристики из пройденных тестов на одной диаграмме. Выберите, что показывать, и
          сохраните картинку.
        </p>
      </header>
      <ProfileView tests={tests} />
    </div>
  );
}
