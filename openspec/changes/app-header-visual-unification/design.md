## Context

The TasteSpot web frontend is a React + TypeScript SPA (Vite, React Router v6) with a mobile-first shell.  
Current authenticated shell: `AppLayout.tsx` renders a conditional `<header>` (only on non-tab routes, with only a back button) plus a fixed bottom nav and `<Outlet>`. CSS layout uses CSS custom properties and a grid-based frame (`app-shell` / `app-frame`).  
The CSS design system lives in `web/src/styles/` (`base.css`, `layout.css`, `features.css`).  
The app already has class stubs for `.app-header`, `.app-header-brand`, and `.app-header-actions` in `layout.css`, but the JSX component does not yet render them persistently.

## Goals / Non-Goals

**Goals:**

- Render a persistent branded top header on every authenticated route (logo + app name + add-activity CTA)
- Provide a shared `PageHeader` React component for per-route title, subtitle, back link, and contextual actions
- Migrate all authenticated page-level headings to use `PageHeader`
- Redesign the activity detail top section (editorial photo/info balance)
- Refine bottom nav (active states, spacing, desktop sidebar integration)
- Adjust CSS tokens for vertical rhythm, heading scale, and surface consistency

**Non-Goals:**

- Backend or data model changes
- Language switcher implementation
- Map interaction mechanics
- New feature development beyond navigation chrome and visual unification

## Decisions

### D1: Global header always rendered, PageHeader per-route

**Decision**: The `app-header` is always present in `AppLayout.tsx`. The per-route `PageHeader` component handles route-specific titles and back navigation.  
**Alternatives considered**: Single adaptive header that morphs per-route — rejected because it couples the shell to route-specific logic and makes the header harder to reason about.  
**Rationale**: Clean separation of global chrome from local content. Shell stays dumb; pages compose their own header area.

### D2: PageHeader as a dumb presentational component

**Decision**: `PageHeader` receives `title`, optional `eyebrow`, `subtitle`, `onBack`, and `actions` (ReactNode) as props. It renders a consistent DOM structure with no side effects.  
**Rationale**: Keeps the component reusable, easily testable, and free of router coupling. Each page wires `useNavigate(-1)` or a custom back handler as needed.

### D3: Back navigation moved entirely into PageHeader

**Decision**: The shell's conditional back button is removed. Non-tab pages render a `PageHeader` with `onBack` set.  
**Rationale**: Eliminates the redundancy of shell back-button + page-level cancel buttons. One mechanism, one place.

### D4: Add-activity CTA in the global header

**Decision**: The global header includes an `IoAdd` icon button that navigates to `/activities/new`.  
**Rationale**: The plan calls for the primary app action to always be reachable. Header placement is universally accessible and expected by users of discovery-first apps.

### D5: CSS-only refinements, no CSS-in-JS or new framework

**Decision**: All style changes stay in the existing CSS files using the current custom property system.  
**Rationale**: The project already uses a CSS token system that is clean and performant. Adding a new CSS-in-JS approach would be over-engineering for this scope.

### D6: Activity detail top section — remove full-bleed hero overlay

**Decision**: Replace the full-bleed overlay hero with a contained card-style layout: photo(s) appear in a bounded image block below the title/meta row.  
**Rationale**: The plan explicitly calls for sobriety. A contained photo block preserves visual appeal without hiding titles behind gradient overlays, which also improves contrast and accessibility.

## Risks / Trade-offs

- **Map page header height** → The new persistent header adds ~56px to the viewport. The map content area uses `app-content--map` which is `overflow: hidden; padding: 0`. The grid row for content shrinks by the header height. Risk: map feels cramped on small screens. Mitigation: verify map route at multiple screen sizes; consider a toggle or collapse on map route if needed.
- **Sticky crowding on list pages** → List pages already have search + filter rows. PageHeader + sticky filters could feel dense. Mitigation: PageHeader is not sticky on list pages; only the filter/sort bar sticks.
- **Desktop sidebar + header alignment** → Desktop uses a 2-column grid (`280px sidebar + 1fr content`). The header spans full width (`grid-column: 1/-1`). This is already the current pattern and remains unchanged.
- **PageHeader on activity detail** → The detail page has a photo-first layout. The new design moves the title/meta above photos rather than overlaying them. This is a bigger visual change; validate that the new layout still communicates the activity's identity immediately.
