import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { listenCategories, listenWifis } from '../lib/db';
import { ACCENTS } from '../lib/colors';

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

/** Đồng bộ realtime wifi + danh mục cho toàn app (một lần lắng nghe duy nhất) */
export function DataProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [wifis, setWifis] = useState(null); // null = đang tải → hiển thị skeleton
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    const onErr = () => toast.error('Không thể tải dữ liệu. Hãy kiểm tra kết nối hoặc Firestore rules.');
    const a = listenWifis(user.uid, setWifis, onErr);
    const b = listenCategories(user.uid, (c) => setCategories(c.sort((x, y) => x.name.localeCompare(y.name, 'vi'))), onErr);
    return () => { a(); b(); };
  }, [user.uid, toast]);

  // Mỗi danh mục một màu phụ, dùng chung cho thẻ, nhãn và biểu đồ
  const catColors = useMemo(() => Object.fromEntries((categories || []).map((c, i) => [c.name, ACCENTS[i % ACCENTS.length]])), [categories]);
  const colorOf = useCallback((name) => catColors[name] || ACCENTS[0], [catColors]);

  const value = useMemo(() => ({ uid: user.uid, wifis, categories, colorOf, loading: wifis === null || categories === null }), [user.uid, wifis, categories, colorOf]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
