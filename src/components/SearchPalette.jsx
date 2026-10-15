import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Wifi } from 'lucide-react';
import { NAV } from './nav';
import { useScrollLock } from './ui';
import { useData } from '../context/DataContext';
import { useT } from '../context/SettingsContext';

/** Menu tìm nhanh (Ctrl/⌘ + K): nhảy tới trang hoặc mạng wifi. Dùng ↑ ↓ để chọn, Enter để mở. */
export default function SearchPalette({ open, onClose }) {
  const { wifis } = useData();
  const { t } = useT();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef();
  useScrollLock(open);
  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => ref.current?.focus(), 30); } }, [open]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pages = NAV.map((n) => ({ key: n.to, label: t(n.key), icon: n.icon, to: n.to })).filter((n) => !s || n.label.toLowerCase().includes(s));
    const items = s ? (wifis || []).filter((w) => `${w.name} ${w.note} ${w.category}`.toLowerCase().includes(s)).slice(0, 6).map((w) => ({ key: w.id, label: w.name, sub: w.category, icon: Wifi, to: `/wifi?q=${encodeURIComponent(w.name)}` })) : [];
    return [...pages, ...items];
  }, [q, wifis, t]);
  useEffect(() => setActive(0), [q]);
  const go = (to) => { onClose(); nav(to); };
  const key = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) go(results[active].to);
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-scrim/40 p-4 pt-[10vh] animate-fadeIn" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t('search.quick')} className="w-full max-w-lg animate-pop overflow-hidden rounded-[28px] bg-surface-container-high shadow-el3" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex h-14 items-center gap-3 border-b border-outline-variant px-5">
          <Search size={20} className="text-on-surface-variant" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={key} placeholder={t('search.placeholder')}
            className="h-full w-full bg-transparent text-base text-on-surface outline-none placeholder:text-on-surface-variant" />
          <kbd className="hidden rounded bg-surface-container-highest px-1.5 py-0.5 text-xs text-on-surface-variant sm:block">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-on-surface-variant">{t('search.empty')}</li>}
          {results.map((r, i) => (
            <li key={r.key} role="option" aria-selected={i === active}>
              <button type="button" onMouseMove={() => setActive(i)} onClick={() => go(r.to)}
                className={`flex h-12 w-full items-center gap-3 rounded-full px-4 text-left text-sm transition-colors ${i === active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'}`}>
                <r.icon size={18} className={i === active ? '' : 'text-primary'} /> <span className="truncate">{r.label}</span>
                {r.sub && <span className="ml-auto shrink-0 text-xs opacity-70">{r.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
