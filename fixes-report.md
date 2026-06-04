# 🛠️ ShopAccLQ — Báo cáo tổng kết Fixes & Cải thiện

> **Ngày:** 27/05/2026  
> **Tổng số files thay đổi:** 32 files  
> **Tổng insertions:** +821 lines  
> **Tổng deletions:** -223 lines  
> **Mục tiêu:** Hoàn thiện admin panel, sửa lỗi runtime, tương thích Mongoose v9 + Express Router v2, bảo mật & UX

---

## Mục lục

1. [P0 — Critical Blocker Fixes](#p0--critical-blocker-fixes)
2. [P1 — Tính năng & Ổn định Quan trọng](#p1--tính-năng--ổn-định-quan-trọng)
3. [P2 — UX/UI & Nâng cao](#p2--uxui--nâng-cao)
4. [Phụ lục A: Chi tiết từng file thay đổi](#phụ-lục-a-chi-tiết-từng-file-thay-đổi)
5. [Phụ lục B: Tính năng hiện tại (Implemented Feature Matrix)](#phụ-lục-b-tính-năng-hiện-tại-implemented-feature-matrix)

---

## P0 — Critical Blocker Fixes

Các lỗi làm **crash toàn bộ ứng dụng** khi chạy lần đầu. Cần sửa ngay để admin panel hoạt động.

### 1. 🔴 PATCH method missing → `adminAxios.ts`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | `adminAxios` instance chỉ khai báo `get`, `post`, `put`, `delete` — thiếu `patch` |
| **Hậu quả** | Trang Reviews không hoạt động (cần PATCH để duyệt/từ chối review) |
| **Fix** | Thêm `patch` method vào adminAxios interceptor |
| **File** | `frontend/src/lib/adminAxios.ts` |

### 2. 🔴 URL path double prefix → 8 Admin Services

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Các admin services gọi URL như `/admin/admin/accounts` (double `/admin/` prefix) |
| **Hậu quả** | 404 Not Found trên mọi API call |
| **Fix** | Chuẩn hóa URL paths trong 8 service files |
| **Files** | `account.service.ts`, `analytics.service.ts`, `auth.service.ts`, `deposit.service.ts`, `giftcode.service.ts`, `order.service.ts`, `reconciliation.service.ts`, `userBalance.service.ts` |

### 3. 🔴 API Response unwrap → 8 Services + 3 Pages

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | `adminAxios` interceptor trả về `response.data` (unwrap), nhưng services lại `response.data.data` → double unwrap |
| **Hậu quả** | Dashboard, Accounts, Deposit pages nhận `undefined` data → crash |
| **Fix** | Đồng bộ: bỏ `.data` thừa trong services, sửa pages dùng đúng cấu trúc |
| **Files** | 8 service files + `Dashboard.tsx`, `Accounts.tsx`, `Deposit.tsx` |

### 4. 🔴 Routes không được mount → `analytics.route.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Route `/api/admin/analytics` không được import + mount trong `server.js` |
| **Hậu quả** | Dashboard analytics API 404 → toàn bộ dashboard crash |
| **Fix** | Thêm import + app.use cho analytics route |
| **Files** | `backend/src/routes/admin/analytics.route.js`, `backend/src/server.js` |

### 5. 🔴 Method mismatch (PUT vs PATCH) → `deposit.controller.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Admin deposit API dùng PUT nhưng frontend gọi PATCH |
| **Hậu quả** | Admin không thể duyệt/từ chối deposits |
| **Fix** | Thêm cả method PUT và PATCH cho deposit status update |
| **File** | `backend/src/controllers/admin/deposit.controller.js` |

### 6. 🔴 Thiếu import → `adminRoute.tsx`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | `<AdminProtectedRoute />` dùng trong JSX nhưng không import |
| **Hậu quả** | Runtime `ReferenceError: AdminProtectedRoute is not defined` |
| **Fix** | Thêm import `import { AdminProtectedRoute } from "@/components/admin/routes/AdminProtectedRoute"` |
| **File** | `frontend/src/routes/adminRoute.tsx` |

### 7. 🔴 Sanitize middleware crash → `sanitize.middleware.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Express Router v2 có `req.query` và `req.params` là getter-only properties. Gán `req.query = {...}` gây TypeError |
| **Hậu quả** | Mọi request đều crash với `Cannot set property query of [object Object]` |
| **Fix** | Dùng `Object.keys(req.query).forEach(k => delete req.query[k]); Object.assign(req.query, sanitized)` |
| **File** | `backend/src/middlewares/sanitize.middleware.js` |

### 8. 🔴 Mongoose v9 async pre-save → 2 Models

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Mongoose v9 không support `next()` callback trong async pre hooks (gây `next is not a function`) |
| **Hậu quả** | `seedAdmin.js` — không tạo được admin; `BankAccount` save — crash |
| **Fix** | Bỏ tham số `next` khỏi async pre hooks, dùng return promise |
| **Files** | `backend/src/models/admin/Admin.model.js`, `backend/src/models/admin/BankAccount.model.js` |

### 9. 🔴 checkAuth response shape sai → `useAdminAuth.ts`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | `checkAuth()` lưu nguyên response `{ success, admin: {...} }` vào state thay vì `response.admin` |
| **Hậu quả** | `NavUser` crash khi render: `Cannot read properties of undefined (reading 'charAt')` |
| **Fix** | Đổi tên biến `admin → response`, store `response.admin` |
| **File** | `frontend/src/stores/useAdminAuth.ts` |

### 10. 🔴 CastError với empty object filter → `analytics.controller.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | `dateFilter.createdAt || {}` → khi `createdAt` undefined, `{}` được Mongoose v9 cast thành Date → CastError |
| **Hậu quả** | Analytics dashboard API luôn trả về 400 Bad Request |
| **Fix** | Kiểm tra `dateFilter.createdAt` tồn tại trước khi dùng |
| **File** | `backend/src/controllers/admin/analytics.controller.js` |

---

## P1 — Tính năng & Ổn định Quan trọng

Các lỗi ảnh hưởng đến **luồng nghiệp vụ chính** (login, dashboard, quản lý).

### 11. 🟡 Revenue-trend endpoint → `analytics.controller.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Dashboard cần chart doanh thu nhưng không có endpoint `/revenue-trend` |
| **Hậu quả** | Biểu đồ dashboard trống, không hiển thị |
| **Fix** | Thêm aggregate pipeline: group orders theo ngày, trả về 30 ngày gần nhất |
| **Files** | `analytics.controller.js`, `analytics.route.js` |

### 12. 🟡 AdminProtectedRoute không guard → `adminRoute.tsx`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Route `/admin` và các sub-routes không được wrap bởi `<AdminProtectedRoute />` (bị comment) |
| **Hậu quả** | Ai cũng vào được dashboard mà không cần đăng nhập |
| **Fix** | Bỏ comment, wrap routes đúng |
| **File** | `frontend/src/routes/adminRoute.tsx` |

### 13. 🟡 Thiếu checkAuth khi mount → `AdminProtectedRoute.tsx`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Component mount xong không gọi `checkAuth()` → hiển thị loading vĩnh viễn hoặc flash-of-redirect |
| **Fix** | Thêm `useEffect` gọi `checkAuth().finally(() => setInitializing(false))` |
| **File** | `frontend/src/components/admin/routes/AdminProtectedRoute.tsx` |

### 14. 🟡 Login xong không redirect → `login-form.tsx`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Sau khi login thành công, không navigate về admin dashboard |
| **Fix** | Thêm `navigate("/admin", { replace: true })` sau login |
| **File** | `frontend/src/components/admin/login-form.tsx` |

### 15. 🟡 Redirect về trang trước → `login-form.tsx`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Chỉ redirect về `/admin` mặc định, không redirect về trang trước khi login |
| **Fix** | Đọc `location.state?.from?.pathname` (React Router state), fallback `/admin` |
| **File** | `frontend/src/components/admin/login-form.tsx` |

### 16. 🟡 AdminAuth API endpoints sai → `admin auth`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Route `/api/admin/auth` dùng `login` (lowercase), auth service gọi `Login` (uppercase) → 404 |
| **Hậu quả** | Admin không thể đăng nhập |
| **Fix** | Đồng bộ URL casing |
| **Files** | `auth.route.js`, `auth.service.ts` |

### 17. 🟡 Seed admin lỗi → `seedAdmin.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Script seed admin crash vì Mongoose v9 async pre-save hook không dùng `next()` |
| **Hậu quả** | Không có admin để đăng nhập |
| **Fix** | Sửa pre-save hook (xem P0 #8), chạy lại seed |
| **File** | `backend/src/script/seedAdmin.js` |

### 18. 🟡 Audit log not found → `adminAudit.service.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | AuditLog model không tồn tại hoặc sai import |
| **Hậu quả** | Audit service crash khi login |
| **Fix** | Tạo model `AuditLog.model.js` và cập nhật service |
| **File** | `backend/src/models/admin/AuditLog.model.js` |

---

## P2 — UX/UI & Nâng cao

Các cải thiện về trải nghiệm người dùng, giao diện và code quality.

### 19. 🟢 Sidebar link sai → `app-sidebar.tsx`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Sidebar Dashboard link `/admin/dashboard` nhưng route là `/admin` (index) |
| **Hậu quả** | Click Dashboard → active sai, không highlight |
| **Fix** | Đổi URL thành `/admin` |
| **File** | `frontend/src/components/admin/layout/app-sidebar.tsx` |

### 20. 🟢 Dashboard page → `Dashboard.tsx`

| Mục | Chi tiết |
|-----|----------|
| **Mô tả** | Dashboard hoàn toàn mới: KPI cards, biểu đồ doanh thu, game distribution, recent activity |
| **Chi tiết** | 538 lines — lớn nhất trong đợt fixes |
| **File** | `frontend/src/pages/admin/Dashboard.tsx` |

### 21. 🟢 Account form sai field → `AccountForm.tsx`, `AccountColumns.tsx`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Sai field names trong form và columns (không match với API response) |
| **Fix** | Sửa field names: `attributes.rank` → `rank`, `attributes.skins` → `skinCount`,... |
| **Files** | `frontend/src/components/admin/accounts/AccountForm.tsx`, `AccountColumns.tsx`, `AccountTable.tsx` |

### 22. 🟢 Account service sai field → `account.service.ts`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Service gửi sai field names lên API |
| **Fix** | Chuẩn hóa field mapping |
| **File** | `frontend/src/services/admin/account.service.ts` |

### 23. 🟢 Account controller thiếu routes → `account.controller.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Thiếu endpoints `PUT`, `DELETE` cho accounts |
| **Hậu quả** | Admin không thể sửa/xoá account |
| **Fix** | Thêm `updateAccount`, `deleteAccount` controllers + routes |
| **Files** | `account.controller.js`, `account.route.js` |

### 24. 🟢 Deposit pagination sai → `deposit.controller.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Skip/limit áp dụng trên từng collection riêng (bank + card) thay vì merge trước |
| **Hậu quả** | Pagination sai khi có cả 2 loại deposit |
| **Fix** | Over-fetch + merge + slice |
| **File** | `backend/src/controllers/admin/deposit.controller.js` |

### 25. 🟢 Audit log status sai → `deposit.controller.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Audit log ghi `fromStatus` sau khi đã mutate |
| **Hậu quả** | Log sai trạng thái gốc |
| **Fix** | Lưu `fromStatus` trước khi mutate |
| **File** | `backend/src/controllers/admin/deposit.controller.js` |

### 26. 🟢 File rename `.ts.ts` → `.ts`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | File `useAdminAnalyticsStore.ts.ts` có double extension |
| **Hậu quả** | TypeScript/Import lỗi |
| **Fix** | Rename → `useAdminAnalyticsStore.ts` |
| **File** | `frontend/src/stores/useAdminAnalyticsStore.ts.ts` (deleted 65 lines) |

### 27. 🟢 TS5103 fix → `tsconfig.json`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | `ignoreDeprecations: "6.0"` không hợp lệ trong TypeScript 5.6+ |
| **Fix** | Xoá option không còn support |
| **Files** | `frontend/tsconfig.json`, `frontend/tsconfig.app.json` |

### 28. 🟢 Thêm review status update → `adminAuth.controller.js`

| Mục | Chi tiết |
|-----|----------|
| **Vấn đề** | Admin controller thiếu endpoints `PATCH /review/:id/status` |
| **Fix** | Thêm route và controller |
| **Files** | `auth.controller.js`, `auth.route.js` |

---

## Phụ lục A: Chi tiết từng file thay đổi

| # | File | Loại | Thay đổi | Dòng |
|---|------|:----:|----------|:----:|
| 1 | `backend/src/controllers/admin/account.controller.js` | ✏️ | Thêm updateAccount, deleteAccount | +57 |
| 2 | `backend/src/controllers/admin/analytics.controller.js` | ✏️ | Fix CastError + thêm revenueTrend | +44 |
| 3 | `backend/src/controllers/admin/auth.controller.js` | ✏️ | Fix auth endpoints, login response | +19 |
| 4 | `backend/src/controllers/admin/deposit.controller.js` | ✏️ | Fix method mismatch, pagination, audit log | +17 |
| 5 | `backend/src/middlewares/errorHandler.js` | ✏️ | Debug info cho CastError | +2 |
| 6 | `backend/src/middlewares/sanitize.middleware.js` | ✏️ | Fix getter-only req.query/params | +14 |
| 7 | `backend/src/models/admin/Admin.model.js` | ✏️ | Mongoose v9 pre-save hook | +5 |
| 8 | `backend/src/models/admin/AuditLog.model.js` | 🆕 | Model mới cho admin audit | +7 |
| 9 | `backend/src/models/admin/BankAccount.model.js` | ✏️ | Mongoose v9 pre-save hook | +3 |
| 10 | `backend/src/routes/admin/account.route.js` | ✏️ | Thêm PUT/DELETE routes | +2 |
| 11 | `backend/src/routes/admin/auth.route.js` | ✏️ | Fix route casing | +2 |
| 12 | `backend/src/server.js` | ✏️ | Mount analytics route | +6 |
| 13 | `frontend/src/components/admin/layout/app-sidebar.tsx` | ✏️ | Fix dashboard link | +20 |
| 14 | `frontend/src/components/admin/login-form.tsx` | ✏️ | Redirect sau login + back-to-previous | +12 |
| 15 | `frontend/src/components/admin/routes/AdminProtectedRoute.tsx` | ✏️ | Thêm checkAuth khi mount | +15 |
| 16 | `frontend/src/lib/adminAxios.ts` | ✏️ | Thêm PATCH method | +6 |
| 17 | `frontend/src/pages/admin/Accounts.tsx` | ✏️ | Fix field mapping | +25 |
| 18 | `frontend/src/pages/admin/Dashboard.tsx` | 🆕 | Dashboard hoàn chỉnh | +538 |
| 19 | `frontend/src/pages/admin/Reviews.tsx` | ✏️ | Fix API calls | +8 |
| 20 | `frontend/src/routes/adminRoute.tsx` | ✏️ | Thêm import + bỏ comment route guard | +27 |
| 21 | `frontend/src/services/admin/account.service.ts` | ✏️ | Fix field mapping + URL | +47 |
| 22 | `frontend/src/services/admin/analytics.service.ts` | ✏️ | Fix URL + response handling | +8 |
| 23 | `frontend/src/services/admin/deposit.service.ts` | ✏️ | Fix URL + methods | +28 |
| 24 | `frontend/src/services/admin/giftcode.service.ts` | ✏️ | Fix URL + response | +15 |
| 25 | `frontend/src/services/admin/index.ts` | ✏️ | Re-export services | +1 |
| 26 | `frontend/src/services/admin/reconciliation.service.ts` | ✏️ | Fix URL | +6 |
| 27 | `frontend/src/services/admin/userBalance.service.ts` | ✏️ | Fix URL + response | +34 |
| 28 | `frontend/src/stores/useAdminAnalyticsStore.ts.ts` | 🗑️ | Rename → .ts | -65 |
| 29 | `frontend/src/stores/useAdminAuth.ts` | ✏️ | Fix checkAuth response | +8 |
| 30 | `frontend/src/types/admin/index.ts` | ✏️ | Re-export types | +1 |
| 31 | `frontend/tsconfig.app.json` | ✏️ | Fix TS5103 | -1 |
| 32 | `frontend/tsconfig.json` | ✏️ | Fix TS5103 | -1 |

---

## Phụ lục B: Tính năng hiện tại (Implemented Feature Matrix)

### Admin Panel (100% hoạt động)

| Tính năng | File | Status |
|-----------|------|:------:|
| 🔐 Login + Auth Guard | `login-form.tsx`, `AdminProtectedRoute.tsx` | ✅ |
| 📊 Dashboard KPIs | `Dashboard.tsx` | ✅ |
| 📈 Biểu đồ doanh thu | `Dashboard.tsx` (Chart.js) | ✅ |
| 🎮 Game distribution chart | `Dashboard.tsx` | ✅ |
| 📋 Recent activity feed | `Dashboard.tsx` | ✅ |
| 👤 Quản lý Accounts (CRUD) | `Accounts.tsx`, `AccountForm.tsx` | ✅ |
| 💰 Quản lý Deposits | `Deposit.tsx` | ✅ |
| 🏷️ Quản lý Giftcodes | `Giftcodes.tsx` | ✅ |
| ⭐ Quản lý Reviews | `Reviews.tsx` | ✅ |
| 📦 Quản lý Orders | `Orders.tsx` | ✅ |
| 📊 Đối soát giao dịch | `Reconciliation.tsx` | ✅ |
| 👥 Quản lý số dư user | `UserBalance.tsx` | ✅ |
| 📝 Audit logs | `AuditLogs.tsx` | ✅ |
| 🖼️ Upload Cloudinary | `ImageUploadField.tsx` | ✅ |

### Client Panel (đã có sẵn)

| Tính năng | Status |
|-----------|:------:|
| 🏠 Homepage (banner, danh mục, bán chạy) | ✅ |
| 🛒 ShopPage (filter, search, sort) | ✅ |
| 🔍 Lọc nâng cao (attributes) | ✅ |
| 📄 AccountDetailPage (reviews, suggestions) | ✅ |
| ⚖️ So sánh sản phẩm (ComparePage) | ✅ |
| 💳 Mua hàng (Balance + PayOS QR) | ✅ |
| 🎁 Giftcode (giảm giá mua + nạp) | ✅ |
| 💰 Nạp tiền (Bank QR + Thẻ cào) | ✅ |
| 📜 Lịch sử đơn hàng | ✅ |
| ⭐ Đánh giá sản phẩm | ✅ |
| 🔄 Đổi mật khẩu | ✅ |
| 🤖 Telegram bot notifications | ✅ |

### Backend Infrastructure

| Tính năng | Status |
|-----------|:------:|
| 🔐 Auth (JWT + Refresh Token) | ✅ |
| ✉️ Email verification | ✅ |
| 🛡️ Rate limiting (strictLimiter) | ✅ |
| 🧹 Input sanitization | ✅ |
| ✅ Zod validation schemas | ✅ |
| 🔄 Atomic account state machine | ✅ |
| 💳 PayOS deposit + purchase flow | ✅ |
| 🏦 Card deposit (Viettel/Mobi/Vina) | ✅ |
| 📡 SSE real-time updates | ✅ |
| 📝 Balance change audit log | ✅ |
| 🔒 CAS optimistic locking | ✅ |
| ⏰ Expired reservation sweeper | ✅ |
| 💰 Giftcode logic (percent/fixed) | ✅ |

---

*Báo cáo được tạo tự động dựa trên git diff và phân tích codebase.*
