# Client UI Improvements — Spec

> **Date:** June 9, 2026  
> **Status:** Draft — awaiting implementation  
> **Scope:** Frontend only (React/TypeScript/Tailwind)

---

## 1. Overview

This spec covers 5 related UI improvements across the client-facing site and admin panel:

1. **Carousel size increase** — bigger banner on homepage
2. **Section spacing increase** — more vertical breathing room between homepage sections
3. **Admin Config page splitting** — each config section becomes a dedicated page with sidebar navigation
4. **Popup preview in admin** — preview popup before saving
5. **Smooth scroll** — between sections on client homepage and admin config
6. **Loading skeleton improvements** — shimmer animation + layout-matching shapes

---

## 2. Detailed Requirements

### 2.1 Carousel Size Increase

**Current state:**
- `MainBanner` component in `frontend/src/pages/HomePage.tsx`
- Heights: `h-[250px]` (mobile) / `h-[360px]` (desktop/md)
- Layout: 60/40 flex with `TopDepositorsPodium` (`lg:w-3/5` carousel, `lg:w-2/5` podium)
- Podium is a `GlassCard` with top 3 depositors, progress bars

**Target state:**
- Carousel height: `h-[375px]` (mobile) / `h-[540px]` (desktop/md) — 50% increase
- **Keep 60/40 layout** — podium also grows taller proportionally
- Podium internal spacing may need adjustment to fill the taller card

**Files to modify:**
- `frontend/src/pages/HomePage.tsx` — `MainBanner` skeleton, fallback, and main render heights
- `frontend/src/components/client/sections/TopDepositorsPodium.tsx` — adjust internal spacing if needed

**Edge cases:**
- Skeleton loading height must match new banner height
- Fallback banner (no data) must also use new height
- Podium with 0/1/2 depositors should still look balanced at taller height

---

### 2.2 Section Spacing Increase

**Current state:**
- `HomePage.tsx` root div: `className="py-4 space-y-4 sm:space-y-6"`
- `GameProductSections.tsx` uses `space-y-10`

**Target state:**
- Root div: `space-y-10 sm:space-y-14` (~40-56px between sections)
- Keep `py-4` for top padding
- `GameProductSections` already uses `space-y-10` — may increase to `space-y-12` for consistency

**Files to modify:**
- `frontend/src/pages/HomePage.tsx` — root div className
- `frontend/src/components/client/sections/GameProductSections.tsx` — internal spacing

**Edge cases:**
- Sections that are `null` (empty data) should not create extra spacing
- Mobile spacing should still be comfortable (not too tight, not too loose)

---

### 2.3 Admin Config Page Splitting

**Current state:**
- Single monolithic `Config.tsx` (~780 lines) with collapsible `Section` components
- 4 sections: General Settings, Bank Accounts, Card Providers, UI Management
- UI Management contains 4 lazy-loaded sub-components: GameCategoryManager, PopupManager, BannerManager, CmsPageManager
- Routes already exist in `adminRoute.tsx` but all render same `AdminConfig` component:
  - `config/general` → `AdminConfig`
  - `config/banks` → `AdminConfig`
  - `config/cards` → `AdminConfig`
  - `config/ui` → `AdminConfig`

**Target state:**
- **Sidebar navigation** within the Config page area
- Each section is a separate page component:
  - `/admin/config/general` → `GeneralSettingsPage`
  - `/admin/config/banks` → `BankAccountsPage`
  - `/admin/config/cards` → `CardProvidersPage`
  - `/admin/config/ui` → `UiManagementPage`
- Sidebar shows all 4 items with active state indicator
- Each page is a standalone component (extracted from Config.tsx)
- Lazy-loaded via React.lazy for code splitting

**Sidebar design:**
```
┌──────────┬────────────────────────────┐
│ Config   │                            │
│ ─────── │   [Page content here]       │
│ • General│                            │
│ • Ngân hàng                           │
│ • Thẻ cào│                            │
│ • Giao diện                           │
└──────────┴────────────────────────────┘
```

**Files to modify:**
- `frontend/src/pages/admin/Config.tsx` — refactor into layout + extracted page components
- `frontend/src/routes/adminRoute.tsx` — update routes to point to specific pages

**New files to create:**
- `frontend/src/pages/admin/config/GeneralSettingsPage.tsx`
- `frontend/src/pages/admin/config/BankAccountsPage.tsx`
- `frontend/src/pages/admin/config/CardProvidersPage.tsx`
- `frontend/src/pages/admin/config/UiManagementPage.tsx`
- `frontend/src/pages/admin/config/ConfigLayout.tsx` — sidebar + outlet layout

**Edge cases:**
- Super admin vs regular admin permissions (UI Management section is super_admin only)
- Sidebar should hide UI Management for non-super-admins
- Deep linking to specific config page should work
- Back navigation from config sub-page should return to config main

---

### 2.4 Popup Preview in Admin

**Current state:**
- `PopupManager.tsx` has create/edit dialog with title, content (CmsEditor rich text), trigger type, display pages
- No preview functionality — admin must save and check client manually

**Target state:**
- **Preview button** in the popup edit dialog
- Clicking "Xem trước" opens a **Preview Dialog** that renders the popup as it would appear on the client
- Preview shows:
  - Popup title
  - Rich text content rendered (not editor)
  - Trigger type badge
  - Display pages badges
  - Simulated overlay/dim background
- Preview is read-only, non-dismissible (just a visual check)
- Close button to return to edit

**Files to modify:**
- `frontend/src/components/admin/ui/PopupManager.tsx` — add preview button + preview dialog

**Edge cases:**
- Preview should work for both create (new popup) and edit (existing popup)
- Rich text content should render correctly in preview (headings, images, links, etc.)
- Preview should handle empty content gracefully

---

### 2.5 Smooth Scroll

**Current state:**
- No smooth scroll behavior on any page
- Header nav links use `navigate()` for client routes
- Admin config has no navigation between sections

**Target state:**

#### Client Homepage
- Header nav items that link to sections on the homepage should smooth-scroll to them
- When already on homepage, clicking a nav item scrolls to section
- When on another page, clicking nav navigates to homepage first, then scrolls

**Note:** Currently the Header nav items are route-based (Trang chủ, Nạp tiền, Lịch sử mua). This may require adding anchor links or section IDs to the homepage sections.

#### Admin Config
- Smooth scroll when navigating between config sections via sidebar
- Or simply route-based navigation (since each section is now a separate page)

**Files to modify:**
- `frontend/src/pages/HomePage.tsx` — add `id` attributes to sections
- `frontend/src/components/client/layout/Header.tsx` — update nav links to use anchor/hash navigation
- `frontend/src/components/client/layout/AppLayout.tsx` — handle hash-based scroll on route change

**Edge cases:**
- Smooth scroll should not conflict with `ScrollToTop` component
- Should respect `prefers-reduced-motion` for accessibility
- Hash should update in URL when scrolling to section

---

### 2.6 Loading Skeleton Improvements

**Current state:**
- Skeletons are simple rectangles (`<Skeleton className="h-36 w-full rounded-xl" />`)
- No shimmer animation on most skeletons (some have inline shimmer)
- Shimmer keyframe exists in `tailwind.config.ts` but not widely used

**Target state:**
- **Shimmer animation** on all skeleton elements (smooth gradient sweep)
- **Layout-matching shapes** — skeletons should approximate the actual content layout:
  - Card skeleton: image area + text lines + price badge area
  - Banner skeleton: gradient overlay + text lines + button
  - Table skeleton: rows with columns matching actual table
- Consistent skeleton component across all pages

**Files to modify:**
- `frontend/src/pages/HomePage.tsx` — improve MainBanner, GameCategories, PopularProducts skeletons
- `frontend/src/components/client/sections/GameProductSections.tsx` — improve AccountSkeleton
- `frontend/src/components/client/sections/TopDepositorsPodium.tsx` — already has decent skeleton
- `frontend/src/pages/ShopPage.tsx` — improve account card skeletons
- `frontend/src/index.css` — ensure shimmer animation is globally available

**Edge cases:**
- Skeletons should match the actual content height at each breakpoint
- Dark mode skeletons should look correct
- Skeletons should not cause layout shift when real content loads

---

## 3. Implementation Order

1. **Phase 1 — Quick wins (no routing changes)**
   - Carousel size increase (50% bigger)
   - Section spacing increase (space-y-10 sm:space-y-14)
   - Loading skeleton improvements

2. **Phase 2 — Admin Config split**
   - Create ConfigLayout with sidebar
   - Extract page components from Config.tsx
   - Update routes in adminRoute.tsx

3. **Phase 3 — Interactive features**
   - Popup preview in admin
   - Smooth scroll on client homepage

---

## 4. Files Summary

### Modified files:
- `frontend/src/pages/HomePage.tsx` — carousel height, section spacing, skeletons, section IDs
- `frontend/src/components/client/sections/TopDepositorsPodium.tsx` — adjust for taller carousel
- `frontend/src/components/client/sections/GameProductSections.tsx` — section spacing, skeletons
- `frontend/src/pages/ShopPage.tsx` — skeleton improvements
- `frontend/src/pages/admin/Config.tsx` — refactor into layout + extracted pages
- `frontend/src/routes/adminRoute.tsx` — update config routes
- `frontend/src/components/admin/ui/PopupManager.tsx` — add preview dialog
- `frontend/src/components/client/layout/Header.tsx` — smooth scroll nav links
- `frontend/src/components/client/layout/AppLayout.tsx` — handle hash scroll
- `frontend/src/index.css` — shimmer animation utilities

### New files:
- `frontend/src/pages/admin/config/ConfigLayout.tsx`
- `frontend/src/pages/admin/config/GeneralSettingsPage.tsx`
- `frontend/src/pages/admin/config/BankAccountsPage.tsx`
- `frontend/src/pages/admin/config/CardProvidersPage.tsx`
- `frontend/src/pages/admin/config/UiManagementPage.tsx`

---

## 5. Acceptance Criteria

- [ ] Carousel is 50% taller on all breakpoints
- [ ] Podium maintains proportional height alongside carousel
- [ ] Section spacing is ~40-56px between all homepage sections
- [ ] Admin Config has sidebar navigation with 4 items
- [ ] Each config section renders on its own route
- [ ] Sidebar respects super_admin permission for UI Management
- [ ] Popup edit dialog has working "Xem trước" button
- [ ] Preview dialog renders popup content correctly
- [ ] Smooth scroll works on homepage section navigation
- [ ] Skeletons have shimmer animation and match layout shapes
- [ ] All changes pass build (`vite build --mode production`)
- [ ] No visual regressions on mobile/tablet/desktop
