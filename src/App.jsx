import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { pageImports } from './pages/lazyPages';

// Tải trang theo nhu cầu (code-splitting) để mở app nhanh hơn; ProtectedRoute sẽ tải trước
// các trang này ngay khi xác thực xong, nên việc chuyển trang sau đó gần như tức thì.
const Home = lazy(pageImports.Home);
const WifiPage = lazy(pageImports.Wifi);
const Categories = lazy(pageImports.Categories);
const Stats = lazy(pageImports.Stats);
const SettingsPage = lazy(pageImports.Settings);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Mọi route bên dưới đều yêu cầu đăng nhập, được gác bởi ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="wifi" element={<WifiPage />} />
          <Route path="categories" element={<Categories />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
