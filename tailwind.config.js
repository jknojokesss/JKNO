/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['\'DM Sans\'', 'sans-serif'],
        mono: ['\'DM Mono\'', 'monospace'],
      },
      colors: {
        ink: '#0D0D0D',
        paper: '#F7F4EF',
        gold: '#C9A84C',
        'gold-light': '#E8D5A3',
        slate: '#2C3E50',
        'slate-mid': '#4A5568',
        'slate-light': '#CBD5E0',
        emerald: '#2D6A4F',
        'emerald-light': '#74C69D',
        ruby: '#C0392B',
        'ruby-light': '#F1948A',
      },
    },
  },
  plugins: [],
}
