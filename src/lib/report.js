// Xuất báo cáo thống kê ra PDF hoặc PNG.
// Báo cáo được dựng thành một khối HTML riêng (màu cố định, nền sáng) rồi chụp bằng html2canvas, nên
// luôn đẹp, dễ in và không phụ thuộc chế độ sáng/tối hay kích thước màn hình. Dùng font hệ thống/Roboto nên tiếng Việt không lỗi.
import { download, stamp } from './fileIO';
import { ACCENTS } from './colors';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const W = 900; // chiều rộng khối báo cáo (px)

const LOGO = `<svg width="48" height="48" viewBox="0 0 64 64"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A7DB3"/><stop offset="1" stop-color="#274F7D"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#rg)"/><g transform="translate(0 -2)"><g fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"><path d="M12.7 23a30 30 0 0 1 38.6 0"/><path d="M19.1 30.7a20 20 0 0 1 25.8 0"/><path d="M25.6 38.3a10 10 0 0 1 12.8 0"/></g><circle cx="32" cy="47.5" r="5.5" fill="#D1E4FF"/><circle cx="32" cy="47" r="1.9" fill="#274F7D"/><path d="M31 48h2l.5 3.3h-3z" fill="#274F7D"/></g></svg>`;

function donut(byCat, total, c, colorOf) {
  const R = 70, C = 2 * Math.PI * R;
  let acc = 0;
  const arcs = byCat.map((x) => {
    const len = (x.value / total) * C;
    const el = `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${colorOf(x.name).hex}" stroke-width="34" stroke-dasharray="${Math.max(len - 2, 0.5)} ${C - Math.max(len - 2, 0.5)}" stroke-dashoffset="${-acc}" transform="rotate(-90 100 100)"/>`;
    acc += len;
    return el;
  }).join('');
  return `<svg width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="${R}" fill="none" stroke="${c.surfaceContainerHigh}" stroke-width="34"/>${arcs}
    <text x="100" y="104" text-anchor="middle" font-size="34" font-weight="500" fill="${c.onSurface}">${total}</text>
    <text x="100" y="124" text-anchor="middle" font-size="13" fill="${c.onSurfaceVariant}">wifi</text></svg>`;
}

/** Dựng khối HTML của báo cáo. Mỗi phần tử có `data-block` là một khối không bị cắt đôi khi chia trang PDF. */
function buildSheet({ s, total, categoriesCount }, c, t, lang, colorOf) {
  const card = `background:${c.surfaceContainerLow};border-radius:24px;padding:24px;margin-top:20px;`;
  const h2 = `font-size:18px;font-weight:500;margin:0;color:${c.onSurface};`;
  const note = `font-size:12px;color:${c.onSurfaceVariant};margin:4px 0 18px;`;
  const tile = (bg, fg, value, label) => `<div style="flex:1;background:${bg};color:${fg};border-radius:24px;padding:18px 20px;"><div style="font-size:32px;line-height:36px;">${esc(value)}</div><div style="font-size:13px;margin-top:6px;opacity:.8;">${esc(label)}</div></div>`;
  const maxLen = Math.max(1, ...s.byLen.map((x) => x.value));
  const maxCat = Math.max(1, ...s.byCat.map((x) => x.value));
  const bars = s.byLen.map((x, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">
      <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:${c.onSurfaceVariant};">${x.value}</div>
      <div style="width:56px;height:${Math.max((x.value / maxLen) * 130, x.value ? 6 : 2)}px;border-radius:10px 10px 0 0;background:${c.primary};opacity:${0.4 + i * 0.2};"></div></div>`).join('');
  const labels = s.byLen.map((x) => `<div style="flex:1;text-align:center;font-size:12px;color:${c.onSurfaceVariant};">${esc(x.name)}</div>`).join('');
  const legend = s.byCat.map((x) => `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:14px;">
      <span style="width:12px;height:12px;border-radius:50%;background:${colorOf(x.name).hex};flex:none;"></span>
      <span style="flex:1;color:${c.onSurface};">${esc(x.name)}</span><b>${x.value}</b>
      <span style="width:44px;text-align:right;color:${c.onSurfaceVariant};">${Math.round((x.value / total) * 100)}%</span></div>`).join('');
  const hbars = s.byCat.map((x) => `<div style="display:flex;align-items:center;gap:12px;padding:5px 0;">
      <div style="width:170px;font-size:13px;color:${c.onSurface};text-align:right;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${esc(x.name)}</div>
      <div style="flex:1;background:${c.surfaceContainerHigh};border-radius:8px;height:22px;"><div style="width:${(x.value / maxCat) * 100}%;height:22px;border-radius:8px;background:${colorOf(x.name).hex};"></div></div>
      <div style="width:32px;font-size:14px;font-weight:700;">${x.value}</div></div>`).join('');

  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:-10000px;top:0;width:${W}px;box-sizing:border-box;background:${c.surface};padding:40px;font-family:Roboto,system-ui,-apple-system,'Segoe UI',sans-serif;color:${c.onSurface};`;
  el.innerHTML = `
    <div data-block style="display:flex;align-items:center;gap:16px;">
      ${LOGO}
      <div style="flex:1;"><div style="font-size:26px;line-height:30px;">${esc(t('app.name'))}</div><div style="font-size:14px;color:${c.onSurfaceVariant};">${esc(t('report.title'))}</div></div>
      <div style="font-size:13px;color:${c.onSurfaceVariant};text-align:right;">${esc(t('report.generated', { date: new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'long' }) }))}</div>
    </div>
    <div data-block style="display:flex;gap:14px;margin-top:28px;">
      ${tile(c.primaryContainer, c.onPrimaryContainer, total, t('stats.total'))}
      ${tile(c.secondaryContainer, c.onSecondaryContainer, categoriesCount, t('stats.categories'))}
      ${tile(c.tertiaryContainer, c.onTertiaryContainer, t('stats.chars', { n: s.avg }), t('stats.avgLen'))}
      ${tile(c.surfaceContainerHighest, c.onSurface, s.withNote, t('stats.withNote'))}
    </div>
    <div data-block style="${card}"><h2 style="${h2}">${esc(t('stats.lenTitle'))}</h2><p style="${note}">${esc(t('stats.lenNote'))}</p>
      <div style="display:flex;align-items:flex-end;height:170px;border-bottom:1px solid ${c.outlineVariant};">${bars}</div><div style="display:flex;margin-top:8px;">${labels}</div></div>
    <div data-block style="${card}"><h2 style="${h2}">${esc(t('stats.ratioTitle'))}</h2><p style="${note}">${esc(t('stats.ratioNote'))}</p>
      <div style="display:flex;align-items:center;gap:32px;"><div style="flex:none;">${donut(s.byCat, total, c, colorOf)}</div><div style="flex:1;">${legend}</div></div></div>
    <div data-block style="${card}"><h2 style="${h2}">${esc(t('stats.countTitle'))}</h2><p style="${note}">${esc(t('stats.countNote'))}</p>${hbars}</div>
    <div data-block style="margin-top:28px;text-align:center;font-size:12px;color:${c.onSurfaceVariant};">${esc(t('report.footer'))}</div>`;
  document.body.appendChild(el);
  return el;
}

/** Cắt chiều cao canvas thành các trang, không cắt ngang một khối nội dung */
function paginate(blocks, total, pageH) {
  const pages = [];
  let start = 0, prevBottom = 0;
  for (const b of blocks) {
    if (b.bottom - start > pageH && prevBottom > start) { pages.push([start, prevBottom]); start = b.top; }
    while (b.bottom - start > pageH) { pages.push([start, start + pageH]); start += pageH; } // khối quá cao → buộc phải cắt
    prevBottom = b.bottom;
  }
  pages.push([start, total]);
  return pages;
}

/**
 * Xuất báo cáo thống kê.
 * @param {object} p { format: 'pdf'|'png', s, total, categoriesCount, colors (bảng màu sáng), t, lang, colorOf }
 */
export async function exportReport({ format, s, total, categoriesCount, colors, t, lang, colorOf }) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), format === 'pdf' ? import('jspdf') : Promise.resolve({})]);
  await document.fonts?.ready;
  const node = buildSheet({ s, total, categoriesCount }, colors, t, lang, colorOf);
  try {
    const scale = 2;
    const canvas = await html2canvas(node, { scale, backgroundColor: colors.surface, useCORS: true, logging: false });
    const base = `wifi-vault-report-${stamp()}`;
    if (format === 'png') {
      await new Promise((resolve, reject) => canvas.toBlob((b) => { if (!b) return reject(new Error('png')); download(b, `${base}.png`); resolve(); }, 'image/png'));
      return;
    }
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 8;
    const pw = pdf.internal.pageSize.getWidth() - margin * 2;
    const ph = pdf.internal.pageSize.getHeight() - margin * 2;
    const pxPerMm = W / pw; // 1mm trên giấy = bao nhiêu px của khối báo cáo
    const top = node.getBoundingClientRect().top;
    const blocks = [...node.querySelectorAll('[data-block]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - top - (el === node.firstElementChild ? 0 : 20), bottom: r.bottom - top };
    });
    blocks[0].top = 0;
    const pages = paginate(blocks, node.offsetHeight, ph * pxPerMm);
    pages.forEach(([y0, y1], i) => {
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.max(1, Math.round((y1 - y0) * scale));
      const ctx = slice.getContext('2d');
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, Math.round(y0 * scale), canvas.width, slice.height, 0, 0, canvas.width, slice.height);
      if (i) pdf.addPage();
      pdf.setFillColor(colors.surface);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, pw, (y1 - y0) / pxPerMm);
    });
    pdf.save(`${base}.pdf`);
  } finally {
    node.remove();
  }
}
