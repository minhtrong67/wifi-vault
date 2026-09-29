import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { useToast } from './ToastContext';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

/** Quản lý đăng nhập Google */
export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  const login = useCallback(async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { if (e.code !== 'auth/popup-closed-by-user') toast.error('Đăng nhập thất bại. Vui lòng thử lại.'); }
  }, [toast]);
  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
