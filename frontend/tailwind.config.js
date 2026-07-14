/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: {
          950: '#07111f',
          900: '#0a1628',
          800: '#10213a',
          700: '#17304f',
        },
        accent: {
          500: '#64f5c0',
          600: '#28d6a6',
        },
        gold: {
          400: '#ffd36e',
          500: '#f6b73c',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(100, 245, 192, 0.12), 0 20px 80px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};