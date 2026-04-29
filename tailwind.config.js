/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './widget.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-solid': 'rgb(var(--surface-solid) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-mid': 'rgb(var(--fg) / 0.6)',
        'fg-sub': 'rgb(var(--fg) / 0.4)',
        hover: 'rgb(var(--fg) / 0.04)',
        selected: 'rgb(var(--fg) / 0.06)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        serif: ['var(--font-serif)'],
      },
      borderRadius: { card: '14px' },
    },
  },
  plugins: [],
};
