# Payment Refactor Spec — Dùng PayOS cho mọi thanh toán

> **Mục tiêu:** Thay thế MoMo + VNPay bằng PayOS cho cả nạp tiền và mua trực tiếp. Dùng PayOS QR + chuyển khoản (giống flow nạp tiền hiện tại). Giữ lại Balance, Thẻ cào.

---

## 1. Hiện trạng

### Các phương thức thanh toán hiện tại

| Phương thức | Deposit (nạp) | Purchase (mua) | Trạng thái |
|-------------|---------------|----------------|------------|
| Balance (số dư ví) | ❌ | ✅ | ✅ Giữ nguyên |
| PayOS (chuyển khoản) | ✅ QR + webhook | ❌ | ✅ Giữ, thêm purchase |
| Thẻ cào (NetPay) | ✅ | ❌ | ✅ Giữ nguyên |
| MoMo | ✅ | ✅ | ❌ Xoá |
| VNPay | ✅ | ✅ | ❌ Xoá |

### Files liên quan đến MoMo/VNPay (sẽ xoá)

```
Backend:
- src/libs/momo.config.js
- src/libs/vnpay.config.js
- src/services/momo.service.js
- src/services/vnpay.service.js
- src/controllers/momo.controller.js
- src/controllers/vnpay.controller.js
- src/routes/momo.route.js
- src/routes/vnpay.route.js
- src/models/GatewayTransaction.model.js

Frontend:
- src/types/payment.ts
- src/services/client/paymentService.ts
- src/pages/PaymentResultPage.tsx
```

---

## 2. Files giữ nguyên

### Backend
- `src/libs/payos.config.js` — ✅ Giữ
- `src/controllers/payment.controller.js` — Sửa: thêm `createPayOSPurchase`, giữ nguyên `createDepositInfo` (đổi tên thành `createPayOSDeposit`?), `payosWebhook` (sửa để hỗ trợ cả purchase), `cardDeposit`, `cardWebhook`, `calculateFee`
- `src/services/cardProvider.service.js` — ✅ Giữ nguyên
- `src/models/client/deposits/BankDeposit.model.js` — **Sửa**: thêm `type: "deposit" | "purchase"`, thêm `order` ref
- `src/models/client/deposits/CardDeposit.model.js` — ✅ Giữ nguyên
- `src/controllers/order.controller.js` — Sửa: bỏ `paymentMethod: "momo"/"vnpay"`, thêm `paymentMethod: "payos"`
- `src/models/Order.model.js` — Sửa: paymentMethod enum: `["balance", "bank", "card", "payos"]`
- `src/server.js` — Sửa: bỏ import momoRoute + vnpayRoute

### Frontend
- `src/components/client/DepositDialog.tsx` — Sửa: bỏ tabs MoMo + VNPay, giữ Bank (PayOS) + Thẻ cào
- `src/pages/AccountDetailPage.tsx` — Sửa: bỏ MoMo/VNPay khỏi Select, thay bằng 2 nút "Mua bằng ví" và "Mua qua PayOS"
- `src/services/client/depositService.ts` — Có thể cần thêm method `createPayOSPurchase`
- `src/types/deposit.ts` — Sửa: thêm type cho purchase
- `src/routes/clientRoute.tsx` — Xoá route `/payment/result`

---

## 3. Kiến trúc mới

### Flow: Nạp tiền qua PayOS (giữ nguyên)

```
User nhập số tiền → Backend tạo PayOS payment link → 
Hiển thị QR + thông tin TK → User quét QR chuyển khoản →
PayOS webhook → Cộng balance → SSE thông báo
```

### Flow: Mua trực tiếp qua PayOS (MỚI)

```
User chọn "Mua qua PayOS" trên AccountDetailPage →
Backend:
  1. Reserve account (đánh dấu reserved, không cho người khác mua)
  2. Tạo BankDeposit record với type: "purchase" + order ref
  3. Tạo PayOS payment link với amount = giá account
  4. Lưu payosOrderId
→ Hiển thị Dialog popup với QR + thông tin chuyển khoản →
User quét QR chuyển khoản →
PayOS webhook gọi /api/payment/payos/webhook →
Backend xử lý:
  - Tìm BankDeposit theo orderCode
  - Nếu type === "purchase": mark order "completed", mark account "sold"
  - Nếu type === "deposit": cộng balance (giữ nguyên)
→ SSE thông báo → Dialog tự đóng
```

### Flow: Kiểm tra thủ công

```
User bấm "Đã thanh toán - Kiểm tra" →
Backend gọi PayOS API check trạng thái payment →
Nếu đã thanh toán: xử lý như webhook →
Thông báo kết quả
```

### Flow: Huỷ (timeout 15 phút)

```
Nếu user không thanh toán trong 15 phút:
- Account được release (isReserved: false)
- BankDeposit status → CANCELLED
- Order status → cancelled
Hoặc user có thể bấm "Huỷ" để release ngay
```

---

## 4. Database changes

### BankDeposit model — sửa

```javascript
// Thêm các field:
type: { type: String, enum: ["deposit", "purchase"], default: "deposit" },
order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
reservedAt: { type: Date, default: null },
expiresAt: { type: Date, default: null }, // 15 phút sau reservedAt
```

### Order model — sửa

```javascript
// paymentMethod enum
enum: ["balance", "bank", "card", "payos"]
```

### Account model — thêm field (nếu chưa có)

```javascript
// Có thể đã có, kiểm tra
isReserved: { type: Boolean, default: false },
reservedAt: { type: Date, default: null },
reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
```

---

## 5. Backend changes — chi tiết

### File: `payment.controller.js`

**Giữ nguyên:**
- `createDepositInfo` (hoặc đổi tên → `createPayOSDeposit`) — giữ nguyên logic
- `payosWebhook` — **SỬA**: sau khi xác nhận payment, kiểm tra `deposit.type`:
  - Nếu `"deposit"`: cộng balance (như hiện tại)
  - Nếu `"purchase"`: mark order completed + mark account sold
- `submitCardDeposit` — giữ nguyên
- `cardWebhook` — giữ nguyên
- `calculateFee` — giữ nguyên
- `getActiveBank` — giữ nguyên
- `getDepositHistory` — giữ nguyên (có thể cần include cả purchase deposits)

**Thêm mới:**
- `createPayOSPurchase` — tạo purchase deposit:
  1. Input: `{ accountId, discountCode? }` từ req.body
  2. Validate account chưa reserved, chưa sold
  3. Reserve account (`isReserved = true, reservedBy = userId, reservedAt = new Date()`)
  4. Tạo BankDeposit với `type: "purchase"`, `order: orderId`
  5. Tạo Order với status "pending"
  6. Gọi PayOS tạo payment link
  7. Trả về QR info + order info
- `checkPayOSPurchaseStatus` — kiểm tra trạng thái từ PayOS API
- `cancelPayOSPurchase` — huỷ purchase, release account

### File: `order.controller.js`

- `purchaseAccount`: xoá handling cho `paymentMethod: "momo"/"vnpay"`, giữ nguyên `"balance"`
- API `/api/purchase/payos` sẽ nằm ở payment route, không phải order route

### File: `payment.route.js`

**Sửa:**
- `POST /create-payment/bank` → giữ nguyên
- `POST /create-payment/card` → giữ nguyên
- `POST /payos/webhook` → giữ nguyên
- `POST /card/webhook` → giữ nguyên
- `GET /calculate-fee` → giữ nguyên

**Thêm:**
- `POST /create-purchase` → `createPayOSPurchase` (protected)
- `POST /purchase/:bankDepositId/check` → `checkPayOSPurchaseStatus` (protected)
- `POST /purchase/:bankDepositId/cancel` → `cancelPayOSPurchase` (protected)

### File: `server.js`

- Xoá import: `momoRoute`, `vnpayRoute`
- Xoá mount: `app.use("/api/payment/momo", momoRoute)`, `app.use("/api/payment/vnpay", vnpayRoute)`
- Giữ nguyên: `app.use("/api/payment", paymentRoute)`

### File: `Order.model.js`

- Sửa `paymentMethod.enum`: `["balance", "bank", "card", "payos"]`

---

## 6. Frontend changes — chi tiết

### File: `AccountDetailPage.tsx`

**Thay đổi:**
- Xoá import `paymentService`
- Xoá `paymentMethod` state + Select dropdown
- Thay bằng 2 nút bấm lớn, cạnh nhau:
  1. **"Mua bằng số dư"** (nút xanh, icon Banknote) — gọi `orderService.purchaseAccount` với `paymentMethod: "balance"`
  2. **"Mua qua chuyển khoản"** (nút tím, icon QrCode) — gọi API tạo PayOS purchase

**Khi bấm "Mua qua chuyển khoản":**
- Show loading
- Gọi `POST /api/payment/create-purchase` với `{ accountId, discountCode? }`
- Nhận về `{ qrImage, accountName, accountNumber, referenceCode, amount }`
- Hiển thị **Dialog popup** với:
  - QR code
  - Thông tin chuyển khoản (chủ TK, số TK, ngân hàng, nội dung)
  - Số tiền cần chuyển
  - Nút **"Đã chuyển khoản - Kiểm tra"** — gọi `POST /api/payment/purchase/:id/check`
  - Nút **"Huỷ"** — gọi `POST /api/payment/purchase/:id/cancel`
  - Hướng dẫn chuyển khoản
  - Timeout đếm ngược 15 phút

### File: `DepositDialog.tsx`

**Thay đổi:**
- `TabsList` grid: từ `grid-cols-4` → `grid-cols-2`
- Xoá tabs: MoMo, VNPay
- Giữ: Bank (PayOS), Thẻ cào
- Xoá: `handleMoMoDeposit`, `handleVnpayDeposit`, momo/vnpay state
- Xoá import: `paymentService`

### File: `clientRoute.tsx`

- Xoá import + route cho `PaymentResultPage`

### File: `depositService.ts`

- Thêm method mới:
  - `createPayOSPurchase(accountId, discountCode?)` → `POST /api/payment/create-purchase`
  - `checkPayOSPurchaseStatus(bankDepositId)` → `POST /api/payment/purchase/:id/check`
  - `cancelPayOSPurchase(bankDepositId)` → `POST /api/payment/purchase/:id/cancel`

### File: `types/deposit.ts`

- Thêm type:
  ```typescript
  interface PayOSPurchaseResponse {
    orderId: string;
    bankDepositId: string;
    qrImage: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    referenceCode: string;
    amount: number;
    expiresAt: string;
  }
  ```

---

## 7. Files to DELETE

### Backend (9 files)

| File | Reason |
|------|--------|
| `backend/src/libs/momo.config.js` | MoMo removed |
| `backend/src/libs/vnpay.config.js` | VNPay removed |
| `backend/src/services/momo.service.js` | MoMo removed |
| `backend/src/services/vnpay.service.js` | VNPay removed |
| `backend/src/controllers/momo.controller.js` | MoMo removed |
| `backend/src/controllers/vnpay.controller.js` | VNPay removed |
| `backend/src/routes/momo.route.js` | MoMo removed |
| `backend/src/routes/vnpay.route.js` | VNPay removed |
| `backend/src/models/GatewayTransaction.model.js` | Replaced by BankDeposit.type |

### Frontend (3 files)

| File | Reason |
|------|--------|
| `frontend/src/types/payment.ts` | MoMo/VNPay types no longer needed |
| `frontend/src/services/client/paymentService.ts` | MoMo/VNPay services no longer needed |
| `frontend/src/pages/PaymentResultPage.tsx` | Redirect flow removed, replaced by inline Dialog |

---

## 8. .env changes

- Xoá: `MOMO_*`, `VNPAY_*` variables (có thể giữ comment nếu sau này muốn thêm lại)
- Giữ nguyên: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`

---

## 9. Edge cases & xử lý

### Double-sell prevention
- Account có field `isReserved` — khi tạo PayOS purchase, set `isReserved = true`
- Khi mua bằng balance, check `isSold === false && isReserved === false`
- Nếu `isReserved === true`, hiển thị thông báo "Tài khoản đang có người thanh toán"
- Cronjob hoặc user action: release reserved nếu quá 15 phút

### Webhook failure
- Nếu PayOS webhook không gọi được (server down), user có thể bấm "Kiểm tra" để manual verify
- Admin cũng có thể xác nhận thủ công trong admin panel

### Partial payment / wrong amount
- PayOS webhook kiểm tra `data.amount === deposit.expectedAmount` (giống hiện tại)
- Nếu sai amount → deposit.FAILED + thông báo lỗi

### Concurrent purchase
- 2 users cùng mua 1 account balance: transaction trong MongoDB session ngăn double-sell
- 1 user balance + 1 user PayOS: `isReserved` flag ngăn trường hợp này

### Gift code / discount cho PayOS purchase
- Áp dụng discount khi tạo PayOS purchase (giống balance flow)
- Số tiền PayOS tạo payment = giá sau giảm
- Lưu discount info vào BankDeposit (đã có field discount)
- Lưu discount info vào Order (đã có field discount)

---

## 10. Summary of all changes

### Backend
| File | Action |
|------|--------|
| `payment.controller.js` | Thêm `createPayOSPurchase`, `checkPayOSPurchaseStatus`, `cancelPayOSPurchase`. Sửa `payosWebhook` hỗ trợ cả purchase. |
| `payment.route.js` | Thêm 3 endpoints mới (create, check, cancel). |
| `order.controller.js` | Xoá handling momo/vnpay. |
| `Order.model.js` | Sửa enum paymentMethod. |
| `BankDeposit.model.js` | Thêm type, order, reservedAt, expiresAt. |
| `Account.model.js` | Kiểm tra/thêm isReserved, reservedBy, reservedAt. |
| `server.js` | Xoá momoRoute, vnpayRoute import + mount. |
| 9 files MoMo/VNPay | DELETE. |

### Frontend
| File | Action |
|------|--------|
| `AccountDetailPage.tsx` | 2 nút (Balance / PayOS QR) + Dialog popup QR. |
| `DepositDialog.tsx` | Xoá MoMo/VNPay tabs. |
| `depositService.ts` | Thêm PayOS purchase methods. |
| `types/deposit.ts` | Thêm PayOSPurchase types. |
| `clientRoute.tsx` | Xoá PaymentResultPage route. |
| 3 files MoMo/VNPay | DELETE. |

### Database
- BankDeposit: thêm type enum + order ref
- Account: thêm isReserved fields
- Order: sửa paymentMethod enum

### Env
- Xoá MOMO_*, VNPAY_* vars

---

## 11. Implementation order

1. **Backend models**: sửa BankDeposit, Order, Account
2. **Backend controller**: thêm PayOS purchase logic vào `payment.controller.js`
3. **Backend routes**: thêm endpoints, cập nhật payment.route.js
4. **Backend cleanup**: xoá MoMo/VNPay files, update server.js
5. **Frontend types**: cập nhật deposit.ts
6. **Frontend services**: thêm methods vào depositService.ts, xoá paymentService.ts
7. **Frontend components**: sửa AccountDetailPage, DepositDialog
8. **Frontend cleanup**: xoá PaymentResultPage, clientRoute update
9. **Env cleanup**: xoá MoMo/VNPay vars
10. **Test**: TypeScript check, server restart, API test
