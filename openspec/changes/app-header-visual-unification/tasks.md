## 1. Shell and Global Header (Phase 1)

- [x] 1.1 Update `AppLayout.tsx`: always render `<header class="app-header">` with logo, app name, and add-activity button — remove the conditional back-button logic
- [x] 1.2 Add add-activity icon button (`IoAddOutline`) to the global header that navigates to `/activities/new`
- [x] 1.3 Update `layout.css` app-header styles: ensure the header renders correctly on both mobile and desktop layouts
- [x] 1.4 Verify map route — confirm `app-content--map` still fills remaining height correctly with the persistent header

## 2. PageHeader Component (Phase 1)

- [x] 2.1 Create `web/src/components/PageHeader.tsx` with props: `title`, `eyebrow?`, `subtitle?`, `onBack?`, `actions?`
- [x] 2.2 Add `PageHeader` CSS to `layout.css`: `.page-header`, `.page-header-row`, `.page-header-back`, `.page-header-body`, `.page-header-actions`

## 3. List Pages Migration (Phase 2)

- [x] 3.1 Update `ActivitiesListPanel.tsx`: replace the inline title/eyebrow block with `<PageHeader>`
- [x] 3.2 Verify Favorites page (`/favorites`) renders `PageHeader` via `ActivitiesListPanel`
- [x] 3.3 Verify Nearby page (`/nearby`) renders `PageHeader` via `ActivitiesListPanel`

## 4. Private Area Pages Migration (Phase 2)

- [x] 4.1 Update `ProfilePage.tsx`: replace local hero block with `<PageHeader title="Profilo">`
- [x] 4.2 Update `SecurityPage.tsx`: replace local heading with `<PageHeader title="Sicurezza" onBack={...}>`
- [x] 4.3 Update `TypesPage.tsx`: replace local heading with `<PageHeader title="Tipi" onBack={...}>`

## 5. Form and Review Pages Migration (Phase 3)

- [x] 5.1 Update `ActivityFormPage.tsx`: use `<PageHeader>` for title, move cancel/back into `onBack` prop
- [x] 5.2 Update `ActivityReviewPage.tsx`: use `<PageHeader>` for title with back navigation

## 6. Activity Detail Redesign (Phase 4)

- [x] 6.1 Update `ActivityDetailPage.tsx`: render `<PageHeader title={activity.name} onBack={...}>` at the top with quick-action buttons in `actions` slot
- [x] 6.2 Restructure the detail top section: title/meta row first, then bounded photo block below
- [x] 6.3 Update `features.css`: add `.detail-photo-block` styles for the contained image area
- [x] 6.4 Verify detail page layout at mobile and desktop widths

## 7. Visual Polish and CSS Tokens (Phase 5)

- [x] 7.1 Review and tighten heading scale tokens in `base.css`
- [x] 7.2 Verify consistent vertical rhythm at top of all migrated pages
- [x] 7.3 Run `npm run lint` in `web/` and fix any issues
- [x] 7.4 Run `npm run build` in `web/` and confirm clean build
