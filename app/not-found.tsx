import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="t-h1">Страница не найдена</h1>
      <Link href="/" className="btn btn-primary">
        К каталогу тестов
      </Link>
    </div>
  );
}
