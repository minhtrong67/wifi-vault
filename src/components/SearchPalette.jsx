import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Wifi } from 'lucide-react';
import { NAV } from './nav';
import { useData } from '../context/DataContext';

/** Menu tìm nhanh (Ctrl/⌘ + K): nhảy tới trang hoặc mạng wifi */
export default function SearchPalette({ open, onClose }) {
  const { wifis } = useData();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const ref = useRef();
  useEffect(() => { if (open) { setQ(''); setTimeout(() => ref.current?.focus(), 30); } }, [open]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pages = NAV.filter((n) => !s || n.label.toLowerCase().includes(s)).map((n) => ({ key: n.to, label: n.label, icon: n.icon, color: n.color, to: n.to }));
    const items = s ? (wifis || []).filter((w) => `${w.name} ${w.note}`.toLowerCase().includes(s)).slice(0, 6).map((w) => ({ key: w.id, label: w.name, sub: w.category, icon: Wifi, to: `/wifi?q=${encodeURIComponent(w.name)}` })) : [];
    return [...pages, ...items];
  }, [q, wifis]);
  const go = (to) => { onClose(); nav(to); };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] animate-fadeIn" onMouseDown={onClose}>
      <div className="w-full max-w-lg animate-pop overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800 px-4">
          <Search size={18} className="text-slate-400" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && results[0]) go(results[0].to); }}
            placeholder="Tìm trang hoặc mạng wifi…" className="w-full bg-transparent py-4 text-sm outline-none" />
          <kbd className="hidden rounded border border-slate-200 dark:border-zinc-800 px-1.5 text-xs text-slate-400 sm:block">Esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-400">Không tìm thấy kết quả.</li>}
          {results.map((r) => (
            <li key={r.key}>
              <button onClick={() => go(r.to)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-blue-50 dark:hover:bg-blue-500/10">
                <r.icon size={17} className={r.color || 'text-blue-600 dark:text-blue-400'} /> {r.label}
                {r.sub && <span className="ml-auto text-xs text-slate-400">{r.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
