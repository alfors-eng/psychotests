import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTests, isReady } from '@/lib/tests';

export const metadata: Metadata = { title: 'О проекте' };

export default function AboutPage() {
  const tests = getAllTests();
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">О проекте</h1>

      <ul className="grid gap-3 sm:grid-cols-3" aria-label="Принципы проекта">
        {[
          { t: 'Не диагноз', x: 'Результат — повод для размышления, а не медицинское заключение.', c: 'cat-emotional', d: 'M12 21s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 8.6a4.3 4.3 0 0 1 7.5 2.4c0 5.6-7.5 10-7.5 10Z' },
          { t: 'Приватность', x: 'Ответы остаются в вашем браузере и никуда не отправляются.', c: 'cat-eq', d: 'M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3' },
          { t: 'Открытые источники', x: 'Автор, год и лицензия указаны в каждой карточке теста.', c: 'cat-wellbeing', d: 'M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4V5Zm16 0h-4a2 2 0 0 0-2 2' },
        ].map((p) => (
          <li key={p.t} className={`${p.c} card cat-card space-y-2 p-4`}>
            <span className="cat-bubble inline-flex h-10 w-10 items-center justify-center rounded-xl">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d={p.d} />
              </svg>
            </span>
            <p className="font-semibold">{p.t}</p>
            <p className="text-sm text-muted">{p.x}</p>
          </li>
        ))}
      </ul>

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
