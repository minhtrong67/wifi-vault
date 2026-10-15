import { Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Search, Sun, Monitor } from 'lucide-react';
import { NAV } from './nav';
import SearchPalette from './SearchPalette';
import ScrollTop from './ScrollTop';
import { IconButton, PageSkeleton, ripple, useScrollLock } from './ui';
import { useAuth } from '../context/AuthContext';
import { useSettings, useT } from '../context/SettingsContext';

let launched = false; // chỉ chuyển tới "trang mặc định" đúng một lần mỗi lần mở app

/** Nút đổi nhanh sáng → tối → hệ thống */
function ThemeToggle({ className = '' }) {
  const { settings, update, dark } = useSettings();
  const { t } = useT();

  const nextTheme = {
    light: 'dark',
    dark: 'system',
    system: 'light',
  };

  return (
    <IconButton
      icon={settings.theme === 'system' ? Monitor : dark ? Sun : Moon}
      label={
        settings.theme === 'system'
          ? t('theme.system')
          : dark
            ? t('theme.toggleLight')
            : t('theme.toggleDark')
      }
      className={className}
      onClick={() => update({ theme: nextTheme[settings.theme] ?? 'system' })}
      data-mode={settings.theme}
    />
  );
}

/** Khung ứng dụng Material 3: top app bar + navigation bar (mobile), navigation drawer (desktop), tìm nhanh Ctrl+K */
export default function Layout() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { t } = useT();
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useScrollLock(drawer);

  // Mở app → chuyển tới trang mặc định người dùng chọn (không ép lại khi tự bấm "Trang chủ")
  useLayoutEffect(() => {
    if (launched) return;
    launched = true;
    if (pathname === '/' && settings.startPage !== '/' && NAV.some((n) => n.to === settings.startPage)) navigate(settings.startPage, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch((s) => !s); }
      if (e.key === 'Escape') setDrawer(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col px-3 py-5">
      <div className="flex items-center justify-between gap-2 pl-3 pr-1">
        <span className="truncate text-[22px] text-on-surface">Wifi Vault</span>
        <ThemeToggle className="hidden md:grid" />
      </div>
      <nav className="mt-6 space-y-1" aria-label="Main">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} onPointerDown={ripple}
            className={({ isActive }) => `state flex h-14 items-center gap-3 rounded-full px-4 text-sm font-medium transition-colors duration-200 ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'}`}>
            <n.icon size={22} /> {t(n.key)}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-3">
        <button type="button" onClick={() => setSearch(true)} onPointerDown={ripple} className="state hidden h-12 w-full items-center gap-3 rounded-full border border-outline-variant px-4 text-sm text-on-surface-variant md:flex">
          <Search size={18} /> {t('search.quick')} <kbd className="ml-auto rounded bg-surface-container-highest px-1.5 py-0.5 text-xs">Ctrl K</kbd>
        </button>
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-high p-3">
          {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-10 rounded-full" /> : <span className="size-10 rounded-full bg-primary-container" />}
          <div className="min-w-0 flex-1 text-sm"><p className="truncate font-medium">{user.displayName}</p><p className="truncate text-xs text-on-surface-variant">{user.email}</p></div>
          <IconButton icon={LogOut} label={t('auth.logout')} onClick={logout} size={18} className="hover:text-error" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh md:pl-72">
      {/* Navigation drawer cố định trên desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-outline-variant/60 bg-surface-container-low md:block">{sidebar}</aside>
      {/* Drawer dạng modal trên mobile */}
      <div className={`fixed inset-0 z-40 bg-scrim/40 transition-opacity duration-300 md:hidden ${drawer ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setDrawer(false)} />
      <aside inert={drawer ? undefined : ''} className={`fixed inset-y-0 left-0 z-50 w-[19rem] max-w-[85vw] rounded-r-[28px] bg-surface-container-low shadow-el3 transition-transform duration-300 ease-emphasized md:hidden ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</aside>

      {/* Top app bar (mobile) */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-1 bg-surface/90 px-1.5 backdrop-blur md:hidden">
        <IconButton icon={Menu} label={t('nav.menu')} onClick={() => setDrawer(true)} className="text-on-surface" />
        <span className="flex-1 truncate text-[22px] text-on-surface">Wifi Vault</span>
        <IconButton icon={Search} label={t('search.open')} onClick={() => setSearch(true)} className="text-on-surface-variant" />
        <ThemeToggle className="text-on-surface-variant" />
      </header>

      {/* Chỉ vùng nội dung này hiện skeleton khi tải trang mới — khung ứng dụng luôn giữ nguyên */}
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-3 md:px-8 md:pb-24 md:pt-8">
        <Suspense fallback={<PageSkeleton />}>
          <div key={pathname} className="animate-fadeThrough"><Outlet /></div>
        </Suspense>
      </main>

      {/* Navigation bar (mobile): 4 mục hay dùng */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 bg-surface-container pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.filter((n) => n.tab).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className="group flex flex-col items-center gap-1 pb-3 pt-3 text-xs font-medium">
            {({ isActive }) => (
              <>
                <span className={`grid h-8 w-16 place-items-center rounded-full transition-colors duration-300 ease-emphasized group-active:scale-95 ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'}`}><n.icon size={22} /></span>
                <span className={isActive ? 'text-on-surface' : 'text-on-surface-variant'}>{t(n.shortKey || n.key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <SearchPalette open={search} onClose={() => setSearch(false)} />
      <ScrollTop />
    </div>
  );
}
