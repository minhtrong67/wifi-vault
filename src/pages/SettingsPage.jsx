import { useEffect, useState } from "react";
import {
  Database,
  Download,
  Heart,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Smartphone,
  Sun,
  Type,
} from "lucide-react";
import { FONT_SIZES, useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { Button, ConfirmDialog } from "../components/ui";
import { exportBackup } from "../lib/fileIO";

const THEMES = [
  { v: "light", label: "Sáng", icon: Sun },
  { v: "dark", label: "Tối", icon: Moon },
  { v: "system", label: "Hệ thống", icon: Monitor },
];

/** Khối cài đặt có icon màu phụ */
const Section = ({ icon: Icon, tone, title, desc, children }) => (
  <div className="card p-3.5 md:p-4">
    <div className="mb-3 flex items-start gap-3">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}
      >
        <Icon size={17} />
      </span>
      <div>
        <h2 className="font-medium leading-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
          {desc}
        </p>
      </div>
    </div>
    {children}
  </div>
);
const optCls = (on) =>
  `flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm transition active:scale-95 ${on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60"}`;

/** Trang cài đặt: giao diện sáng/tối, cài app PWA, cỡ chữ, sao lưu dữ liệu, khôi phục mặc định */
export default function SettingsPage() {
  const { settings, update, reset } = useSettings();
  const { wifis, categories, loading } = useData();
  const toast = useToast();
  const [prompt, setPrompt] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone;

  useEffect(() => {
    const h = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", () => setPrompt(null));
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const install = async () => {
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <div className="space-y-3.5 md:space-y-4">
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
        Cài đặt
      </h1>

      {!installed && (
        <div className="card flex flex-col gap-3 border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/10 p-3.5 sm:flex-row sm:items-center md:p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
            <Smartphone size={19} />
          </span>
          <div className="flex-1 text-sm">
            <p className="font-medium">Cài đặt ứng dụng</p>
            <p className="text-slate-600 dark:text-zinc-300">
              {isIOS && !prompt
                ? 'Trên iPhone: bấm nút Chia sẻ trong Safari, rồi chọn "Thêm vào Màn hình chính".'
                : "Thêm Wifi Vault vào màn hình chính để mở nhanh như một ứng dụng."}
            </p>
          </div>
          <Button icon={Download} onClick={install} disabled={!prompt}>
            Cài đặt
          </Button>
        </div>
      )}

      <Section
        icon={Palette}
        tone="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
        title="Giao diện"
        desc="Chọn chế độ sáng, tối hoặc theo thiết bị."
      >
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.v}
              onClick={() => update({ theme: t.v })}
              aria-pressed={settings.theme === t.v}
              className={optCls(settings.theme === t.v)}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section
        icon={Type}
        tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
        title="Cỡ chữ"
        desc="Điều chỉnh kích thước chữ toàn ứng dụng."
      >
        <div className="grid grid-cols-4 gap-2">
          {FONT_SIZES.map((f) => (
            <button
              key={f.px}
              onClick={() => update({ fontSize: f.px })}
              aria-pressed={settings.fontSize === f.px}
              className={optCls(settings.fontSize === f.px)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      <Section
        icon={Database}
        tone="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
        title="Dữ liệu"
        desc="Tải về bản sao lưu JSON gồm toàn bộ wifi và danh mục."
      >
        <Button
          className="btn bg-green-600 w-full sm:w-auto"
          icon={Download}
          disabled={loading}
          onClick={() => {
            exportBackup(wifis, categories);
            toast.success("Đã xuất toàn bộ dữ liệu.");
          }}
        >
          Xuất toàn bộ dữ liệu
        </Button>
      </Section>

      <Section
        icon={RotateCcw}
        tone="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
        title="Khôi phục mặc định"
        desc="Đưa giao diện và cỡ chữ về ban đầu. Dữ liệu wifi không bị ảnh hưởng."
      >
        <Button
          className="btn-danger w-full sm:w-auto"
          icon={RotateCcw}
          onClick={() => setConfirm(true)}
        >
          Khôi phục mặc định
        </Button>
      </Section>

      <div className="text-center text-xs text-slate-400 md:text-sm">
        <p>
          Wifi Vault • Tác giả{" "}
          <b className="font-medium text-slate-600 dark:text-zinc-300">
            minhtrong67
          </b>
        </p>

        <p className="mt-1 flex items-center justify-center gap-1">
          <span>Với sự hỗ trợ của Claude</span>
          <Heart size={13} className="shrink-0 text-blue-500" />
        </p>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Khôi phục mặc định?"
        message="Cỡ chữ sẽ về mức Vừa và giao diện sẽ theo hệ thống."
        confirmLabel="Khôi phục"
        onConfirm={() => {
          reset();
          setConfirm(false);
          toast.success("Đã khôi phục cài đặt mặc định.");
        }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
