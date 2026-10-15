import { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { Button, IconButton, TextField } from './ui';
import { useT } from '../context/SettingsContext';
import { LIMITS, normalizeWifi, validateWifi, wifiId } from '../lib/validate';

/** Form thêm/sửa wifi. Tự trim, kiểm tra ràng buộc và chặn trùng tên trước khi lưu. */
export default function WifiForm({ initial, categories, wifis, onSubmit, onCancel }) {
  const { t } = useT();
  const [v, setV] = useState({ name: '', password: '', category: categories[0]?.name || '', note: '', ...initial });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setV((s) => ({ ...s, [k]: e.target.value })); setErrors((s) => ({ ...s, [k]: null })); };
  // Tự loại bỏ khoảng trắng thừa khi rời ô nhập
  const blur = (k) => () => setV((s) => ({ ...s, [k]: normalizeWifi({ ...s })[k] }));

  const submit = async (e) => {
    e.preventDefault();
    const data = normalizeWifi(v);
    const errs = validateWifi(data, categories.map((c) => c.name));
    const id = wifiId(data.name);
    if (!errs.name && id !== initial?.id && wifis.some((w) => w.id === id)) errs.name = { key: 'wifi.form.exists' };
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { await onSubmit(data); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField label={t('wifi.form.name')} error={errors.name} value={v.name} onChange={set('name')} onBlur={blur('name')} maxLength={LIMITS.name + 10} autoFocus autoComplete="off" />
      <TextField label={t('wifi.form.password')} error={errors.password} hint={t('wifi.form.passHint', { min: LIMITS.passMin, max: LIMITS.passMax })}
        type={show ? 'text' : 'password'} value={v.password} onChange={set('password')} onBlur={blur('password')} autoComplete="off" spellCheck={false}
        trailing={<IconButton icon={show ? EyeOff : Eye} size={19} label={show ? t('wifi.card.hide') : t('wifi.card.show')} onClick={() => setShow(!show)} />} />
      <TextField as="select" label={t('wifi.form.category')} error={errors.category} value={v.category} onChange={set('category')}>
        {categories.map((c) => <option key={c.id}>{c.name}</option>)}
      </TextField>
      <TextField as="textarea" rows={3} label={t('wifi.form.note')} error={errors.note} hint={`${v.note.length}/${LIMITS.note}`} value={v.note} onChange={set('note')} onBlur={blur('note')} />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="text" onClick={onCancel} disabled={busy}>{t('common.cancel')}</Button>
        <Button type="submit" icon={Save} loading={busy}>{t('common.save')}</Button>
      </div>
    </form>
  );
}
