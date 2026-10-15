// Sinh lại src/theme/default-theme.css từ material-theme.json + material-blue.json (cùng logic với src/theme/theme.js).
// Chạy: node scripts/build-theme-css.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(new URL(`../src/theme/${f}`, import.meta.url), 'utf-8'));
const base = read('material-theme.json');
const blue = read('material-blue.json');
const TOKENS = ['primary','onPrimary','primaryContainer','onPrimaryContainer','secondary','onSecondary','secondaryContainer','onSecondaryContainer','tertiary','onTertiary','tertiaryContainer','onTertiaryContainer','error','onError','errorContainer','onErrorContainer','background','onBackground','surface','onSurface','surfaceVariant','onSurfaceVariant','outline','outlineVariant','shadow','scrim','inverseSurface','inverseOnSurface','inversePrimary','surfaceTint','surfaceDim','surfaceBright','surfaceContainerLowest','surfaceContainerLow','surfaceContainer','surfaceContainerHigh','surfaceContainerHighest'];
const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const triplet = (hex) => { const n = parseInt(hex.slice(1, 7), 16); return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`; };
const vars = (s) => TOKENS.map((k) => `--md-${kebab(k)}:${triplet(s[k])}`).join(';');
const light = { ...base.schemes.light, ...blue.light };
const dark = { ...base.schemes.dark, ...blue.dark };
const css = `/* Token màu mặc định — SINH TỰ ĐỘNG bằng scripts/build-theme-css.mjs từ material-theme.json + material-blue.json. Đừng sửa tay. */\n:root{${vars(light)}}\n:root.dark{${vars(dark)}}\n`;
writeFileSync(new URL('../src/theme/default-theme.css', import.meta.url), css);
console.log('Wrote src/theme/default-theme.css');
