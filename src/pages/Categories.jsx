import { useDeferredValue, useMemo, useState } from 'react';
import { Pencil, Plus, Save, Search, SearchX, Tags, Trash2, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useT } from '../context/SettingsContext';
import { Button, ConfirmDialog, EmptyState, Fab, Modal, PageHeader, Skeleton, Swipeable, TextField, IconButton } from '../components/ui';
import { useSessionState } from '../lib/useSessionState';
import { addCategory, deleteCategory, renameCategory } from '../lib/db';
import { clean, LIMITS, validateCategory } from '../lib/validate';

/** Trang quản lý danh mục: thêm, đổi tên (vuốt phải), xoá (vuốt trái) */
export default function Categories() {
  const { uid, wifis, categories, loading, colorOf } = useData();
  const { t } = useT();
  const toast = useToast();
  const [edit, setEdit] = useState(null); // null | {} (thêm) | category (sửa)
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null); // tên mới chờ xác nhận
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useSessionState('wifi-vault:filters:categories', ''); // ghi nhớ khi chuyển trang
  const dq = useDeferredValue(q);
  const shown = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return s ? categories.filter((c) => c.name.toLowerCase().includes(s)) : categories;
  }, [categories, dq]);

  const count = (n) => wifis.filter((w) => w.category === n).length;
  const open = (c = {}) => { setEdit(c); setName(c.name || ''); setError(null); };

  const submit = async (e) => {
    e.preventDefault();
    const n = clean(name);
    const err = validateCategory(n, categories.map((c) => c.name), edit.name);
    setError(err);
    if (err) return;
    if (edit.id) return n === edit.name ? setEdit(null) : setPending(n); // sửa → xác nhận
    setBusy(true);
    try {
      await addCategory(uid, n);
      toast.success(t('cat.toast.added'));
      setEdit(null);
    } catch { toast.error(t('cat.toast.addFail')); } finally { setBusy(false); }
  };
  const confirmRename = async () => {
    try {
      await renameCategory(uid, edit, pending, wifis);
      toast.success(t('cat.toast.renamed'));
      setPending(null);
      setEdit(null);
    } catch { toast.error(t('cat.toast.renameFail')); }
  };
  const tryDelete = (c) => (count(c.name) ? toast.error(t('cat.cannotDelete', { n: count(c.name) })) : setDel(c));
  const confirmDelete = async () => {
    try {
      await deleteCategory(uid, del.id);
      toast.success(t('cat.toast.deleted'));
      setDel(null);
    } catch { toast.error(t('cat.toast.deleteFail')); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('cat.title')} subtitle={loading ? t('common.loading') : q.trim() ? t('cat.found', { shown: shown.length, total: categories.length }) : t('cat.count', { n: categories.length })} />
      {!loading && categories.length > 0 && (
        <div className="searchbar">
          <Search size={20} className="shrink-0" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('cat.search')} aria-label={t('cat.search')} enterKeyHint="search" />
          {q && <IconButton icon={X} size={18} label={t('common.clear')} onClick={() => setQ('')} />}
        </div>
      )}
      {!loading && categories.length > 0 && <p className="text-xs text-on-surface-variant md:hidden">{t('cat.swipeHint')}</p>}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : categories.length === 0 ? (
        <EmptyState icon={Tags} title={t('cat.title')} hint={t('cat.add')} />
      ) : shown.length === 0 ? (
        <EmptyState icon={SearchX} title={t('cat.noResults')} hint={t('cat.noResultsHint')} />
      ) : (
        <div className="space-y-3">
          {shown.map((c) => (
            <Swipeable key={c.id} onEdit={() => open(c)} onDelete={() => tryDelete(c)}>
              <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4 shadow-el1">
                <span style={colorOf(c.name).tile} className="grid size-11 shrink-0 place-items-center rounded-2xl"><Tags size={20} /></span>
                <span className="min-w-0 flex-1 truncate text-base font-medium text-on-surface">{c.name}</span>
                <span style={colorOf(c.name).chip} className="chip shrink-0">{t('cat.wifiCount', { n: count(c.name) })}</span>
                <div className="-mr-2 hidden items-center md:flex">
                  <IconButton icon={Pencil} size={19} label={t('common.edit')} onClick={() => open(c)} />
                  <IconButton icon={Trash2} size={19} label={t('common.delete')} onClick={() => tryDelete(c)} className="hover:text-error" />
                </div>
              </div>
            </Swipeable>
          ))}
        </div>
      )}

      <Fab icon={Plus} label={t('cat.add')} onClick={() => open()} disabled={loading} />

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t('cat.renameTitle') : t('cat.addTitle')}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <TextField label={t('cat.name')} error={error} value={name} maxLength={LIMITS.category + 10} autoFocus autoComplete="off"
            onChange={(e) => { setName(e.target.value); setError(null); }} onBlur={() => setName(clean(name))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="text" onClick={() => setEdit(null)} disabled={busy}>{t('common.cancel')}</Button>
            <Button type="submit" icon={Save} loading={busy}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!pending} title={t('cat.rename.title')} message={t('cat.rename.msg', { from: edit?.name, to: pending, n: edit ? count(edit.name) : 0 })}
        confirmLabel={t('cat.rename.ok')} onConfirm={confirmRename} onCancel={() => setPending(null)} />
      <ConfirmDialog open={!!del} danger title={t('cat.delete.title')} message={t('cat.delete.msg', { name: del?.name })}
        confirmLabel={t('common.delete')} onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </div>
  );
}
