import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Для специалистов: как добавить тест',
  description: 'Формат JSON для тестов и правила добавления новых методик через pull request.',
};

const REPO = 'https://github.com/alfors-eng/psychotests';

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Для специалистов</h1>
      <p className="text-lg text-muted">
        Каталог можно расширять без программирования: каждый тест — один JSON-файл в папке{' '}
        <code className="rounded bg-accent-soft px-1.5 py-0.5 text-[15px]">data/tests</code>.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Что нужно для нового теста</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Методика в открытом доступе или с явным разрешением правообладателя на публикацию.</li>
          <li>Точные формулировки и ключи подсчёта из первоисточника или валидированной адаптации, со ссылкой.</li>
          <li>Указание автора, года, лицензии и статуса перевода (рабочий или валидированный).</li>
          <li>Интерпретация с границами, у которых есть источник; ориентировочные границы помечаются как такие.</li>
          <li>Для клинических скринингов — правила безопасности (блок помощи при высоких баллах, критические вопросы).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Как предложить тест</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Скопируйте похожий образец из репозитория:{' '}
            <a href={`${REPO}/tree/main/data/tests`} className="text-accent underline underline-offset-4" target="_blank" rel="noopener noreferrer">
              data/tests
            </a>
            .
          </li>
          <li>
            Заполните поля по описанию в{' '}
            <a href={`${REPO}#как-добавить-новый-тест`} className="text-accent underline underline-offset-4" target="_blank" rel="noopener noreferrer">
              README
            </a>
            .
          </li>
          <li>Проверьте файл командой <code className="rounded bg-accent-soft px-1.5 py-0.5 text-[15px]">npm run validate</code>.</li>
          <li>Откройте pull request: автоматическая проверка запустится сама.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Чего мы не публикуем</h2>
        <p>
          Проприетарные методики (MMPI, MBTI, NEO-PI-R, шкала Бека, Maslach Burnout Inventory, Роршах и др.),
          а также любые тесты, условия лицензии которых запрещают публичное онлайн-использование.
        </p>
      </section>
    </div>
  );
}
