// Chuẩn hoá & kiểm tra dữ liệu wifi. Dùng chung cho form và import để không lưu dữ liệu sai.

/** Bỏ khoảng trắng đầu/cuối và gộp khoảng trắng liên tiếp thành một */
export const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
/** Mật khẩu: chỉ trim đầu/cuối (giữ nguyên ký tự bên trong) */
export const cleanPassword = (v) => String(v ?? '').trim();

export const LIMITS = { name: 32, passMin: 8, passMax: 63, note: 200, category: 30 };

/** Chuẩn hoá một bản ghi wifi (tự động trim) */
export const normalizeWifi = (w) => ({
  name: clean(w.name),
  password: cleanPassword(w.password),
  category: clean(w.category),
  note: clean(w.note),
});

/** Trả về object lỗi theo field dạng { key, params } (dịch bằng t()); rỗng nghĩa là hợp lệ */
export function validateWifi(w, categoryNames = null) {
  const e = {};
  if (!w.name) e.name = { key: 'val.nameRequired' };
  else if (w.name.length > LIMITS.name) e.name = { key: 'val.nameMax', params: { n: LIMITS.name } };
  if (!w.password) e.password = { key: 'val.passRequired' };
  else if (w.password.length < LIMITS.passMin || w.password.length > LIMITS.passMax)
    e.password = { key: 'val.passRange', params: { min: LIMITS.passMin, max: LIMITS.passMax } };
  if (!w.category) e.category = { key: 'val.catRequired' };
  else if (w.category.length > LIMITS.category) e.category = { key: 'val.catMax', params: { n: LIMITS.category } };
  else if (categoryNames && !categoryNames.includes(w.category)) e.category = { key: 'val.catMissing' };
  if (w.note.length > LIMITS.note) e.note = { key: 'val.noteMax', params: { n: LIMITS.note } };
  return e;
}

/** Trả về null nếu hợp lệ, hoặc { key, params } */
export const validateCategory = (name, existing, selfName = null) => {
  const n = clean(name);
  if (!n) return { key: 'val.catNameRequired' };
  if (n.length > LIMITS.category) return { key: 'val.catNameMax', params: { n: LIMITS.category } };
  if (existing.some((x) => x.toLowerCase() === n.toLowerCase() && x !== selfName)) return { key: 'val.catExists' };
  return null;
};

/** Khoá duy nhất theo tên wifi (không phân biệt hoa thường/dấu) → ID document.
 *  Nhờ vậy import lại cùng tên sẽ GHI ĐÈ thay vì tạo bản sao. */
export function wifiId(name) {
  const norm = clean(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  let h = 5381; // hash djb2 để tránh trùng khi slug giống nhau
  for (const ch of clean(name).toLowerCase()) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0;
  return `${norm.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'wifi'}-${h.toString(36)}`;
}
