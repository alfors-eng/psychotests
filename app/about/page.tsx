import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTests, isReady } from '@/lib/tests';

export const metadata: Metadata = { title: 'О проекте' };

export default function AboutPage() {
  const tests = getAllTests();
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">О проекте</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Что это</h2>
        <p>
          Каталог психологических тестов на основе открытых методик. Мы не воспроизводим проприетарные
          инструменты (MMPI, MBTI, NEO-PI-R, шкалу Бека, Maslach Burnout Inventory и т. п.) и берём им
          открытые аналоги.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Приватность</h2>
        <p>
          Регистрации нет. Ответы считаются в вашем браузере и не отправляются на сервер. Прогресс и история
          результатов хранятся в localStorage вашего устройства, их можно удалить в разделе «
          <Link href="/results" className="text-accent underline underline-offset-4">Мои результаты</Link>». На сайте нет
          трекеров, аналитики и сторонних шрифтов.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Ограничения онлайн-тестов</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Тест не является диагнозом. Диагноз ставит специалист по результатам очной оценки.</li>
          <li>Скрининговые опросники лишь показывают, нужна ли дальнейшая оценка; они не определяют причину.</li>
          <li>
            Русские версии большинства тестов здесь — рабочие переводы, а не валидированные адаптации; в карточке
            каждого теста это указано.
          </li>
          <li>
            Границы интерпретации ориентировочные. Без репрезентативных российских норм баллы нельзя
            считать процентилями.
          </li>
          <li>Ответы зависят от настроения, усталости, обстоятельств и желания выглядеть лучше.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Научные источники</h2>
        <ul className="space-y-2">
          {tests.map((t) => (
            <li key={t.id} className="text-[15px]">
              <Link href={`/tests/${t.id}`} className="font-medium text-accent underline underline-offset-4">
                {t.title}
              </Link>
              {' — '}
              {t.author}, {t.year}.{' '}
              <a href={t.source} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4">
                оригинал
              </a>
              {!isReady(t) && <span className="text-muted"> (в подготовке)</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Если вам тяжело</h2>
        <p>
          Если вы думаете о том, чтобы причинить себе вред, или вам очень плохо, обратитесь к близким или в
          экстренную службу (в России — 112). Перечень линий помощи показывается на странице результата
          клинических тестов.
        </p>
      </section>
    </div>
  );
}
