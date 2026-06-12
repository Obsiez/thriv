/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        thriv: {
          50: '#ecfdf8',
          100: '#d1faf0',
          200: '#a7f3e1',
          300: '#6ee7cb',
          400: '#34d3b0',
          500: '#14b896',
          600: '#0d9478',
          700: '#0f7662',
          800: '#115e50',
          900: '#134e44',
          950: '#042f28',
        },
        surface: {
          950: 'rgba(var(--surface-950-rgb, 4, 47, 40), <alpha-value>)',
          900: 'rgba(var(--surface-900-rgb, 10, 15, 20), <alpha-value>)',
          800: 'rgba(var(--surface-800-rgb, 17, 25, 33), <alpha-value>)',
          700: 'rgba(var(--surface-700-rgb, 26, 36, 47), <alpha-value>)',
          600: 'rgba(var(--surface-600-rgb, 36, 48, 64), <alpha-value>)',
          500: 'rgba(var(--surface-500-rgb, 47, 61, 79), <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
