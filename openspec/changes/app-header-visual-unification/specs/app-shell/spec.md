## ADDED Requirements

### Requirement: Persistent branded header in authenticated shell

The app shell SHALL render a top header on every authenticated route that includes the TasteSpot logo (or wordmark), the app name, and a primary add-activity action.

#### Scenario: Header visible on tab route

- **WHEN** the user is on a tab route (map, favorites, nearby, profile)
- **THEN** the top header is rendered and visible

#### Scenario: Header visible on non-tab route

- **WHEN** the user is on a non-tab route (detail, form, review, types, security)
- **THEN** the top header is rendered and visible

#### Scenario: Add-activity CTA always accessible

- **WHEN** the user taps or clicks the add button in the top header
- **THEN** the app navigates to the add-activity form (`/activities/new`)

### Requirement: Shell back button removed

The shell's conditional back button in the header SHALL be removed. Back navigation is handled per-page via `PageHeader`.

#### Scenario: No shell-level back button

- **WHEN** the user navigates to any non-tab route
- **THEN** there is no back button rendered by the shell header itself

### Requirement: Bottom navigation refinement

The bottom navigation bar SHALL maintain its current structure but with refined active states, spacing, and visual integration with the new top header.

#### Scenario: Active nav item styling

- **WHEN** a nav item corresponds to the current route
- **THEN** it is visually distinguished from inactive items using the primary color and accent-soft background

#### Scenario: Desktop sidebar integration

- **WHEN** viewport width is ≥ 900px
- **THEN** the navigation renders as a left sidebar and the header spans the full app width
