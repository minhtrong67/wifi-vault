/** @type {import('tailwindcss').Config} */

// Màu lấy từ CSS variables của Material 3 (xem src/theme/theme.js) — hỗ trợ độ trong suốt: bg-primary/10
const c = (name) => `rgb(var(--md-${name}) / <alpha-value>)`;
const TOKENS = [
  'primary', 'on-primary', 'primary-container', 'on-primary-container',
  'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
  'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
  'error', 'on-error', 'error-container', 'on-error-container',
  'background', 'on-background', 'surface', 'on-surface', 'surface-variant', 'on-surface-variant',
  'outline', 'outline-variant', 'shadow', 'scrim', 'inverse-surface', 'inverse-on-surface', 'inverse-primary',
  'surface-tint', 'surface-dim', 'surface-bright',
  'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest',
];

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: Object.fromEntries(TOKENS.map((t) => [t, c(t)])),
      fontFamily: { sans: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      // Hình khối Material 3: extra-small 4 · small 8 · medium 12 · large 16 · extra-large 28
      borderRadius: { '4xl': '28px' },
      // Đổ bóng theo cấp độ elevation của Material 3
      boxShadow: {
        el1: '0 1px 2px rgb(var(--md-shadow) / .3), 0 1px 3px 1px rgb(var(--md-shadow) / .15)',
        el2: '0 1px 2px rgb(var(--md-shadow) / .3), 0 2px 6px 2px rgb(var(--md-shadow) / .15)',
        el3: '0 1px 3px rgb(var(--md-shadow) / .3), 0 4px 8px 3px rgb(var(--md-shadow) / .15)',
        el4: '0 2px 3px rgb(var(--md-shadow) / .3), 0 6px 10px 4px rgb(var(--md-shadow) / .15)',
      },
      // Easing & thời lượng chuẩn của Material Motion
      transitionTimingFunction: {
        emphasized: 'cubic-bezier(.2, 0, 0, 1)',
        'emphasized-decel': 'cubic-bezier(.05, .7, .1, 1)',
        'emphasized-accel': 'cubic-bezier(.3, 0, .8, .15)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'none' } },
        pop: { from: { opacity: 0, transform: 'scale(.92)' }, to: { opacity: 1, transform: 'none' } },
        // Fade through: hiệu ứng chuyển trang của Material
        fadeThrough: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'none' } },
        snack: { from: { opacity: 0, transform: 'translateY(12px) scale(.96)' }, to: { opacity: 1, transform: 'none' } },
        // Thanh tiến trình không xác định (linear progress indicator)
        loading: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(200%)' } },
        ripple: { from: { transform: 'scale(0)', opacity: 0.18 }, to: { transform: 'scale(1)', opacity: 0 } },
      },
      animation: {
        fadeIn: 'fadeIn .2s cubic-bezier(.2,0,0,1)',
        slideUp: 'slideUp .35s cubic-bezier(.05,.7,.1,1) backwards',
        pop: 'pop .25s cubic-bezier(.05,.7,.1,1) backwards',
        fadeThrough: 'fadeThrough .3s cubic-bezier(.05,.7,.1,1) backwards',
        snack: 'snack .3s cubic-bezier(.05,.7,.1,1) backwards',
        loading: 'loading 1.2s cubic-bezier(.4,0,.2,1) infinite',
        ripple: 'ripple .6s cubic-bezier(.2,0,0,1) forwards',
      },
    },
  },
  plugins: [],
};
