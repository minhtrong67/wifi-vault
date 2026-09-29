import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** Nút cuộn lên đầu trang, chỉ hiện khi đã cuộn xuống một đoạn */
export default function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', h, { passive: true });
    h();
    return () => window.removeEventListener('scroll', h);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Cuộn lên đầu trang"
      className="fixed bottom-24 right-4 z-30 grid size-11 animate-pop place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-90 md:bottom-6">
      <ArrowUp size={19} />
    </button>
  );
}
