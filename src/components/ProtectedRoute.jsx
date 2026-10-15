import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useT } from "../context/SettingsContext";
import { DataProvider } from "../context/DataContext";
import { pageImports } from "../pages/lazyPages";

/** Màn hình chờ toàn trang — chỉ hiện đúng một lần lúc Firebase xác thực phiên đăng nhập ban đầu */
const AuthChecking = () => {
  const { t } = useT();
  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-6" role="status">
      <div className="flex flex-col items-center text-center">
        <img src="/icon-192.png" alt="" width="72" height="72" className="size-[72px] animate-pop rounded-[22px] shadow-el3" />
        <p className="mt-4 text-base font-medium text-on-surface">{t('app.name')}</p>
        <div className="mt-4 h-1 w-28 overflow-hidden rounded-full bg-secondary-container">
          <div className="h-full w-1/2 animate-loading rounded-full bg-primary" />
        </div>
        <span className="sr-only">{t('auth.checking')}</span>
      </div>
    </div>
  );
};

/** Bảo vệ các route cần đăng nhập: chờ Firebase xác thực xong đúng một lần, sau đó chỉ điều hướng
 *  theo trạng thái user chứ không kiểm tra lại mỗi khi chuyển trang — tránh hiện loading liên tục. */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Khi đã đăng nhập, tải trước (prefetch) toàn bộ các trang lúc rảnh để chuyển trang sau đó không phải chờ
  useEffect(() => {
    if (!user) return;
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = idle(() =>
      Object.values(pageImports).forEach((imp) => imp().catch(() => {})),
    );
    return () => cancel(id);
  }, [user]);

  if (loading) return <AuthChecking />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <DataProvider>
      <Outlet />
    </DataProvider>
  );
}
