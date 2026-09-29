/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Chỉ dùng duy nhất một font: system-ui
      fontFamily: { sans: ['system-ui', 'sans-serif'] },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        pop: { from: { opacity: 0, transform: 'scale(.96)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { fadeIn: 'fadeIn .2s ease-out', slideUp: 'slideUp .25s ease-out', pop: 'pop .18s ease-out' },
    },
  },
  plugins: [],
};
