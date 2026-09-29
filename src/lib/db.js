// Tầng truy cập Firestore: users/{uid}/wifis, users/{uid}/categories
import { collection, doc, writeBatch, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { wifiId } from './validate';

const CHUNK = 400; // Firestore giới hạn 500 thao tác / batch

const wifisCol = (uid) => collection(db, 'users', uid, 'wifis');
const catsCol = (uid) => collection(db, 'users', uid, 'categories');
export const catId = (name) => `c-${wifiId(name)}`;

/** Lắng nghe realtime một collection */
const listen = (col, cb, onErr) =>
  onSnapshot(query(col), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), onErr);
export const listenWifis = (uid, cb, onErr) => listen(wifisCol(uid), cb, onErr);
export const listenCategories = (uid, cb, onErr) => listen(catsCol(uid), cb, onErr);

/** Chạy danh sách thao tác theo từng batch */
async function runBatches(ops) {
  for (let i = 0; i < ops.length; i += CHUNK) {
    const b = writeBatch(db);
    ops.slice(i, i + CHUNK).forEach((op) => op(b));
    await b.commit();
  }
}

/** Thêm/ghi đè wifi theo tên (ID = hash tên) → không bao giờ trùng lặp. */
export async function upsertWifis(uid, list, existingIds = new Set()) {
  const now = Date.now();
  const map = new Map(); // gộp trùng ngay trong file, dòng sau ghi đè dòng trước
  list.forEach((w) => map.set(wifiId(w.name), w));
  const ops = [...map].map(([id, w]) => (b) =>
    b.set(doc(wifisCol(uid), id), { ...w, updatedAt: now, ...(existingIds.has(id) ? {} : { createdAt: now }) }, { merge: true })
  );
  // Tự tạo danh mục còn thiếu
  [...new Set(list.map((w) => w.category))].forEach((c) =>
    ops.push((b) => b.set(doc(catsCol(uid), catId(c)), { name: c, createdAt: now }, { merge: true }))
  );
  await runBatches(ops);
  return { total: map.size, updated: [...map.keys()].filter((id) => existingIds.has(id)).length };
}

/** Sửa wifi; nếu đổi tên thì xoá document cũ và tạo document mới */
export async function updateWifi(uid, oldId, w, createdAt) {
  const newId = wifiId(w.name);
  const b = writeBatch(db);
  if (newId !== oldId) b.delete(doc(wifisCol(uid), oldId));
  b.set(doc(wifisCol(uid), newId), { ...w, createdAt, updatedAt: Date.now() });
  await b.commit();
}
export const deleteWifis = (uid, ids) => runBatches(ids.map((id) => (b) => b.delete(doc(wifisCol(uid), id))));

export const addCategory = (uid, name) => runBatches([(b) => b.set(doc(catsCol(uid), catId(name)), { name, createdAt: Date.now() })]);
export const deleteCategory = (uid, id) => runBatches([(b) => b.delete(doc(catsCol(uid), id))]);

/** Đổi tên danh mục và cập nhật toàn bộ wifi đang dùng danh mục đó */
export async function renameCategory(uid, cat, newName, wifis) {
  const ops = [(b) => b.delete(doc(catsCol(uid), cat.id)), (b) => b.set(doc(catsCol(uid), catId(newName)), { name: newName, createdAt: cat.createdAt || Date.now() })];
  wifis.filter((w) => w.category === cat.name).forEach((w) => ops.push((b) => b.update(doc(wifisCol(uid), w.id), { category: newName, updatedAt: Date.now() })));
  await runBatches(ops);
}

