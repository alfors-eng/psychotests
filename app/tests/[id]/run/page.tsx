import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Runner from '@/components/Runner';
import { getAllTests, getTest, isReady } from '@/lib/tests';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getAllTests().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTest((await params).id);
  return { title: t ? `Прохождение: ${t.title}` : 'Тест' };
}

export default async function RunPage({ params }: Props) {
  const { id } = await params;
  const t = getTest(id);
  if (!t) notFound();
  if (!isReady(t)) redirect(`/tests/${id}`);
  return <Runner test={t} />;
}
