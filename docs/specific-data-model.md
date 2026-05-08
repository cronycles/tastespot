# Data Model Documentation

Database model for TasteSpot - a web application where users discover, review, and favorite food & beverage activities (restaurants, bars, cafes, etc.).

**Database Type:** Laravel (MySQL/SQLite)  
**ID Strategy:** UUIDs (v4, CHAR(36)) for main entities; serial IDs for users  
**Soft Deletes:** None - cascading deletes enabled

---

## Entities

### 1. **users**
Core user authentication and identity.

| Field | Type | Notes |
|-------|------|-------|
| `id` | BIGINT PK | Auto-increment |
| `name` | VARCHAR(255) | User display name |
| `email` | VARCHAR(255) | Unique, used for login |
| `password` | VARCHAR(255) | Hashed (Laravel) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Relations:**
- 1 → N `activity_types` (user can create custom activity type categories)
- 1 → N `activities` (user's saved activities)
- 1 → N `reviews` (user's reviews/ratings)
- N → M `favorites` (user's favorite activities)

---

### 2. **activity_types**
User-defined categories/types for activities (e.g., "Italian", "Fast Food", "Casual", etc.).

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | UUID v4 |
| `user_id` | BIGINT FK | References `users.id` (CASCADE) |
| `name` | VARCHAR(255) | Type name |
| `description` | VARCHAR(255) | Optional description |
| `icon_key` | VARCHAR(100) | Icon identifier (default: `restaurant-outline`) |
| `display_order` | INT | Ordering priority (0-based) |
| `created_at` | TIMESTAMP | No `updated_at` |

**Relations:**
- N → 1 `users` (owner)
- N ↔ M `activities` (via `activity_type_assignments`)
- 1 → N `reviews` (activity type used in review)

---

### 3. **activities**
Places/venues that users discover and track (restaurants, bars, cafes, etc.).

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | UUID v4 |
| `user_id` | BIGINT FK | References `users.id` (CASCADE) |
| `name` | VARCHAR(255) | Activity/place name |
| `address` | VARCHAR(255) | Physical address (nullable) |
| `lat` | DOUBLE | Latitude (nullable) |
| `lng` | DOUBLE | Longitude (nullable) |
| `phone` | VARCHAR(50) | Contact number (nullable) |
| `notes` | TEXT | User notes/description (nullable) |
| `tags` | JSON | Array of custom tags (nullable) |
| `last_viewed_at` | TIMESTAMP | Track last user interaction (nullable) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Relations:**
- N → 1 `users` (creator/owner)
- N ↔ M `activity_types` (via `activity_type_assignments`)
- 1 → N `reviews` (ratings/feedback)
- 1 → N `activity_photos` (media attachments)
- N → 1 `favorites` (favorited by users)

---

### 4. **activity_type_assignments**
Pivot table linking activities to their assigned types (M:N relationship).

| Field | Type | Notes |
|-------|------|-------|
| `activity_id` | CHAR(36) FK | References `activities.id` (CASCADE) |
| `activity_type_id` | CHAR(36) FK | References `activity_types.id` (CASCADE) |

**Constraint:** Composite PK on `(activity_id, activity_type_id)`

---

### 5. **reviews**
User ratings and feedback for activities, tied to a specific activity type.

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | UUID v4 |
| `activity_id` | CHAR(36) FK | References `activities.id` (CASCADE) |
| `user_id` | BIGINT FK | References `users.id` (CASCADE) |
| `activity_type_id` | CHAR(36) FK | References `activity_types.id` (CASCADE) |
| `score_location` | FLOAT | Rating for location/ambiance (nullable) |
| `score_food` | FLOAT | Rating for food quality (nullable) |
| `score_service` | FLOAT | Rating for service (nullable) |
| `score_price` | FLOAT | Rating for value/price (nullable) |
| `cost_per_person` | FLOAT | Estimated cost per person (nullable) |
| `liked` | TEXT | What user liked (nullable) |
| `disliked` | TEXT | What user disliked (nullable) |
| `notes` | TEXT | Additional comments (nullable) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Constraints:**
- Unique on `(activity_id, user_id, activity_type_id)` — one review per user per activity per type

**Relations:**
- N → 1 `activities` (reviewed activity)
- N → 1 `users` (reviewer)
- N → 1 `activity_types` (review context type)

---

### 6. **favorites**
Association table marking activities favorited by users.

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | BIGINT FK | References `users.id` (CASCADE) |
| `activity_id` | CHAR(36) FK | References `activities.id` (CASCADE) |
| `created_at` | TIMESTAMP | No auto-timestamp (manually set) |

**Constraint:** Composite PK on `(user_id, activity_id)` | No `updated_at`

**Relations:**
- N → 1 `users` (favoriter)
- N → 1 `activities` (favorited activity)

---

### 7. **activity_photos**
Media attachments (photos) for activities, ordered for gallery display.

| Field | Type | Notes |
|-------|------|-------|
| `id` | CHAR(36) PK | UUID v4 |
| `activity_id` | CHAR(36) FK | References `activities.id` (CASCADE) |
| `storage_path` | VARCHAR(255) | File path/URL in storage |
| `display_order` | INT | Sort priority in gallery (0-based) |
| `created_at` | TIMESTAMP | No `updated_at` |

**Relations:**
- N → 1 `activities` (associated activity)

---

## Relationship Summary

```
users (1) ──→ (N) activity_types
users (1) ──→ (N) activities
users (1) ──→ (N) reviews
users (1) ──→ (N) favorites

activities (N) ←→ (M) activity_types [via activity_type_assignments]
activities (1) ──→ (N) reviews
activities (1) ──→ (N) activity_photos
activities (1) ←──  (N) favorites

reviews (N) ──→ (1) activity_types
activity_photos (N) ──→ (1) activities
```

---

## Key Design Notes

1. **UUID Primary Keys:** Most entities use UUID v4 (CHAR 36) for distributable IDs; only `users` uses auto-increment.
2. **Cascade Deletes:** All foreign keys cascade on delete to maintain referential integrity.
3. **Created-Only Timestamps:** `activity_types`, `activity_photos` track only `created_at` (no `updated_at`).
4. **Unique Review Constraint:** Prevents duplicate reviews for the same activity-user-type combination.
5. **JSON Tags:** Activities support dynamic, unstructured tags via JSON column.
6. **Geolocation:** Activities include optional lat/lng for map integration.
7. **Display Ordering:** Both `activity_types` and `activity_photos` support manual reordering via `display_order` field.
8. **No Soft Deletes:** Direct cascade deletion used; no `deleted_at` field.