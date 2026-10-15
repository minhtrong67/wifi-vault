import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Plus, RotateCcw, Search, WifiOff, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useT } from '../context/SettingsContext';
import WifiCard from '../components/WifiCard';
import WifiForm from '../components/WifiForm';
import { Accordion, Button, ConfirmDialog, EmptyState, Fab, IconButton, PageHeader, Sheet, Skeleton, TextField } from '../components/ui';
import { deleteWifis, updateWifi, upsertWifis } from '../lib/db';

const DEFAULT_SORT = 'name-asc';
const SORTS = {
  'name-asc': ['wifi.sort.nameAsc', (a, b, l) => a.name.localeCompare(b.name, l)],
  'name-desc': ['wifi.sort.nameDesc', (a, b, l) => b.name.localeCompare(a.name, l)],
  'cat-asc': ['wifi.sort.category', (a, b, l) => a.category.localeCompare(b.category, l) || a.name.localeCompare(b.name, l)],
  new: ['wifi.sort.newest', (a, b) => (b.createdAt || 0) - (a.createdAt || 0)],
  old: ['wifi.sort.oldest', (a, b) => (a.createdAt || 0) - (b.createdAt || 0)],
};

/** Trang quản lý wifi: tìm kiếm / lọc / sắp xếp, thêm - sửa - xoá (nhập/xuất dữ liệu nằm ở trang Cài đặt) */
export default function WifiPage() {
  const { uid, wifis, categories, loading, colorOf } = useData();
  const { t, lang } = useT();
  const toast = useToast();
  const [params] = useSearchParams();
  const urlQ = params.get('q') || '';
  const [q, setQ] = useState(urlQ);
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [form, setForm] = useState(null); // null | {} (thêm) | wifi (sửa)
  const [pendingEdit, setPendingEdit] = useState(null); // dữ liệu chờ xác nhận sửa
  const [toDelete, setToDelete] = useState(null);
  const dq = useDeferredValue(q);

  // Tìm nhanh (Ctrl+K) có thể điều hướng tới /wifi?q=… khi đang ở sẵn trang này
  useEffect(() => setQ(urlQ), [urlQ]);

  const list = useMemo(() => {
    const s = dq.trim().toLowerCase();
    const cmp = SORTS[sort][1];
    return (wifis || [])
      .filter((w) => (!cat || w.category === cat) && (!s || `${w.name} ${w.note} ${w.category}`.toLowerCase().includes(s)))
      .sort((a, b) => cmp(a, b, lang));
  }, [wifis, dq, cat, sort, lang]);
  const activeFilters = (q.trim() ? 1 : 0) + (cat ? 1 : 0) + (sort !== DEFAULT_SORT ? 1 : 0);
  const resetFilters = () => { setQ(''); setCat(''); setSort(DEFAULT_SORT); };

  const openAdd = () => (categories.length ? setForm({}) : toast.info(t('wifi.needCategory')));
  const submit = async (data) => {
    if (form.id) return setPendingEdit(data); // sửa → hỏi xác nhận trước
    try {
      await upsertWifis(uid, [data]);
      toast.success(t('wifi.toast.added'));
      setForm(null);
    } catch { toast.error(t('wifi.toast.saveFail')); }
  };
  const confirmEdit = async () => {
    try {
      await updateWifi(uid, form.id, pendingEdit, form.createdAt);
      toast.success(t('wifi.toast.updated'));
      setPendingEdit(null);
      setForm(null);
    } catch { toast.error(t('wifi.toast.updateFail')); }
  };
  const confirmDelete = async () => {
    try {
      await deleteWifis(uid, [toDelete.id]);
      toast.success(t('wifi.toast.deleted'));
      setToDelete(null);
    } catch { toast.error(t('wifi.toast.deleteFail')); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('wifi.title')} subtitle={loading ? t('common.loading') : t('wifi.count', { shown: list.length, total: wifis.length })} />

      {/* Bộ lọc dạng accordion */}
      <Accordion title={t('wifi.filter.title')} icon={Filter} badge={activeFilters} defaultOpen>
        <div className="searchbar">
          <Search size={20} className="shrink-0" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('wifi.filter.search')} aria-label={t('wifi.filter.search')} enterKeyHint="search" />
          {q && <IconButton icon={X} size={18} label={t('common.clear')} onClick={() => setQ('')} />}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField as="select" label={t('wifi.filter.category')} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">{t('wifi.filter.all')}</option>
            {categories?.map((c) => <option key={c.id}>{c.name}</option>)}
          </TextField>
          <TextField as="select" label={t('wifi.filter.sort')} value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, [label]]) => <option key={k} value={k}>{t(label)}</option>)}
          </TextField>
        </div>
        <div className="flex w-full">
          <Button className='w-full' variant="text-danger" icon={RotateCcw} onClick={resetFilters} disabled={!activeFilters}>{t('wifi.filter.reset')}</Button>
        </div>
      </Accordion>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState icon={WifiOff} title={t('wifi.empty.title')} hint={t('wifi.empty.hint')} />
      ) : (
        <>
          <p className="text-xs text-on-surface-variant md:hidden">{t('wifi.swipeHint')}</p>
          <div className="space-y-3">
            {list.map((w) => <WifiCard key={w.id} wifi={w} accent={colorOf(w.category)} onEdit={setForm} onDelete={setToDelete} />)}
          </div>
        </>
      )}

      <Fab icon={Plus} label={t('wifi.add')} onClick={openAdd} disabled={loading} />

      {/* Thêm/sửa wifi dùng sheet drawer (đáy màn hình trên mobile, cạnh phải trên desktop) */}
      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? t('wifi.editTitle') : t('wifi.addTitle')}>
        {form && <WifiForm key={form.id || 'new'} initial={form.id ? form : undefined} categories={categories} wifis={wifis} onSubmit={submit} onCancel={() => setForm(null)} />}
      </Sheet>
      <ConfirmDialog open={!!pendingEdit} title={t('wifi.confirmEdit.title')} message={t('wifi.confirmEdit.msg', { name: pendingEdit?.name })}
        confirmLabel={t('wifi.confirmEdit.ok')} onConfirm={confirmEdit} onCancel={() => setPendingEdit(null)} />
      <ConfirmDialog open={!!toDelete} danger title={t('wifi.confirmDelete.title')} message={t('wifi.confirmDelete.msg', { name: toDelete?.name })}
        confirmLabel={t('common.delete')} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
