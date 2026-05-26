# 🗺️ ShopAcc — Roadmap & Spec

> Tổng quan các mục công việc còn lại, ưu tiên, mô tả tính năng, và định hướng kỹ thuật.
> Tạo ngày: 27/05/2026

---

## Tổng quan tiến độ

| Phase | Mô tả | Trạng thái |
|-------|-------|:----------:|
| UI Polish | Hover effects, duration-300 đồng bộ toàn bộ card sections | ✅ Hoàn thành |
| Phase 1 | Commerce Integrity — Atomic Account Reservation + state machine | ✅ Hoàn thành |
| Phase 2 | API Trust Boundary — Validation (Zod) + Sanitize + Rate Limiting | ✅ Hoàn thành |
| **Phase 3** | **Money Integrity — Idempotent payment + Reconciliation** | **⬅ Mục tiêu** |
| Phase 4 | Security — Session hardening + admin 2FA + upload protection | 📋 Chờ |
| Phase 5 | UX Resilience — Error boundaries + loading/empty/retry states | 📋 Chờ |
| Phase 6 | Operability — Structured logging + monitoring + audit trails | 📋 Chờ |

---

## Phase 3: Money Integrity 🔥 (Ưu tiên cao nhất)

### Vấn đề hiện tại

Dù đã có atomic reservation + idempotent `finalizePurchase`, hệ thống vẫn thiếu:

1. **PayOS webhook**: Thiếu idempotency key → nếu webhook gọi trùng → nguy cơ double-finalize
2. **Card deposit**: Thiếu unique compound index (serial + pin) cho PENDING/SUCCESS → nguy cơ nạp trùng
3. **Không có audit log**: Không trace được ai đã thay đổi balance, khi nào, lý do
4. **Admin không có dashboard đối soát**: Không biết tổng nạp trong ngày, tỷ lệ thành công/thất bại, phát hiận bất thường
5. **Reconciliation thủ công**: Không có công cụ để admin đối chiếu giao dịch

### Mục tiêu

> Đảm bảo mọi giao dịch tiền xử lý **exactly-once**, có **audit trail đầy đủ**, và admin có **dashboard đối soát** để phát hiện bất thường.

---

### Hạng mục 3.1: Idempotent PayOS Webhook

**Mô tả**: Thêm idempotency key + unique constraint để đảm bảo PayOS webhook gọi N lần cũng chỉ finalize 1 lần.

**Giải pháp**:
- **Idempotency key**: `orderCode` đã là unique → dùng làm idempotency key tự nhiên
- **Optimistic locking**: Thêm `version` field trên `BankDeposit`, dùng `$inc: { version: 1 }` với điều kiện `version: currentVersion` — CAS (Compare-And-Swap)
- Kết hợp cả 2: `orderCode` unique index ngăn insert duplicate; `version` ngăn concurrent updates

**Files cần sửa/tạo**:

| File | Action | Mô tả |
|------|--------|-------|
| `models/client/deposits/BankDeposit.model.js` | ✏️ | Thêm `version: { type: Number, default: 0 }` |
| `services/purchaseFinalization.service.js` | ✏️ | Thêm CAS update: `findOneAndUpdate` với `{ _id: deposit._id, version: deposit.version }`, `$inc: { version: 1 }` |
| `controllers/payment.controller.js` | ✏️ | Webhook handler kiểm tra idempotency key trước khi xử lý |
| `middlewares/sanitize.middleware.js` | ✏️ | Đảm bảo không strip webhook Buffer (đã xong ✅) |

**Độ phức tạp**: 🟢 Dễ (2-3 file, logic rõ ràng)

---

### Hạng mục 3.2: Card Deposit Replay Protection

**Mô tả**: Chống nạp lại cùng serial/pin đã SUCCESS hoặc đang PENDING.

**Hiện trạng**: Code đã check `CardDeposit.findOne({ serial, pin, status: { $in: ["PENDING", "SUCCESS"] } })` trong controller, nhưng thiếu unique index ở database → race condition có thể bypass check.

**Giải pháp**: Thêm partial unique index ở DB.

**Files cần sửa/tạo**:

| File | Action | Mô tả |
|------|--------|-------|
| `models/client/deposits/CardDeposit.model.js` | ✏️ | Thêm index: `{ serial: 1, pin: 1 }` với `partialFilterExpression: { status: { $in: ["PENDING", "SUCCESS"] } }` |
| `controllers/payment.controller.js` | ✏️ | Bắt lỗi duplicate key → thông báo "Thẻ này đã được nạp" |

> **Lưu ý**: Index này chỉ nên tạo khi DB đã clean duplicate data. Cần script migrate trước khi deploy.

**Độ phức tạp**: 🟢 Dễ (1-2 file, thêm index)

---

### Hạng mục 3.3: Balance Change Audit Log

**Mô tả**: Ghi JSON log mỗi lần balance thay đổi (mua, nạp, admin điều chỉnh) để phục vụ đối soát.

**Giải pháp**: Ghi vào file JSON với `pino` hoặc `winston`, rotate hàng ngày, giữ 30 ngày.

**Log format**:

```json
{
  "timestamp": "2026-05-27T10:30:00.000Z",
  "userId": "67a7...",
  "userName": "john",
  "type": "purchase" | "deposit_bank" | "deposit_card" | "admin_adjust",
  "amount": -50000,
  "balanceBefore": 200000,
  "balanceAfter": 150000,
  "reference": "order-xxx / deposit-xxx / admin-xxx",
  "note": "Mua acc Liên Quân #ABC123",
  "ip": "192.168.1.1"
}
```

**Files cần tạo**:

| File | Action | Mô tả |
|------|--------|-------|
| `services/auditLogger.service.js` | 🆕 | Service ghi balance_change log + cleanup job |
| `.env` | ✏️ | Thêm `AUDIT_LOG_DIR=./logs/audit` |
| `controllers/payment.controller.js` | ✏️ | Gọi auditLogger sau mỗi balance thay đổi |
| `controllers/order.controller.js` | ✏️ | Gọi auditLogger sau purchase thành công |
| `controllers/admin/deposit.controller.js` | ✏️ | Gọi auditLogger khi admin manual adjust |

**Độ phức tạp**: 🟡 Trung bình (3-4 file, tích hợp vào nhiều controller)

---

### Hạng mục 3.4: Admin Reconciliation Dashboard

**Mô tả**: Dashboard tổng quan cho admin — KPIs nạp tiền, biểu đồ, danh sách giao dịch, cảnh báo bất thường.

**Gồm**:

| Tính năng | Mô tả |
|-----------|-------|
| **KPI Cards** | Tổng nạp hôm nay, tổng nạp tháng, tỷ lệ thành công (%), chênh lệch so với hôm qua |
| **Deposit Table** | Danh sách giao dịch (bank + card), filter status, search referenceCode, xem chi tiết |
| **Chart** | Biểu đồ nạp tiền theo ngày/tuần/tháng, phân loại bank vs card |
| **Alert** | Cảnh báo: deposit pending quá lâu (>30 phút), amount mismatch, serial trùng |

**API Endpoints**:

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/admin/reconciliation/summary` | GET | KPIs tổng quan |
| `/api/admin/reconciliation/deposits` | GET | Danh sách deposit (paginated, filterable) |
| `/api/admin/reconciliation/alerts` | GET | Cảnh báo bất thường |

**Files cần tạo/sửa**:

| File | Action | Mô tả |
|------|--------|-------|
| `controllers/admin/reconciliation.controller.js` | 🆕 | API endpoints |
| `routes/admin/reconciliation.route.js` | 🆕 | Routes cho reconciliation |
| `server.js` | ✏️ | Mount route `/api/admin/reconciliation` |
| `frontend/src/pages/admin/Dashboard.tsx` | ✏️ | Thêm tab/section Reconciliation (hoặc page riêng) |
| `frontend/src/components/admin/reconciliation/*.tsx` | 🆕 | KPI cards, deposit table, charts, alerts |

**Độ phức tạp**: 🔴 Khó (5-7 files backend + 3-5 components frontend)

---

### Hạng mục 3.5: Balance Change Admin UI

**Mô tả**: Trang admin để xem audit trail balance của user, filter/search, và manual adjust balance.

**Files cần tạo/sửa**:

| File | Action | Mô tả |
|------|--------|-------|
| `controllers/admin/userBalance.controller.js` | 🆕 | GET audit log, POST adjust balance |
| `routes/admin/userBalance.route.js` | 🆕 | Routes |
| `services/auditLogger.service.js` | ✏️ | Ghi log khi admin adjust |
| `frontend/src/pages/admin/BalanceAudit.tsx` | 🆕 | Page xem audit trail |
| `frontend/src/components/admin/BalanceAdjustDialog.tsx` | 🆕 | Dialog adjust balance (lý do bắt buộc) |

**Độ phức tạp**: 🟡 Trung bình (4-5 files)

---

## Phase 4: Security 🔒

### Mô tả tổng quan

Củng cố bảo mật — session, token, 2FA, upload.

### Hạng mục 4.1: Refresh Token Rotation

- Thay refresh token mỗi lần dùng (rotation)
- Blacklist refresh token cũ
- Thời gian: access token 15p, refresh token 7 ngày
- **Độ phức tạp**: 🟡 Trung bình

### Hạng mục 4.2: Admin 2FA (TOTP)

- Thêm TOTP (Google Authenticator) cho admin login
- QR code + verify code khi setup
- Yêu cầu 2FA sau login nếu admin chưa setup
- **Độ phức tạp**: 🟡 Trung bình

### Hạng mục 4.3: Upload Protection

- Validate file type bằng magic bytes (không chỉ extension)
- Giới hạn kích thước file
- Scan virus (ClamAV) optional
- **Độ phức tạp**: 🟢 Dễ (thêm validation ở `upload.middleware.js`)

### Hạng mục 4.4: HTTP Security Headers

- helmet middleware
- CSP policy
- X-Frame-Options, X-Content-Type-Options, etc.
- **Độ phức tạp**: 🟢 Dễ (1 file + server.js)

---

## Phase 5: UX Resilience 🛡️

### Mô tả tổng quan

Đảm bảo frontend không crash khi API lỗi, hiển thị loading/empty/retry state đồng bộ.

### Hạng mục 5.1: React Error Boundary

- Component `ErrorBoundary` wrapper + fallback UI
- `ErrorFallback` component có retry button + error details
- **Độ phức tạp**: 🟢 Dễ (2 components)

### Hạng mục 5.2: Loading Skeleton Pattern

- Tạo `CardSkeleton`, `TableSkeleton`, `PageSkeleton`
- Thống nhất pattern loading cho tất cả pages
- **Độ phức tạp**: 🟢 Dễ (3 components + update pages)

### Hạng mục 5.3: Empty State Component

- Component `EmptyState` với icon + message + action button
- Props: `icon`, `title`, `description`, `actionLabel`, `onAction`
- **Độ phức tạp**: 🟢 Dễ (1 component)

### Hạng mục 5.4: useAsync hook

- Custom hook `useAsync(asyncFn, deps)` trả về `{ data, loading, error, retry }`
- Giảm boilerplate trong các pages
- **Độ phức tạp**: 🟢 Dễ (1 hook)

---

## Phase 6: Operability 📊

### Mô tả tổng quan

Ghi log có cấu trúc, monitoring, alerting.

### Hạng mục 6.1: Request Logger Middleware

- Ghi log mỗi request: method, path, status, duration, IP
- Dùng pino/winston, output JSON
- Skip health check endpoints
- **Độ phức tạp**: 🟢 Dễ (1 middleware)

### Hạng mục 6.2: Health Check Endpoint

- `GET /api/health` → trả về DB status, memory usage, uptime
- **Độ phức tạp**: 🟢 Dễ (1 route)

### Hạng mục 6.3: Payment Monitoring

- Dashboard admin: biểu đồ deposit theo thời gian thực (SSE)
- Alert khi deposit pending > 1 giờ
- **Độ phức tạp**: 🟡 Trung bình

### Hạng mục 6.4: Automated Deposit Reconciliation Job

- Cron job chạy mỗi 5 phút
- So khớp PayOS order với BankDeposit
- Báo cáo bất thường
- **Độ phức tạp**: 🟡 Trung bình

---

## Ma trận ưu tiên & Dependencies

| Phase | Mục | Phụ thuộc vào | Effort | Impact | Priority |
|-------|-----|--------------|--------|--------|:--------:|
| 3.1 | Idempotent webhook | — | 🟢 1-2 ngày | Ngăn mất tiền | **P0** |
| 3.2 | Card replay protection | — | 🟢 1 ngày | Ngăn nạp trùng | **P0** |
| 3.3 | Audit log | — | 🟡 2-3 ngày | Traceability | **P1** |
| 3.4 | Recon dashboard (API) | 3.3 | 🟡 2-3 ngày | Admin tool | **P1** |
| 3.4 | Recon dashboard (UI) | 3.4 API | 🔴 3-5 ngày | Admin tool | **P1** |
| 3.5 | Balance audit UI | 3.3 | 🟡 2 ngày | Admin tool | **P2** |
| 4.1 | Refresh token rotation | — | 🟡 2-3 ngày | Bảo mật | **P1** |
| 4.2 | Admin 2FA | — | 🟡 3-4 ngày | Bảo mật | **P2** |
| 4.3 | Upload protection | — | 🟢 1 ngày | Bảo mật | **P1** |
| 5.1-5.4 | UX Resilience | — | 🟢 2-3 ngày | UX quality | **P2** |
| 6.1-6.2 | Logger + Health | — | 🟢 1 ngày | Ops | **P2** |
| 6.3-6.4 | Payment monitoring | 3.4 | 🟡 3-5 ngày | Ops | **P3** |

---

## Sequence đề xuất

```
Phase 3 ───────────────────────────────▶ 4 tuần
├── Week 1: 3.1 → 3.2 → 3.3
├── Week 2: 3.4 API → 3.5 API
├── Week 3: 3.4 UI → 3.5 UI
└── Week 4: Testing + deploy

Phase 4 ───────────────────────────────▶ 2 tuần
├── Week 5: 4.1 → 4.3 → 4.4
└── Week 6: 4.2

Phase 5 ───────────────────────────────▶ 1 tuần
└── Week 7: 5.1 → 5.2 → 5.3 → 5.4

Phase 6 ───────────────────────────────▶ 1-2 tuần
└── Week 8-9: 6.1 → 6.2 → 6.3 → 6.4
```

---

## Technical Decisions (đã confirm)

| Decision | Lựa chọn | Lý do |
|----------|----------|-------|
| Idempotency | Idempotency key + optimistic locking (cả 2) | Defense-in-depth |
| Audit storage | File log (JSON) | Đơn giản, không ảnh hưởng DB, dễ rotate |
| Audit retention | 30 ngày | Cân bằng giữa compliance và dung lượng |
| Recon UI | Dashboard tổng quan | KPIs + charts + alerts trong 1 trang |
