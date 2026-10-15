// Theo dõi trạng thái cài đặt PWA. Module này được nạp sớm ở main.jsx để không bỏ lỡ sự kiện
// `beforeinstallprompt` (trình duyệt chỉ phát sự kiện một lần, thường trước khi mở trang Cài đặt).
import { useSyncExternalStore } from 'react';

const standaloneQuery = () => window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)').matches || navigator.standalone === true;

let deferred = null;
let snapshot = { installed: standaloneQuery(), canPrompt: false };
const listeners = new Set();
const emit = (patch) => { snapshot = { ...snapshot, ...patch }; listeners.forEach((l) => l()); };

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit({ canPrompt: true }); });
window.addEventListener('appinstalled', () => { deferred = null; emit({ installed: true, canPrompt: false }); });
window.matchMedia('(display-mode: standalone)').addEventListener?.('change', () => emit({ installed: standaloneQuery() }));

const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Trả về { installed, canPrompt, install } — `install()` hiện hộp thoại cài đặt của trình duyệt */
export function useInstall() {
  const s = useSyncExternalStore(subscribe, () => snapshot);
  const install = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    emit({ canPrompt: false });
    return outcome === 'accepted';
  };
  return { ...s, install };
}
