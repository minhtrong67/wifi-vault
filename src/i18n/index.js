import en from './en';
import vi from './vi';

export const DICTS = { en, vi };
export const LANGS = ['vi', 'en'];
export const LANG_NAMES = { vi: 'Tiếng Việt', en: 'English' };

/** Nhận diện ngôn ngữ thiết bị: lấy ngôn ngữ được hỗ trợ đầu tiên theo thứ tự ưu tiên của trình duyệt, mặc định tiếng Anh */
export function detectLanguage() {
  const list = (typeof navigator !== 'undefined' && (navigator.languages?.length ? navigator.languages : [navigator.language])) || [];
  for (const l of list) {
    const code = String(l || '').toLowerCase().split('-')[0];
    if (LANGS.includes(code)) return code;
  }
  return 'en';
}

/** Dịch khoá và thay {tham số}. Nhận cả đối tượng lỗi dạng { key, params } từ validate.js */
export function translate(lang, key, params) {
  if (key && typeof key === 'object') ({ key, params } = key);
  const d = DICTS[lang] || en;
  let s = d[key] ?? en[key] ?? key;
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
  return s;
}
