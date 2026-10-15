import { BarChart3, Home, Settings, Tags, Wifi } from 'lucide-react';

/** Danh sách điều hướng. `tab: true` = hiện ở thanh điều hướng dưới của mobile (4 mục hay dùng nhất) */
export const NAV = [
  { to: '/', key: 'nav.home', icon: Home, tab: true },
  { to: '/wifi', key: 'nav.wifi', shortKey: 'nav.wifiShort', icon: Wifi, tab: true },
  { to: '/categories', key: 'nav.categories', icon: Tags },
  { to: '/stats', key: 'nav.stats', icon: BarChart3, tab: true },
  { to: '/settings', key: 'nav.settings', icon: Settings, tab: true },
];
