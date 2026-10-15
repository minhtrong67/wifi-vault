import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui';
import Credits from '../components/Credits';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/SettingsContext';
import { isFirebaseConfigured } from '../lib/firebase';

/** Trang đăng nhập bằng Google. Đăng nhập xong sẽ quay lại đúng trang người dùng định vào ban đầu. */
export default function Login() {
  const { user, login } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) navigate(location.state?.from?.pathname || '/', { replace: true });
  }, [user, navigate, location.state]);

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      <div aria-hidden="true" className="absolute -left-24 -top-24 size-80 rounded-full bg-primary-container/60 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-20 size-96 rounded-full bg-tertiary-container/50 blur-3xl" />
      <div className="relative w-full max-w-sm animate-slideUp text-center">
        <img src="/icon-192.png" alt="" width="80" height="80" className="mx-auto size-20 rounded-[24px] shadow-el3" />
        <h1 className="mt-6 text-[32px] leading-10 text-on-surface">{t('app.name')}</h1>
        <p className="mt-2 text-on-surface-variant">{t('app.tagline')}</p>
        {!isFirebaseConfigured && (
          <p role="alert" className="mt-6 rounded-2xl bg-error-container p-4 text-left text-sm text-on-error-container">{t('auth.notConfigured')}</p>
        )}
        <Button variant="outlined" className="mt-8 h-12 w-full bg-surface" onClick={login} disabled={!isFirebaseConfigured}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
          {t('auth.google')}
        </Button>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant"><ShieldCheck size={14} /> {t('auth.privacy')}</p>
        <Credits compact className="mt-8" />
      </div>
    </div>
  );
}
