/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        danger: {
          DEFAULT: '#ef4444',
          dark: '#7f1d1d',
          glow: 'rgba(239, 68, 68, 0.45)',
        },
        caution: {
          DEFAULT: '#f59e0b',
          dark: '#78350f',
          glow: 'rgba(245, 158, 11, 0.45)',
        },
        safe: {
          DEFAULT: '#10b981',
          dark: '#064e3b',
          glow: 'rgba(16, 185, 129, 0.45)',
        },
        cyber: {
          blue: '#00f2fe',
          cyan: '#38bdf8',
          purple: '#818cf8',
          dark: '#090d16',
          panel: 'rgba(15, 23, 42, 0.78)',
          card: 'rgba(30, 41, 59, 0.7)',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser': 'laser 2s linear infinite',
      },
      keyframes: {
        laser: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
}
