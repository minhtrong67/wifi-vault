import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { listenCategories, listenWifis } from '../lib/db';
import { ACCENTS } from '../lib/colors';
import { useT } from './SettingsContext';

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

/** Đồng bộ realtime wifi + danh mục cho toàn app (một lần lắng nghe duy nhất) */
export function DataProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const { t, lang } = useT();
  const [wifis, setWifis] = useState(null); // null = đang tải → hiển thị skeleton
  const [rawCats, setRawCats] = useState(null);
  const tRef = useRef(t); // giữ t mới nhất mà không phải đăng ký lại listener khi đổi ngôn ngữ
  tRef.current = t;

  useEffect(() => {
    const onErr = () => toast.error(tRef.current('data.loadFail'));
    const a = listenWifis(user.uid, setWifis, onErr);
    const b = listenCategories(user.uid, setRawCats, onErr);
    return () => { a(); b(); };
  }, [user.uid, toast]);

  // Danh mục hiển thị theo tên (đúng ngôn ngữ đang dùng)
  const categories = useMemo(() => rawCats && [...rawCats].sort((x, y) => x.name.localeCompare(y.name, lang)), [rawCats, lang]);

  // Mỗi danh mục một màu, gán theo thứ tự tạo nên thêm danh mục mới không làm đổi màu các danh mục cũ
  const catColors = useMemo(
    () => Object.fromEntries([...(rawCats || [])].sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0) || x.name.localeCompare(y.name)).map((c, i) => [c.name, ACCENTS[i % ACCENTS.length]])),
    [rawCats]
  );
  const colorOf = useCallback((name) => catColors[name] || ACCENTS[0], [catColors]);

  const value = useMemo(() => ({ uid: user.uid, wifis, categories, colorOf, loading: wifis === null || categories === null }), [user.uid, wifis, categories, colorOf]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
