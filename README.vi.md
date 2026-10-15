<div align="center">

<img src="public/icon-192.png" alt="Logo Wifi Vault" width="96" height="96" />

# Wifi Vault

**Két sắt gọn gàng để lưu trữ, tìm kiếm và quản lý mật khẩu wifi.**
Material Design 3 · PWA cài đặt được · Tiếng Việt & English

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)

[English](README.md) · Tiếng Việt

Tác giả **minhtrong67** với sự hỗ trợ của **Claude** (Anthropic)

</div>

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Ảnh chụp màn hình](#ảnh-chụp-màn-hình)
- [Tính năng](#tính-năng)
- [Cài đặt](#cài-đặt)
- [Tech stack](#tech-stack)
- [Development](#development)
- [Build](#build)
- [Cấu trúc project](#cấu-trúc-project)
- [License](#license)

## Giới thiệu

Wifi Vault lưu mọi tên và mật khẩu wifi của bạn ở một nơi, đồng bộ theo tài khoản Google và dùng được trên mọi thiết bị. Tìm kiếm tức thì, phân nhóm theo danh mục, nhập/xuất dữ liệu và cài đặt như một ứng dụng thật. Giao diện theo **Material Design 3**, tự thích ứng với thiết bị: chế độ sáng/tối, ngôn ngữ và màu chủ đề yêu thích.

## Ảnh chụp màn hình

Ảnh nằm trong thư mục [`screenshots/`](screenshots).

| | | |
| :---: | :---: | :---: |
| ![image01](screenshots/image01.png) | ![image02](screenshots/image02.png) | ![image03](screenshots/image03.png) |
| ![image04](screenshots/image04.png) | ![image05](screenshots/image05.png) | ![image06](screenshots/image06.png) |

## Tính năng

**Quản lý wifi**
- Thêm, sửa, xoá, tìm kiếm, lọc theo danh mục và sắp xếp (bộ lọc dạng accordion, có nút **Đặt lại bộ lọc**)
- Thêm / sửa bằng **sheet drawer** Material (trượt từ đáy trên mobile, từ cạnh phải trên desktop)
- Vuốt phải để sửa, vuốt trái để xoá (có xác nhận); desktop dùng nút bấm
- Bộ lọc và sắp xếp (mặc định mới nhất) được ghi nhớ theo từng trang trong phiên trình duyệt
- Tìm nhanh bằng `Ctrl/⌘ + K`
- Tên wifi là duy nhất: nhập file có tên trùng sẽ **ghi đè**, không tạo bản sao

**Danh mục**
- Thêm, đổi tên (cập nhật các wifi liên quan), xoá (không xoá được khi đang được dùng) và tìm kiếm

**Thống kê**
- Thẻ số liệu và biểu đồ (độ dài mật khẩu, số wifi theo danh mục)
- Xuất báo cáo **PDF** hoặc ảnh **PNG**

**Cài đặt**
- **Nhập/xuất** wifi và danh mục dạng **CSV, XLSX, JSON** (mục *Dữ liệu* dạng accordion) và nút **Xuất tất cả** trong một lần
- **Trang mặc định**: chọn trang hiển thị khi mở app
- **Ngôn ngữ**: tự nhận diện ngôn ngữ thiết bị (Tiếng Việt hoặc English), hoặc chọn thủ công
- **Màu chủ đề**: chọn trong bảng màu Material, toàn bộ bảng màu sáng/tối được sinh theo màu bạn chọn
- Chế độ sáng / tối / theo hệ thống (có nút đổi nhanh trên header), 3 cỡ chữ
- **Thẻ cài đặt app**: chỉ hiện khi app chưa được cài
- Khôi phục cài đặt mặc định

**Trải nghiệm**
- Thành phần Material Design 3, state layer, ripple và chuyển động chuẩn Material
- Nút hành động nổi chỉ có icon, nút cuộn lên đầu trang, toast, skeleton loading, hỗ trợ giảm chuyển động
- Responsive từ điện thoại đến desktop, service worker hỗ trợ mạng yếu

## Cài đặt

### Yêu cầu

- [Node.js](https://nodejs.org) 18 trở lên
- Một project [Firebase](https://console.firebase.google.com)

### Các bước

```bash
git clone https://github.com/minhtrong67/wifi-vault.git
cd wifi-vault
npm install
cp .env.example .env
```

Cấu hình Firebase:

1. **Authentication → Sign-in method** → bật **Google**, thêm domain triển khai vào *Authorized domains*.
2. **Firestore Database** → tạo database, dán nội dung [`firestore.rules`](firestore.rules) vào tab *Rules* rồi Publish.
3. **Project settings → Your apps** → thêm Web app và sao chép cấu hình vào `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> `.env` đã nằm trong `.gitignore`. Không commit khoá thật.

## Tech stack

| Mảng | Công nghệ |
| --- | --- |
| UI | React 18, React Router 6 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 với token màu Material 3 |
| Design system | Material Design 3, `@material/material-color-utilities` |
| Backend | Firebase Authentication (Google) + Cloud Firestore |
| Biểu đồ | Recharts |
| File | SheetJS (`xlsx`), jsPDF, html2canvas |
| Icon | lucide-react |
| PWA | [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app) (service worker Workbox, manifest sáng/tối) |

## Development

```bash
npm run dev       # chạy môi trường phát triển
npm run build     # build production vào dist/
npm run preview   # chạy thử bản build
```

Cấu trúc dữ liệu Firestore:

```
users/{uid}/wifis/{id}        name, password, category, note, createdAt, updatedAt
users/{uid}/categories/{id}   name, createdAt
```

Ràng buộc: tên wifi 1–32 ký tự, mật khẩu 8–63 ký tự, ghi chú tối đa 200 ký tự. File nhập dùng cột `name, password, category, note` (chấp nhận cả tiêu đề tiếng Việt); JSON là mảng hoặc `{ "wifis": [...] }`.

Thêm ngôn ngữ mới: tạo `src/i18n/<mã>.js` với đủ khoá như `en.js` rồi đăng ký trong `src/i18n/index.js`.

## Build

```bash
npm run build
```

Đưa thư mục `dist/` lên Firebase Hosting, Vercel, Netlify hoặc hosting tĩnh bất kỳ. Cấu hình rewrite mọi đường dẫn về `index.html` và thêm domain vào *Authorized domains* của Firebase.

## Cấu trúc project

```
wifi-vault/
├── public/            favicon và icon app (manifest + service worker do vite-plugin-pwa sinh ra)
├── screenshots/       ảnh cho README (image01, image02, …)
├── src/
│   ├── components/    Layout, WifiCard, WifiForm, SearchPalette, ScrollTop, Credits, ui
│   ├── context/       Auth, Data, Settings, Toast
│   ├── data/          dữ liệu mẫu
│   ├── i18n/          en.js, vi.js, nhận diện ngôn ngữ
│   ├── lib/           firebase, db, validate, fileIO, report, pwa
│   ├── pages/         Home, Wifi, Categories, Stats, Settings, Login
│   └── theme/         JSON theme Material + bộ sinh CSS variables
├── firestore.rules
├── tailwind.config.js
└── vite.config.js
```

## License

Wifi Vault là phần mềm tự do mã nguồn mở, phát hành theo [giấy phép MIT](LICENSE).

---

<div align="center">

Thiết kế và phát triển bởi **minhtrong67** · xây dựng cùng **Claude** của Anthropic

</div>
