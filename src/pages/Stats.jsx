import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileImage, FileText, KeyRound, StickyNote, Tags, Wifi } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useSettings, useT } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { MenuButton, PageHeader, Skeleton, StatCard } from '../components/ui';
import { useMediaQuery } from '../lib/useMediaQuery';
import { exportReport } from '../lib/report';

const RAD = Math.PI / 180;

const ChartCard = ({ title, note, children, className = '' }) => (
  <div className={`card animate-fadeThrough p-4 md:p-5 ${className}`}>
    <h2 className="text-base font-medium text-on-surface">{title}</h2>
    <p className="mb-3 text-xs text-on-surface-variant">{note}</p>
    {children}
  </div>
);

/** Tooltip riêng để theo đúng màu theme (sáng/tối) */
const Tip = ({ active, payload, unit }) =>
  active && payload?.length ? (
    <div className="rounded-xl bg-inverse-surface px-3 py-2 text-sm text-inverse-on-surface shadow-el2">
      <p className="font-medium">{payload[0].payload.name}</p>
      <p className="opacity-80">{payload[0].value} {unit}</p>
    </div>
  ) : null;

/** Số lượng hiển thị ngay trong lát cắt của biểu đồ tròn (ẩn nếu lát quá nhỏ) */
const sliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) / 2;
  return <text x={cx + r * Math.cos(-midAngle * RAD)} y={cy + r * Math.sin(-midAngle * RAD)} fill="#fff" fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">{value}</text>;
};

/** Trang thống kê: thẻ số liệu + biểu đồ cột (độ dài mật khẩu), tròn, cột (danh mục) + xuất báo cáo PDF/PNG */
export default function Stats() {
  const { wifis, categories, loading, colorOf } = useData();
  const { t, lang } = useT();
  const { colors, lightColors } = useSettings();
  const toast = useToast();
  const mobile = useMediaQuery('(max-width: 640px)');
  const [exporting, setExporting] = useState(false);

  const s = useMemo(() => {
    if (!wifis) return null;
    const byCat = Object.entries(wifis.reduce((m, w) => ((m[w.category] = (m[w.category] || 0) + 1), m), {}))
      .map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, lang));
    const buckets = [
      ['stats.bucket.8', (l) => l <= 8],
      ['stats.bucket.9', (l) => l >= 9 && l <= 10],
      ['stats.bucket.11', (l) => l >= 11 && l <= 12],
      ['stats.bucket.13', (l) => l >= 13],
    ];
    const byLen = buckets.map(([k, f]) => ({ k, value: wifis.filter((w) => f(w.password.length)).length }));
    const avg = wifis.length ? (wifis.reduce((a, w) => a + w.password.length, 0) / wifis.length).toFixed(1) : '0';
    return { byCat, byLen, avg, withNote: wifis.filter((w) => w.note).length };
  }, [wifis, lang]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const total = wifis.length;
  const lenData = s.byLen.map((x) => ({ name: t(x.k), value: x.value }));
  const axis = { fontSize: 12, fill: colors.onSurfaceVariant };
  const grid = <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.outlineVariant} strokeOpacity={0.7} />;
  const cursor = { fill: colors.onSurface, fillOpacity: 0.06 };
  const labelFill = colors.onSurfaceVariant;

  const runExport = async (format) => {
    setExporting(true);
    try {
      await exportReport({ format, s: { ...s, byLen: lenData }, total, categoriesCount: categories.length, colors: lightColors, t, lang, colorOf });
      toast.success(t('stats.export.done', { fmt: format.toUpperCase() }));
    } catch (e) {
      console.error(e);
      toast.error(t('stats.export.fail'));
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('stats.title')} subtitle={t('stats.subtitle')}>
        <MenuButton label={exporting ? t('stats.export.busy') : t('stats.export')} icon={Download} loading={exporting} disabled={total === 0}
          items={[
            { key: 'pdf', label: t('stats.export.pdf'), icon: FileText, onClick: () => runExport('pdf') },
            { key: 'png', label: t('stats.export.png'), icon: FileImage, onClick: () => runExport('png') },
          ]} />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Wifi} label={t('stats.total')} value={total} tone="primary" />
        <StatCard icon={Tags} label={t('stats.categories')} value={categories.length} tone="secondary" />
        <StatCard icon={KeyRound} label={t('stats.avgLen')} value={t('stats.chars', { n: s.avg })} tone="tertiary" />
        <StatCard icon={StickyNote} label={t('stats.withNote')} value={s.withNote} tone="neutral" />
      </div>
      {total === 0 ? (
        <div className="card p-10 text-center text-sm text-on-surface-variant">{t('stats.empty')}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Biểu đồ cột: độ dài mật khẩu (thứ tự → một màu chủ đề, đậm dần) */}
          <ChartCard title={t('stats.lenTitle')} note={t('stats.lenNote')}>
            <ResponsiveContainer width="100%" height={mobile ? 230 : 270}>
              <BarChart data={lenData} margin={{ top: 22, right: 6, left: -22, bottom: 0 }}>
                {grid}
                <XAxis dataKey="name" tick={{ ...axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip unit={t('common.wifiUnit')} />} cursor={cursor} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={56} animationDuration={600}>
                  {lenData.map((_, i) => <Cell key={i} fill={colors.primary} fillOpacity={0.4 + i * 0.2} />)}
                  <LabelList dataKey="value" position="top" fontSize={13} fontWeight={700} fill={labelFill} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Biểu đồ tròn: tỷ lệ theo danh mục, chú thích HTML bên dưới để không tràn trên mobile */}
          <ChartCard title={t('stats.ratioTitle')} note={t('stats.ratioNote')}>
            <div className="relative">
              <ResponsiveContainer width="100%" height={mobile ? 210 : 240}>
                <PieChart>
                  <Pie data={s.byCat} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="92%" paddingAngle={2} stroke="none" label={sliceLabel} labelLine={false} animationDuration={600}>
                    {s.byCat.map((c) => <Cell key={c.name} fill={colorOf(c.name).hex} />)}
                  </Pie>
                  <Tooltip content={<Tip unit={t('common.wifiUnit')} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div><p className="text-3xl leading-none text-on-surface">{total}</p><p className="mt-1 text-xs text-on-surface-variant">{t('common.wifiUnit')}</p></div>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs sm:grid-cols-3">
              {s.byCat.map((c) => (
                <li key={c.name} className="flex items-center gap-1.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorOf(c.name).hex }} />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto shrink-0 font-semibold">{c.value}</span>
                  <span className="shrink-0 text-on-surface-variant">{Math.round((c.value / total) * 100)}%</span>
                </li>
              ))}
            </ul>
          </ChartCard>

          {/* Biểu đồ cột: số wifi theo danh mục */}
          <ChartCard className="lg:col-span-2" title={t('stats.countTitle')} note={t('stats.countNote')}>
            <ResponsiveContainer width="100%" height={mobile ? 290 : 300}>
              <BarChart data={s.byCat} margin={{ top: 22, right: 6, left: -22, bottom: 0 }}>
                {grid}
                <XAxis dataKey="name" interval={0} tick={{ ...axis, fontSize: 11 }} angle={mobile ? -40 : 0} textAnchor={mobile ? 'end' : 'middle'} height={mobile ? 70 : 30} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip unit={t('common.wifiUnit')} />} cursor={cursor} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={48} animationDuration={600}>
                  {s.byCat.map((c) => <Cell key={c.name} fill={colorOf(c.name).hex} />)}
                  <LabelList dataKey="value" position="top" fontSize={13} fontWeight={700} fill={labelFill} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
