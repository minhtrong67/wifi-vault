// Xuất / nhập dữ liệu wifi và danh mục dạng CSV, Excel (XLSX) và JSON.
// Thư viện xlsx khá nặng nên chỉ được tải khi người dùng thực sự xuất/nhập.
import { clean, normalizeWifi } from './validate';

export const FORMATS = ['csv', 'xlsx', 'json'];
export const ACCEPT = '.csv,.xlsx,.xls,.json';

/** Lỗi có khoá i18n để hiển thị đúng ngôn ngữ */
export class FileError extends Error {
  constructor(key) { super(key); this.key = key; }
}

const WIFI_FIELDS = ['name', 'password', 'category', 'note'];
// Cho phép tiêu đề cột tiếng Anh hoặc tiếng Việt
const ALIASES = {
  name: ['name', 'ten', 'tenwifi', 'ssid'],
  password: ['password', 'matkhau', 'pass'],
  category: ['category', 'danhmuc'],
  note: ['note', 'ghichu'],
};
const CAT_ALIASES = ['name', 'ten', 'tendanhmuc', 'category', 'danhmuc'];
const key = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z]/g, '');
const xlsx = () => import('xlsx');

export const download = (blob, filename) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
export const stamp = () => new Date().toISOString().slice(0, 10);
const plain = (list) => list.map(({ name, password, category, note }) => ({ name, password, category, note: note || '' }));

/** Ghi mảng đối tượng ra file theo định dạng; trả về số dòng đã xuất */
async function writeRows(rows, header, sheet, base, format) {
  if (format === 'json') {
    download(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }), `${base}.json`);
    return rows.length;
  }
  const X = await xlsx();
  const ws = X.utils.json_to_sheet(rows, { header });
  if (format === 'csv') {
    // BOM giúp Excel hiển thị đúng tiếng Việt
    download(new Blob(['﻿' + X.utils.sheet_to_csv(ws)], { type: 'text/csv;charset=utf-8' }), `${base}.csv`);
  } else {
    ws['!cols'] = header.map((h) => ({ wch: Math.min(40, Math.max(h.length + 2, ...rows.map((r) => String(r[h] ?? '').length + 2))) }));
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, sheet);
    X.writeFile(wb, `${base}.xlsx`);
  }
  return rows.length;
}

/** Xuất toàn bộ wifi ra CSV | XLSX | JSON */
export const exportWifis = (list, format) => writeRows(plain(list), WIFI_FIELDS, 'Wifi', `wifi-vault-wifi-${stamp()}`, format);
/** Xuất danh sách danh mục ra CSV | XLSX | JSON (list: mảng tên hoặc đối tượng { name }) */
export const exportCategories = (list, format) =>
  writeRows(list.map((c) => ({ name: typeof c === 'string' ? c : c.name })), ['name'], 'Categories', `wifi-vault-categories-${stamp()}`, format);

/** Xuất cả wifi và danh mục: JSON = một file { wifis, categories }; XLSX = một file hai trang tính; CSV = hai file */
export async function exportAll(wifis, categories, format) {
  const w = plain(wifis);
  const c = categories.map((x) => ({ name: typeof x === 'string' ? x : x.name }));
  const base = `wifi-vault-${stamp()}`;
  if (format === 'json') {
    download(new Blob([JSON.stringify({ wifis: w, categories: c }, null, 2)], { type: 'application/json' }), `${base}.json`);
  } else if (format === 'xlsx') {
    const X = await xlsx();
    const wb = X.utils.book_new();
    const add = (rows, header, name) => {
      const ws = X.utils.json_to_sheet(rows, { header });
      ws['!cols'] = header.map((h) => ({ wch: Math.min(40, Math.max(h.length + 2, ...rows.map((r) => String(r[h] ?? '').length + 2))) }));
      X.utils.book_append_sheet(wb, ws, name);
    };
    add(w, WIFI_FIELDS, 'Wifi');
    add(c, ['name'], 'Categories');
    X.writeFile(wb, `${base}.xlsx`);
  } else {
    await writeRows(w, WIFI_FIELDS, 'Wifi', `${base}-wifi`, 'csv');
    await new Promise((r) => setTimeout(r, 400)); // tách hai lần tải để trình duyệt không chặn
    await writeRows(c, ['name'], 'Categories', `${base}-categories`, 'csv');
  }
  return { wifis: w.length, categories: c.length };
}

/** Đọc file → { rows: mảng đối tượng thô } hoặc { json } (với JSON). `sheet`: tên trang tính ưu tiên với file Excel nhiều trang */
async function parse(file, sheet) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'json') {
    try { return { json: JSON.parse((await file.text()).replace(/^﻿/, '')) }; } catch { throw new FileError('settings.data.readFail'); }
  }
  if (!['csv', 'xlsx', 'xls'].includes(ext)) throw new FileError('file.errFormat');
  try {
    const X = await xlsx();
    // raw: true giữ nguyên chuỗi trong CSV (không biến "0123456789" thành số 123456789 làm mất số 0 đầu của mật khẩu)
    const wb = ext === 'csv' ? X.read((await file.text()).replace(/^﻿/, ''), { type: 'string', raw: true }) : X.read(await file.arrayBuffer());
    const name = wb.SheetNames.find((n) => n.toLowerCase() === sheet) || wb.SheetNames[0];
    return { rows: X.utils.sheet_to_json(wb.Sheets[name], { defval: '', raw: false }) };
  } catch {
    throw new FileError('settings.data.readFail');
  }
}

/** Đổi một dòng thô thành object wifi theo alias cột */
function mapWifi(raw) {
  if (!raw || typeof raw !== 'object') return normalizeWifi({});
  const keys = Object.keys(raw);
  const out = {};
  for (const f of WIFI_FIELDS) {
    const k = keys.find((k) => ALIASES[f].includes(key(k)));
    out[f] = k ? raw[k] : '';
  }
  return normalizeWifi(out);
}

/** Đọc file (.csv/.xlsx/.xls/.json) → mảng wifi đã chuẩn hoá */
export async function readWifiFile(file) {
  const { rows, json } = await parse(file, 'wifi');
  if (rows) return rows.map(mapWifi);
  const list = Array.isArray(json) ? json : json?.wifis;
  if (!Array.isArray(list)) throw new FileError('file.errJson');
  return list.map(mapWifi);
}

/** Đọc file → mảng tên danh mục đã chuẩn hoá (chưa kiểm tra hợp lệ) */
export async function readCategoryFile(file) {
  const { rows, json } = await parse(file, 'categories');
  let names;
  if (rows) {
    const keys = Object.keys(rows[0] || {});
    const k = keys.find((k) => CAT_ALIASES.includes(key(k)));
    // Không có tiêu đề khớp (file chỉ gồm danh sách tên) → dòng đầu bị đọc thành tiêu đề, nên thêm lại làm một danh mục
    names = k ? rows.map((r) => r[k]) : keys.length ? [keys[0], ...rows.map((r) => r[keys[0]])] : [];
  } else {
    const list = Array.isArray(json) ? json : json?.categories;
    if (!Array.isArray(list)) throw new FileError('file.errJsonCat');
    names = list.map((c) => (c && typeof c === 'object' ? c.name : c));
  }
  return names.map(clean);
}
