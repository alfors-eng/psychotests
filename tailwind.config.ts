import type { Config } from 'tailwindcss';

// Все значения берутся из app/tokens.css; здесь только имена для утилит.
const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        surface: c('surface'),
        'surface-2': c('surface-2'),
        ink: c('text'),
        muted: c('muted'),
        line: c('border'),
        'line-strong': c('border-strong'),
        accent: c('accent'),
        'accent-hover': c('accent-hover'),
        'accent-fg': c('accent-fg'),
        'accent-soft': c('accent-soft'),
        warm: c('warm'),
        'warm-soft': c('warm-soft'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
      },
      // Шкала текста интерфейса: ui — основной мелкий текст, meta — подписи
      fontSize: {
        ui: ['0.9375rem', { lineHeight: '1.55' }],
        meta: ['0.8125rem', { lineHeight: '1.45' }],
      },
      borderRadius: {
        control: 'var(--r-control)',
        card: 'var(--r-card)',
      },
      boxShadow: {
        float: 'var(--shadow-float)',
      },
      transitionTimingFunction: {
        out: 'var(--ease)',
      },
      spacing: {
        gutter: 'var(--gutter)',
      },
    },
  },
  plugins: [],
};
export default config;
