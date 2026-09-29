import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const Ctx = createContext(null);
export const useSettings = () => useContext(Ctx);
export const FONT_SIZES = [{ label: 'Nhỏ', px: 14 }, { label: 'Vừa', px: 16 }, { label: 'Lớn', px: 18 }, { label: 'Rất lớn', px: 20 }];
export const THEMES = ['light', 'dark', 'system'];
const DEFAULTS = { fontSize: 16, theme: 'system' };
const KEY = 'wifi-vault:settings';

/** Cài đặt giao diện (cỡ chữ, sáng/tối/hệ thống), lưu ở localStorage */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return DEFAULTS; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--fs', `${settings.fontSize}px`);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    // Áp dụng chế độ sáng/tối; ở chế độ "hệ thống" sẽ theo dõi thay đổi của thiết bị
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      root.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f172a' : '#2563eb');
    };
    apply();
    mq.addEventListener('change', apply);
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* bỏ qua khi bị chặn storage */ }
    return () => mq.removeEventListener('change', apply);
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings(DEFAULTS), []);
  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
