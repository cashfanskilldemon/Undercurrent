/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--uc-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--uc-surface-rgb) / <alpha-value>)',
        'surface-2': 'rgb(var(--uc-surface-2-rgb) / <alpha-value>)',
        fg: 'rgb(var(--uc-fg-rgb) / <alpha-value>)',
        muted: 'rgb(var(--uc-muted-rgb) / <alpha-value>)',
        border: 'var(--uc-border)',
        'border-strong': 'var(--uc-border-strong)',
        primary: 'rgb(var(--uc-primary-rgb) / <alpha-value>)',
        'primary-fg': 'rgb(var(--uc-primary-fg-rgb) / <alpha-value>)',
        rust: 'rgb(var(--uc-rust-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', '"ZCOOL QingKe HuangYou"', 'sans-serif'],
        cn: ['"ZCOOL QingKe HuangYou"', '"Noto Sans SC"', 'sans-serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        feed: '620px',
        shell: '1240px',
      },
      boxShadow: {
        card: '0 1px 0 var(--uc-border), 0 8px 28px -18px rgb(0 0 0 / 0.55)',
        lift: '0 18px 48px -24px rgb(0 0 0 / 0.6)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'ring-spin': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .28s ease-out both',
        'toast-in': 'toast-in .22s ease-out both',
        'ring-spin': 'ring-spin 8s linear infinite',
      },
    },
  },
  plugins: [],
};
