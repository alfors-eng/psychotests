import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import ResultView from '@/components/ResultView';
import { getAllTests, getTest, isReady } from '@/lib/tests';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getAllTests().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTest((await params).id);
  return { title: t ? `Результат: ${t.title}` : 'Результат', robots: { index: false } };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const t = getTest(id);
  if (!t) notFound();
  if (!isReady(t)) redirect(`/tests/${id}`);
  return (
    <Suspense fallback={<p className="text-muted">Загрузка…</p>}>
      <ResultView test={t} />
    </Suspense>
  );
}
