// Tập trung các import động của từng trang: dùng chung cho React.lazy() và việc tải trước (prefetch)
export const pageImports = {
  Home: () => import('./Home'),
  Wifi: () => import('./WifiPage'),
  Categories: () => import('./Categories'),
  Stats: () => import('./Stats'),
  Settings: () => import('./SettingsPage'),
};
