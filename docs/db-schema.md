# DB Doc

- Database: SQL semplice
- `users` — gestito da Laravel Sanctum
- `activity_types` (id CHAR36, user_id, name, description, icon_key, display_order, created_at)
- `activities` (id CHAR36, user_id, name, address, lat, lng, phone, notes, tags JSON, is_favorite, created_at, updated_at, last_viewed_at)
- `activity_activity_type` (activity_id, activity_type_id) — pivot M:N
- `reviews` (id CHAR36, activity_id, activity_type_id, user_id, score_location, score_food, score_service, score_price, cost_per_person, liked, disliked, notes, created_at, updated_at) — UNIQUE(activity_id, user_id, activity_type_id)
- `activity_photos` (id CHAR36, activity_id, storage_path, display_order, created_at)