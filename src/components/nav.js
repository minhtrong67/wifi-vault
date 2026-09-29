import { BarChart3, Home, Settings, Tags, Wifi } from 'lucide-react';

/** Danh sách điều hướng. `tab: true` = hiện ở bottom bar mobile (4 tab hay dùng nhất) */
export const NAV = [
  { to: '/', label: 'Trang chủ', icon: Home, color: 'text-blue-500', tab: true },
  { to: '/wifi', label: 'Quản lý wifi', short: 'Wifi', icon: Wifi, color: 'text-cyan-500', tab: true },
  { to: '/categories', label: 'Danh mục', icon: Tags, color: 'text-violet-500' },
  { to: '/stats', label: 'Thống kê', icon: BarChart3, color: 'text-emerald-500', tab: true },
  { to: '/settings', label: 'Cài đặt', icon: Settings, color: 'text-amber-500', tab: true },
];
