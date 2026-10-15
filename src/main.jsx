import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { registerSW } from 'virtual:pwa-register';
import './lib/pwa'; // bắt sự kiện cài đặt PWA sớm
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Service worker do vite-plugin-pwa tạo (chỉ ở bản build production): cache app shell, tự cập nhật khi có bản mới
if (import.meta.env.PROD) registerSW({ immediate: true });
