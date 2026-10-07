import Catalog from '@/components/Catalog';
import { getAllTests, toSummary } from '@/lib/tests';

export default function HomePage() {
  const tests = getAllTests().map(toSummary);
  return (
    <div className="space-y-10">
      <section className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Психологические тесты</h1>
        <p className="text-lg text-muted">
          Открытые методики с понятной интерпретацией. Без регистрации: ответы считаются в вашем браузере и
          никуда не отправляются.
        </p>
      </section>
      <Catalog tests={tests} />
    </div>
  );
}
