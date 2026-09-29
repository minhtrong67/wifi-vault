import { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { Button, Field } from './ui';
import { LIMITS, normalizeWifi, validateWifi, wifiId } from '../lib/validate';

/** Form thêm/sửa wifi. Tự trim, kiểm tra ràng buộc và chặn trùng tên trước khi lưu. */
export default function WifiForm({ initial, categories, wifis, onSubmit, onCancel }) {
  const [v, setV] = useState({ name: '', password: '', category: categories[0]?.name || '', note: '', ...initial });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setV((s) => ({ ...s, [k]: e.target.value })); setErrors((s) => ({ ...s, [k]: '' })); };
  // Tự loại bỏ khoảng trắng thừa khi rời ô nhập
  const blur = (k) => () => setV((s) => ({ ...s, [k]: normalizeWifi({ ...s })[k] }));

  const submit = async (e) => {
    e.preventDefault();
    const data = normalizeWifi(v);
    const errs = validateWifi(data, categories.map((c) => c.name));
    const id = wifiId(data.name);
    if (!errs.name && id !== initial?.id && wifis.some((w) => w.id === id)) errs.name = 'Tên wifi này đã tồn tại.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { await onSubmit(data); } finally { setBusy(false); }
  };
  const cls = (k) => `input ${errors[k] ? 'input-err' : ''}`;

  return (
    <form onSubmit={submit} noValidate className="space-y-3.5">
      <Field label="Tên wifi" error={errors.name}>
        <input className={cls('name')} value={v.name} onChange={set('name')} onBlur={blur('name')} maxLength={LIMITS.name + 10} placeholder="Ví dụ: Highlands 5G" autoFocus />
      </Field>
      <Field label="Mật khẩu" error={errors.password} hint={`Từ ${LIMITS.passMin} đến ${LIMITS.passMax} ký tự`}>
        <div className="relative">
          <input className={`${cls('password')} pr-11`} type={show ? 'text' : 'password'} value={v.password} onChange={set('password')} onBlur={blur('password')} autoComplete="off" />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200">
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Field>
      <Field label="Danh mục" error={errors.category}>
        <select className={cls('category')} value={v.category} onChange={set('category')}>
          {categories.map((c) => <option key={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Ghi chú" error={errors.note} hint={`${v.note.length}/${LIMITS.note}`}>
        <textarea className={cls('note')} rows={3} value={v.note} onChange={set('note')} onBlur={blur('note')} placeholder="Địa chỉ, vị trí, thông tin thêm…" />
      </Field>
      <div className="flex gap-2 pt-1">
        <Button type="button" className="btn-ghost flex-1" onClick={onCancel} disabled={busy}>Huỷ</Button>
        <Button type="submit" className="btn-primary flex-1" icon={Save} loading={busy}>Lưu</Button>
      </div>
    </form>
  );
}
