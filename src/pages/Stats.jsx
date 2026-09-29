import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileText, KeyRound, Tags, Wifi } from "lucide-react";
import { useData } from "../context/DataContext";
import { Skeleton, StatCard } from "../components/ui";
import { useMediaQuery } from "../lib/useMediaQuery";

const LEN_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]; // mỗi nhóm độ dài một màu
const AXIS = { fontSize: 12, fill: "#64748b" };
const RAD = Math.PI / 180;

const ChartCard = ({ title, note, children, className = "" }) => (
  <div className={`card p-3.5 md:p-4 ${className}`}>
    <h2 className="font-medium">{title}</h2>
    <p className="mb-3 text-xs text-slate-500 dark:text-zinc-400">{note}</p>
    {children}
  </div>
);

/** Tooltip riêng để hỗ trợ giao diện tối */
const Tip = ({ active, payload }) =>
  active && payload?.length ? (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{payload[0].payload.name}</p>
      <p className="text-slate-500 dark:text-zinc-400">
        {payload[0].value} wifi
      </p>
    </div>
  ) : null;

/** Số lượng hiển thị ngay trong lát cắt của biểu đồ tròn (ẩn nếu lát quá nhỏ) */
const sliceLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  value,
}) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) / 2;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RAD)}
      y={cy + r * Math.sin(-midAngle * RAD)}
      fill="#fff"
      fontSize={10}
      fontWeight={700}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {value}
    </text>
  );
};

/** Trang thống kê: thẻ số liệu + biểu đồ cột (độ dài mật khẩu), tròn, cột (danh mục) */
export default function Stats() {
  const { wifis, categories, loading, colorOf } = useData();
  const mobile = useMediaQuery("(max-width: 640px)");

  const s = useMemo(() => {
    if (!wifis) return null;
    const byCat = Object.entries(
      wifis.reduce(
        (m, w) => ((m[w.category] = (m[w.category] || 0) + 1), m),
        {},
      ),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const buckets = [
      ["8 ký tự", (l) => l === 8],
      ["9–10 ký tự", (l) => l >= 9 && l <= 10],
      ["11–12 ký tự", (l) => l >= 11 && l <= 12],
      ["13+ ký tự", (l) => l >= 13],
    ];
    const byLen = buckets.map(([name, f]) => ({
      name,
      value: wifis.filter((w) => f(w.password.length)).length,
    }));
    const avg = wifis.length
      ? (
          wifis.reduce((a, w) => a + w.password.length, 0) / wifis.length
        ).toFixed(1)
      : 0;
    return { byCat, byLen, avg, withNote: wifis.filter((w) => w.note).length };
  }, [wifis]);

  if (loading)
    return (
      <div className="space-y-3.5">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );

  const total = wifis.length;
  const grid = (
    <CartesianGrid
      strokeDasharray="3 3"
      vertical={false}
      stroke="#94a3b8"
      strokeOpacity={0.3}
    />
  );
  return (
    <div className="space-y-3.5 md:space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Thống kê
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Tổng quan về kho wifi của bạn
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <StatCard icon={Wifi} label="Tổng số wifi" value={total} tone="blue" />
        <StatCard
          icon={Tags}
          label="Danh mục"
          value={categories.length}
          tone="emerald"
        />
        <StatCard
          icon={KeyRound}
          label="Độ dài mật khẩu TB"
          value={`${s.avg} ký tự`}
          tone="violet"
        />
        <StatCard
          icon={FileText}
          label="Wifi có ghi chú"
          value={s.withNote}
          tone="amber"
        />
      </div>
      {total === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500 dark:text-zinc-400">
          Chưa có dữ liệu để thống kê.
        </div>
      ) : (
        <div className="grid gap-3.5 md:gap-4 lg:grid-cols-2">
          {/* Biểu đồ cột: độ dài mật khẩu */}
          <ChartCard
            title="Độ dài mật khẩu"
            note="Trục dọc là số wifi, trục ngang là nhóm độ dài mật khẩu"
          >
            <ResponsiveContainer width="100%" height={mobile ? 230 : 270}>
              <BarChart
                data={s.byLen}
                margin={{ top: 22, right: 6, left: -22, bottom: 0 }}
              >
                {grid}
                <XAxis
                  dataKey="name"
                  tick={{ ...AXIS, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={AXIS}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<Tip />}
                  cursor={{ fill: "#94a3b8", fillOpacity: 0.12 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={56}>
                  {s.byLen.map((_, i) => (
                    <Cell key={i} fill={LEN_COLORS[i]} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    fontSize={10}
                    fontWeight={700}
                    fill="#64748b"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Biểu đồ tròn: tỷ lệ theo danh mục, chú thích HTML bên dưới để không tràn trên mobile */}
          <ChartCard
            title="Tỷ lệ theo danh mục"
            note="Số trong lát cắt là số wifi; phần trăm ở chú thích bên dưới"
          >
            <div className="relative">
              <ResponsiveContainer width="100%" height={mobile ? 210 : 240}>
                <PieChart>
                  <Pie
                    data={s.byCat}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="48%"
                    outerRadius="92%"
                    paddingAngle={2}
                    stroke="none"
                    label={sliceLabel}
                    labelLine={false}
                  >
                    {s.byCat.map((c) => (
                      <Cell key={c.name} fill={colorOf(c.name).hex} />
                    ))}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-2xl font-semibold leading-none">{total}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    wifi
                  </p>
                </div>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs sm:grid-cols-3">
              {s.byCat.map((c) => (
                <li key={c.name} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: colorOf(c.name).hex }}
                  />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto shrink-0 font-semibold">
                    {c.value}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">
                    {Math.round((c.value / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>

          {/* Biểu đồ cột: số wifi theo danh mục (thay cho biểu đồ cột ngang) */}
          <ChartCard
            className="lg:col-span-2"
            title="Số wifi theo danh mục"
            note="Mỗi cột là một danh mục, sắp xếp từ nhiều đến ít"
          >
            <ResponsiveContainer width="100%" height={mobile ? 290 : 300}>
              <BarChart
                data={s.byCat}
                margin={{ top: 22, right: 6, left: -22, bottom: 0 }}
              >
                {grid}
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ ...AXIS, fontSize: 10 }}
                  angle={mobile ? -40 : 0}
                  textAnchor={mobile ? "end" : "middle"}
                  height={mobile ? 70 : 30}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={AXIS}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<Tip />}
                  cursor={{ fill: "#94a3b8", fillOpacity: 0.12 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {s.byCat.map((c) => (
                    <Cell key={c.name} fill={colorOf(c.name).hex} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    fontSize={10}
                    fontWeight={700}
                    fill="#64748b"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
