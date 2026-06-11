# Website Overhaul Spec — ShopSam

> **Project:** Comprehensive website overhaul for ShopSam (loginvip)
> **Date:** 2026-06-10
> **Status:** Draft — awaiting implementation
> **Priority Order:** Song song tất cả (all features in parallel)

---

## Table of Contents

1. [Bug Fixes](#1-bug-fixes)
2. [UI Modifications](#2-ui-modifications)
3. [Floating Chat Box](#3-floating-chat-box)
4. [Realtime Marquee Notifications](#4-realtime-marquee-notifications)
5. [Product Grid Layout](#5-product-grid-layout)
6. [Deposit System Improvements](#6-deposit-system-improvements)
7. [First Deposit Promotion](#7-first-deposit-promotion)
8. [Dynamic Admin Configuration System](#8-dynamic-admin-configuration-system)
9. [General Requirements](#9-general-requirements)

---

## 1. Bug Fixes

### 1.1 Signup Error (500 Internal Server Error)

**Problem:**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
signup-form.tsx:53 Error: Lỗi hệ thống
at signUp (useAuthStore.ts:93:17)
at async handleSubmit (signup-form.tsx:42:23)
```

**Environment:** Happens in BOTH development and production.

**Root Cause Analysis (to investigate):**
- Backend `auth.controller.js` → `signUp` function uses `User.create()` with `hashedPassword` field
- Potential issues:
  - User model field mismatch: controller passes `hashedPassword` but model may expect `password`
  - MongoDB connection issues during `User.create()`
  - Zod validation schema mismatch with actual request body
  - Missing required fields in User model

**Investigation Steps:**
1. Read `backend/src/models/client/User.model.js` to check field definitions
2. Read `backend/src/validation/validation.schemas.js` → `signUpSchema` to check validation rules
3. Read `frontend/src/services/client/authService.ts` → `signUp` method to check payload structure
4. Read `frontend/src/types/client/services.ts` → `SignUpPayload` type
5. Check server logs for full stack trace of 500 error
6. Test with curl/Postman to isolate frontend vs backend issue

**Expected Fix:**
- Ensure User model fields match what controller is passing
- Ensure frontend payload matches backend validation schema
- Ensure MongoDB connection is stable during user creation
- User should be able to register successfully with email verification flow

**Files to investigate:**
- `backend/src/models/client/User.model.js`
- `backend/src/controllers/auth.controller.js`
- `backend/src/validation/validation.schemas.js`
- `frontend/src/services/client/authService.ts`
- `frontend/src/stores/useAuthStore.ts`
- `frontend/src/components/client/signup-form.tsx`

---

### 1.2 Admin Login on Client Page

**Requirement:** Admin accounts should be able to login via the client-facing `/signin` page.

**Current State:**
- Client auth uses `User` model with fields: `username`, `email`, `hashedPassword`
- Admin auth uses separate `Admin` model with fields: `username`, `email`, `password`, `role`
- Client `signIn` controller only queries `User` model: `User.findOne({ $or: [{ email: identifier }, { username: identifier }] })`

**Solution:**
- Modify client `signIn` controller to first query `User` model; if not found, query `Admin` model
- **Critical: bcrypt vs bcryptjs mismatch** — Admin model uses `bcryptjs` with `matchPassword` method, while auth controller imports `bcrypt`. After finding an Admin, must call `Admin`'s `matchPassword()` method, NOT `User.comparePassword()`
- After successful admin login via client, set role in JWT payload (`{ userId, role: "admin" }`)
- Frontend auth store must handle admin role to show/hide admin nav links
- Admin should be able to access `/admin` panel after logging in through `/signin`

**Implementation detail (signIn function):**
```javascript
// In auth.controller.js signIn:
let user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] })
  .select("+hashedPassword +failedLoginAttempts +lockoutUntil");
let isAdmin = false;

if (!user) {
  // Try Admin model (uses bcryptjs, not bcrypt)
  const admin = await Admin.findOne({ $or: [{ email: identifier }, { username: identifier }] })
    .select("+password +failedLoginAttempts +lockoutUntil");
  if (admin) {
    user = admin;
    isAdmin = true;
  }
}

// For Admin: use admin.matchPassword(password) — uses bcryptjs internally
// For User: use user.comparePassword(password) — uses bcrypt internally
const passwordCorrect = isAdmin
  ? await user.matchPassword(password)
  : await user.comparePassword(password);
```

**Files to modify:**
- `backend/src/controllers/auth.controller.js` → `signIn` function
- `frontend/src/stores/useAuthStore.ts` → handle admin role in auth state
- `frontend/src/components/client/routes/ProtectedRoute.tsx` → handle admin role access

---

## 2. UI Modifications

### 2.1 Price Filter Redesign

**Remove old ranges:**
- 50k - 100k
- 100k - 300k
- 300k - 500k

**New price ranges (user-specified):**
```typescript
const priceRanges = [
  { value: "all", label: "Tất cả" },
  { value: "0-50000", label: "Dưới 50.000đ" },
  { value: "50000-100000", label: "50.000đ - 100.000đ" },
  { value: "100000-200000", label: "100.000đ - 200.000đ" },
  { value: "200000-500000", label: "200.000đ - 500.000đ" },
  { value: "500000-1000000", label: "500.000đ - 1.000.000đ" },
  { value: "1000000-999999999", label: "Trên 1.000.000đ" },
];
```

**Design Requirements:**
- Modern, clean filter UI
- Consider using chip/tag style or dropdown with icons
- Add visual indicators for active filter state
- Smooth animations when selecting/deselecting

**File to modify:**
- `frontend/src/pages/ShopPage.tsx` → `priceRanges` array and filter UI

---

### 2.2 Login Form Improvements

**Change login info section color to be more prominent:**
- Current: Blue gradient background with white text
- New: More vibrant, eye-catching color scheme
- Consider: Brighter gradients, animated elements, or contrasting colors

**Remove password validation message:**
- Remove: "Mật khẩu hiện tại phải từ 8 ký tự trở lên"
- **Located in:** `frontend/src/pages/UserProfilePage.tsx` or a password change dialog component — search for this exact string and remove it
- The actual minimum password length is 6 characters (already enforced in `auth.controller.js` → `changePassword`), so this 8-character message is incorrect

**Files to investigate:**
- `frontend/src/pages/UserProfilePage.tsx` → search for "8 ký tự"
- `frontend/src/components/client/` → any password change dialog/form

---

### 2.3 Dynamic Shop Name

**Requirement:**
- Remove all hardcoded "ShopSam" references
- Create admin panel to manage shop name
- All website sections auto-update when admin changes name

**Current hardcoded locations:**
- `frontend/src/components/client/layout/Header.tsx` → Logo text "ShopSam"
- `frontend/src/components/client/login-form.tsx` → "ShopSam" in decorative section
- `frontend/src/components/client/sections/ScrollingMarquee.tsx` → "ShopSam" in right side
- `frontend/src/pages/HomePage.tsx` → Banner fallback "SHOPT1.COM"

**Solution:**
1. Create API endpoint: `GET /api/ui/shop-name` (public)
2. Create admin endpoint: `POST /api/admin/config/shop-name`
3. Store in `SiteConfig` collection in MongoDB
4. Frontend: Create custom hook `useShopName()` or add to existing `useThemeStore()`
5. Replace all hardcoded instances with dynamic data
6. Admin page: Add shop name field to General Settings or create new "Branding" section

**Backend Model (SiteConfig):**
```javascript
const siteConfigSchema = new mongoose.Schema({
  shopName: { type: String, default: "ShopSam" },
  // ... other config fields
}, { timestamps: true });
```

---

### 2.4 Dynamic Contact Information

**Requirement:**
- Admin can manage: Phone, Email, Address, Facebook, Zalo, Telegram, Messenger, Discord
- Display prominently on website
- No code changes needed when updating

**Admin Panel Fields:**
```typescript
interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  facebook: string;
  zalo: string;
  telegram: string;
  messenger: string;
  discord: string;
}
```

**API Endpoints:**
- `GET /api/ui/contact-info` (public)
- `POST /api/admin/config/contact-info` (admin only)

**Phone Number Prominence:**
- Display phone number prominently in: Header (top bar or next to logo), Footer (large text), Floating Chat Box
- Consider: Sticky top bar with hotline number, pulsing phone icon, or dedicated "Gọi ngay" CTA button
- On mobile: show phone as tappable `tel:` link

**Frontend Display Locations:**
- **Header**: Top announcement bar or next to logo with phone icon
- **Footer**: Large, prominent phone number with call icon
- **Floating Chat Box**: Phone number as primary contact method
- **Homepage**: Dedicated contact section with phone/email/address

**Files to create/modify:**
- `backend/src/models/admin/SiteConfig.model.js`
- `backend/src/controllers/admin/config.controller.js`
- `backend/src/routes/admin/config.route.js`
- `frontend/src/components/client/layout/Footer.tsx`
- `frontend/src/services/client/uiService.ts`

---

## 3. Floating Chat Box

### 3.1 Unified Chat Widget

**Requirement:**
- Single floating chat button (bottom-right corner)
- Always visible, floating with scroll
- Opens popup/drawer with all contact channels
- Clean, modern UI

**Contact Channels (from admin config):**
- Messenger
- Zalo
- Telegram
- Discord (if configured)

**UI Design:**
```
┌─────────────────────────────┐
│  💬 Chat với chúng tôi      │
│  ─────────────────────────  │
│  [ Facebook Messenger icon] │
│  [ Zalo icon ]              │
│  [ Telegram icon ]          │
│  [ Discord icon ]           │
│  ─────────────────────────  │
│  📞 Hotline: 0123.456.789   │
│  📧 support@shopsam.com     │
└─────────────────────────────┘
```

**Implementation:**
1. Create `FloatingChatBox` component
2. Fetch contact links from `/api/ui/contact-info`
3. Show/hide toggle with smooth animation
4. Position: fixed bottom-right, z-index above other elements
5. Mobile: full-width bottom sheet

**Files to create:**
- `frontend/src/components/client/FloatingChatBox.tsx`

**Files to modify:**
- `frontend/src/pages/HomePage.tsx` → Replace existing floating button
- `frontend/src/components/client/layout/AppLayout.tsx` → Add FloatingChatBox globally

**Admin Controls:**
- Toggle: Enable/Disable chat box
- Individual channel toggles (Messenger, Zalo, Telegram, Discord)
- Store in SiteConfig model

**Mobile Behavior:**
- Full-width bottom sheet instead of popup
- Swipe-down to dismiss
- Larger touch targets for channel buttons

---

## 4. Realtime Marquee Notifications

### 4.1 Realtime Scrolling Notifications

**Requirement:**
- Horizontal scrolling marquee showing realtime events
- Display: Recent deposits, account purchases, random account spins
- Do NOT display: Carrying service purchases (cày thuê)

**Events to Show:**
```typescript
type MarqueeEvent = {
  type: "deposit" | "purchase" | "random_spin";
  displayName: string;      // Masked for privacy: "Nguyễn V.***"
  amount?: number;          // For deposits
  accountTitle?: string;    // For purchases/spins
  timestamp: Date;
};
```

**Realtime Method:** Use existing SSE (Server-Sent Events)

**Backend Implementation:**
1. Create SSE endpoint: `GET /api/sse/marquee` (public, read-only)
2. When deposit completes → push event to marquee stream
3. When order completes → push event to marquee stream
4. When random spin completes → push event to marquee stream
5. Filter out "cày thuê" service purchases

**Frontend Implementation:**
1. Modify `frontend/src/components/client/sections/ScrollingMarquee.tsx`
2. Use `EventSource` or existing `useDepositSSE` hook pattern
3. Store recent events in state (keep last 20 events)
4. Rotate through events with smooth animation
5. Add icons per event type (💰 deposit, 🛒 purchase, 🎰 spin)

**Privacy:**
- Mask display names: "Nguyễn V.***" format
- Show amounts but not full account details
- Consider: Only show events from last 10-15 minutes

**Manual Announcements (Admin):**
- Admin can add custom marquee text that appears alongside realtime events
- Manual announcements persist until admin removes them
- Priority: Manual announcements appear first, then realtime events

**MarqueeAnnouncement Model:**
```javascript
// backend/src/models/admin/MarqueeAnnouncement.model.js
const announcementSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },  // Higher = appears first
  expiresAt: { type: Date },               // Optional: auto-remove after date
}, { timestamps: true });
```

**API Endpoints:**
- `GET /api/ui/marquee/announcements` (public) — Get active manual announcements
- `GET /api/admin/marquee/announcements` (admin) — List all
- `POST /api/admin/marquee/announcements` (admin) — Create
- `DELETE /api/admin/marquee/announcements/:id` (admin) — Delete

**Admin Controls (in SiteConfig support section):**
- Toggle: Enable/Disable marquee
- Speed control: Slow / Normal / Fast

**Files to modify/create:**
- `backend/src/models/admin/MarqueeAnnouncement.model.js` (NEW)
- `backend/src/controllers/admin/marquee.controller.js` (NEW)
- `backend/src/routes/admin/marquee.route.js` (NEW)
- `backend/src/controllers/sse.controller.js` (or create new)
- `backend/src/routes/sse.route.js`
- `frontend/src/components/client/sections/ScrollingMarquee.tsx`
- `frontend/src/hooks/useDepositSSE.ts` (reference pattern)

---

## 5. Product Grid Layout

### 5.1 Responsive Grid Design

**Requirement:**
- First row always shows full products (no orphan items)
- Consistent grid across all rows
- Responsive per screen size
- **Key rule:** `limit` in API call should be a multiple of column count to avoid orphan rows

**Grid Breakpoints (Tailwind classes):**
```css
/* Mobile: 2 columns */
@media (max-width: 640px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Tablet: 3 columns */
@media (min-width: 641px) and (max-width: 1024px) {
  grid-template-columns: repeat(3, 1fr);
}

/* Desktop: 4 columns */
@media (min-width: 1025px) {
  grid-template-columns: repeat(4, 1fr);
}
```

**Products Per Page:**
- Mobile: 12 products (6 rows × 2)
- Tablet: 12 products (4 rows × 3)
- Desktop: 12 products (3 rows × 4)

**File to modify:**
- `frontend/src/pages/ShopPage.tsx` → Grid CSS classes

---

## 6. Deposit System Improvements

### 6.1 Authentication Check

**Requirement:**
- When user clicks "Nạp Tiền" (Deposit):
  - If NOT logged in → Redirect to `/signin`
  - If logged in → Show deposit dialog

**Implementation:**
1. Check `isAuthenticated` from `useAuthStore` before opening deposit dialog
2. If not authenticated:
   ```typescript
   navigate("/signin", { state: { from: location.pathname } });
   toast.error("Vui lòng đăng nhập để nạp tiền");
   ```
3. If authenticated: Show `<DepositDialog />`

**Current State:**
- `DepositDialog` component exists in `frontend/src/components/client/DepositDialog.tsx`
- Header already has deposit button with dialog trigger

**Files to modify:**
- `frontend/src/components/client/DepositDialog.tsx` → Add auth check
- `frontend/src/components/client/layout/Header.tsx` → Update deposit button onClick

### 6.2 Admin Bank Account Management

**Requirement:**
- Admin can manage: Bank name, Account number, Account holder, Transfer content template, QR Code
- No code changes needed

**Current State:**
- Bank accounts page already exists: `frontend/src/pages/admin/config/BankAccountsPage.tsx`
- API: `backend/src/routes/admin/bankAccount.route.js`

**Verify/Enhance:**
- Ensure all fields are editable: bank name, account number, holder name, transfer content template, QR upload
- Frontend deposit form reads from admin config via `GET /api/admin/banks`
- Frontend should refetch bank info on each deposit dialog open (not cached long-term)
- Ensure QR code upload works with Cloudinary
- **Migration note:** Existing bank account data should be preserved; this section only enhances the UI/UX

---

## 7. First Deposit Promotion

### 7.1 Promotion System Design

**Requirement:**
- Reward users on their first deposit
- Condition: Deposit >= 100,000 VNĐ
- Reward type: Admin-configurable per promotion

**First Deposit Detection:**
- Before awarding promotion, check if user has ANY completed deposit (BankDeposit with status "PAID" OR CardDeposit with status "SUCCESS")
- If no prior deposits exist, this is the user's first deposit
- Query: `BankDeposit.countDocuments({ user: userId, status: "PAID" }) + CardDeposit.countDocuments({ user: userId, status: "SUCCESS" })`
- If total == 0 before this deposit → eligible for first-deposit promotion

**Reward Types:**
```typescript
type RewardType = "balance_bonus" | "random_spin";

interface Promotion {
  id: string;
  name: string;
  isActive: boolean;
  minDepositAmount: number;    // Default: 100000
  rewardType: RewardType;
  rewardAmount?: number;       // For balance_bonus: 20000
  rewardSpins?: number;        // For random_spin: 1
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}
```

**Backend Model:**
```javascript
// backend/src/models/admin/Promotion.model.js
const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  minDepositAmount: { type: Number, default: 100000 },
  rewardType: { type: String, enum: ["balance_bonus", "random_spin"], required: true },
  rewardAmount: { type: Number },           // For balance_bonus
  rewardSpins: { type: Number },            // For random_spin
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  // Track who claimed
}, { timestamps: true });
```

**API Endpoints:**
- `GET /api/ui/promotions/active` (public) — Get active promotions
- `GET /api/admin/promotions` (admin) — List all promotions
- `POST /api/admin/promotions` (admin) — Create promotion
- `PUT /api/admin/promotions/:id` (admin) — Update promotion
- `DELETE /api/admin/promotions/:id` (admin) — Delete promotion

**Frontend Admin Page:**
- Create `frontend/src/pages/admin/Promotions.tsx`
- Table: Name, Status, Min Amount, Reward Type, Start/End Date, Actions
- Create/Edit dialog with all fields
- Toggle isActive switch

**Frontend Client Integration:**
- Show promotion banner on deposit page
- After successful deposit, check eligibility and apply reward
- Show toast: "🎉 Bạn nhận được 20,000đ bonus!" or "🎰 Bạn nhận được 1 lượt quay random!"

**Files to create:**
- `backend/src/models/admin/Promotion.model.js`
- `backend/src/controllers/admin/promotion.controller.js`
- `backend/src/routes/admin/promotion.route.js`
- `frontend/src/pages/admin/Promotions.tsx`
- `frontend/src/services/admin/promotion.service.ts`

---

## 8. Dynamic Admin Configuration System

### 8.1 Site Configuration Model

**Requirement:**
- Single MongoDB collection for all site config
- Admin can edit via visual UI
- All changes apply immediately
- Config history/audit trail

**Concurrency Strategy:**
- Use field-level `$set` updates instead of full-document replace
- Each admin save only updates the fields they changed
- Prevents one admin from overwriting another admin's changes
- Example: `SiteConfig.updateOne({}, { $set: { "contact.phone": "0123456789" } })`

**Banner System Note:**
- The existing `Banner.model.js` and banner carousel system remain separate from SiteConfig
- SiteConfig stores `mainBanner` and `secondaryBanner` as fallback/override URLs
- The existing `Banner` collection handles the full carousel with multiple slides
- Do NOT migrate existing banner data — keep both systems, SiteConfig as supplementary

**SiteConfig Schema:**
```javascript
// backend/src/models/admin/SiteConfig.model.js
const siteConfigSchema = new mongoose.Schema({
  // ── Website Info ──
  shopName: { type: String, default: "ShopSam" },
  logo: { type: String },              // Cloudinary URL
  favicon: { type: String },           // Cloudinary URL
  description: { type: String },
  seoKeywords: { type: String },

  // ── Contact Info ──
  contact: {
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    facebook: { type: String },
    zalo: { type: String },
    telegram: { type: String },
    messenger: { type: String },
    discord: { type: String },
  },

  // ── Content ──
  topNotification: { type: String },   // Announcement bar text
  footerContent: { type: String },     // Rich text (Tiptap JSON)
  privacyPolicy: { type: String },
  termsOfService: { type: String },
  depositGuide: { type: String },
  purchaseGuide: { type: String },

  // ── Homepage ──
  mainBanner: { type: String },        // Cloudinary URL
  secondaryBanner: { type: String },
  featuredCategories: [{ type: String }],
  introContent: { type: String },
  introVideo: { type: String },        // YouTube/Vimeo URL

  // ── Support Channels ──
  support: {
    chatEnabled: { type: Boolean, default: true },
    messengerEnabled: { type: Boolean, default: true },
    zaloEnabled: { type: Boolean, default: true },
    telegramEnabled: { type: Boolean, default: true },
    marqueeEnabled: { type: Boolean, default: true },
    marqueeSpeed: { type: String, enum: ["slow", "normal", "fast"], default: "normal" },
  },

  // ── SEO ──
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: { type: String },
    ogImage: { type: String },
    googleAnalyticsId: { type: String },
    facebookPixelId: { type: String },
  },

  // ── Theme Colors ──
  theme: {
    primary: { type: String, default: "#3b82f6" },
    button: { type: String, default: "#2563eb" },
    heading: { type: String, default: "#111827" },
    background: { type: String, default: "#ffffff" },
    footer: { type: String, default: "#1f2937" },
    footerText: { type: String, default: "#ffffff" },
  },

  // ── Metadata ──
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, {
  timestamps: true,
});
```

### 8.2 Config History/Audit

**Requirement:**
- Track all config changes
- Show who changed what and when
- Ability to view/restore previous versions

**Implementation:**
1. Use existing `AuditLog` model (already exists in codebase)
2. Before each config update, save snapshot to history
3. Store in `ConfigHistory` subcollection or separate collection

```javascript
const configHistorySchema = new mongoose.Schema({
  configId: { type: mongoose.Schema.Types.ObjectId, ref: "SiteConfig" },
  snapshot: { type: mongoose.Schema.Types.Mixed },  // Full config at that point
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  changedFields: [{ type: String }],  // Which fields changed
}, { timestamps: true });
```

### 8.3 API Endpoints

**Public Endpoints (no auth):**
- `GET /api/ui/site-config` — Get public config (shop name, contact, theme, etc.)
- `GET /api/ui/contact-info` — Get contact info only
- `GET /api/ui/theme` — Get theme colors only
- `GET /api/ui/seo` — Get SEO metadata

**Admin Endpoints (admin auth required):**
- `GET /api/admin/config` — Get full config
- `PUT /api/admin/config` — Update config (with history tracking)
- `GET /api/admin/config/history` — Get config change history
- `POST /api/admin/config/restore/:historyId` — Restore previous config

### 8.4 Frontend Admin Pages

**Existing Config Pages (keep + expand, NOT replace):**
- `GeneralSettingsPage.tsx` → **Add** shop name, logo, favicon, description fields (do NOT remove existing fields)
- `BankAccountsPage.tsx` → Keep as-is
- `CardProvidersPage.tsx` → Keep as-is
- `UiManagementPage.tsx` → **Add** theme colors section; keep existing banner/popup management

**New Config Pages (add alongside existing):**
1. **ContactPage.tsx** — Phone, email, address, social links
2. **ContentPage.tsx** — Footer, policies, guides (use Tiptap editor)
3. **HomepageSettingsPage.tsx** — Featured categories, intro content, video
4. **SupportChannelsPage.tsx** — Toggle chat, messenger, zalo, telegram, marquee + speed
5. **SeoPage.tsx** — Meta tags, GA, Facebook Pixel
6. **ConfigHistoryPage.tsx** — Table of all config changes with restore option

**ConfigLayout.tsx nav items to add:**
```
Contact Info  → /admin/config/contact
Content       → /admin/config/content
Homepage      → /admin/config/homepage
Support       → /admin/config/support
SEO           → /admin/config/seo
History       → /admin/config/history
```

**Files to create/modify:**
- `backend/src/models/admin/SiteConfig.model.js`
- `backend/src/models/admin/ConfigHistory.model.js`
- `backend/src/controllers/admin/siteConfig.controller.js`
- `backend/src/routes/admin/siteConfig.route.js`
- `frontend/src/pages/admin/config/ContactPage.tsx`
- `frontend/src/pages/admin/config/ContentPage.tsx`
- `frontend/src/pages/admin/config/HomepageSettingsPage.tsx`
- `frontend/src/pages/admin/config/SupportChannelsPage.tsx`
- `frontend/src/pages/admin/config/SeoPage.tsx`
- `frontend/src/pages/admin/config/ThemeColorsPage.tsx`
- `frontend/src/pages/admin/config/ConfigHistoryPage.tsx`

### 8.5 Frontend Dynamic Theme Application

**Implementation:**
1. Fetch theme from `/api/ui/theme` on app load
2. Apply CSS variables dynamically:
   ```typescript
   document.documentElement.style.setProperty("--color-primary", theme.primary);
   document.documentElement.style.setProperty("--color-button", theme.button);
   // etc.
   ```
3. Store in `useThemeStore` for immediate access
4. Refetch when config changes (or use SSE for realtime updates)

**Files to modify:**
- `frontend/src/stores/useThemeStore.ts`
- `frontend/src/App.tsx` — Initialize theme on load
- `frontend/src/index.css` — Add CSS variable definitions

---

## 9. General Requirements

### 9.1 Responsive Design
- Mobile (320px - 640px): Full width, single column layouts, bottom navigation
- Tablet (641px - 1024px): 2-3 column grids, side navigation
- Desktop (1025px+): 4 column grids, full navigation

### 9.2 Performance
- Lazy load images with `loading="lazy"`
- Use React Query caching (already implemented)
- Optimize bundle size with code splitting (already using lazy routes)
- Minimize API calls with proper staleTime/gcTime

### 9.3 Error Handling
- All API errors show user-friendly Vietnamese messages
- Toast notifications for success/error feedback
- Error boundaries for route-level isolation (already implemented)

### 9.4 Accessibility
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast ratios (WCAG AA)

### 9.5 Testing Checklist
After implementation, verify:
- [ ] User can register successfully (no 500 error)
- [ ] Admin can login via client `/signin` page
- [ ] Shop name updates dynamically from admin
- [ ] Contact info updates dynamically from admin
- [ ] Price filter shows new ranges
- [ ] Grid layout is responsive (2/3/4 columns)
- [ ] Deposit requires login (redirects if not)
- [ ] First deposit promotion applies correctly
- [ ] Marquee shows realtime events via SSE
- [ ] Chat box shows all contact channels
- [ ] Theme colors apply dynamically
- [ ] All config pages save to database
- [ ] Config history tracks changes
- [ ] Mobile responsive on all pages
- [ ] No console errors

---

## Appendix A: File Structure Summary

### New Backend Files
```
backend/src/
├── models/
│   ├── admin/
│   │   ├── SiteConfig.model.js      (NEW)
│   │   ├── ConfigHistory.model.js   (NEW)
│   │   └── Promotion.model.js       (NEW)
├── controllers/
│   ├── admin/
│   │   ├── siteConfig.controller.js (NEW)
│   │   └── promotion.controller.js  (NEW)
├── routes/
│   ├── admin/
│   │   ├── siteConfig.route.js      (NEW)
│   │   └── promotion.route.js       (NEW)
```

### New Frontend Files
```
frontend/src/
├── components/
│   └── client/
│       └── FloatingChatBox.tsx      (NEW)
├── pages/
│   └── admin/
│       ├── Promotions.tsx           (NEW)
│       └── config/
│           ├── ContactPage.tsx      (NEW)
│           ├── ContentPage.tsx      (NEW)
│           ├── HomepageSettingsPage.tsx (NEW)
│           ├── SupportChannelsPage.tsx  (NEW)
│           ├── SeoPage.tsx          (NEW)
│           ├── ThemeColorsPage.tsx   (NEW)
│           └── ConfigHistoryPage.tsx (NEW)
├── services/
│   └── admin/
│       └── promotion.service.ts     (NEW)
```

### Modified Files
```
backend/src/
├── controllers/auth.controller.js   (MODIFY - admin login support)
├── routes/sse.route.js              (MODIFY - add marquee endpoint)
├── server.js                        (MODIFY - add new routes)

frontend/src/
├── components/client/
│   ├── layout/Header.tsx            (MODIFY - dynamic shop name)
│   ├── login-form.tsx               (MODIFY - dynamic shop name)
│   ├── DepositDialog.tsx            (MODIFY - auth check)
│   ├── sections/ScrollingMarquee.tsx (MODIFY - realtime events)
│   └── layout/Footer.tsx            (MODIFY - dynamic contact info)
├── pages/
│   ├── ShopPage.tsx                 (MODIFY - new price ranges, grid)
│   ├── HomePage.tsx                 (MODIFY - replace floating button)
│   └── admin/config/
│       ├── ConfigLayout.tsx         (MODIFY - add new nav items)
│       ├── GeneralSettingsPage.tsx  (MODIFY - add shop name fields)
│       └── UiManagementPage.tsx     (MODIFY - add theme colors)
├── stores/
│   └── useThemeStore.ts             (MODIFY - add dynamic theme)
├── services/client/uiService.ts     (MODIFY - add config endpoints)
└── routes/adminRoute.tsx            (MODIFY - add new routes)
```

---

## Appendix B: Database Collections Summary

| Collection | Purpose | Auth Required |
|------------|---------|---------------|
| `siteconfigs` | Single document with all site settings | Read: Public, Write: Admin |
| `confighistories` | Audit trail of config changes | Admin only |
| `promotions` | First deposit promotion rules | Read: Public, Write: Admin |
| `admins` | Admin accounts (existing) | Admin only |
| `users` | User accounts (existing) | User/Admin |
| `accounts` | Game accounts for sale (existing) | Read: Public, Write: Admin |
| `orders` | Purchase orders (existing) | User/Admin |
| `bankdeposits` | Bank deposit records (existing) | User/Admin |
| `carddeposits` | Card deposit records (existing) | User/Admin |

---

**Document Version:** 1.0
**Last Updated:** 2026-06-10
**Author:** Buffy (AI Assistant)
