import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Loader2, Pencil, Trash2, TriangleAlert, X } from 'lucide-react';
import { useT } from '../context/SettingsContext';

/** Hiệu ứng ripple của Material tại điểm chạm (CSS: .ripple-dot trong index.css) */
export function ripple(e) {
  const el = e.currentTarget;
  if (el.disabled) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  const keyboard = !e.clientX && !e.clientY;
  const dot = document.createElement('span');
  dot.className = 'ripple-dot';
  Object.assign(dot.style, {
    width: `${size}px`, height: `${size}px`,
    left: `${(keyboard ? r.width / 2 : e.clientX - r.left) - size / 2}px`,
    top: `${(keyboard ? r.height / 2 : e.clientY - r.top) - size / 2}px`,
  });
  el.appendChild(dot);
  dot.addEventListener('animationend', () => dot.remove(), { once: true });
}

const VARIANTS = { filled: 'btn-filled', tonal: 'btn-tonal', outlined: 'btn-outlined', text: 'btn-text', danger: 'btn-error', 'text-danger': 'btn-text-error' };

/** Nút Material (filled | tonal | outlined | text | danger) có trạng thái loading và ripple */
export function Button({ variant = 'filled', icon: Icon, loading, children, className = '', disabled, onPointerDown, type = 'button', ...p }) {
  return (
    <button type={type} disabled={disabled || loading} onPointerDown={(e) => { ripple(e); onPointerDown?.(e); }}
      className={`${VARIANTS[variant]} ${Icon || loading ? 'btn-icon-lead' : ''} ${className}`} {...p}>
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

/** Nút icon tròn; `label` dùng làm aria-label và tooltip */
export const IconButton = forwardRef(function IconButton({ icon: Icon, label, className = '', size = 20, onPointerDown, ...p }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} title={label} onPointerDown={(e) => { ripple(e); onPointerDown?.(e); }} className={`icon-btn ${className}`} {...p}>
      <Icon size={size} />
    </button>
  );
});

/** Nút hành động nổi (FAB) chỉ có icon; `label` dùng cho aria-label và tooltip. Đánh dấu body[data-fab] để nút "lên đầu trang" tự nâng lên tránh chồng lấn. */
export function Fab({ icon: Icon, label, onClick, disabled }) {
  useEffect(() => {
    document.body.dataset.fab = '1';
    return () => { delete document.body.dataset.fab; };
  }, []);
  return (
    <button type="button" onClick={onClick} disabled={disabled} onPointerDown={ripple} aria-label={label} title={label}
      className="fab fixed bottom-24 right-4 z-30 animate-pop disabled:opacity-40 md:bottom-6 md:right-8">
      <Icon size={26} />
    </button>
  );
}

/** Khối skeleton loading */
export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-2xl bg-surface-container-high ${className}`} />;

/** Khoá cuộn trang nền khi có hộp thoại/drawer mở (đếm số lớp để lồng nhau vẫn đúng) */
let locks = 0;
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    if (locks++ === 0) document.documentElement.style.overflow = 'hidden';
    return () => { if (--locks === 0) document.documentElement.style.overflow = ''; };
  }, [active]);
}

/** Hộp thoại Material 3: luôn ở giữa màn hình, đóng bằng Esc hoặc bấm nền, trả lại focus khi đóng */
export function Modal({ open, onClose, title, children, wide }) {
  const { t } = useT();
  const ref = useRef();
  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    ref.current?.focus({ preventScroll: true });
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); prev?.focus?.({ preventScroll: true }); };
  }, [open, onClose]);
  if (!open) return null;
  // Render ra <body> để không bị ảnh hưởng bởi style của phần tử cha (vd. space-y-4 thêm margin-top cho phần tử fixed)
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40 p-4 animate-fadeIn" onMouseDown={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={`max-h-[88dvh] w-full ${wide ? 'max-w-lg' : 'max-w-md'} animate-pop overflow-y-auto rounded-4xl bg-surface-container-high p-6 shadow-el3 outline-none`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl leading-8 text-on-surface">{title}</h2>
          <IconButton icon={X} label={t('common.close')} onClick={onClose} className="-mr-2" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

/** Sheet drawer Material 3 toàn màn hình: trượt từ đáy lên, nội dung căn giữa (tối đa 36rem). Đóng bằng Esc hoặc nút đóng; không tự focus vào ô nhập. */
export function Sheet({ open, onClose, title, children }) {
  const { t } = useT();
  const ref = useRef();
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useScrollLock(mounted);
  // Giữ phần tử trong DOM đến khi chạy xong hiệu ứng đóng
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const id = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(id);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); prev?.focus?.({ preventScroll: true }); };
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title}
        className={`absolute inset-0 flex flex-col bg-surface transition-[transform,opacity] duration-300 ease-emphasized ${shown ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="shrink-0 border-b border-outline-variant/60 bg-surface-container-low">
          <div className="mx-auto flex h-16 w-full max-w-xl items-center gap-2 px-2">
            <IconButton icon={X} label={t('common.close')} onClick={onClose} className="text-on-surface" />
            <h2 className="min-w-0 flex-1 truncate text-[22px] leading-7 text-on-surface">{title}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Hộp thoại xác nhận (sửa / xoá / nhập dữ liệu) */
export function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={busy ? () => {} : onCancel} title={title}>
      <div className="flex gap-3 text-sm leading-6 text-on-surface-variant">
        <TriangleAlert className={`mt-0.5 shrink-0 ${danger ? 'text-error' : 'text-primary'}`} size={20} />
        <p>{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="text" onClick={onCancel} disabled={busy}>{t('common.cancel')}</Button>
        <Button variant={danger ? 'danger' : 'filled'} onClick={run} loading={busy}>{confirmLabel || t('common.confirm')}</Button>
      </div>
    </Modal>
  );
}

/** Ô nhập Material (filled, nhãn nổi). as = input | textarea | select; `error` là { key, params } hoặc chuỗi đã dịch */
export function TextField({ label, error, hint, as: As = 'input', children, trailing, className = '', inputClassName = '', ...p }) {
  const { t } = useT();
  const id = useId();
  const msg = error ? (typeof error === 'string' ? error : t(error)) : hint;
  return (
    <div className={className}>
      <div className="tf">
        <As id={id} placeholder=" " aria-invalid={!!error} aria-describedby={msg ? `${id}-s` : undefined}
          className={`peer tf-input ${error ? 'is-error' : ''} ${trailing ? 'pr-12' : ''} ${inputClassName}`} {...p}>{children}</As>
        <label htmlFor={id} className="tf-label">{label}</label>
        {As === 'select' && <ChevronDown size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />}
        {trailing && <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {msg && <p id={`${id}-s`} className={`tf-support ${error ? 'is-error' : ''}`} role={error ? 'alert' : undefined}>{msg}</p>}
    </div>
  );
}

/** Accordion mở/đóng mượt bằng grid-rows */
export function Accordion({ title, icon: Icon, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} onPointerDown={ripple} aria-expanded={open} aria-controls={id}
        className="state flex min-h-14 w-full items-center gap-3 px-4 text-left text-base font-medium text-on-surface">
        {Icon && <Icon size={20} className="text-primary" />}
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {badge > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-medium text-on-primary">{badge}</span>}
        <ChevronDown size={20} className={`shrink-0 text-on-surface-variant transition-transform duration-300 ease-emphasized ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={id} className={`grid transition-[grid-template-rows] duration-300 ease-emphasized ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`} inert={open ? undefined : ''}>
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Vuốt phải = sửa, vuốt trái = xoá. Chuột/desktop dùng các nút bấm thay thế. */
export function Swipeable({ onEdit, onDelete, children }) {
  const { t } = useT();
  const [dx, setDx] = useState(0);
  const start = useRef(null);
  const TH = 80;
  const down = (e) => { start.current = { x: e.clientX, y: e.clientY, lock: null, id: e.pointerId }; };
  const move = (e) => {
    const s = start.current;
    if (!s) return;
    const mx = e.clientX - s.x;
    if (s.lock === null && (Math.abs(mx) > 8 || Math.abs(e.clientY - s.y) > 8)) {
      s.lock = Math.abs(mx) > Math.abs(e.clientY - s.y) ? 'x' : 'y';
      if (s.lock === 'x') e.currentTarget.setPointerCapture?.(s.id);
    }
    if (s.lock === 'x') setDx(Math.max(-140, Math.min(140, mx)));
  };
  const up = () => {
    const d = dx;
    start.current = null;
    setDx(0);
    if (d > TH) onEdit();
    else if (d < -TH) onDelete();
  };
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div aria-hidden="true" className={`absolute inset-y-0 left-0 flex w-1/2 items-center gap-2 bg-primary pl-6 text-sm font-medium text-on-primary transition-opacity ${dx > 0 ? 'opacity-100' : 'opacity-0'}`}><Pencil size={18} /> {t('common.edit')}</div>
      <div aria-hidden="true" className={`absolute inset-y-0 right-0 flex w-1/2 items-center justify-end gap-2 bg-error pr-6 text-sm font-medium text-on-error transition-opacity ${dx < 0 ? 'opacity-100' : 'opacity-0'}`}>{t('common.delete')} <Trash2 size={18} /></div>
      <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, touchAction: 'pan-y', transition: start.current ? 'none' : 'transform .3s cubic-bezier(.2,0,0,1)' }}
        className="relative select-none rounded-2xl bg-surface">
        {children}
      </div>
    </div>
  );
}

/** Nhóm nút chọn một (Material segmented button). options: [{ value, label, icon? }] */
export function Segmented({ value, onChange, options, label, className = '' }) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex w-full overflow-hidden rounded-full border border-outline ${className}`}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} onPointerDown={ripple}
            className={`state flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 px-2 text-sm font-medium transition-colors duration-200 ${i ? 'border-l border-outline' : ''} ${on ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'}`}>
            {on ? <Check size={16} className="shrink-0" /> : o.icon && <o.icon size={16} className="shrink-0" />}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Menu thả xuống (Material menu): nút kích hoạt + danh sách mục */
export function MenuButton({ label, icon, items, loading, variant = 'tonal', disabled }) {
  const [open, setOpen] = useState(false);
  const box = useRef();
  useEffect(() => {
    if (!open) return;
    const away = (e) => !box.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); window.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <Button variant={variant} icon={icon} loading={loading} disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>{label}</Button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 min-w-48 origin-top-right animate-pop rounded-xl bg-surface-container py-2 shadow-el2">
          {items.map((it) => (
            <button key={it.key} role="menuitem" type="button" onPointerDown={ripple} onClick={() => { setOpen(false); it.onClick(); }}
              className="state flex h-12 w-full items-center gap-3 px-4 text-left text-base text-on-surface">
              {it.icon && <it.icon size={20} className="text-on-surface-variant" />} {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Tiêu đề trang + mô tả phụ + vùng hành động bên phải */
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <h1 className="truncate text-[28px] leading-9 text-on-surface">{title}</h1>
      {subtitle && <p className="text-sm text-on-surface-variant">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/** Trạng thái rỗng */
export const EmptyState = ({ icon: Icon, title, hint }) => (
  <div className="card animate-fadeIn px-6 py-14 text-center text-on-surface-variant">
    <span className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-surface-container-highest"><Icon size={30} /></span>
    <p className="text-base font-medium text-on-surface">{title}</p>
    {hint && <p className="mt-1 text-sm">{hint}</p>}
  </div>
);

// Thẻ số liệu dạng tonal của Material (dùng ở Trang chủ và Thống kê)
const TONES = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  neutral: 'bg-surface-container-highest text-on-surface',
};
export const StatCard = ({ icon: Icon, label, value, tone = 'primary' }) => (
  <div className={`animate-fadeThrough rounded-3xl p-4 ${TONES[tone]}`}>
    <span className="grid size-10 place-items-center rounded-full bg-surface/45"><Icon size={20} /></span>
    <p className="mt-4 text-[28px] font-normal leading-8">{value}</p>
    <p className="mt-1 text-sm opacity-80">{label}</p>
  </div>
);

/** Khung skeleton dùng khi một trang đang được tải */
export const PageSkeleton = () => (
  <div className="animate-fadeIn space-y-4" aria-busy="true">
    <Skeleton className="h-9 w-48" />
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Skeleton className="h-32" /><Skeleton className="h-32" />
      <Skeleton className="hidden h-32 md:block" /><Skeleton className="hidden h-32 md:block" />
    </div>
    <Skeleton className="h-44" />
  </div>
);
