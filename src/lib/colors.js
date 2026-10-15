// Bảng màu phân loại cho danh mục. Mỗi danh mục một màu (dùng cho thẻ, nhãn và biểu đồ).
// Nhãn/ô màu được pha với màu nền & chữ của theme (color-mix) nên luôn đủ tương phản ở cả chế độ sáng và tối.
export const ACCENTS = [
  { hex: '#2196F3' }, { hex: '#4CAF50' }, { hex: '#FF9800' }, { hex: '#9C27B0' }, { hex: '#F44336' },
  { hex: '#00BCD4' }, { hex: '#FF5722' }, { hex: '#E91E63' }, { hex: '#009688' }, { hex: '#8BC34A' },
].map((a) => ({
  ...a,
  chip: {
    background: `color-mix(in srgb, ${a.hex} 20%, rgb(var(--md-surface)))`,
    color: `color-mix(in srgb, ${a.hex} 60%, rgb(var(--md-on-surface)))`,
  },
  tile: { background: `color-mix(in srgb, ${a.hex} 22%, rgb(var(--md-surface)))`, color: `color-mix(in srgb, ${a.hex} 62%, rgb(var(--md-on-surface)))` },
}));
