# UI Management System — Spec

> **Mục tiêu:** Xây dựng hệ thống cho phép **Super Admin** quản lý giao diện người dùng (client-facing UI) qua admin panel, bao gồm: Danh mục game/tài khoản, Popup/Modal động, Banner trang chủ, và Nội dung CMS tĩnh.

---

## 1. Tổng quan kiến trúc

### 1.1 Công nghệ

| Layer | Công nghệ |
|-------|-----------|
| Database | **MongoDB** (mongoose) — model mới |
| Backend | **Express.js** — REST API routes + controllers mới |
| Frontend (admin) | **React + Vite + shadcn/ui + TypeScript** |
| Editor | **WYSIWYG Rich Text Editor** (TipTap hoặc React Quill) |
| Images | **Cloudinary** (service đã có) + hỗ trợ nhập URL |
| Caching | **@tanstack/react-query** + localStorage cho dữ liệu public |
| UI Location | **Tab mới trong trang `/admin/config`** (hiện có Tab: Chung, Ngân hàng, Thẻ cào) |

### 1.2 Route mới (Backend)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET/POST/PUT/DELETE` | `/api/admin/ui/categories/games` | CRUD Game (gameCategory) |
| `GET/POST/PUT/DELETE` | `/api/admin/ui/categories/games/:gameId/items` | CRUD CategoryItem trong Game |
| `GET/POST/PUT/DELETE` | `/api/admin/ui/popups` | CRUD Popup |
| `GET/POST/PUT/DELETE` | `/api/admin/ui/banners` | CRUD Banner |
| `GET/POST/PUT/DELETE` | `/api/admin/ui/pages` | CRUD CMS Page |
| `GET` (public) | `/api/ui/popups?page=home` | Lấy popup active theo trang |
| `GET` (public) | `/api/ui/banners` | Lấy banner active |
| `GET` (public) | `/api/ui/categories` | Lấy danh mục (thay thế categories.ts hardcoded) |
| `GET` (public) | `/api/ui/pages/:slug` | Lấy nội dung CMS theo slug |

### 1.3 Enum values

```typescript
// Game slugs
type GameSlug = "lien-quan" | "lien-minh" | "valorant" | "free-fire" | "khac";

// Popup types
type PopupType = "notification" | "promotion";

// Popup triggers
type PopupTrigger = "timeout" | "click";

// Display pages
type DisplayPage = "home" | "shop" | "compare" | "account-detail" | "order-history" | "profile" | "all";

// CMS slugs
type CmsSlug = "gioi-thieu" | "chinh-sach-bao-mat" | "chinh-sach-doi-tra" | "dieu-khoan-dich-vu" | "huong-dan-mua-hang" | "huong-dan-nap-tien" | "faq" | "lien-he" | "footer";
```

---

## 2. MongoDB Models

### 2.1 GameCategory

```js
// Thay thế GAME_CATEGORIES hardcode trong categories.ts
{
  gameSlug: { type: String, required: true, unique: true, trim: true }, // "lien-quan"
  gameName: { type: String, required: true, trim: true },               // "LIÊN QUÂN MOBILE"
  gameIcon: { type: String, default: "🎮" },                            // Emoji hoặc URL ảnh
  iconType: { type: String, enum: ["emoji", "image"], default: "emoji" },// Phân biệt emoji vs ảnh
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  categories: [CategoryItem], // Embedded sub-documents
  timestamps: true
}
```

### 2.2 CategoryItem (sub-document)

```js
{
  id: { type: String, required: true },             // "lq-trang"
  name: { type: String, required: true },            // "Nick Thông Tin Đẹp"
  slug: { type: String, required: true },            // "nick-thong-tin-dep"
  typeValue: { type: String, required: true },       // "trang" — tương ứng field type của Account
  image: { type: String, default: "" },              // URL ảnh đại diện
  priceFrom: { type: Number, default: 0 },           // Giá khởi điểm
  stock: { type: Number, default: 0 },               // Tồn kho (có thể tính tự động từ Account)
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}
```

### 2.3 Popup

```js
{
  title: { type: String, required: true },            // Tiêu đề popup
  type: { type: String, enum: ["notification", "promotion"], required: true },
  content: { type: String, default: "" },             // Nội dung (HTML từ WYSIWYG editor)
  imageUrl: { type: String, default: "" },            // Ảnh nền (promotion)
  imageMobileUrl: { type: String, default: "" },      // Ảnh nền mobile
  ctaText: { type: String, default: "" },             // Text nút CTA
  ctaLink: { type: String, default: "" },             // Link khi click CTA
  displayPages: [{ type: String, enum: ["home", "shop", "compare", "account-detail", "order-history", "profile", "all"] }],
  triggerType: { type: String, enum: ["timeout", "click"] },
  triggerDelay: { type: Number, default: 5 },          // Delay giây nếu trigger=timeout (mặc định 5s)
  startDate: { type: Date, default: null },            // Bắt đầu hiển thị (null = ngay lập tức)
  endDate: { type: Date, default: null },              // Kết thúc hiển thị (null = vô thời hạn)
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  timestamps: true
}
```

### 2.4 Banner

```js
{
  title: { type: String, required: true },             // Tiêu đề nội bộ
  imageDesktopUrl: { type: String, required: true },   // Ảnh desktop
  imageMobileUrl: { type: String, default: "" },       // Ảnh mobile (nếu trống thì dùng ảnh desktop)
  headline: { type: String, default: "" },             // Tiêu đề hiển thị trên banner
  description: { type: String, default: "" },          // Mô tả ngắn
  ctaText: { type: String, default: "" },              // Text nút hành động
  ctaLink: { type: String, default: "" },              // Link khi click banner/nút
  startDate: { type: Date, default: null },            // Lên lịch hiển thị
  endDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  timestamps: true
}
```

### 2.5 CmsPage

```js
{
  slug: { type: String, required: true, unique: true }, // "gioi-thieu", "faq", "footer"
  title: { type: String, required: true },               // "Giới thiệu"
  content: { type: String, default: "" },                // Nội dung HTML (WYSIWYG)
  metaTitle: { type: String, default: "" },              // SEO meta title
  metaDescription: { type: String, default: "" },         // SEO meta description
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

#### CMS Pages seed data:

| slug | title | Mô tả |
|------|-------|-------|
| `gioi-thieu` | Giới thiệu | Trang giới thiệu shop |
| `chinh-sach-bao-mat` | Chính sách bảo mật | Chính sách privacy |
| `chinh-sach-doi-tra` | Chính sách đổi trả | Chính sách đổi/trả/bảo hành |
| `dieu-khoan-dich-vu` | Điều khoản dịch vụ | Terms of service |
| `huong-dan-mua-hang` | Hướng dẫn mua hàng | Hướng dẫn steps |
| `huong-dan-nap-tien` | Hướng dẫn nạp tiền | Hướng dẫn deposit |
| `faq` | Câu hỏi thường gặp | FAQ |
| `lien-he` | Liên hệ | Thông tin liên hệ + form |
| `footer` | Footer | Nội dung hiển thị ở footer |

---

## 3. Backend Implementation

### 3.1 Validation

- Tất cả API đều cần middleware `adminProtect` + `adminLimiter`
- Chỉ **super_admin** mới được access (check role middleware)
- Validation schemas với express-validator hoặc joi:
  - `GameCategory`: gameSlug unique, gameName required
  - `CategoryItem`: name + slug + typeValue required
  - `Popup`: title + type required, nếu promotion thì imageUrl + ctaText optional
  - `Banner`: title + imageDesktopUrl required
  - `CmsPage`: slug unique, title required

### 3.2 API Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Thành công"
}
```

### 3.3 Audit Logging

Tất cả CRUD operations đều ghi log qua `logAdminAction()` đã có:

```js
logAdminAction({
  adminId: req.admin._id,
  adminName: req.admin.username,
  action: "ui:gameCategory:create",     // pattern: ui:<resource>:<action>
  resource: "gameCategory",             // gameCategory, popup, banner, cmsPage
  resourceId: doc._id,
  details: { title, gameSlug },
  ip: req.ip,
});
```

### 3.4 File structure (Backend)

```
backend/src/
├── models/admin/
│   ├── GameCategory.model.js    # MỚI
│   ├── Popup.model.js           # MỚI
│   ├── Banner.model.js          # MỚI
│   └── CmsPage.model.js         # MỚI
├── controllers/admin/
│   └── ui.controller.js         # MỚI — tất cả logic trong 1 controller
├── routes/admin/
│   └── ui.route.js              # MỚI
├── validation/
│   └── ui.validation.js         # MỚI
```

---

## 4. Frontend Implementation

### 4.1 File structure

```
frontend/src/
├── components/admin/ui/
│   ├── GameCategoryManager.tsx       # MỚI — Quản lý game + categories
│   ├── PopupManager.tsx              # MỚI — Quản lý popup
│   ├── BannerManager.tsx             # MỚI — Quản lý banner
│   ├── CmsPageManager.tsx            # MỚI — Quản lý CMS pages
│   ├── CmsEditor.tsx                 # MỚI — WYSIWYG editor wrapper
│   ├── ImagePickerField.tsx          # MỚI — Cloudinary upload + URL input
│   └── components/
│       ├── GameCategoryFormDialog.tsx
│       ├── CategoryItemFormDialog.tsx
│       ├── PopupFormDialog.tsx
│       ├── BannerFormDialog.tsx
│       ├── BannerPreview.tsx
│       └── CmsPageFormDialog.tsx
├── services/admin/
│   └── ui.service.ts                 # MỚI
├── types/admin/
│   └── ui.type.ts                    # MỚI
├── hooks/queries/
│   └── useAdminUiQueries.ts          # MỚI
└── pages/
    └── admin/
        └── Config.tsx                 # SỬA — thêm tab "UI Management"
```

### 4.2 Tab cấu trúc trong Config.tsx

Thêm tab thứ 4: **"Giao diện"** với icon `Palette` từ lucide-react.

```
Cấu hình hệ thống
├── Chung      (Settings)  ← đã có
├── Ngân hàng  (Building)  ← đã có
├── Thẻ cào    (CreditCard)← đã có
└── Giao diện  (Palette)   ← MỚI
```

Tab Giao diện có sub-tabs:

```
Giao diện
├── Danh mục game     (GameCategoryManager)
├── Popup/Modal       (PopupManager)
├── Banner            (BannerManager)
└── Trang nội dung    (CmsPageManager)
```

### 4.3 GameCategoryManager

**Màn hình:**
- Bảng hiển thị danh sách game + categories trong game
- Mỗi game là 1 Card/Row expandable: hiển thị game name, icon, số categories, status
- Click expand → hiển thị categories table bên trong
- Nút "Thêm game", "Sửa", "Xoá" cho game
- Mỗi category có nút "Sửa", "Xoá"
- Nút "Thêm danh mục" trong mỗi game

**Dialog Game:**
- Game slug (text, unique)
- Game name (text)
- Icon (emoji picker hoặc URL ảnh)
- Sort order (number)
- Active toggle

**Dialog CategoryItem:**
- ID (text, unique trong game)
- Name (text)
- Slug (auto-generate từ name)
- Type value (text)
- Image URL (Cloudinary upload hoặc URL)
- Price from (number)
- Stock (number)
- Sort order (number)

### 4.4 PopupManager

**Màn hình:**
- Bảng danh sách popup: title, type, trigger, display pages, schedule, active status
- Nút "Thêm popup", "Sửa", "Xoá"
- Toggle active/inactive

**Dialog Popup:**
- Title (text)
- Type (select: Notification / Promotion)
- Content (WYSIWYG editor — nếu type=notification)
- Image URL + Mobile Image URL (nếu type=promotion)
- CTA text + Link (nếu type=promotion)
- Display pages (multi-select: Home, Shop, Compare, Detail, Order History, Profile, All)
- Trigger type (select: Timeout / Click)
- Delay seconds (nếu trigger=timeout)
- Start date (datetime picker, optional)
- End date (datetime picker, optional)
- Active toggle

### 4.5 BannerManager

**Màn hình:**
- Preview grid: hiển thị banner dạng card với hình ảnh preview nhỏ
- Drag & drop sắp xếp thứ tự
- Nút "Thêm banner", "Sửa", "Xoá"

**Dialog Banner:**
- Title nội bộ (text)
- Desktop Image (Cloudinary upload hoặc URL) — **bắt buộc**
- Mobile Image (Cloudinary upload hoặc URL) — optional
- Headline (text — hiển thị overlay)
- Description (textarea)
- CTA text (text)
- CTA link (text)
- Start date (datetime picker, optional)
- End date (datetime picker, optional)
- Sort order (number)
- Active toggle

### 4.6 CmsPageManager

**Màn hình:**
- Danh sách các trang CMS dạng grid/card với slug, title, trạng thái
- Nút "Sửa" cho mỗi trang, không có "Thêm" hay "Xoá" (các trang cố định)

**Dialog CMS:**
- Slug (disabled — không sửa được)
- Title (text)
- Content (WYSIWYG editor — **đầy đủ**: bold, italic, headings, lists, links, images, tables)
- Meta title (text, SEO)
- Meta description (textarea, SEO)

### 4.7 ImagePickerField

Component reusable cho việc chọn ảnh:
- Tab "Upload" : upload lên Cloudinary (dùng service đã có)
- Tab "URL" : nhập URL trực tiếp
- Preview ảnh sau khi chọn
- Nút "Xoá ảnh"

### 4.8 Client-side rendering (Public)

**Game Categories:**
- Sửa `AccountCategories.tsx` + `HomePage.tsx` để gọi API `/api/ui/categories` thay vì import `GAME_CATEGORIES` từ `categories.ts`
- Cache với React Query + localStorage (cache 30 phút)

**Popups:**
- Thêm component `PopupRenderer.tsx` ở client, render popup dựa trên data từ API
- Gọi API `/api/ui/popups?page=<current_page>` khi vào trang
- Nếu có popup active + phù hợp trigger → hiển thị modal
- Cache với React Query (cache 5 phút)

**Banners:**
- Sửa `MainBanner` trong `HomePage.tsx` thành slider dynamic
- Gọi API `/api/ui/banners` để lấy danh sách
- Render slider với navigation buttons, auto-play
- Cache với React Query + localStorage (cache 15 phút)

**CMS Pages:**
- Tạo route mới `/pages/:slug` cho client
- Component `CmsPage.tsx` render HTML content từ API (dùng `dangerouslySetInnerHTML` với sanitize)
- Footer content lấy từ CMS page slug="footer"
- Cache với React Query + localStorage (cache 1 giờ)

---

## 5. Seed data

Khi khởi tạo, seed script cần tạo:

1. **GameCategories** — copy từ `categories.ts` hiện tại thành documents MongoDB
2. **CmsPages** — tạo 9 trang với nội dung mặc định (có thể để trống, chỉ có title + slug)
3. **Banners** — 1-2 banner mẫu
4. **Popups** — 0 popup mặc định

---

## 6. Permissions

- **Super Admin** duy nhất được truy cập tab "Giao diện" trong Config
- Nếu admin thường cố tình truy cập route → redirect dashboard + toast error
- Kiểm tra ở backend route middleware + frontend ProtectedRoute

---

## 7. Sequence Diagram (Luồng chính)

### 7.1 Admin tạo game category

```
Admin → Config.tsx → GameCategoryManager → Click "Thêm game"
→ GameCategoryFormDialog → Nhập thông tin → Submit
→ ui.service.createGame(data) → POST /api/admin/ui/categories/games
→ Backend validation → GameCategory.create() → Audit log
→ Response success → React Query invalidate → Refresh list
```

### 7.2 Client hiển thị popup

```
User vào HomePage → PopupRenderer mount
→ useQuery('/api/ui/popups?page=home') → API trả về popups active
→ React Query cache 5 phút + localStorage
→ Nếu có popup với trigger=timeout → setTimeout N giây → show Dialog
→ Nếu có popup với trigger=click → chờ user click nút → show Dialog
→ User đóng popup → set localStorage 'popup_dismissed:{id}' để không hiện lại trong session
```

### 7.3 Client hiển thị banner

```
User vào HomePage → Gọi API /api/ui/banners
→ React Query cache 15 phút + localStorage
→ Render Swiper slider với banners
→ Auto-play + navigation arrows
```

---

## 8. Implementation Order

| Step | Task | Dependencies |
|------|------|-------------|
| 1 | Backend models + validation + seed script | - |
| 2 | Backend CRUD APIs + routes + audit logging | Step 1 |
| 3 | Frontend types + service + hooks | Step 2 |
| 4 | ImagePickerField component | - |
| 5 | GameCategoryManager (tab + dialogs) | Step 2, 3 |
| 6 | PopupManager (tab + dialogs) | Step 2, 3 |
| 7 | BannerManager (tab + dialogs) | Step 2, 3 |
| 8 | CmsPageManager + WYSIWYG editor | Step 2, 3 |
| 9 | Thêm tab "Giao diện" vào Config.tsx | Step 5, 6, 7, 8 |
| 10 | Client: thay categories hardcode bằng API | Step 2 |
| 11 | Client: PopupRenderer component | Step 2 |
| 12 | Client: Banner slider dynamic | Step 2 |
| 13 | Client: CMS page routes + Footer | Step 2 |

---

## 9. Edge Cases & Constraints

### Categories
- Không xoá game đang có account (cần kiểm tra Account count trước khi xoá)
- Slug phải unique giữa các category trong cùng game
- Khi thay đổi category slug → Account link cũ có thể broken (cần redirect hoặc giữ slug cũ)

### Popups
- Popup không được block UX chính: luôn có nút close, không auto-open khi đã dismiss trong session
- Multiple popups cùng lúc: chỉ hiển thị 1 popup ưu tiên cao nhất (sortOrder)
- Popup promotion cần responsive: hiển thị tốt trên mobile

### Banners
- Banner cần responsive: ảnh mobile riêng hoặc dùng object-fit
- Banner slider cần graceful degradation khi chỉ có 1 banner
- Auto-play dừng khi user hover

### CMS
- Content HTML cần sanitize trước khi render (tránh XSS)
- Footer content ngắn gọn, responsive

---

## 10. UI Mockups (Text-based)

### Tab "Giao diện" trong Config

```
┌─────────────────────────────────────────────────────┐
│  [Chung] [Ngân hàng] [Thẻ cào] [Giao diện]          │
├─────────────────────────────────────────────────────┤
│  [Danh mục game] [Popup/Modal] [Banner] [Trang ND]  │  ← sub-tabs
├─────────────────────────────────────────────────────┤
│                                                     │
│  (Nội dung của sub-tab được chọn)                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Danh mục game (GameCategoryManager)

```
┌─────────────────────────────────────────────────────┐
│  Danh mục game                      [+ Thêm game]   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │ 🎮 LIÊN QUÂN MOBILE        [Sửa] [Xoá]  ▼ 3 loại││
│  ├─────────────────────────────────────────────────┤│
│  │ │ ID        | Tên           | Giá   | Tồn |   ▲ ││
│  │ │ lq-trang  | Nick TT Đẹp   | 100k  | 8   | ... ││
│  │ │ lq-reg    | Nick Reg Trắng| 30k   | 110 | ... ││
│  │ │ lq-rlp    | Nick RLP      | 270k  | 6   | ... ││
│  │ │                              [+ Thêm danh mục]││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 🔫 VALORANT                     [Sửa] [Xoá]  ▼  ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Popup/Modal (PopupManager)

```
┌─────────────────────────────────────────────────────┐
│  Popup/Modal                          [+ Thêm popup] │
├─────────────────────────────────────────────────────┤
│  Tiêu đề     | Loại     | Trigger | Trang   | Kích   │
│  "Sale 50%"  | Promo    | 5s      | Home   | Bật    │
│  "Bảo trì"   | Notif    | Click   | All    | Tắt    │
└─────────────────────────────────────────────────────┘
```

### Banner (BannerManager)

```
┌─────────────────────────────────────────────────────┐
│  Banner                               [+ Thêm banner]│
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Banner  │ │  Banner  │ │  Banner  │  [+ Add]  │
│  │  Preview │ │  Preview │ │  Preview │            │
│  │  [Sửa]   │ │  [Sửa]   │ │  [Sửa]   │            │
│  │  [Xoá]   │ │  [Xoá]   │ │  [Xoá]   │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

### Trang nội dung (CmsPageManager)

```
┌─────────────────────────────────────────────────────┐
│  Trang nội dung (CMS)                                │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │ 📄 Giới thiệu              [Sửa]        ● Hoạt động│
│  ├─────────────────────────────────────────────────┤│
│  │ 📄 Chính sách bảo mật      [Sửa]        ● Hoạt động│
│  ├─────────────────────────────────────────────────┤│
│  │ 📄 Hướng dẫn mua hàng      [Sửa]        ● Hoạt động│
│  ├─────────────────────────────────────────────────┤│
│  │ ... thêm 6 trang nữa ...                         │
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 11. Glossary

| Thuật ngữ | Nghĩa |
|-----------|-------|
| GameCategory | Nhóm game lớn (Liên Quân, Valorant...) |
| CategoryItem | Danh mục con trong game (Nick Trang, Reg, RLP...) |
| Popup | Cửa sổ bật lên trên client |
| Banner | Ảnh quảng cáo lớn ở đầu trang chủ |
| CMS Page | Trang nội dung tĩnh (Giới thiệu, Chính sách...) |
| WYSIWYG | What You See Is What You Get — trình soạn thảo trực quan |
| CTA | Call To Action — nút kêu gọi hành động |

---

## 12. Notes

- Feature này **chỉ dành cho Super Admin**
- Cần seed script để migrate data từ `categories.ts` hardcoded sang MongoDB
- Khi triển khai, cần chạy seed script để tạo CMS pages mặc định
- Client caching strategy: React Query + localStorage để giảm tải API
- Không yêu cầu realtime update (user refresh để thấy thay đổi)
