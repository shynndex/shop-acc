# 📊 Spec: Cải thiện Đối soát Giao dịch

> **Phiên bản:** v1.0  
> **Ngày tạo:** 09/06/2026  
> **Trạng thái:** Draft  
> **Phạm vi:** Cải thiện + Bổ sung tính năng mới cho trang Đối soát

---

## 1. Tổng quan

### 1.1 Mục tiêu
Cải thiện toàn diện trang Đối soát giao dịch (Reconciliation) trong admin dashboard:
- **Bổ sung tính năng mới:** Biểu đồ phân tích, so khớp tự động deposit vs order, cảnh báo nâng cao
- **Cải thiện phần hiện tại:** UX tốt hơn, responsive mobile, workflow xử lý alert đơn giản

### 1.2 Hiện trạng
Hệ thống hiện tại đã có:
- **Backend APIs:** `/summary`, `/deposits`, `/alerts`
- **Frontend:** Page 3 tab (Tổng quan, Cảnh báo, Danh sách giao dịch)
- **Auto-reconciliation job:** Chạy mỗi 5 phút, tự xử lý PENDING >60 phút
- **Export CSV:** Cho danh sách deposit

### 1.3 Vấn đề cần giải quyết
| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | Không có biểu đồ phân tích (chart) | Cao |
| 2 | Không phát hiện chênh lệch deposit vs order | Cao |
| 3 | Thiếu alert: serial/pin trùng, bank mismatch, nạp bất thường | Trung bình |
| 4 | Chưa responsive trên mobile | Trung bình |
| 5 | Chart filter chưa linh hoạt | Thấp |

---

## 2. Phạm vi tính năng

### 2.1 Biểu đồ phân tích (Charts)

**Thư viện:** Recharts (lightweight, dễ maintain)

**Vị trí:** Tab Tổng quan (Overview)

**Các loại chart:**

| Chart | Loại | Dữ liệu | Mô tả |
|-------|------|---------|-------|
| Tổng nạp theo thời gian | Bar chart (stacked) | Nạp tiền theo ngày/tuần/tháng | So sánh bank vs card, hiển thị tổng |
| Tỷ lệ trạng thái | Donut/Pie chart | SUCCESS vs FAILED vs PENDING vs CANCELLED | Hiển thị tỷ lệ phần trăm |
| Top người nạp tiền | Horizontal bar chart | Top 10 users theo tổng nạp | Hiển thị username + amount |
| Phân bổ phương thức | Pie chart | Bank vs Card ratio | Hiển thị tỷ lệ % |

**Filter cho chart:**
- Date range picker (từ/đến)
- Filter theo loại (bank/card/tất cả)
- Filter theo trạng thái (PENDING/SUCCESS/FAILED/CANCELLED/tất cả)
- Filter theo người dùng (search username/email)

**Responsive:** Chart phải responsive trên mobile (hiển thị dạng stacked hoặc scroll ngang)

### 2.2 So khớp tự động Deposit vs Order

**Logic phát hiện:**

| Loại mismatch | Điều kiện | Alert type |
|--------------|-----------|------------|
| Amount mismatch | `deposit.amount ≠ order.amount` khi order completed | `order_amount_mismatch` |
| Status mismatch | Deposit SUCCESS nhưng order chưa completed (sau 15 phút) | `order_status_mismatch` |
| Orphan deposit | Deposit completed nhưng không có order nào liên kết | `orphan_deposit` |

**API mới:**
```
GET /api/admin/reconciliation/mismatches?page=1&limit=20&status=pending
```

**Trả về:**
```typescript
interface MismatchAlert {
  _id: string;
  type: "order_amount_mismatch" | "order_status_mismatch" | "orphan_deposit";
  severity: "warning" | "critical";
  deposit: {
    _id: string;
    amount: number;
    status: string;
    user: { username: string; email: string };
    createdAt: string;
  };
  order?: {
    _id: string;
    amount: number;
    status: string;
    createdAt: string;
  };
  message: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedNote?: string;
}
```

**Workflow xử lý:**
1. Auto-detect khi deposit hoặc order thay đổi status
2. Lưu mismatch record vào `MismatchAlert` collection
3. Hiển thị trong tab "Cảnh báo"
4. Admin xem → click "Xử lý" → dismiss (không cần nhập lý do)
5. Alert chuyển sang `resolved`

### 2.3 Alert mới

#### 2.3.1 Serial/Pin trùng

**Logic:**
```javascript
// Phát hiện serial/pin đã được nạp trước đó (PENDING hoặc SUCCESS)
const duplicate = await CardDeposit.findOne({
  serial: serial,
  pin: pin,
  status: { $in: ["PENDING", "SUCCESS"] },
  _id: { $ne: currentDepositId } // Loại trừ chính nó
});

if (duplicate) {
  alerts.push({
    type: "serial_pin_duplicate",
    severity: "warning",
    message: `Thẻ ${provider} serial ...${serial.slice(-4)} đã được nạp trước đó`
  });
}
```

**API alert endpoint hiện tại đã hỗ trợ** - cần thêm logic check trong `getReconciliationAlerts`

#### 2.3.2 Bank Amount Mismatch

**Logic:**
```javascript
// So sánh expectedAmount vs amount thực tế từ PayOS
const bankDeposits = await BankDeposit.find({
  type: "purchase",
  status: "PAID",
  expectedAmount: { $gt: 0 },
  amount: { $ne: "$expectedAmount" }
});

for (const deposit of bankDeposits) {
  if (deposit.amount !== deposit.expectedAmount) {
    alerts.push({
      type: "bank_amount_mismatch",
      severity: deposit.amount < deposit.expectedAmount ? "critical" : "warning",
      message: `Chuyển khoản ${deposit.referenceCode}: khai báo ${deposit.expectedAmount}đ, thực nhận ${deposit.amount}đ`
    });
  }
}
```

#### 2.3.3 Nạp bất thường (Anti-fraud)

**Logic (configurable rules):**
```javascript
// Config trong admin settings hoặc hardcoded
const RULES = {
  dailyLimit: 500000, // >500k/ngày
  pendingThreshold: 2, // >2 giao dịch PENDING trong 1h
};

// Kiểm tra 1: Tổng nạp trong ngày > limit
const userDepositsToday = await BankDeposit.aggregate([
  { $match: { user: userId, createdAt: { $gte: todayStart } } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
]);

if (userDepositsToday[0]?.total > RULES.dailyLimit) {
  alerts.push({
    type: "abnormal_deposit",
    severity: "warning",
    message: `User ${username} nạp ${userDepositsToday[0].total}đ hôm nay (vượt hạn ${RULES.dailyLimit}đ)`
  });
}

// Kiểm tra 2: Nhiều PENDING trong 1h
const pendingCount = await BankDeposit.countDocuments({
  user: userId,
  status: "PENDING",
  createdAt: { $gte: oneHourAgo }
});

if (pendingCount >= RULES.pendingThreshold) {
  alerts.push({
    type: "abnormal_pending",
    severity: "warning",
    message: `User ${username} có ${pendingCount} giao dịch PENDING trong 1h`
  });
}
```

#### 2.3.4 Order-Deposit Status Mismatch

**Logic:**
```javascript
// Deposit SUCCESS nhưng order vẫn pending sau 15 phút
const staleOrders = await Order.aggregate([
  {
    $lookup: {
      from: "bankdeposits",
      localField: "_id",
      foreignField: "order",
      as: "deposit"
    }
  },
  { $unwind: "$deposit" },
  {
    $match: {
      "deposit.status": "PAID",
      status: "pending",
      createdAt: { $lte: fifteenMinAgo }
    }
  }
]);

for (const order of staleOrders) {
  alerts.push({
    type: "order_status_mismatch",
    severity: "warning",
    message: `Order ${order.transactionId} chưa completed dù deposit đã PAID`
  });
}
```

### 2.4 Alert Workflow

**Hiện tại:** Alert chỉ hiển thị, không có action

**Cải thiện:**
- Thêm button "Xử lý" trên mỗi alert
- Click → Alert chuyển sang resolved (không cần nhập lý do)
- Hiển thị "Đã xử lý" badge trên alert đã resolved
- Filter: Tất cả / Chưa xử lý / Đã xử lý

**API mới:**
```
PATCH /api/admin/reconciliation/alerts/:id/resolve
Body: { resolvedBy: "admin_id" }
```

### 2.5 Responsive Mobile

**Yêu cầu:**
- Trang reconciliation phải hoạt động tốt trên mobile
- KPI cards: 2 columns trên mobile (thay vì 6 columns trên desktop)
- Chart: Responsive, có thể scroll ngang nếu cần
- Tabs: Dropdown hoặc scroll trên mobile
- Table: Horizontal scroll trên mobile
- Alert: Card layout trên mobile thay vì table

### 2.6 Auto-refresh

**Logic:**
- Dashboard tự động refresh data mỗi 30 giây
- Hiển thị badge "Auto-refreshing" khi đang refresh
- Cho phép toggle auto-refresh on/off
- Khi user đang ở tab khác, vẫn refresh nhưng không hiển thị loading

---

## 3. Architecture

### 3.1 Backend

#### Files mới cần tạo:

| File | Mô tả |
|------|-------|
| `backend/src/controllers/admin/reconciliation.controller.js` | Sửa: thêm endpoint mismatches, resolve alert |
| `backend/src/models/MismatchAlert.model.js` | Mới: Model lưu alert mismatch |
| `backend/src/services/reconciliation.service.js` | Mới: Business logic reconciliation |

#### Files sửa:

| File | Thay đổi |
|------|----------|
| `backend/src/controllers/admin/reconciliation.controller.js` | Thêm `getMismatches`, `resolveAlert` |
| `backend/src/routes/admin/reconciliation.route.js` | Thêm routes mới |
| `backend/src/jobs/autoReconciliation.job.js` | Thêm logic detect mismatch |

#### Database Schema:

```javascript
// MismatchAlert.model.js
const mismatchAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "order_amount_mismatch",
      "order_status_mismatch",
      "orphan_deposit",
      "serial_pin_duplicate",
      "bank_amount_mismatch",
      "abnormal_deposit",
      "abnormal_pending"
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ["warning", "critical"],
    required: true
  },
  deposit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BankDeposit" // hoặc CardDeposit tùy type
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "resolved"],
    default: "pending",
    index: true
  },
  resolvedAt: { type: Date, default: null },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }
}, { timestamps: true });

// Index cho query nhanh
mismatchAlertSchema.index({ status: 1, createdAt: -1 });
mismatchAlertSchema.index({ type: 1, status: 1 });
```

### 3.2 Frontend

#### Files mới cần tạo:

| File | Mô tả |
|------|-------|
| `frontend/src/components/admin/reconciliation/ReconCharts.tsx` | Component hiển thị chart |
| `frontend/src/components/admin/reconciliation/ReconMismatchPanel.tsx` | Panel hiển thị mismatch alerts |

#### Files sửa:

| File | Thay đổi |
|------|----------|
| `frontend/src/pages/admin/Reconciliation.tsx` | Thêm tab "Mismatches", tích hợp chart |
| `frontend/src/types/admin/reconciliation.type.ts` | Thêm types mới |
| `frontend/src/services/admin/reconciliation.service.ts` | Thêm API calls mới |
| `frontend/src/hooks/queries/useAdminQueries.ts` | Thêm query hooks mới |

#### Types mới:

```typescript
// Thêm vào reconciliation.type.ts

export interface MismatchAlert {
  _id: string;
  type: "order_amount_mismatch" | "order_status_mismatch" | "orphan_deposit";
  severity: "warning" | "critical";
  deposit: {
    _id: string;
    amount: number;
    status: string;
    user: { _id: string; username: string; email?: string };
    createdAt: string;
  };
  order?: {
    _id: string;
    amount: number;
    status: string;
    createdAt: string;
  };
  message: string;
  status: "pending" | "resolved";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ChartDataPoint {
  date: string;
  bank: number;
  card: number;
  total: number;
}

export interface TopDepositor {
  userId: string;
  username: string;
  totalAmount: number;
  transactionCount: number;
}
```

#### Chart Component:

```tsx
// ReconCharts.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

interface ReconChartsProps {
  chartData: ChartDataPoint[];
  statusDistribution: Record<string, number>;
  topDepositors: TopDepositor[];
  methodDistribution: { method: string; amount: number; count: number }[];
  loading?: boolean;
}

export function ReconCharts({
  chartData,
  statusDistribution,
  topDepositors,
  methodDistribution,
  loading
}: ReconChartsProps) {
  // Render 4 charts trong grid responsive
  // Mobile: 1 column
  // Tablet: 2 columns
  // Desktop: 2x2 grid
}
```

### 3.3 API Endpoints mới

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `GET /api/admin/reconciliation/mismatches` | GET | Danh sách mismatch alerts (paginated) |
| `PATCH /api/admin/reconciliation/alerts/:id/resolve` | PATCH | Resolve alert |
| `GET /api/admin/reconciliation/chart-data` | GET | Data cho charts |

#### Request/Response examples:

**GET /api/admin/reconciliation/mismatches**
```
Query: page=1&limit=20&status=pending&type=order_amount_mismatch

Response:
{
  "success": true,
  "data": {
    "mismatches": MismatchAlert[],
    "totalPages": number,
    "currentPage": number,
    "totalItems": number,
    "stats": {
      "pending": number,
      "resolved": number
    }
  }
}
```

**PATCH /api/admin/reconciliation/alerts/:id/resolve**
```
Body: {}

Response:
{
  "success": true,
  "message": "Đã xử lý alert"
}
```

**GET /api/admin/reconciliation/chart-data**
```
Query: dateFrom=2026-06-01&dateTo=2026-06-09&type=bank&status=SUCCESS

Response:
{
  "success": true,
  "data": {
    "timeSeries": ChartDataPoint[],
    "statusDistribution": Record<string, number>,
    "topDepositors": TopDepositor[],
    "methodDistribution": { method: string; amount: number; count: number }[]
  }
}
```

---

## 4. UI/UX Design

### 4.1 Layout hiện tại vs mới

**Hiện tại:**
```
┌─────────────────────────────────────────┐
│ [Tổng quan] [Cảnh báo] [Danh sách GT]  │
├─────────────────────────────────────────┤
│ Tab Content                              │
└─────────────────────────────────────────┘
```

**Mới:**
```
┌─────────────────────────────────────────┐
│ [Tổng quan] [Cảnh báo] [Mismatches] [Danh sách GT] │
├─────────────────────────────────────────┤
│ KPI Cards (6 cards, responsive)          │
├─────────────────────────────────────────┤
│ Charts (2x2 grid, responsive)            │
├─────────────────────────────────────────┤
│ Recent Transactions + Alerts Preview     │
└─────────────────────────────────────────┘
```

### 4.2 Tab "Mismatches"

**Header:**
- Filter: Tất cả / Chưa xử lý / Đã xử lý
- Filter: Loại mismatch
- Search: Username/email
- Stats: X pending, Y resolved

**Table/Alert list:**
- Mỗi alert là 1 card
- Hiển thị: Type badge, Severity badge, Message, User, Time
- Button "Xử lý" (chỉ hiện khi pending)
- Badge "Đã xử lý" khi resolved

### 4.3 Charts trong Tab Tổng quan

**Layout:**
```
┌──────────────────────┬──────────────────────┐
│ Tổng nạp theo ngày   │ Tỷ lệ trạng thái     │
│ (Bar chart stacked)  │ (Pie/Donut chart)    │
├──────────────────────┼──────────────────────┤
│ Top người nạp tiền   │ Phân bổ phương thức   │
│ (Horizontal bar)     │ (Pie chart)          │
└──────────────────────┴──────────────────────┘
```

**Mobile:**
- Stack thành 1 column
- Chart scroll ngang nếu cần
- Legend hiển thị dưới chart

### 4.4 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| < 640px (Mobile) | 1 column, cards stack, table horizontal scroll |
| 640-1024px (Tablet) | 2 columns, charts 2x2 |
| > 1024px (Desktop) | Full layout, 6 KPI cards, 2x2 charts |

---

## 5. Implementation Plan

### Phase 1: Backend (2-3 ngày)

| Task | File | Mô tả |
|------|------|-------|
| 1.1 | `models/MismatchAlert.model.js` | Tạo model mới |
| 1.2 | `controllers/admin/reconciliation.controller.js` | Thêm getMismatches, resolveAlert, getChartData |
| 1.3 | `routes/admin/reconciliation.route.js` | Thêm routes mới |
| 1.4 | `services/reconciliation.service.js` | Business logic detect mismatch |
| 1.5 | `jobs/autoReconciliation.job.js` | Thêm detect logic vào job |

### Phase 2: Frontend Core (3-4 ngày)

| Task | File | Mô tả |
|------|------|-------|
| 2.1 | `types/admin/reconciliation.type.ts` | Thêm types mới |
| 2.2 | `services/admin/reconciliation.service.ts` | Thêm API calls |
| 2.3 | `hooks/queries/useAdminQueries.ts` | Thêm query hooks |
| 2.4 | `components/admin/reconciliation/ReconCharts.tsx` | Tạo component chart |
| 2.5 | `components/admin/reconciliation/ReconMismatchPanel.tsx` | Tạo component mismatch panel |

### Phase 3: Frontend Integration (2-3 ngày)

| Task | File | Mô tả |
|------|------|-------|
| 3.1 | `pages/admin/Reconciliation.tsx` | Tích hợp tab Mismatches + Charts |
| 3.2 | Responsive styling | Đảm bảo responsive mobile |
| 3.3 | Auto-refresh logic | Thêm auto-refresh 30s |
| 3.4 | Alert workflow | Button "Xử lý" + resolve logic |

### Phase 4: Testing & Polish (1-2 ngày)

| Task | Mô tả |
|------|-------|
| 4.1 | Test backend APIs |
| 4.2 | Test frontend components |
| 4.3 | Test responsive design |
| 4.4 | Test alert workflow |
| 4.5 | Performance check |

**Tổng estimated time:** 8-12 ngày

---

## 6. Edge Cases & Error Handling

### 6.1 Edge Cases

| Case | Xử lý |
|------|-------|
| Deposit không có order liên kết | Hiển thị orphan_deposit alert |
| Order amount = 0 (giftcode) | Bỏ qua amount mismatch check |
| User nạp nhiều lần cùng lúc | Check anti-fraud rules, hiển thị alert |
| Deposit đã resolved nhưng lại có mismatch mới | Tạo alert mới, không resolve alert cũ |
| Chart data rỗng | Hiển thị empty state "Chưa có dữ liệu" |
| Auto-refresh bị fail | Silent fail, giữ data cũ, retry sau 30s |

### 6.2 Error Handling

| Error | Xử lý |
|-------|-------|
| API fails | Hiển thị toast error, giữ data cũ |
| Chart render fail | Fallback to simple text/stats |
| Resolve alert fails | Toast error, giữ alert ở pending |
| Invalid filter | Reset to default, toast warning |

---

## 7. Database Indexes

```javascript
// MismatchAlert indexes
{ status: 1, createdAt: -1 }  // Query alerts by status
{ type: 1, status: 1 }  // Filter by type + status
{ user: 1, status: 1 }  // Filter by user

// BankDeposit - thêm index cho reconciliation queries
{ status: 1, createdAt: -1, amount: 1 }

// CardDeposit - thêm index
{ status: 1, createdAt: -1, serial: 1 }
```

---

## 8. Configuration

### 8.1 Anti-fraud Rules (Có thể config trong admin settings)

```javascript
// Hoặc trong .env hoặc admin settings collection
RECON_DAILY_DEPOSIT_LIMIT=500000  // VND
RECON_PENDING_THRESHOLD=2  // giao dịch
RECON_PENDING_WINDOW_MINUTES=60
```

### 8.2 Auto-refresh Interval

```javascript
// Frontend config
AUTO_REFRESH_INTERVAL=30000  // 30 seconds
```

### 8.3 Chart Defaults

```javascript
const CHART_DEFAULTS = {
  dateRange: "7d",  // 7 ngày mặc định
  topN: 10,  // Top 10 users
  barColors: {
    bank: "#3b82f6",  // blue-500
    card: "#8b5cf6",  // violet-500
  }
};
```

---

## 9. Testing Plan

### 9.1 Backend Tests

| Test case | Mô tả |
|-----------|-------|
| `GET /mismatches` | Test query params, pagination |
| `PATCH /alerts/:id/resolve` | Test resolve alert |
| `GET /chart-data` | Test aggregation queries |
| Anti-fraud detection | Test với mock deposits |
| Amount mismatch detection | Test edge cases |

### 9.2 Frontend Tests

| Test case | Mô tả |
|-----------|-------|
| ReconCharts render | Test chart components render correctly |
| ReconMismatchPanel | Test filter, resolve button |
| Responsive layout | Test mobile/tablet/desktop |
| Auto-refresh | Test toggle on/off |
| Alert workflow | Test resolve flow |

### 9.3 Integration Tests

| Test case | Mô tả |
|-----------|-------|
| Full reconciliation flow | Create deposit → detect mismatch → resolve |
| Chart data accuracy | Verify chart data matches DB |
| Mobile responsiveness | Test trên various screen sizes |

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Alert detection accuracy | > 95% |
| Chart load time | < 2s |
| Mobile responsive score | > 90 (Lighthouse) |
| Admin time to resolve alert | < 30s |
| False positive rate | < 5% |

---

## 11. Dependencies

| Package | Version | Dùng cho |
|---------|---------|----------|
| recharts | latest | Charts |
| @tanstack/react-query | existing | Data fetching |
| zustand | existing | State management |
| lucide-react | existing | Icons |

---

## 12. Out of Scope (Không làm trong version này)

- PDF report export
- Real-time SSE push alerts
- Complex statistical anomaly detection
- Machine learning fraud detection
- Admin assignment/escalation workflow
- Custom alert rules builder (UI)

---

## 13. Notes

1. **Performance:** Với volume nhỏ (<1k/tháng), không cần caching phức tạp. Có thể optimize sau nếu cần.

2. **Mobile-first:** Ưu tiên responsive mobile vì admin có thể cần check alert khi away.

3. **Quick dismiss:** Alert workflow đơn giản - admin chỉ cần click "Xử lý" để dismiss, không cần nhập lý do (giảm friction).

4. **Auto-refresh:** Dashboard tự refresh mỗi 30s, không cần SSE push (đơn giản hơn, đủ dùng).

5. **Chart library:** Dùng Recharts vì lightweight, dễ maintain, phù hợp với project.

6. **Filter đầy đủ:** Chart filter phải linh hoạt: date range + type + status + user.

---

**Spec created by:** Buffy (Codebuff AI)  
**Last updated:** 09/06/2026  
**Status:** Ready for review
