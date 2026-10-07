import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psychotests.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/results', '/tests/*/result', '/tests/*/run'] },
    sitemap: `${base}/sitemap.xml`,
  };
}
