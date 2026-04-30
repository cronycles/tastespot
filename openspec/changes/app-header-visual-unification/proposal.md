## Why

The TasteSpot web frontend has a fragmented visual hierarchy: there is no persistent branded app header, page titles are defined inconsistently across routes, and back-navigation patterns differ from screen to screen. This creates a product that feels unpolished and harder to navigate. The codebase is now stable enough to address these structural UX gaps in one focused effort.

## What Changes

- Introduce a persistent branded top header in the authenticated shell (`AppLayout.tsx`) that is visible across all routes
- Add a global "add activity" CTA to the header, always available in the authenticated app
- Create a shared `PageHeader` component to unify page-level titles, subtitles, back navigation, and local actions
- Migrate all authenticated routes to use the shared `PageHeader` pattern (activities lists, favorites, nearby, profile, security, types, forms, review, detail)
- Refine bottom navigation active states, spacing, and integration with the new top header
- Align desktop sidebar with the new header system
- Redesign the activity detail top section for a more editorial, image-aware composition
- Adjust global CSS tokens (typography, spacing, surface language) to support the new hierarchy

## Capabilities

### New Capabilities

- `app-shell`: Persistent branded top header with logo, app title, add-activity action, and bottom navigation refinements inside the authenticated shell
- `page-header`: Shared `PageHeader` component providing consistent title, subtitle, back navigation, and contextual actions for all authenticated routes
- `activity-detail-redesign`: Redesigned top section of the activity detail page with better balance between photography and core information

### Modified Capabilities

<!-- No existing spec-level requirements are changing; this is a new visual layer -->

## Impact

- `web/src/components/AppLayout.tsx`: shell restructuring, new top header
- `web/src/styles/layout.css`: layout tokens, sticky header support
- `web/src/styles/base.css`: typography and spacing tokens
- `web/src/styles/features.css`: surface and card refinements
- `web/src/components/ActivitiesListPanel.tsx`: migrate to shared page-header
- `web/src/pages/ProfilePage.tsx`, `SecurityPage.tsx`, `TypesPage.tsx`: remove local hero blocks, use PageHeader
- `web/src/pages/ActivityFormPage.tsx`, `ActivityReviewPage.tsx`: use PageHeader, clarify back/cancel hierarchy
- `web/src/pages/ActivityDetailPage.tsx`: redesigned top section
- New file: `web/src/components/PageHeader.tsx`
