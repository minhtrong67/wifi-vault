import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Wifi } from "lucide-react";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";

// Tải trang theo nhu cầu (code-splitting) để mở app nhanh hơn
const Home = lazy(() => import("./pages/Home"));
const WifiPage = lazy(() => import("./pages/WifiPage"));
const Categories = lazy(() => import("./pages/Categories"));
const Stats = lazy(() => import("./pages/Stats"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const AppLoading = () => (
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

export default function App() {
  const { user, loading } = useAuth();

  // Loading authentication
  if (loading) {
    return <AppLoading />;
  }

  // Chưa đăng nhập
  if (!user) {
    return <Login />;
  }

  return (
    <DataProvider>
      <Suspense fallback={<AppLoading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="wifi" element={<WifiPage />} />
            <Route path="categories" element={<Categories />} />
            <Route path="stats" element={<Stats />} />
            <Route path="settings" element={<SettingsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </DataProvider>
  );
}
