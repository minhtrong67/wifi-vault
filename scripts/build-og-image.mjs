// Xuất public/og-image.png (1200×630) từ scripts/og-image.html bằng Playwright/Chromium.
// Chạy: node scripts/build-og-image.mjs   (cần: npm i -D playwright-core hoặc playwright)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('./og-image.html', import.meta.url));
const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('file://' + src);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log('Wrote', out);
