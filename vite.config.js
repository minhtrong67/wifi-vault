import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cấu hình Vite: tách vendor để tải nhanh hơn (tối ưu hiệu năng)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts: ['recharts'],
          xlsx: ['xlsx'],
          export: ['html2canvas', 'jspdf'],
        },
      },
    },
  },
});
