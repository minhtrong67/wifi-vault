import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Wifi } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';

/** Trang đăng nhập bằng Google. Đăng nhập xong sẽ quay lại đúng trang người dùng định vào ban đầu. */
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) navigate(location.state?.from?.pathname || '/', { replace: true });
  }, [user, navigate, location.state]);

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-sm animate-slideUp text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25"><Wifi size={30} /></span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Wifi Vault</h1>
        <p className="mt-2 text-slate-500 dark:text-zinc-400">Két sắt gọn gàng cho mọi mật khẩu wifi của bạn.</p>
        {!isFirebaseConfigured && (
          <p className="mt-6 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-left text-sm text-amber-800 dark:text-amber-200">Chưa cấu hình Firebase. Hãy điền các khoá <code>VITE_FIREBASE_*</code> vào file <code>.env</code> rồi chạy lại ứng dụng.</p>
        )}
        <Button className="btn-ghost mt-8 w-full py-3" onClick={login} disabled={!isFirebaseConfigured}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
          Đăng nhập với Google
        </Button>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500"><ShieldCheck size={14} /> Dữ liệu chỉ thuộc về tài khoản của bạn</p>
      </div>
    </div>
  );
}
