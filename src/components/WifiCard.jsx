import { memo, useState } from "react";
import { Copy, Eye, EyeOff, Pencil, Trash2, Wifi } from "lucide-react";
import { Swipeable } from "./ui";
import { copyText } from "../lib/clipboard";
import { useToast } from "../context/ToastContext";

/** Thẻ hiển thị một mạng wifi, màu theo danh mục (memo để tránh render lại không cần thiết) */
function WifiCard({ wifi, accent, onEdit, onDelete }) {
  const [show, setShow] = useState(false);
  const toast = useToast();
  const copy = async () =>
    (await copyText(wifi.password))
      ? toast.success("Đã sao chép mật khẩu.")
      : toast.error("Không thể sao chép.");
  return (
    <Swipeable onEdit={() => onEdit(wifi)} onDelete={() => onDelete(wifi)}>
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 p-3 transition hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 md:p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl  bg-blue-600/10 text-blue-300`}
        >
          <Wifi size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-medium leading-tight">
            {wifi.name}
          </h3>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${accent.chip}`}
          >
            {wifi.category}
          </span>
          <p className="mt-1.5 break-all font-mono text-[13px] text-slate-600 dark:text-zinc-300">
            {show
              ? wifi.password
              : "•".repeat(Math.min(wifi.password.length, 14))}
          </p>
          {wifi.note && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-zinc-400">
              {wifi.note}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center text-slate-400">
          <button
            onClick={() => setShow(!show)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button
            onClick={copy}
            aria-label="Sao chép mật khẩu"
            className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Copy size={17} />
          </button>
          {/* Nút bấm dự phòng cho desktop (chuột không vuốt được) */}
          <button
            onClick={() => onEdit(wifi)}
            aria-label="Sửa"
            className="hidden rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 md:block"
          >
            <Pencil size={17} />
          </button>
          <button
            onClick={() => onDelete(wifi)}
            aria-label="Xoá"
            className="hidden rounded-lg p-2 transition hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 md:block"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </Swipeable>
  );
}
export default memo(WifiCard);
