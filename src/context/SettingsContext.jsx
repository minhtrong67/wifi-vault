import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SCHEMES, DEFAULT_SEED, schemesFromSeed, schemesToCss } from '../theme/theme';
import { detectLanguage, translate } from '../i18n';

const Ctx = createContext(null);
export const useSettings = () => useContext(Ctx);
/** Chỉ cần `t` và ngôn ngữ đang dùng */
export const useT = () => {
  const { t, lang } = useContext(Ctx);
  return { t, lang };
};

export const FONT_SIZES = [
  { key: 'settings.font.small', px: 14 },
  { key: 'settings.font.medium', px: 16 },
  { key: 'settings.font.large', px: 18 },
];
export const MODES = ['light', 'dark', 'system'];

// lang: 'auto' = theo ngôn ngữ thiết bị; seed = màu chủ đề (hex); startPage = trang mở khi khởi động app
const DEFAULTS = { fontSize: 16, theme: 'system', lang: 'auto', seed: DEFAULT_SEED, startPage: '/' };
const KEY = 'wifi-vault:settings';
const CSS_KEY = 'wifi-vault:theme-css'; // CSS của màu tuỳ chỉnh, nạp sớm trong index.html để không bị nháy màu

const readSettings = () => {
  try {
    const s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) };
    // Cỡ chữ đã lưu ngoài 3 mức hiện có (vd. 20px của bản cũ) → đưa về mức gần nhất
    s.fontSize = FONT_SIZES.reduce((a, b) => (Math.abs(b.px - s.fontSize) < Math.abs(a.px - s.fontSize) ? b : a)).px;
    return s;
  } catch { return DEFAULTS; }
};

/** Cài đặt giao diện: sáng/tối, màu chủ đề Material, cỡ chữ, ngôn ngữ, trang mặc định. Lưu ở localStorage. */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readSettings);
  const [schemes, setSchemes] = useState(DEFAULT_SCHEMES);
  const [dark, setDark] = useState(false);
  const [deviceLang, setDeviceLang] = useState(detectLanguage);

  // Theo dõi thay đổi ngôn ngữ của thiết bị (khi đang ở chế độ Tự động)
  useEffect(() => {
    const h = () => setDeviceLang(detectLanguage());
    window.addEventListener('languagechange', h);
    return () => window.removeEventListener('languagechange', h);
  }, []);

  const lang = settings.lang === 'auto' ? deviceLang : settings.lang;
  const t = useCallback((key, params) => translate(lang, key, params), [lang]);

  // Ngôn ngữ cho thẻ <html>, tiêu đề và mô tả trang
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(lang, 'app.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', translate(lang, 'app.description'));
  }, [lang]);

  // Cỡ chữ gốc + lưu cài đặt
  useEffect(() => {
    document.documentElement.style.setProperty('--fs', `${settings.fontSize}px`);
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* bỏ qua khi bị chặn storage */ }
  }, [settings]);

  // Chế độ sáng/tối; ở chế độ "hệ thống" theo dõi thay đổi của thiết bị
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', isDark);
      setDark(isDark);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  // Màu chủ đề: sinh bảng màu Material 3 từ màu hạt rồi ghi đè CSS variables
  useEffect(() => {
    let cancelled = false;
    let el = document.getElementById('md-theme');
    if (!el) { el = document.createElement('style'); el.id = 'md-theme'; document.head.appendChild(el); }
    if (settings.seed.toUpperCase() === DEFAULT_SEED) {
      el.textContent = '';
      setSchemes(DEFAULT_SCHEMES);
      try { localStorage.removeItem(CSS_KEY); } catch { /* ignore */ }
      return;
    }
    schemesFromSeed(settings.seed).then((s) => {
      if (cancelled) return;
      const css = schemesToCss(s.light, s.dark, true);
      el.textContent = css;
      setSchemes(s);
      try { localStorage.setItem(CSS_KEY, JSON.stringify({ seed: settings.seed, css })); } catch { /* ignore */ }
    });
    return () => { cancelled = true; };
  }, [settings.seed]);

  // Màu thanh trạng thái/PWA theo màu nền của giao diện đang dùng. Manifest chuyển sang bản tối
  // (background_color + theme_color tối) để màn hình khởi động và thanh tiêu đề của app đã cài khớp với giao diện.
  useEffect(() => {
    const surface = (dark ? schemes.dark : schemes.light).surface;
    document.querySelectorAll('meta[name="theme-color"]').forEach((n, i) => { if (i) n.remove(); });
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.removeAttribute('media');
    m.setAttribute('content', surface);
    document.querySelector('link[rel="manifest"]')?.setAttribute('href', dark ? '/manifest-dark.webmanifest' : '/manifest.webmanifest');
  }, [dark, schemes]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings(DEFAULTS), []);
  const value = useMemo(
    () => ({ settings, update, reset, t, lang, deviceLang, dark, colors: dark ? schemes.dark : schemes.light, lightColors: schemes.light }),
    [settings, update, reset, t, lang, deviceLang, dark, schemes]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
