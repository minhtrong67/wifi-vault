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

/** Trả về object lỗi theo field; rỗng nghĩa là hợp lệ */
export function validateWifi(w, categoryNames = null) {
  const e = {};
  if (!w.name) e.name = 'Vui lòng nhập tên wifi.';
  else if (w.name.length > LIMITS.name) e.name = `Tên wifi tối đa ${LIMITS.name} ký tự.`;
  if (!w.password) e.password = 'Vui lòng nhập mật khẩu.';
  else if (w.password.length < LIMITS.passMin || w.password.length > LIMITS.passMax)
    e.password = `Mật khẩu phải từ ${LIMITS.passMin} đến ${LIMITS.passMax} ký tự.`;
  if (!w.category) e.category = 'Vui lòng chọn danh mục.';
  else if (w.category.length > LIMITS.category) e.category = `Danh mục tối đa ${LIMITS.category} ký tự.`;
  else if (categoryNames && !categoryNames.includes(w.category)) e.category = 'Danh mục không tồn tại.';
  if (w.note.length > LIMITS.note) e.note = `Ghi chú tối đa ${LIMITS.note} ký tự.`;
  return e;
}

export const validateCategory = (name, existing, selfName = null) => {
  const n = clean(name);
  if (!n) return 'Vui lòng nhập tên danh mục.';
  if (n.length > LIMITS.category) return `Tên danh mục tối đa ${LIMITS.category} ký tự.`;
  if (existing.some((x) => x.toLowerCase() === n.toLowerCase() && x !== selfName)) return 'Danh mục này đã tồn tại.';
  return '';
};

/** Khoá duy nhất theo tên wifi (không phân biệt hoa thường/dấu) → ID document.
 *  Nhờ vậy import lại cùng tên sẽ GHI ĐÈ thay vì tạo bản sao. */
export function wifiId(name) {
  const norm = clean(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  let h = 5381; // hash djb2 để tránh trùng khi slug giống nhau
  for (const ch of clean(name).toLowerCase()) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0;
  return `${norm.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'wifi'}-${h.toString(36)}`;
}
