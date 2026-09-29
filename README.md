# Wifi Vault

Két sắt gọn gàng để lưu trữ, tìm kiếm và quản lý mật khẩu wifi. Giao diện tiếng Việt, phong cách Modern Minimalism, ưu tiên mobile và cài đặt được như ứng dụng (PWA).

> Tác giả: **minhtrong67** • Với sự hỗ trợ của Claude

## Công nghệ

React 18 · Vite 5 · Tailwind CSS 3 · Firebase (Authentication + Firestore) · Recharts · lucide-react · SheetJS (xlsx) · html2canvas · jsPDF

## Tính năng

- Đăng nhập bằng Google, dữ liệu tách riêng theo từng tài khoản
- Quản lý wifi: thêm, sửa, xoá, tìm kiếm, lọc theo danh mục, sắp xếp (bộ lọc dạng accordion)
- Vuốt phải để sửa, vuốt trái để xoá (có hộp thoại xác nhận); desktop có nút bấm thay thế
- Nhập/xuất CSV, Excel (.xlsx/.xls), JSON, PNG, PDF (PNG/PDF xuất dạng bảng đã định dạng sẵn, không lỗi font tiếng Việt). Nhập lại file có tên wifi trùng sẽ **ghi đè**, không tạo bản sao
- Quản lý danh mục (đổi tên sẽ cập nhật các wifi liên quan; không xoá được danh mục đang được dùng)
- Thống kê với biểu đồ cột (độ dài mật khẩu, số wifi theo danh mục) và biểu đồ tròn
- Cài đặt: cài app PWA, giao diện sáng/tối, cỡ chữ, xuất toàn bộ dữ liệu, khôi phục mặc định
- Tìm nhanh `Ctrl/⌘ + K`, toast, skeleton loading, nút có trạng thái loading
- Giao diện sáng / tối / theo hệ thống (tông màu Zinc cho chế độ tối), mỗi danh mục một màu phụ để dễ phân biệt
- Nút cuộn lên đầu trang khi cuộn xuống danh sách dài

## Cài đặt & chạy

```bash
npm install
npm run dev        # chạy môi trường phát triển
npm run build      # build production
npm run preview    # chạy thử bản build
```

## Cấu hình Firebase

1. Tạo project tại [Firebase Console](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → bật **Google**. Thêm domain triển khai vào *Authorized domains*.
3. **Firestore Database** → tạo database, sau đó dán nội dung file `firestore.rules` vào tab *Rules* và Publish.
4. Project settings → *Your apps* → thêm Web app, sao chép cấu hình vào file `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Khởi động lại `npm run dev`, đăng nhập bằng Google rồi tạo danh mục và thêm (hoặc nhập file) wifi của bạn.

## Cấu trúc dữ liệu Firestore

```
users/{uid}/wifis/{id}        name, password, category, note, createdAt, updatedAt
users/{uid}/categories/{id}   name, createdAt
```

`{id}` của wifi được sinh từ tên (không phân biệt hoa/thường/dấu) nên trùng tên = ghi đè.

## Ràng buộc dữ liệu

| Trường | Quy tắc |
| --- | --- |
| Tên wifi | Bắt buộc, tối đa 32 ký tự, không trùng |
| Mật khẩu | Bắt buộc, 8–63 ký tự |
| Danh mục | Bắt buộc, phải tồn tại (import sẽ tự tạo nếu thiếu) |
| Ghi chú | Tối đa 200 ký tự |

Mọi trường đều được `trim()` và gộp khoảng trắng thừa trước khi lưu. Dòng không hợp lệ khi import sẽ bị bỏ qua và được báo lại.

## Định dạng file nhập

Cột: `name, password, category, note` (chấp nhận thêm tiêu đề tiếng Việt: `tên wifi, mật khẩu, danh mục, ghi chú`). JSON là mảng đối tượng hoặc `{ "wifis": [...] }`.

## Cấu trúc thư mục

```
src/
  components/  Layout, WifiForm, WifiCard, SearchPalette, ui (Modal, Confirm, Swipeable…)
  context/     Auth, Data, Settings, Toast
  lib/         firebase, db, validate, fileIO (gồm xuất PNG/PDF), clipboard, colors, useMediaQuery
  pages/       Home, WifiPage, Categories, Stats, SettingsPage, Login
```

## Triển khai

Build rồi đưa thư mục `dist/` lên Firebase Hosting / Vercel / Netlify (cấu hình rewrite mọi đường dẫn về `index.html`).
