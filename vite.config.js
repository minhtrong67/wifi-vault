import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Màu khởi động (splash) và thanh trạng thái của app lấy từ theme Material mặc định
const { schemes } = JSON.parse(readFileSync(new URL('./src/theme/material-theme.json', import.meta.url), 'utf-8'));
const LIGHT = schemes.light.surface; // #F8F9FF
const DARK = schemes.dark.surface; // #111418

const manifest = {
  id: '/',
  name: 'Wifi Vault',
  short_name: 'Wifi Vault',
  description: 'Két sắt lưu trữ và quản lý mật khẩu wifi · A tidy vault for your wifi passwords.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: LIGHT,
  theme_color: LIGHT,
  categories: ['utilities', 'productivity'],
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Wifi', url: '/wifi', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    { name: 'Stats', url: '/stats', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
  ],
};

/** Manifest bản tối: cùng nội dung nhưng background_color/theme_color theo giao diện tối.
 *  Trang sẽ trỏ <link rel="manifest"> sang file này khi đang dùng giao diện tối (xem SettingsContext). */
const darkManifest = () => ({
  name: 'wifi-vault-dark-manifest',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'manifest-dark.webmanifest',
      source: JSON.stringify({ ...manifest, background_color: DARK, theme_color: DARK }, null, 2),
    });
  },
});

// Tách vendor để tải nhanh và cache tốt hơn. Các thư viện nặng dùng ít (xlsx, jsPDF, html2canvas,
// material-color-utilities) được import động nên chỉ tải khi người dùng thực sự cần.
export default defineConfig({
  plugins: [
    react(),
    darkManifest(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__\//], // đường dẫn đăng nhập của Firebase (/__/auth/...)
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts: ['recharts'],
        },
      },
    },
  },
});
