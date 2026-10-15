// Material 3 theming: biến schema màu (Material Theme Builder) thành CSS variables dạng "R G B"
// để Tailwind dùng được kèm độ trong suốt, ví dụ `bg-primary/10`.
import baseTheme from './material-theme.json';
import blue from './material-blue.json';

// Theme mặc định = file Material Theme Builder + màu primary là đúng Material Blue (xem material-blue.json)
const defaultTheme = { schemes: { light: { ...baseTheme.schemes.light, ...blue.light }, dark: { ...baseTheme.schemes.dark, ...blue.dark } } };

export const DEFAULT_SEED = '#2196F3';

/** Bảng màu gốc của Material Design (sắc độ 500) — người dùng chọn làm màu chủ đề */
export const MATERIAL_COLORS = [
  { name: 'blue', hex: '#2196F3' },
  { name: 'lightBlue', hex: '#03A9F4' },
  { name: 'cyan', hex: '#00BCD4' },
  { name: 'teal', hex: '#009688' },
  { name: 'green', hex: '#4CAF50' },
  { name: 'lightGreen', hex: '#8BC34A' },
  { name: 'lime', hex: '#CDDC39' },
  { name: 'yellow', hex: '#FFEB3B' },
  { name: 'amber', hex: '#FFC107' },
  { name: 'orange', hex: '#FF9800' },
  { name: 'deepOrange', hex: '#FF5722' },
  { name: 'red', hex: '#F44336' },
  { name: 'pink', hex: '#E91E63' },
  { name: 'purple', hex: '#9C27B0' },
  { name: 'deepPurple', hex: '#673AB7' },
  { name: 'indigo', hex: '#3F51B5' },
  { name: 'brown', hex: '#795548' },
  { name: 'blueGrey', hex: '#607D8B' },
];

// Các token được xuất ra CSS (khớp với tên trong file theme JSON)
const TOKENS = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground', 'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
  'outline', 'outlineVariant', 'shadow', 'scrim', 'inverseSurface', 'inverseOnSurface', 'inversePrimary',
  'surfaceTint', 'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
];

const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const triplet = (hex) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
const vars = (scheme) => TOKENS.map((k) => `--md-${kebab(k)}:${triplet(scheme[k])}`).join(';');

/** Dựng CSS cho cả hai chế độ sáng/tối. `strong` nâng độ ưu tiên để luôn thắng CSS mặc định. */
export const schemesToCss = (light, dark, strong = false) => {
  const r = strong ? ':root:root' : ':root';
  return `${r}{${vars(light)}}${r}.dark{${vars(dark)}}`;
};

/** CSS của theme mặc định (đúng theo file JSON Material Theme Builder) */
export const defaultCss = (strong = false) => schemesToCss(defaultTheme.schemes.light, defaultTheme.schemes.dark, strong);

const hexOf = (mcu, argb) => `#${(argb & 0xffffff).toString(16).padStart(6, '0')}`;

/** Sinh bảng màu Material 3 (tonal spot) từ một màu hạt. Thư viện được tải khi cần nên không làm nặng lần mở đầu. */
export async function schemesFromSeed(seed) {
  if (seed.toUpperCase() === DEFAULT_SEED) return { light: defaultTheme.schemes.light, dark: defaultTheme.schemes.dark };
  const mcu = await import('@material/material-color-utilities');
  const { SchemeTonalSpot, Hct, MaterialDynamicColors: M, argbFromHex } = mcu;
  const source = Hct.fromInt(argbFromHex(seed));
  const build = (isDark) => {
    const scheme = new SchemeTonalSpot(source, isDark, 0);
    return Object.fromEntries(TOKENS.map((k) => [k, hexOf(mcu, M[k].getArgb(scheme))]));
  };
  return { light: build(false), dark: build(true) };
}

/** Bảng màu (hex) của một chế độ, dùng cho biểu đồ và báo cáo */
export const tokensFor = (schemes, dark) => (dark ? schemes.dark : schemes.light);
export const DEFAULT_SCHEMES = { light: defaultTheme.schemes.light, dark: defaultTheme.schemes.dark };
