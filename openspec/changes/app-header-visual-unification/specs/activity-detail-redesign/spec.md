## ADDED Requirements

### Requirement: Editorial activity detail top section

The activity detail page top section SHALL display the activity title, address, rating, and type in a scannable block, with photos rendered in a bounded image area below the core info — not as a full-bleed overlay hero.

#### Scenario: Title and meta above photos

- **WHEN** the user opens an activity detail page
- **THEN** the activity title, type badge, and address are visible before any photo content

#### Scenario: Photos in bounded block

- **WHEN** the activity has one or more photos
- **THEN** photos are displayed in a contained image area with defined aspect ratio and no text overlaid on them

#### Scenario: No photos fallback

- **WHEN** the activity has no photos
- **THEN** the page renders correctly with no empty hero space

#### Scenario: Back navigation via PageHeader

- **WHEN** the user is on the activity detail page
- **THEN** a back button is available via the `PageHeader` component that navigates back

#### Scenario: Quick actions remain discoverable

- **WHEN** the user views the activity detail page
- **THEN** edit, favorite, and other quick actions are accessible without scrolling past the hero area
