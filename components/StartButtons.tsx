'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clearProgress, loadProgress } from '@/lib/storage';

export default function StartButtons({ testId }: { testId: string }) {
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    const p = loadProgress(testId);
    setSaved(p ? Object.keys(p.answers).length : null);
  }, [testId]);

  return (
    <div className="flex flex-wrap gap-3">
      {saved ? (
        <>
          <Link href={`/tests/${testId}/run`} className="btn btn-primary">
            Продолжить (отвечено: {saved})
          </Link>
          <Link
            href={`/tests/${testId}/run?fresh=1`}
            onClick={() => clearProgress(testId)}
            className="btn btn-ghost"
          >
            Начать заново
          </Link>
        </>
      ) : (
        <Link href={`/tests/${testId}/run`} className="btn btn-primary">
          Начать
        </Link>
      )}
    </div>
  );
}
