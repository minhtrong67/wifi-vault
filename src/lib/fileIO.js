// Import / Export CSV, Excel, JSON
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { normalizeWifi } from './validate';

const FIELDS = ['name', 'password', 'category', 'note'];
// Cho phép tiêu đề cột tiếng Anh hoặc tiếng Việt
const ALIASES = {
  name: ['name', 'ten', 'tenwifi', 'ssid'],
  password: ['password', 'matkhau', 'pass'],
  category: ['category', 'danhmuc'],
  note: ['note', 'ghichu'],
};
const key = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z]/g, '');

/** Đổi một dòng thô thành object wifi theo alias cột */
function mapRow(raw) {
  const out = {};
  const keys = Object.keys(raw);
  for (const f of FIELDS) {
    const k = keys.find((k) => ALIASES[f].includes(key(k)));
    out[f] = k ? raw[k] : '';
  }
  return normalizeWifi(out);
}

/** Đọc file (.csv/.xlsx/.xls/.json) → mảng wifi đã chuẩn hoá */
export async function readFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'json') {
    const data = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
    const list = Array.isArray(data) ? data : data.wifis;
    if (!Array.isArray(list)) throw new Error('File JSON phải là một mảng hoặc có thuộc tính "wifis".');
    return list.map(mapRow);
  }
  if (['csv', 'xlsx', 'xls'].includes(ext)) {
    const wb = ext === 'csv' ? XLSX.read(await file.text(), { type: 'string' }) : XLSX.read(await file.arrayBuffer());
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
    return rows.map(mapRow);
  }
  throw new Error('Định dạng không được hỗ trợ. Hãy dùng CSV, Excel hoặc JSON.');
}

const download = (blob, filename) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
const stamp = () => new Date().toISOString().slice(0, 10);
const plain = (list) => list.map(({ name, password, category, note }) => ({ name, password, category, note }));

/** Xuất danh sách wifi ra CSV | XLSX | JSON */
export function exportWifis(list, format) {
  const rows = plain(list);
  const base = `wifi-vault-${stamp()}`;
  if (format === 'json') return download(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }), `${base}.json`);
  const ws = XLSX.utils.json_to_sheet(rows, { header: FIELDS });
  if (format === 'csv') {
    // BOM giúp Excel hiển thị đúng tiếng Việt
    return download(new Blob(['\uFEFF' + XLSX.utils.sheet_to_csv(ws)], { type: 'text/csv;charset=utf-8' }), `${base}.csv`);
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Wifi');
  XLSX.writeFile(wb, `${base}.xlsx`);
}

/** Sao lưu toàn bộ dữ liệu (wifi + danh mục) dạng JSON */
export function exportBackup(wifis, categories) {
  const data = { app: 'Wifi Vault', exportedAt: new Date().toISOString(), categories: categories.map((c) => c.name), wifis: plain(wifis) };
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `wifi-vault-backup-${stamp()}.json`);
}


const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Dựng một khối HTML định dạng đẹp (bảng wifi) để chụp thành ảnh/PDF.
 *  Dùng chính DOM + font hệ thống của trình duyệt nên tiếng Việt luôn hiển thị đúng, không lỗi font. */
function buildExportSheet(list, colorOf) {
  const th = 'padding:10px 12px;text-align:left;font-weight:600;font-size:12px;letter-spacing:.02em;';
  const td = 'padding:10px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;vertical-align:top;';
  const rows = list.map((w, i) => {
    const c = colorOf ? colorOf(w.category) : null;
    const bg = i % 2 ? 'background:#f8fafc;' : '';
    return `<tr style="${bg}">
      <td style="${td}font-weight:600;color:#0f172a;">${esc(w.name)}</td>
      <td style="${td}font-family:ui-monospace,monospace;color:#334155;">${esc(w.password)}</td>
      <td style="${td}"><span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${c ? c.hex + '22' : '#eff6ff'};color:${c ? c.hex : '#2563eb'};">${esc(w.category)}</span></td>
      <td style="${td}color:#64748b;">${esc(w.note) || '—'}</td>
    </tr>`;
  }).join('');

  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:-10000px;top:0;width:860px;background:#ffffff;padding:36px;font-family:system-ui,-apple-system,sans-serif;color:#0f172a;';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
      <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);display:flex;align-items:center;justify-content:center;">
        <svg width="22" height="22" viewBox="0 0 64 64"><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M14 27a26 26 0 0 1 36 0"/><path d="M21 34a16 16 0 0 1 22 0"/><path d="M28 41a6 6 0 0 1 8 0"/></g><circle cx="32" cy="48" r="3.5" fill="#fff"/></svg>
      </div>
      <div>
        <div style="font-size:22px;font-weight:700;letter-spacing:-.01em;">Wifi Vault</div>
        <div style="font-size:12px;color:#64748b;margin-top:1px;">Xuất ngày ${esc(new Date().toLocaleString('vi-VN'))} • ${list.length} mạng wifi</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;">
      <thead><tr style="background:#1d4ed8;color:#fff;">
        <th style="${th}">Tên wifi</th><th style="${th}">Mật khẩu</th><th style="${th}">Danh mục</th><th style="${th}">Ghi chú</th>
      </tr></thead>
      <tbody>${rows || `<tr><td style="${td}color:#94a3b8;" colspan="4">Không có dữ liệu.</td></tr>`}</tbody>
    </table>
    <div style="margin-top:20px;text-align:center;font-size:11px;color:#94a3b8;">Wifi Vault · Tác giả minhtrong67 · Với sự hỗ trợ của Claude</div>
  `;
  document.body.appendChild(el);
  return el;
}

/** Xuất danh sách wifi ra ảnh PNG hoặc PDF (định dạng bảng, không lỗi font tiếng Việt) */
export async function exportVisual(list, format, colorOf) {
  const node = buildExportSheet(list, colorOf);
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const base = `wifi-vault-${stamp()}`;
    if (format === 'png') {
      await new Promise((resolve) => canvas.toBlob((blob) => { download(blob, `${base}.png`); resolve(); }, 'image/png'));
      return;
    }
    // PDF: nhúng ảnh đã render, tự chia trang nếu danh sách dài
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/png');
    const imgW = pageW;
    const imgH = (canvas.height / canvas.width) * pageW;
    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(`${base}.pdf`);
  } finally {
    document.body.removeChild(node);
  }
}
