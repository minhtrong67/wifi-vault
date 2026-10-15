import { useCallback, useState } from 'react';

/** useState nhưng được ghi nhớ trong sessionStorage (giữ khi chuyển trang / tải lại tab, mất khi đóng tab).
 *  Dùng cho bộ lọc của từng trang. Nếu storage bị chặn thì vẫn hoạt động như state thường. */
export function useSessionState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw !== null) {
        const v = JSON.parse(raw);
        // Giá trị object được trộn với mặc định để thêm trường mới sau này không làm hỏng dữ liệu cũ
        return initial && typeof initial === 'object' ? { ...initial, ...v } : v;
      }
    } catch { /* bỏ qua */ }
    return initial;
  });
  const set = useCallback((next) => {
    setValue((prev) => {
      const v = typeof next === 'function' ? next(prev) : next;
      try { sessionStorage.setItem(key, JSON.stringify(v)); } catch { /* bỏ qua */ }
      return v;
    });
  }, [key]);
  return [value, set];
}
