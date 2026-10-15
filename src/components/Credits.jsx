import { Code2, Heart, Sparkles } from 'lucide-react';
import { useT } from '../context/SettingsContext';

export const AUTHOR = 'minhtrong67';
export const AI = 'Claude';

/** Ghi công tác giả + AI hỗ trợ. `compact` = một dòng gọn (đăng nhập, sidebar); mặc định là thẻ nổi bật. */
export default function Credits({ compact = false, className = '' }) {
  const { t } = useT();
  if (compact) {
    return (
      <p className={`flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-on-surface-variant ${className}`}>
        <span>{t('credits.author')}</span>
        <b className="rounded-full bg-primary-container px-2 py-0.5 font-medium text-on-primary-container">{AUTHOR}</b>
        <span className="opacity-60">·</span>
        <span>{t('credits.builtWith')}</span>
        <b className="inline-flex items-center gap-1 rounded-full bg-tertiary-container px-2 py-0.5 font-medium text-on-tertiary-container"><Sparkles size={12} />{AI}</b>
      </p>
    );
  }
  const Tile = ({ icon: Icon, label, name, tone }) => (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface/60 px-3 py-4 text-center backdrop-blur-sm">
      <span className={`grid size-12 place-items-center rounded-full shadow-el2 ${tone}`}><Icon size={22} /></span>
      <p className="text-[11px] font-medium uppercase tracking-wider text-on-secondary-container/80">{label}</p>
      <p className="text-xl font-medium leading-6 text-on-secondary-container">{name}</p>
    </div>
  );
  return (
    <div className={`relative isolate mx-auto w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container via-secondary-container to-tertiary-container p-5 text-center ${className}`}>
      <div aria-hidden="true" className="absolute -right-8 -top-8 -z-10 size-32 rounded-full bg-primary/10 blur-2xl" />
      <div aria-hidden="true" className="absolute -bottom-10 -left-6 -z-10 size-36 rounded-full bg-tertiary/15 blur-2xl" />
      <p className="mb-4 text-sm font-medium text-on-secondary-container">{t('credits.title')}</p>
      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Code2} label={t('credits.author')} name={AUTHOR} tone="bg-primary text-on-primary" />
        <Tile icon={Sparkles} label={t('credits.builtWith')} name={AI} tone="bg-tertiary text-on-tertiary" />
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-on-secondary-container/80">
        <Heart size={13} className="fill-current" /> {t('credits.openSource')}
      </p>
    </div>
  );
}
