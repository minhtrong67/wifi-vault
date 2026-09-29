import { useEffect, useRef, useState } from "react";
import { Loader2, X, TriangleAlert } from "lucide-react";

/** Khối skeleton loading */
export const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-zinc-700/60 ${className}`}
  />
);

/** Nút có trạng thái loading + disable khi đang xử lý */
export function Button({
  loading,
  icon: Icon,
  children,
  className = "btn-primary",
  disabled,
  ...p
}) {
  return (
    <button className={className} disabled={disabled || loading} {...p}>
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={16} />
      )}
      {children}
    </button>
  );
}

/** Hộp thoại (dialog) dùng chung, luôn nằm giữa màn hình để dễ thao tác (đóng bằng Esc hoặc bấm nền) */
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-fadeIn"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-md animate-pop overflow-y-auto rounded-3xl bg-white dark:bg-zinc-900 p-4 shadow-xl sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Hộp thoại xác nhận (sửa / xoá) */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  danger,
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={busy ? () => {} : onCancel} title={title}>
      <div className="flex gap-3 text-sm text-slate-600 dark:text-zinc-300">
        <TriangleAlert
          className={
            danger ? "shrink-0 text-red-500" : "shrink-0 text-blue-500"
          }
          size={20}
        />
        <p>{message}</p>
      </div>
      <div className="mt-5 flex gap-2">
        <Button className="btn-ghost flex-1" onClick={onCancel} disabled={busy}>
          Huỷ
        </Button>
        <Button
          className={`${danger ? "btn-danger" : "btn-primary"} flex-1`}
          onClick={run}
          loading={busy}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/** Trường nhập có nhãn + thông báo lỗi */
export const Field = ({ label, error, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-200">
      {label}
    </span>
    {children}
    {error ? (
      <span className="mt-1 block text-xs text-red-600">{error}</span>
    ) : (
      hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>
    )}
  </label>
);

/** Accordion mở/đóng mượt bằng grid-rows */
export function Accordion({
  title,
  icon: Icon,
  badge,
  children,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-zinc-800/60"
      >
        {Icon && (
          <Icon size={17} className="text-blue-600 dark:text-blue-400" />
        )}{" "}
        {title}
        {badge > 0 && (
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
            {badge}
          </span>
        )}
        <span
          className={`ml-auto text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-slate-100 dark:border-zinc-800 p-3.5 md:p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Vuốt phải = sửa, vuốt trái = xoá. Trên desktop có thêm nút bấm. */
export function Swipeable({ onEdit, onDelete, children }) {
  const [dx, setDx] = useState(0);
  const start = useRef(null);
  const TH = 80;
  const down = (e) => {
    start.current = { x: e.clientX, y: e.clientY, lock: null };
  };
  const move = (e) => {
    const s = start.current;
    if (!s) return;
    const mx = e.clientX - s.x;
    if (s.lock === null && (Math.abs(mx) > 8 || Math.abs(e.clientY - s.y) > 8))
      s.lock = Math.abs(mx) > Math.abs(e.clientY - s.y) ? "x" : "y";
    if (s.lock === "x") setDx(Math.max(-140, Math.min(140, mx)));
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
      <div className="absolute inset-0 flex items-center justify-between px-5 text-sm font-medium text-white">
        <span className="flex items-center gap-1.5 bg-blue-600 absolute inset-y-0 left-0 w-1/2 pl-5">
          Sửa
        </span>
        <span className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-end gap-1.5 bg-red-600 pr-5">
          Xoá
        </span>
      </div>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{
          transform: `translateX(${dx}px)`,
          touchAction: "pan-y",
          transition: start.current ? "none" : "transform .25s ease",
        }}
        className="relative select-none bg-white dark:bg-zinc-900"
      >
        {children}
      </div>
    </div>
  );
}

// Thẻ số liệu có nền màu nổi bật (dùng ở Trang chủ và Thống kê)
const TONES = {
  blue: "from-blue-500 to-blue-700",
  emerald: "from-emerald-500 to-teal-600",
  violet: "from-violet-500 to-purple-700",
  amber: "from-amber-500 to-orange-600",
};
export const StatCard = ({ icon: Icon, label, value, tone = "blue" }) => (
  <div
    className={`rounded-2xl bg-gradient-to-br p-3.5 text-white shadow-sm md:p-4 ${TONES[tone]}`}
  >
    <span className="grid size-8 place-items-center rounded-lg bg-white/20">
      <Icon size={17} />
    </span>
    <p className="mt-3 text-xl font-semibold leading-none">{value}</p>
    <p className="mt-1.5 text-xs text-white/90 md:text-sm">{label}</p>
  </div>
);

/** Khung skeleton dùng khi một trang đang được tải (lần đầu vào route đó) */
export const PageSkeleton = () => (
  <div className="animate-fadeIn space-y-3.5">
    <Skeleton className="h-8 w-40" />
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24 hidden md:block" />
      <Skeleton className="h-24 hidden md:block" />
    </div>
    <Skeleton className="h-40" />
  </div>
);
