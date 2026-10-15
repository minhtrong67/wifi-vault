import { useRef, useState } from 'react';
import { Check, Database, Download, PackageOpen, Globe, Home, Languages, Palette, PaintBucket, RotateCcw, Smartphone, Sun, Moon, Monitor, Type, Upload } from 'lucide-react';
import { FONT_SIZES, useSettings } from '../context/SettingsContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Accordion, Button, ConfirmDialog, PageHeader, Segmented, TextField } from '../components/ui';
import Credits from '../components/Credits';
import { NAV } from '../components/nav';
import { MATERIAL_COLORS } from '../theme/theme';
import { LANG_NAMES } from '../i18n';
import { ACCEPT, FORMATS, exportAll, exportCategories, exportWifis, readCategoryFile, readWifiFile } from '../lib/fileIO';
import { catId, upsertCategories, upsertWifis } from '../lib/db';
import { isIOS, useInstall } from '../lib/pwa';
import { validateCategory, validateWifi, wifiId } from '../lib/validate';

/** Khối cài đặt có icon tròn + tiêu đề + mô tả */
const Section = ({ icon: Icon, title, desc, children }) => (
  <section className="card p-4 md:p-5">
    <div className="mb-4 flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container"><Icon size={20} /></span>
      <div className="min-w-0">
        <h2 className="text-base font-medium leading-6 text-on-surface">{title}</h2>
        <p className="text-sm text-on-surface-variant">{desc}</p>
      </div>
    </div>
    {children}
  </section>
);

/** Màu chữ/dấu tick dễ đọc trên một màu nền bất kỳ */
const onColor = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? '#1b1b1f' : '#ffffff';
};

/** Một khối xuất/nhập: chọn định dạng (CSV/XLSX/JSON) → Xuất hoặc Nhập */
function DataBlock({ title, desc, onExport, onImport, disabled }) {
  const { t } = useSettings();
  const [fmt, setFmt] = useState('xlsx');
  const [busy, setBusy] = useState(false);
  const ref = useRef();
  const run = async () => { setBusy(true); try { await onExport(fmt); } finally { setBusy(false); } };
  return (
    <div className="rounded-2xl border border-outline-variant p-4">
      <p className="font-medium text-on-surface">{title}</p>
      <p className="mb-3 text-sm text-on-surface-variant">{desc}</p>
      <Segmented label={t('settings.data.exportAs')} value={fmt} onChange={setFmt} options={FORMATS.map((f) => ({ value: f, label: f.toUpperCase() }))} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="tonal" icon={Download} loading={busy} disabled={disabled} onClick={run}>{t('settings.data.export')}</Button>
        <Button variant="outlined" icon={Upload} disabled={disabled} onClick={() => ref.current.click()}>{t('settings.data.import')}</Button>
        <input ref={ref} type="file" accept={ACCEPT} hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onImport(f); }} />
      </div>
    </div>
  );
}

/** Khối "Xuất tất cả": wifi + danh mục trong một lần, theo CSV/XLSX/JSON */
function ExportAllBlock({ onExport, disabled }) {
  const { t } = useSettings();
  const [fmt, setFmt] = useState('xlsx');
  const [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); try { await onExport(fmt); } finally { setBusy(false); } };
  return (
    <div className="rounded-2xl bg-secondary-container/50 p-4">
      <p className="flex items-center gap-2 font-medium text-on-surface"><PackageOpen size={18} className="text-primary" /> {t('settings.data.all')}</p>
      <p className="mb-3 text-sm text-on-surface-variant">{t('settings.data.allDesc')}</p>
      <Segmented label={t('settings.data.exportAs')} value={fmt} onChange={setFmt} options={FORMATS.map((f) => ({ value: f, label: f.toUpperCase() }))} />
      <Button className="mt-3 w-full" icon={Download} loading={busy} disabled={disabled} onClick={run}>{t('settings.data.exportAll')}</Button>
    </div>
  );
}

/** Trang cài đặt: cài app, giao diện, màu chủ đề, cỡ chữ, ngôn ngữ, trang mặc định, xuất/nhập dữ liệu, khôi phục mặc định */
export default function SettingsPage() {
  const { settings, update, reset, t, lang, deviceLang } = useSettings();
  const { uid, wifis, categories, loading } = useData();
  const toast = useToast();
  const { installed, canPrompt, install } = useInstall();
  const [confirmReset, setConfirmReset] = useState(false);
  const [plan, setPlan] = useState(null); // kế hoạch nhập đang chờ xác nhận

  // ----- Xuất -----
  const doExport = (what) => async (fmt) => {
    const list = what === 'wifi' ? wifis : categories;
    if (!list.length) return toast.info(t('settings.data.nothing'));
    try {
      const n = await (what === 'wifi' ? exportWifis(list, fmt) : exportCategories(list, fmt));
      toast.success(t('settings.data.exported', { n, fmt: fmt.toUpperCase() }));
    } catch { toast.error(t('settings.data.exportFail')); }
  };

  const doExportAll = async (fmt) => {
    if (!wifis.length && !categories.length) return toast.info(t('settings.data.nothing'));
    try {
      const r = await exportAll(wifis, categories, fmt);
      toast.success(t('settings.data.exportedAll', { w: r.wifis, c: r.categories, fmt: fmt.toUpperCase() }));
    } catch { toast.error(t('settings.data.exportFail')); }
  };

  // ----- Nhập: đọc file → kiểm tra từng dòng → hỏi xác nhận → ghi (wifi trùng tên được ghi đè) -----
  const pickWifi = async (file) => {
    try {
      const rows = await readWifiFile(file);
      const valid = rows.filter((r) => !Object.keys(validateWifi(r)).length);
      if (!valid.length) return toast.error(t('settings.data.noValid'));
      const ids = new Set(wifis.map((w) => w.id));
      const unique = new Map(valid.map((r) => [wifiId(r.name), r])); // dòng sau ghi đè dòng trước
      const over = [...unique.keys()].filter((id) => ids.has(id)).length;
      setPlan({ kind: 'wifi', rows: [...unique.values()], over, fresh: unique.size - over, skipped: rows.length - valid.length, ids });
    } catch (e) { toast.error(e.key ? t(e.key) : t('settings.data.readFail')); }
  };
  const pickCategories = async (file) => {
    try {
      const names = await readCategoryFile(file);
      const valid = [...new Map(names.filter((n) => !validateCategory(n, [])).map((n) => [catId(n), n])).values()];
      if (!valid.length) return toast.error(t('settings.data.noValid'));
      const ids = new Set(categories.map((c) => c.id));
      const fresh = valid.filter((n) => !ids.has(catId(n))).length;
      setPlan({ kind: 'cat', rows: valid, fresh, over: valid.length - fresh, skipped: names.length - valid.length, ids });
    } catch (e) { toast.error(e.key ? t(e.key) : t('settings.data.readFail')); }
  };
  const confirmImport = async () => {
    try {
      if (plan.kind === 'wifi') {
        const r = await upsertWifis(uid, plan.rows, plan.ids);
        toast.success(t('settings.data.importedWifi', { total: r.total, fresh: r.total - r.updated, over: r.updated }));
      } else {
        const r = await upsertCategories(uid, plan.rows, plan.ids);
        toast.success(t('settings.data.importedCat', { fresh: r.added }));
      }
      setPlan(null);
    } catch { toast.error(t('settings.data.importFail')); }
  };
  const skippedMsg = plan?.skipped ? t('settings.data.skipped', { n: plan.skipped }) : '';
  const planMsg = plan && t(plan.kind === 'wifi' ? 'settings.data.importWifiMsg' : 'settings.data.importCatMsg', { total: plan.rows.length, fresh: plan.fresh, over: plan.over, skipped: skippedMsg });

  const doInstall = async () => { if (await install()) toast.success(t('settings.install.done')); };

  return (
    <div className="space-y-4">
      <PageHeader title={t('settings.title')} />

      {/* Card cài đặt ứng dụng — chỉ hiện khi app chưa được cài */}
      {!installed && (
        <div className="relative isolate flex animate-fadeThrough flex-col gap-4 overflow-hidden rounded-3xl bg-primary-container p-5 text-on-primary-container sm:flex-row sm:items-center">
          <div aria-hidden="true" className="absolute -right-10 -top-10 -z-10 size-40 rounded-full bg-primary/10 blur-2xl" />
          <img src="/icon-192.png" alt="" width="56" height="56" className="size-14 shrink-0 rounded-2xl shadow-el2" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-lg font-medium leading-6"><Smartphone size={18} /> {t('settings.install.title')}</p>
            <p className="mt-1 text-sm opacity-90">{canPrompt ? t('settings.install.desc') : isIOS() ? t('settings.install.ios') : t('settings.install.manual')}</p>
          </div>
          {canPrompt && <Button icon={Download} onClick={doInstall} className="shrink-0">{t('settings.install.button')}</Button>}
        </div>
      )}

      <Section icon={Palette} title={t('settings.appearance.title')} desc={t('settings.appearance.desc')}>
        <Segmented label={t('settings.appearance.title')} value={settings.theme} onChange={(v) => update({ theme: v })}
          options={[{ value: 'light', label: t('settings.mode.light'), icon: Sun }, { value: 'dark', label: t('settings.mode.dark'), icon: Moon }, { value: 'system', label: t('settings.mode.system'), icon: Monitor }]} />
      </Section>

      <Section icon={PaintBucket} title={t('settings.color.title')} desc={t('settings.color.desc')}>
        <div role="radiogroup" aria-label={t('settings.color.title')} className="grid grid-cols-6 gap-2 sm:grid-cols-9">
          {MATERIAL_COLORS.map((c) => {
            const on = settings.seed.toUpperCase() === c.hex;
            const name = t(`settings.color.${c.name}`);
            return (
              <button key={c.hex} type="button" role="radio" aria-checked={on} aria-label={name} title={name} onClick={() => update({ seed: c.hex })}
                style={{ background: c.hex, color: onColor(c.hex) }}
                className={`grid aspect-square w-full place-items-center rounded-full transition-all duration-200 ease-emphasized hover:scale-110 active:scale-95 ${on ? 'scale-105 ring-2 ring-on-surface ring-offset-2 ring-offset-surface-container-low' : ''}`}>
                {on && <Check size={18} strokeWidth={3} className="animate-pop" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={Type} title={t('settings.font.title')} desc={t('settings.font.desc')}>
        <Segmented label={t('settings.font.title')} value={settings.fontSize} onChange={(v) => update({ fontSize: v })} options={FONT_SIZES.map((f) => ({ value: f.px, label: t(f.key) }))} />
      </Section>

      <Section icon={Languages} title={t('settings.lang.title')} desc={t('settings.lang.desc')}>
        <Segmented label={t('settings.lang.title')} value={settings.lang} onChange={(v) => update({ lang: v })}
          options={[{ value: 'auto', label: t('settings.lang.auto'), icon: Globe }, { value: 'vi', label: LANG_NAMES.vi }, { value: 'en', label: LANG_NAMES.en }]} />
        {settings.lang === 'auto' && <p className="mt-2 px-1 text-xs text-on-surface-variant">{t('settings.lang.autoHint', { lang: LANG_NAMES[deviceLang] })}</p>}
      </Section>

      <Section icon={Home} title={t('settings.start.title')} desc={t('settings.start.desc')}>
        <TextField as="select" label={t('settings.start.label')} value={settings.startPage} onChange={(e) => update({ startPage: e.target.value })}>
          {NAV.map((n) => <option key={n.to} value={n.to}>{t(n.key)}</option>)}
        </TextField>
      </Section>

      {/* Dữ liệu: accordion, mặc định đóng */}
      <Accordion title={t('settings.data.title')} icon={Database}>
        <p className="text-sm text-on-surface-variant">{t('settings.data.desc')}</p>
        <ExportAllBlock disabled={loading} onExport={doExportAll} />
        <div className="grid gap-3 md:grid-cols-2">
          <DataBlock title={t('settings.data.wifi')} desc={t('settings.data.wifiDesc')} disabled={loading} onExport={doExport('wifi')} onImport={pickWifi} />
          <DataBlock title={t('settings.data.categories')} desc={t('settings.data.categoriesDesc')} disabled={loading} onExport={doExport('cat')} onImport={pickCategories} />
        </div>
        <p className="px-1 text-xs text-on-surface-variant">{t('settings.data.importHint')}</p>
      </Accordion>

      <Section icon={RotateCcw} title={t('settings.reset.title')} desc={t('settings.reset.desc')}>
        <Button variant="text-danger" className='w-full' icon={RotateCcw} onClick={() => setConfirmReset(true)}>{t('settings.reset.title')}</Button>
      </Section>

      <Credits />

      <ConfirmDialog open={confirmReset} title={t('settings.reset.confirmTitle')} message={t('settings.reset.confirmMsg')} confirmLabel={t('settings.reset.ok')}
        onConfirm={() => { reset(); setConfirmReset(false); toast.success(t('settings.reset.done')); }} onCancel={() => setConfirmReset(false)} />
      <ConfirmDialog open={!!plan} title={t('settings.data.importTitle')} message={planMsg} confirmLabel={t('settings.data.importOk')} onConfirm={confirmImport} onCancel={() => setPlan(null)} />
    </div>
  );
}
