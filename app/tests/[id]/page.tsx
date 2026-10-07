import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StartButtons from '@/components/StartButtons';
import { categoryTitle } from '@/lib/categories';
import { getAllTests, getTest, isReady } from '@/lib/tests';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getAllTests().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTest((await params).id);
  return t ? { title: t.title, description: t.shortDescription } : {};
}

export default async function TestPage({ params }: Props) {
  const t = getTest((await params).id);
  if (!t) notFound();
  const ready = isReady(t);

  const facts: [string, string][] = [
    ['Время', `≈ ${t.duration} мин`],
    ['Вопросов', `${t.questionCount}`],
    ['Автор', t.author],
    ['Год', `${t.year}`],
  ];

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <Link href="/" className="text-sm text-accent underline-offset-4 hover:underline">
        ← Все тесты
      </Link>
      <header className="space-y-3">
        <p className="text-sm font-medium text-accent">{categoryTitle(t.category)}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-lg text-muted">{t.shortDescription}</p>
      </header>

      <dl className="grid grid-cols-2 gap-4 rounded-xl2 border border-line bg-surface p-5 text-sm sm:grid-cols-4">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">О тесте</h2>
        <p>{t.fullDescription}</p>
        {ready && <p className="text-muted">{t.instructions}</p>}
      </section>

      {ready && t.mode === 'external' ? (
        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Как это работает</h2>
          <ol className="list-decimal space-y-1 pl-5 text-[15px]">
            <li>Пройдите тест на сайте оригинала (мы не воспроизводим его вопросы).</li>
            <li>Вернитесь и введите номера своих ответов.</li>
            <li>Получите баллы и объяснение: подсчёт идёт в вашем браузере.</li>
          </ol>
          <Link href={`/tests/${t.id}/run`} className="btn btn-primary">
            Ввести ответы
          </Link>
        </section>
      ) : ready ? (
        <StartButtons testId={t.id} />
      ) : (
        <div className="card border-warm bg-warm-soft" role="note">
          <p className="font-medium">Этот тест ещё в подготовке</p>
          <p className="mt-1 text-[15px]">
            Формулировки вопросов и ключи подсчёта проверяются по первоисточнику — мы не публикуем их по
            памяти или в непроверенном переводе.
          </p>
        </div>
      )}

      {t.isClinical && (
        <p className="rounded-xl2 bg-accent-soft p-4 text-[15px]">
          Это скрининговый опросник. Он не ставит диагноз и не заменяет консультацию специалиста.
        </p>
      )}

      <section className="space-y-2 border-t border-line pt-6 text-sm text-muted">
        <h2 className="text-base font-semibold text-ink">Источник и лицензия</h2>
        <p>
          <span className="text-ink">Автор:</span> {t.author}, {t.year}
        </p>
        <p>
          <span className="text-ink">Оригинал:</span>{' '}
          <a href={t.source} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
            {t.source}
          </a>
        </p>
        <p>
          <span className="text-ink">Лицензия:</span> {t.license}
        </p>
        {t.translationNote && (
          <p>
            <span className="text-ink">Перевод:</span> {t.translationNote}
          </p>
        )}
      </section>
    </article>
  );
}
