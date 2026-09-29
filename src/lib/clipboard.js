/** Sao chép văn bản; trả về true nếu thành công */
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
