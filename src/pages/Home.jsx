import { Link } from "react-router-dom";
import { ArrowRight, Tags, Upload, Wifi, Plus } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Skeleton, StatCard } from "../components/ui";

/** Trang chủ: lời chào, số liệu nhanh, lối tắt và wifi thêm gần đây */
export default function Home() {
  const { user } = useAuth();
  const { wifis, categories, loading, colorOf } = useData();
  const recent = loading
    ? []
    : [...wifis]
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5);
  const first = (user.displayName || "").split(" ").pop();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Xin chào{first ? `, ${first}` : ""}
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Mọi mật khẩu wifi của bạn, gọn trong một chỗ.
        </p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
          <StatCard
            icon={Wifi}
            label="Mạng wifi"
            value={wifis.length}
            tone="blue"
          />
          <StatCard
            icon={Tags}
            label="Danh mục"
            value={categories.length}
            tone="emerald"
          />
        </div>
      )}
      {/* <div className="grid grid-cols-2 gap-2.5">
        <Link to="/wifi" className="btn-primary py-3"><Plus size={17} /> Quản lý wifi</Link>
        <Link to="/wifi" className="btn-success py-3"><Upload size={17} /> Nhập dữ liệu</Link>
      </div> */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-medium">Thêm gần đây</h2>
          <Link
            to="/wifi"
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        <div className="card divide-y divide-slate-100 dark:divide-zinc-800">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} className="m-3 h-10" />
            ))
          ) : recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500 dark:text-zinc-400">
              Chưa có wifi nào. Hãy thêm hoặc nhập wifi đầu tiên của bạn.
            </p>
          ) : (
            recent.map((w) => {
              const a = colorOf(w.category);
              return (
                <Link
                  key={w.id}
                  to={`/wifi?q=${encodeURIComponent(w.name)}`}
                  className="flex items-center gap-3 p-3 transition hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl  bg-blue-600/10 text-blue-300`}
                  >
                    <Wifi size={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {w.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${a.chip}`}
                  >
                    {w.category}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
