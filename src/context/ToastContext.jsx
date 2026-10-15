import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);
const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };

/** Snackbar thông báo (Material 3): hiện ở cuối màn hình phía trên thanh điều hướng, tự ẩn sau 3,5 giây */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((type, message) => {
    const id = crypto.randomUUID();
    setItems((s) => [...s.slice(-2), { id, type, message }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
  }, []);
  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) }), [push]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {items.map((t) => {
          const I = ICON[t.type];
          return (
            <div key={t.id} role={t.type === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex min-h-12 w-full max-w-md animate-snack items-center gap-3 rounded-xl bg-inverse-surface px-4 py-3 text-sm text-inverse-on-surface shadow-el3">
              <I size={20} className={`shrink-0 ${t.type === 'error' ? 'text-[#FFB4AB]' : 'text-inverse-primary'}`} /> <span className="min-w-0 break-words">{t.message}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
