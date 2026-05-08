## ADDED Requirements

### Requirement: Shared PageHeader component

The system SHALL provide a `PageHeader` component that renders a consistent title area for authenticated pages, supporting optional back navigation, eyebrow text, subtitle, and right-aligned contextual actions.

#### Scenario: Basic title rendering

- **WHEN** a page renders `<PageHeader title="My Page" />`
- **THEN** the heading is displayed with consistent typography and spacing

#### Scenario: Back navigation

- **WHEN** `onBack` prop is provided to `PageHeader`
- **THEN** a back button is rendered and calls `onBack` when clicked

#### Scenario: No back navigation

- **WHEN** `onBack` prop is not provided
- **THEN** no back button is rendered

#### Scenario: Eyebrow text

- **WHEN** `eyebrow` prop is provided
- **THEN** a small uppercase label is rendered above the title

#### Scenario: Subtitle

- **WHEN** `subtitle` prop is provided
- **THEN** a secondary text line is rendered below the title

#### Scenario: Contextual actions

- **WHEN** `actions` prop is provided with ReactNode content
- **THEN** those actions are rendered right-aligned in the header row

### Requirement: PageHeader used across all authenticated page routes

Every authenticated page route SHALL use `PageHeader` for its title section instead of custom inline heading blocks.

#### Scenario: List pages use PageHeader

- **WHEN** the user views the Activities, Favorites, or Nearby list pages
- **THEN** the page title is rendered via the shared `PageHeader` component

#### Scenario: Private area pages use PageHeader

- **WHEN** the user views Profile, Security, or Types pages
- **THEN** the page title is rendered via the shared `PageHeader` component

#### Scenario: Form pages use PageHeader

- **WHEN** the user views the add/edit activity form or review form
- **THEN** the page title is rendered via `PageHeader` with back navigation

#### Scenario: Detail page uses PageHeader

- **WHEN** the user views the activity detail page
- **THEN** the activity title is rendered via `PageHeader` with back navigation
