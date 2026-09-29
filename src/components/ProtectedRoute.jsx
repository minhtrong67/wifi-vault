import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Wifi } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DataProvider } from "../context/DataContext";
import { pageImports } from "../pages/lazyPages";

/** Màn hình chờ toàn trang — chỉ hiện đúng một lần lúc Firebase xác thực phiên đăng nhập ban đầu */
const AuthChecking = () => (
  <div className="grid min-h-dvh place-items-center bg-white px-6 dark:bg-zinc-950">
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 scale-125 rounded-[28px] bg-blue-500/15 blur-xl" />

        <div className="relative flex size-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_8px_30px_-8px_rgba(59,130,246,0.55)]">
          <Wifi size={29} strokeWidth={2.2} />
        </div>
      </div>

      <p className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
        Wifi Vault
      </p>

      <div className="mt-4 h-1 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="
            h-full w-1/2 rounded-full
            bg-blue-500
            animate-[loading_1.2s_ease-in-out_infinite]
          "
        />
      </div>
    </div>
  </div>
);

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
