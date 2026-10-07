import type { MetadataRoute } from 'next';
import { getAllTests } from '@/lib/tests';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psychotests.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base },
    { url: `${base}/about` },
    { url: `${base}/contribute` },
    ...getAllTests().map((t) => ({ url: `${base}/tests/${t.id}` })),
  ];
}
