# Client UI Redesign Specification

## Overview

Redesign the entire client-facing UI to be modern, beautiful, and glassmorphism/gradient-rich. Focus on UI/UX quality, frontend-backend sync, and full responsive support across all devices.

---

## 1. Design System

### 1.1 Visual Style
- **Primary**: Glassmorphism + Gradient-rich
- **Color Scheme**: Blue gradient (Blue #2563EB → Cyan #06B6D4)
- **Font**: Inter (already configured via `@fontsource-variable/inter`)
- **Dark Mode**: Auto-detect via `prefers-color-scheme` + manual toggle saved to localStorage
- **No particles/VFX**: Keep clean — only hover effects, transitions, loading states
- **Layout**: Full-width, max-width container for content

### 1.2 Responsive Breakpoints
| Breakpoint | Range | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, hamburger menu, stacked sections |
| Tablet | 640px – 1024px | 2-column grids, compact nav |
| Desktop | > 1024px | Full layout, side-by-side elements |

### 1.3 CSS Variables / Theme
- Update `index.css` to add blue gradient primary colors for both light and dark modes
- Add glassmorphism utility classes (backdrop-blur, semi-transparent backgrounds)
- Add gradient utility classes for buttons, cards, and accent elements

---

## 2. Header (Redesign)

### 2.1 Desktop Layout
```
[Logo] [Nav: Trang chủ | Nạp tiền | Lịch sử mua | Lịch sử nạp tiền] [Search] [Balance Badge] [Avatar Dropdown]
```

- **Logo**: Left-aligned, "ShopSamcc" with blue gradient text
- **Nav Items**: Horizontal links, active state with underline/glow effect
- **Search Bar**: Centered, expandable on focus with glassmorphism background
- **Balance Badge**: Show user balance when logged in (blue pill badge)
- **Avatar Dropdown**: Triggers on click, shows user info

### 2.2 Mobile Layout
```
[Hamburger] [Logo] [Balance + Avatar]
```

- **Hamburger → Drawer**: Slide-in from left with nav items + user info
- **Logo**: Centered or left
- **Balance + Avatar**: Compact display on right

### 2.3 User Dropdown Menu
When clicking avatar icon:
1. **Header section**: Avatar + Name + Email + Balance badge
2. **Menu items**:
   - 👤 Thông tin cá nhân → `/me`
   - 📋 Lịch sử giao dịch → `/me/orders`
   - 💳 Nạp tiền → Opens deposit modal
   - 🔒 Cài đặt bảo mật → `/me/settings` (new route)
   - ➡️ Đăng xuất
3. **Style**: Glassmorphism dropdown with backdrop-blur, animated entry

### 2.4 Navigation Behavior
- Sticky header with backdrop-blur (glassmorphism)
- Active nav item: Blue underline + slight glow
- Hover: Smooth color transition + slight scale
- Mobile drawer: Full-height with user info at top

---

## 3. Homepage Content

### 3.1 Layout Structure (Top to Bottom)
```
┌──────────────────────────────────────────────┐
│  [Carousel Banner]  │  [Top Nạp Thẻ Podium]  │  ← Side by side
├──────────────────────────────────────────────┤
│  🔥 Marquee / Scrolling Text (Admin Config)  │
├──────────────────────────────────────────────┤
│  [Game Sections - Danh Mục Tài Khoản Game]   │
└──────────────────────────────────────────────┘
```

### 3.2 Carousel + Top Nạp (Side by Side)
**Desktop layout**: 60% Carousel | 40% Top Nạp Podium
**Mobile layout**: Carousel full width → Top Nạp below

#### Carousel
- **Source**: Backend API (admin-configured banners)
- **Controls**: Full controls (auto-slide every 4s + dots + arrows + swipe on mobile)
- **Style**: Rounded corners, subtle shadow, smooth transitions
- **Auto-slide**: Pause on hover, resume on leave
- **Swipe**: Support touch swipe on mobile

#### Top Nạp Thẻ Podium (Top 3)
- **Style**: Podium-style with 3 cards side by side
- **Card 1 (Rank 1)**: Largest card, gold accent, crown/medal icon
- **Card 2 (Rank 2)**: Medium card, silver accent
- **Card 3 (Rank 3)**: Smallest card, bronze accent
- **Each card shows**: Avatar, display name, total deposit amount (formatted), rank badge
- **Data source**: Backend API (existing top depositors endpoint)
- **Animation**: Staggered fade-in on load

### 3.3 Scrolling Text / Marquee
- **Content**: Admin-configurable text from backend
- **Behavior**: Continuous scroll from right to left, infinite loop
- **Style**: Subtle gradient fade on edges, blue accent text
- **Position**: Below carousel + podium, above game sections
- **Responsive**: Full width on all devices

### 3.4 Game Sections (Existing - Enhanced)
Keep existing `GameProductSections.tsx` structure with improvements:
- Glassmorphism card styling
- Better hover effects (scale + glow)
- Improved skeleton loading with shimmer animation
- Category cards: gradient overlay on hover, smooth transitions

---

## 4. Deposit Flow (Multi-Step Modal)

### 4.1 Trigger
- Button in header: "Nạp tiền" (visible when logged in)
- Also accessible from user dropdown menu

### 4.2 Multi-Step Modal Flow
```
Step 1: Chọn mệnh giá → Step 2: Phương thức thanh toán → Step 3: QR Code / Instructions → Step 4: Xác nhận
```

#### Step 1: Chọn mệnh giá
- Quick-select buttons: 10K, 20K, 50K, 100K, 200K, 500K
- Custom amount input
- Glassmorphism card style
- Visual: Each amount in a gradient pill button

#### Step 2: Phương thức thanh toán
- Payment method cards (PayOS, Bank Transfer, etc.)
- Each card shows: icon, name, processing time
- Selected state with blue glow border

#### Step 3: QR Code / Payment Instructions
- QR code display (existing `qrcode.react` dependency)
- Copy payment info button
- Countdown timer for payment expiry
- Auto-check payment status via polling/SSE

#### Step 4: Xác nhận
- Success animation (checkmark)
- Updated balance display
- Close button

### 4.3 Modal Style
- Glassmorphism background (backdrop-blur + semi-transparent)
- Step indicator at top (1/2/3/4 dots or progress bar)
- Smooth slide transitions between steps
- Close button (X) in top-right corner
- Mobile: Full-screen modal on small devices

---

## 5. Footer (Redesign)

### 5.1 Style
- **Background**: Dark gradient (dark blue → dark gray)
- **Text**: Light/white text on dark background
- **Links**: Hover with blue accent glow

### 5.2 Layout (5-6 Sections)
```
┌──────────────────────────────────────────────────────┐
│ [Logo + Description] [Hỗ trợ] [Về chúng tôi] [Game] [Newsletter] │
├──────────────────────────────────────────────────────┤
│ [Contact: Phone | Address | Support 24/7]            │
├──────────────────────────────────────────────────────┤
│ [© 2024 ShopSam. All rights reserved.]              │
└──────────────────────────────────────────────────────┘
```

### 5.3 Sections
1. **Brand Column** (2 cols width): Logo, description, trust badges
2. **Hỗ trợ**: Hướng dẫn mua hàng, Chính sách đổi trả, FAQ, Phương thức nạp tiền
3. **Về chúng tôi**: Giới thiệu, Điều khoản, Chính sách bảo mật
4. **Game nổi bật**: Dynamic from API (top 4 games)
5. **Newsletter**: Email signup input + subscribe button
6. **Bottom Bar**: Copyright, phone, address, support badge

### 5.4 Responsive
- Desktop: 5 columns
- Tablet: 3 columns (stack some sections)
- Mobile: Single column, stacked sections

---

## 6. Other Client Pages (Redesign Style)

### 6.1 ShopPage (`/tai-khoan`)
- Modern card grid with glassmorphism cards
- Improved filters sidebar (collapsible on mobile)
- Better pagination with smooth transitions
- Account cards: gradient hover effect, smooth price display

### 6.2 AccountDetailPage (`/tai-khoan/:category/:id`)
- Larger product images with gallery
- Sticky purchase sidebar on desktop
- Better info sections with glassmorphism cards
- Improved mobile layout (stacked)

### 6.3 UserProfilePage (`/me`)
- Card-based sections (info, settings, etc.)
- Glassmorphism styling
- Mobile-responsive layout

### 6.4 OrderHistoryPage (`/me/orders`)
- Modern table/card layout
- Status badges with color coding
- Filter by date/status

### 6.5 Auth Pages (SignIn, SignUp, ForgotPassword)
- Glassmorphism card centered on page
- Blue gradient background or subtle pattern
- Better form validation UX

---

## 7. Dark Mode Implementation

### 7.1 Strategy
- Auto-detect via `prefers-color-scheme` media query
- Manual toggle button (sun/moon icon) in header
- Save preference to `localStorage`
- Apply `.dark` class to `<html>` element

### 7.2 Theme Colors
Already defined in `index.css`:
- Light mode: White backgrounds, dark text
- Dark mode: Dark backgrounds (#1a1a2e), light text, blue accent

### 7.3 Glassmorphism in Dark Mode
- Semi-transparent dark backgrounds: `bg-black/30 backdrop-blur-xl`
- Borders: `border-white/10`
- Text: White/gray variants

---

## 8. API / Backend Changes Required

### 8.1 New/Modified Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ui/banner` | GET | Get carousel banners (already exists) |
| `/api/accounts/top-depositors` | GET | Get top 3 depositors for podium |
| `/api/ui/scrolling-text` | GET | Get scrolling text content (new) |
| `/api/ui/deposit-presets` | GET | Get quick-select deposit amounts (new) |
| `/api/accounts/by-game` | GET | Game sections data (already exists) |
| `/api/ui/categories` | GET | Game categories (already exists) |

### 8.2 Data Models
```typescript
// Top Depositor
interface TopDepositor {
  id: string;
  displayName: string;
  avatarUrl?: string;
  totalDeposited: number;
  rank: 1 | 2 | 3;
}

// Scrolling Text
interface ScrollingText {
  content: string;
  isActive: boolean;
}

// Deposit Preset
interface DepositPreset {
  amount: number;
  label: string;
  isPopular?: boolean;
}
```

---

## 9. File Changes Plan

### 9.1 New Files
| File | Description |
|------|-------------|
| `frontend/src/components/client/layout/Header.tsx` | **Rewrite** - New header with glassmorphism |
| `frontend/src/components/client/layout/Footer.tsx` | **Rewrite** - Dark gradient footer |
| `frontend/src/components/client/layout/AppLayout.tsx` | **Update** - New layout structure |
| `frontend/src/components/client/layout/MobileDrawer.tsx` | **New** - Mobile hamburger drawer |
| `frontend/src/components/client/layout/UserDropdown.tsx` | **New** - Avatar dropdown menu |
| `frontend/src/components/client/sections/TopDepositorsPodium.tsx` | **New** - Top 3 podium component |
| `frontend/src/components/client/sections/ScrollingMarquee.tsx` | **New** - Scrolling text component |
| `frontend/src/components/client/deposit/DepositModal.tsx` | **Rewrite** - Multi-step deposit modal |
| `frontend/src/components/client/deposit/StepAmount.tsx` | **New** - Amount selection step |
| `frontend/src/components/client/deposit/StepPayment.tsx` | **New** - Payment method step |
| `frontend/src/components/client/deposit/StepQR.tsx` | **New** - QR code step |
| `frontend/src/components/client/deposit/StepConfirm.tsx` | **New** - Confirmation step |
| `frontend/src/index.css` | **Update** - Add glassmorphism utilities, dark mode blue theme |

### 9.2 Modified Files
| File | Changes |
|------|---------|
| `frontend/src/pages/HomePage.tsx` | New layout: Carousel + Podium side-by-side, marquee below |
| `frontend/src/stores/useAuthStore.ts` | Add dark mode state management |
| `frontend/src/services/client/accountService.ts` | Add `getTopDepositors()` method |
| `frontend/src/types/client/services.ts` | Add new types |
| `frontend/src/pages/ShopPage.tsx` | Apply new design system |
| `frontend/src/pages/AccountDetailPage.tsx` | Apply new design system |
| `frontend/src/pages/UserProfilePage.tsx` | Apply new design system |
| `frontend/src/pages/OrderHistoryPage.tsx` | Apply new design system |
| `frontend/src/pages/SigninPage.tsx` | Apply new design system |
| `frontend/src/pages/SignUpPage.tsx` | Apply new design system |

### 9.3 Files to Delete
| File | Reason |
|------|--------|
| `frontend/src/components/client/layout/old/` | Replaced by new components |

---

## 10. Implementation Order

### Phase 1: Design System + Theme (Foundation)
1. Update `index.css` with glassmorphism utilities and blue gradient theme
2. Add dark mode support (toggle + localStorage + prefers-color-scheme)
3. Create reusable glassmorphism components (GlassCard, GradientButton, etc.)

### Phase 2: Header + Navigation
4. Rewrite Header with glassmorphism style
5. Create MobileDrawer component
6. Create UserDropdown component
7. Integrate balance badge and nav items

### Phase 3: Homepage Layout
8. Create TopDepositorsPodium component
9. Create ScrollingMarquee component
10. Update HomePage layout (Carousel + Podium side-by-side)
11. Enhance GameProductSections with new styling

### Phase 4: Deposit Modal
12. Create multi-step DepositModal
13. Implement StepAmount (amount selection)
14. Implement StepPayment (payment method)
15. Implement StepQR (QR code + instructions)
16. Implement StepConfirm (success state)

### Phase 5: Footer + Other Pages
17. Rewrite Footer with dark gradient
18. Apply new design to ShopPage
19. Apply new design to AccountDetailPage
20. Apply new design to UserProfilePage
21. Apply new design to OrderHistoryPage
22. Apply new design to Auth pages (SignIn, SignUp, ForgotPassword)

### Phase 6: Backend + Integration
23. Add new API endpoints (top-depositors, scrolling-text, deposit-presets)
24. Update frontend services to call new endpoints
25. Test full flow end-to-end

---

## 11. Success Criteria

- [ ] All client pages have consistent glassmorphism/gradient-rich design
- [ ] Dark mode works auto + manual toggle
- [ ] Header shows logo, nav items, search, balance, avatar dropdown
- [ ] Mobile has hamburger menu with drawer
- [ ] Homepage shows Carousel + Top 3 Podium side-by-side (desktop)
- [ ] Scrolling text marquee displays admin-configured content
- [ ] Deposit modal has multi-step flow with QR code
- [ ] All pages are fully responsive (mobile, tablet, desktop)
- [ ] No TypeScript errors
- [ ] Consistent with existing shadcn/ui + Tailwind patterns
- [ ] Backend API returns correct data for new components
