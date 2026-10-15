import { Link } from 'react-router-dom';
import { ArrowRight, Tags, Wifi } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/SettingsContext';
import { PageHeader, Skeleton, StatCard } from '../components/ui';

/** Trang chủ: lời chào, số liệu nhanh và các wifi thêm gần đây */
export default function Home() {
  const { user } = useAuth();
  const { t } = useT();
  const { wifis, categories, loading, colorOf } = useData();
  const recent = loading ? [] : [...wifis].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
  const first = (user.displayName || '').split(' ').pop();
  return (
    <div className="space-y-6">
      <PageHeader title={first ? t('home.hello', { name: first }) : t('home.helloAnon')} subtitle={t('home.subtitle')} />
      {loading ? (
        <div className="grid grid-cols-2 gap-3"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Wifi} label={t('home.statWifi')} value={wifis.length} tone="primary" />
          <StatCard icon={Tags} label={t('home.statCats')} value={categories.length} tone="tertiary" />
        </div>
      )}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xl text-on-surface">{t('home.recent')}</h2>
          <Link to="/wifi" className="btn-text -mr-2">{t('home.viewAll')} <ArrowRight size={16} /></Link>
        </div>
        <div className="card divide-y divide-outline-variant/50 overflow-hidden">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="m-3 h-12" />)
          ) : recent.length === 0 ? (
            <p className="p-8 text-center text-sm text-on-surface-variant">{t('home.empty')}</p>
          ) : (
            recent.map((w) => {
              const a = colorOf(w.category);
              return (
                <Link key={w.id} to={`/wifi?q=${encodeURIComponent(w.name)}`} className="state flex min-h-[4.5rem] items-center gap-4 px-4 py-3 text-on-surface">
                  <span style={a.tile} className="grid size-10 shrink-0 place-items-center rounded-full"><Wifi size={18} /></span>
                  <span className="min-w-0 flex-1 truncate text-base">{w.name}</span>
                  <span style={a.chip} className="chip shrink-0">{w.category}</span>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
