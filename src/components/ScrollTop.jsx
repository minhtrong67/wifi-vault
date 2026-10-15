import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useT } from '../context/SettingsContext';
import { ripple } from './ui';

/** Nút cuộn lên đầu trang: trượt vào khi đã cuộn xuống một đoạn, tự nâng lên nếu trang có FAB */
export default function ScrollTop() {
  const { t } = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const h = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setShow(window.scrollY > 400)); };
    window.addEventListener('scroll', h, { passive: true });
    h();
    return () => { window.removeEventListener('scroll', h); cancelAnimationFrame(raf); };
  }, []);
  const go = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  return (
    <button type="button" onClick={go} onPointerDown={ripple} aria-label={t('common.scrollTop')} title={t('common.scrollTop')} tabIndex={show ? 0 : -1}
      className={`fab-small scrolltop fixed right-4 z-30 transition-[opacity,transform] duration-300 ease-emphasized md:right-8 ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
      <ArrowUp size={24} />
    </button>
  );
}
