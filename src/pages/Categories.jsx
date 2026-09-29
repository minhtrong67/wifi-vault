import { useState } from "react";
import { Plus, Save, Tags } from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import {
  Button,
  ConfirmDialog,
  Field,
  Modal,
  Skeleton,
  Swipeable,
} from "../components/ui";
import { addCategory, deleteCategory, renameCategory } from "../lib/db";
import { clean, LIMITS, validateCategory } from "../lib/validate";

/** Trang quản lý danh mục: thêm, đổi tên (vuốt phải), xoá (vuốt trái) */
export default function Categories() {
  const { uid, wifis, categories, loading, colorOf } = useData();
  const toast = useToast();
  const [edit, setEdit] = useState(null); // null | {} (thêm) | category (sửa)
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null); // tên mới chờ xác nhận
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const count = (n) => wifis.filter((w) => w.category === n).length;
  const open = (c = {}) => {
    setEdit(c);
    setName(c.name || "");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const n = clean(name);
    const err = validateCategory(
      n,
      categories.map((c) => c.name),
      edit.name,
    );
    setError(err);
    if (err) return;
    if (edit.id) return n === edit.name ? setEdit(null) : setPending(n); // sửa → xác nhận
    setBusy(true);
    try {
      await addCategory(uid, n);
      toast.success("Đã thêm danh mục.");
      setEdit(null);
    } catch {
      toast.error("Không thể thêm danh mục.");
    } finally {
      setBusy(false);
    }
  };
  const confirmRename = async () => {
    try {
      await renameCategory(uid, edit, pending, wifis);
      toast.success("Đã đổi tên danh mục.");
      setPending(null);
      setEdit(null);
    } catch {
      toast.error("Không thể đổi tên danh mục.");
    }
  };
  const tryDelete = (c) =>
    count(c.name)
      ? toast.error(
          `Không thể xoá: còn ${count(c.name)} wifi thuộc danh mục này.`,
        )
      : setDel(c);
  const confirmDelete = async () => {
    try {
      await deleteCategory(uid, del.id);
      toast.success("Đã xoá danh mục.");
      setDel(null);
    } catch {
      toast.error("Không thể xoá danh mục.");
    }
  };

  return (
    <div className="space-y-3.5 md:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Danh mục
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {loading ? "Đang tải…" : `${categories.length} danh mục`}
          </p>
        </div>
        <Button icon={Plus} onClick={() => open()} disabled={loading}>
          Thêm
        </Button>
      </div>
      {!loading && (
        <p className="text-xs text-slate-400 md:hidden">
          Vuốt phải để đổi tên, vuốt trái để xoá.
        </p>
      )}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((c) => (
            <Swipeable
              key={c.id}
              onEdit={() => open(c)}
              onDelete={() => tryDelete(c)}
            >
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 p-3.5 transition hover:bg-slate-50/60 dark:hover:bg-zinc-800/40">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl text-white ${colorOf(c.name).tile}`}
                >
                  <Tags size={17} />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {c.name}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorOf(c.name).chip}`}
                >
                  {count(c.name)} wifi
                </span>
              </div>
            </Swipeable>
          ))}
        </div>
      )}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? "Đổi tên danh mục" : "Thêm danh mục"}
      >
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Tên danh mục" error={error}>
            <input
              className={`input ${error ? "input-err" : ""}`}
              value={name}
              maxLength={LIMITS.category + 10}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onBlur={() => setName(clean(name))}
              placeholder="Ví dụ: Khách sạn"
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              className="btn-ghost flex-1"
              onClick={() => setEdit(null)}
              disabled={busy}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              className="btn-primary flex-1"
              icon={Save}
              loading={busy}
            >
              Lưu
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!pending}
        title="Đổi tên danh mục?"
        message={`"${edit?.name}" sẽ được đổi thành "${pending}" và áp dụng cho ${edit ? count(edit.name) : 0} wifi.`}
        confirmLabel="Đổi tên"
        onConfirm={confirmRename}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={!!del}
        danger
        title="Xoá danh mục?"
        message={`Bạn có chắc muốn xoá danh mục "${del?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={confirmDelete}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}
