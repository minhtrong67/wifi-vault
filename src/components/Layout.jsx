import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, Search, Wifi, X } from 'lucide-react';
import { NAV } from './nav';
import SearchPalette from './SearchPalette';
import ScrollTop from './ScrollTop';
import { useAuth } from '../context/AuthContext';

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'}`;

/** Khung ứng dụng: header mobile, sidebar (drawer trên mobile), bottom bar, tìm nhanh Ctrl+K */
export default function Layout() {
  const { user, logout } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch((s) => !s); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 flex items-center gap-2.5 px-2 text-lg font-semibold">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white"><Wifi size={19} /></span> Wifi Vault
      </div>
      <nav className="space-y-1">{NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={linkCls}><n.icon size={18} className={n.color} /> {n.label}</NavLink>)}</nav>
      <div className="mt-auto space-y-3">
        <button onClick={() => setSearch(true)} className="hidden w-full items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 px-3 py-2 text-sm text-slate-500 dark:text-zinc-400 transition hover:bg-slate-50 dark:hover:bg-zinc-800/60 md:flex">
          <Search size={16} /> Tìm nhanh <kbd className="ml-auto text-xs">Ctrl K</kbd>
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 p-2.5">
          {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full" /> : <span className="size-9 rounded-full bg-blue-100 dark:bg-blue-500/20" />}
          <div className="min-w-0 flex-1 text-sm"><p className="truncate font-medium">{user.displayName}</p><p className="truncate text-xs text-slate-500 dark:text-zinc-400">{user.email}</p></div>
          <button onClick={logout} aria-label="Đăng xuất" className="rounded-lg p-2 text-slate-400 transition hover:bg-white dark:hover:bg-zinc-900 hover:text-red-600"><LogOut size={17} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh md:pl-64">
      {/* Sidebar cố định trên desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:block">{sidebar}</aside>
      {/* Drawer trên mobile */}
      {drawer && <div className="fixed inset-0 z-40 bg-slate-900/40 animate-fadeIn md:hidden" onClick={() => setDrawer(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 shadow-xl transition-transform duration-300 md:hidden ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</aside>

      {/* Header mobile: trái = tên web + toggle sidebar, phải = tìm kiếm */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/85 px-3 py-2.5 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawer(!drawer)} aria-label="Mở menu" className="rounded-lg p-1.5 text-slate-600 dark:text-zinc-300 transition hover:bg-slate-100 dark:hover:bg-zinc-800">{drawer ? <X size={21} /> : <Menu size={21} />}</button>
          <span className="flex items-center gap-1.5 font-semibold"><Wifi size={18} className="text-blue-600 dark:text-blue-400" /> Wifi Vault</span>
        </div>
        <button onClick={() => setSearch(true)} aria-label="Tìm kiếm" className="rounded-lg p-2 text-slate-600 dark:text-zinc-300 transition hover:bg-slate-100 dark:hover:bg-zinc-800"><Search size={20} /></button>
      </header>

      <main className="mx-auto max-w-5xl px-3.5 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8"><Outlet /></main>

      {/* Bottom bar mobile: 4 tab hay dùng */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.filter((n) => n.tab).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-400'}`}>
            <n.icon size={21} /> {n.short || n.label}
          </NavLink>
        ))}
      </nav>
      <SearchPalette open={search} onClose={() => setSearch(false)} />
      <ScrollTop />
    </div>
  );
}
