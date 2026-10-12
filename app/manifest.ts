import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Психотесты NoNinaaao',
    short_name: 'Психотесты',
    description: 'Каталог психологических тестов без регистрации. Результаты хранятся только на вашем устройстве.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f3ec',
    theme_color: '#346053',
    lang: 'ru',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
