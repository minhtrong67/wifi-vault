import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);
const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLOR = { success: 'text-emerald-600', error: 'text-red-600', info: 'text-blue-600 dark:text-blue-400' };

/** Toast thông báo góc màn hình, tự ẩn sau 3,5 giây */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((type, message) => {
    const id = crypto.randomUUID();
    setItems((s) => [...s.slice(-3), { id, type, message }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
  }, []);
  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) }), [push]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => {
          const I = ICON[t.type];
          return (
            <div key={t.id} className="pointer-events-auto flex max-w-sm animate-slideUp items-center gap-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm shadow-lg">
              <I size={18} className={COLOR[t.type]} /> {t.message}
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
