import { memo, useState } from 'react';
import { Copy, Eye, EyeOff, Pencil, Trash2, Wifi } from 'lucide-react';
import { IconButton, Swipeable } from './ui';
import { copyText } from '../lib/clipboard';
import { useToast } from '../context/ToastContext';
import { useT } from '../context/SettingsContext';

/** Thẻ hiển thị một mạng wifi, màu theo danh mục (memo để tránh render lại không cần thiết) */
function WifiCard({ wifi, accent, onEdit, onDelete }) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  const toast = useToast();
  const copy = async () => ((await copyText(wifi.password)) ? toast.success(t('wifi.toast.copied')) : toast.error(t('wifi.toast.copyFail')));
  return (
    <Swipeable onEdit={() => onEdit(wifi)} onDelete={() => onDelete(wifi)}>
      <div className="state flex items-start gap-3 rounded-2xl bg-surface-container-low p-4 shadow-el1 transition-shadow duration-200 hover:shadow-el2">
        <span style={accent.tile} className="grid size-12 shrink-0 place-items-center rounded-2xl"><Wifi size={22} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium leading-6 text-on-surface">{wifi.name}</h3>
          <span style={accent.chip} className="chip mt-0.5">{wifi.category}</span>
          <p className="mt-2 break-all font-mono text-[13px] tracking-wide text-on-surface-variant">
            {show ? wifi.password : '•'.repeat(Math.min(wifi.password.length, 14))}
          </p>
          {wifi.note && <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant/80">{wifi.note}</p>}
        </div>
        <div className="-mr-2 -mt-1 flex shrink-0 items-center">
          <IconButton icon={show ? EyeOff : Eye} size={19} label={show ? t('wifi.card.hide') : t('wifi.card.show')} onClick={() => setShow(!show)} aria-pressed={show} />
          <IconButton icon={Copy} size={19} label={t('wifi.card.copy')} onClick={copy} />
          {/* Nút bấm dự phòng cho desktop (chuột không vuốt được) */}
          <IconButton icon={Pencil} size={19} label={t('common.edit')} onClick={() => onEdit(wifi)} className="hidden md:grid" />
          <IconButton icon={Trash2} size={19} label={t('common.delete')} onClick={() => onDelete(wifi)} className="hidden hover:text-error md:grid" />
        </div>
      </div>
    </Swipeable>
  );
}
export default memo(WifiCard);
