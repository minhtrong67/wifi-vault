import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownUp,
  Download,
  Filter,
  Plus,
  Search,
  Upload,
  WifiOff,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import WifiCard from "../components/WifiCard";
import WifiForm from "../components/WifiForm";
import {
  Accordion,
  Button,
  ConfirmDialog,
  Modal,
  Skeleton,
} from "../components/ui";
import { deleteWifis, updateWifi, upsertWifis } from "../lib/db";
import { exportVisual, exportWifis, readFile } from "../lib/fileIO";
import { validateWifi, wifiId } from "../lib/validate";

const SORTS = {
  "name-asc": ["Tên A → Z", (a, b) => a.name.localeCompare(b.name, "vi")],
  "name-desc": ["Tên Z → A", (a, b) => b.name.localeCompare(a.name, "vi")],
  "cat-asc": [
    "Danh mục",
    (a, b) =>
      a.category.localeCompare(b.category, "vi") ||
      a.name.localeCompare(b.name, "vi"),
  ],
  new: ["Mới nhất", (a, b) => (b.createdAt || 0) - (a.createdAt || 0)],
  old: ["Cũ nhất", (a, b) => (a.createdAt || 0) - (b.createdAt || 0)],
};

/** Trang quản lý wifi: tìm kiếm/lọc/sắp xếp, thêm-sửa-xoá, import/export */
export default function WifiPage() {
  const { uid, wifis, categories, loading, colorOf } = useData();
  const toast = useToast();
  const [params] = useSearchParams();
  const fileRef = useRef();
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [form, setForm] = useState(null); // null | {} (thêm) | wifi (sửa)
  const [pendingEdit, setPendingEdit] = useState(null); // dữ liệu chờ xác nhận sửa
  const [toDelete, setToDelete] = useState(null);
  const [importPlan, setImportPlan] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState("");
  const dq = useDeferredValue(q);

  const list = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return (wifis || [])
      .filter(
        (w) =>
          (!cat || w.category === cat) &&
          (!s || `${w.name} ${w.note} ${w.category}`.toLowerCase().includes(s)),
      )
      .sort(SORTS[sort][1]);
  }, [wifis, dq, cat, sort]);
  const activeFilters = (cat ? 1 : 0) + (sort !== "name-asc" ? 1 : 0);

  // ----- Thêm / Sửa -----
  const openAdd = () =>
    categories.length
      ? setForm({})
      : toast.info("Hãy tạo danh mục trước khi thêm wifi.");
  const runExport = async (format) => {
    setExportBusy(format);
    try {
      if (format === "png" || format === "pdf")
        await exportVisual(list, format, colorOf);
      else exportWifis(list, format);
      toast.success(`Đã xuất file ${format.toUpperCase()}.`);
      setExportOpen(false);
    } catch {
      toast.error("Xuất file thất bại. Vui lòng thử lại.");
    } finally {
      setExportBusy("");
    }
  };

  const submit = async (data) => {
    if (form.id) return setPendingEdit(data); // sửa → hỏi xác nhận trước
    try {
      await upsertWifis(uid, [data]);
      toast.success("Đã thêm wifi mới.");
      setForm(null);
    } catch {
      toast.error("Không thể lưu. Vui lòng thử lại.");
    }
  };
  const confirmEdit = async () => {
    try {
      await updateWifi(uid, form.id, pendingEdit, form.createdAt);
      toast.success("Đã cập nhật wifi.");
      setPendingEdit(null);
      setForm(null);
    } catch {
      toast.error("Không thể cập nhật. Vui lòng thử lại.");
    }
  };
  const confirmDelete = async () => {
    try {
      await deleteWifis(uid, [toDelete.id]);
      toast.success("Đã xoá wifi.");
      setToDelete(null);
    } catch {
      toast.error("Không thể xoá. Vui lòng thử lại.");
    }
  };

  // ----- Import: đọc file → kiểm tra từng dòng → hỏi xác nhận → ghi đè theo tên -----
  const onPickFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const rows = await readFile(file);
      const valid = [],
        invalid = [];
      rows.forEach((r, i) => {
        const err = validateWifi(r);
        Object.keys(err).length
          ? invalid.push({ line: i + 2, err })
          : valid.push(r);
      });
      if (!valid.length)
        return toast.error("File không có dòng hợp lệ nào để nhập.");
      const ids = new Set(wifis.map((w) => w.id));
      const unique = new Map(valid.map((r) => [wifiId(r.name), r]));
      setImportPlan({
        rows: [...unique.values()],
        overwrite: [...unique.keys()].filter((id) => ids.has(id)).length,
        invalid: invalid.length,
        ids,
      });
    } catch (err) {
      toast.error(err.message || "Không đọc được file.");
    }
  };
  const confirmImport = async () => {
    try {
      const r = await upsertWifis(uid, importPlan.rows, importPlan.ids);
      toast.success(
        `Đã nhập ${r.total} wifi (${r.total - r.updated} mới, ${r.updated} ghi đè).`,
      );
      setImportPlan(null);
    } catch {
      toast.error("Nhập dữ liệu thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-3.5 md:space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Quản lý wifi
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {loading
              ? "Đang tải…"
              : `${list.length} / ${wifis.length} mạng wifi`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:flex">
          <Button
            className="btn-ghost px-2.5"
            icon={Upload}
            onClick={() => fileRef.current.click()}
          >
            Nhập
          </Button>
          <Button
            className="btn-ghost px-2.5"
            icon={Download}
            onClick={() => setExportOpen(true)}
            disabled={loading || !wifis.length}
          >
            Xuất
          </Button>
          <Button
            className="btn-primary px-2.5"
            icon={Plus}
            onClick={openAdd}
            disabled={loading}
          >
            Thêm
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            hidden
            onChange={onPickFile}
          />
        </div>
      </div>

      {/* Bộ lọc dạng accordion */}
      <Accordion
        title="Tìm kiếm, lọc & sắp xếp"
        icon={Filter}
        badge={activeFilters}
        defaultOpen
      >
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="input pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, ghi chú, danh mục…"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="input"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Lọc danh mục"
          >
            <option value="">Tất cả danh mục</option>
            {categories?.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="relative">
            <ArrowDownUp
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              className="input pl-10"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sắp xếp"
            >
              {Object.entries(SORTS).map(([k, [label]]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Accordion>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card animate-fadeIn py-14 text-center text-slate-500 dark:text-zinc-400">
          <WifiOff className="mx-auto mb-3 text-slate-300" size={36} />
          <p className="font-medium text-slate-700 dark:text-zinc-200">
            Không có wifi nào
          </p>
          <p className="text-sm">Thử đổi bộ lọc hoặc thêm wifi mới.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 md:hidden">
            Vuốt phải để sửa, vuốt trái để xoá.
          </p>
          <div className="space-y-2.5">
            {list.map((w) => (
              <WifiCard
                key={w.id}
                wifi={w}
                accent={colorOf(w.category)}
                onEdit={setForm}
                onDelete={setToDelete}
              />
            ))}
          </div>
        </>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Sửa wifi" : "Thêm wifi"}
      >
        {form && (
          <WifiForm
            key={form.id || "new"}
            initial={form.id ? form : undefined}
            categories={categories}
            wifis={wifis}
            onSubmit={submit}
            onCancel={() => setForm(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={!!pendingEdit}
        title="Lưu thay đổi?"
        message={`Thông tin của "${pendingEdit?.name}" sẽ được cập nhật.`}
        confirmLabel="Lưu thay đổi"
        onConfirm={confirmEdit}
        onCancel={() => setPendingEdit(null)}
      />
      <ConfirmDialog
        open={!!toDelete}
        danger
        title="Xoá wifi?"
        message={`Bạn có chắc muốn xoá "${toDelete?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xoá"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      <ConfirmDialog
        open={!!importPlan}
        title="Xác nhận nhập dữ liệu"
        message={
          importPlan &&
          `Có ${importPlan.rows.length} wifi hợp lệ: ${importPlan.rows.length - importPlan.overwrite} mới, ${importPlan.overwrite} trùng tên sẽ được ghi đè.${importPlan.invalid ? ` ${importPlan.invalid} dòng không hợp lệ sẽ bị bỏ qua.` : ""}`
        }
        confirmLabel="Nhập dữ liệu"
        onConfirm={confirmImport}
        onCancel={() => setImportPlan(null)}
      />
      <Modal
        open={exportOpen}
        onClose={() => (exportBusy ? null : setExportOpen(false))}
        title="Xuất dữ liệu"
      >
        <p className="mb-4 text-sm text-slate-500 dark:text-zinc-400">
          Xuất {list.length} wifi đang hiển thị (theo bộ lọc hiện tại).
        </p>
        <div className="grid grid-cols-3 gap-2">
          {["csv", "xlsx", "json", "png", "pdf"].map((f) => (
            <Button
              key={f}
              className="btn-ghost uppercase"
              loading={exportBusy === f}
              disabled={!!exportBusy && exportBusy !== f}
              onClick={() => runExport(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-zinc-500">
          PNG và PDF xuất theo dạng bảng đã định dạng sẵn, đẹp và đầy đủ dấu
          tiếng Việt.
        </p>
      </Modal>
    </div>
  );
}
