-- ─────────────────────────────────────────
-- MIGRATION 004 — Reviews per activity type
-- ─────────────────────────────────────────
-- Each review is now linked to a specific activity_type_id.
-- A single activity can have N reviews, one per assigned type.
-- ─────────────────────────────────────────

-- 1. Add activity_type_id column (nullable first to avoid issues with existing rows)
alter table reviews
  add column if not exists activity_type_id uuid references activity_types(id) on delete cascade;

-- 2. Drop old unique constraint (activity_id, user_id)
alter table reviews
  drop constraint if exists reviews_activity_id_user_id_key;

-- 3. Add new unique constraint (activity_id, user_id, activity_type_id)
--    Allows nulls in activity_type_id to coexist (legacy rows) but enforces
--    uniqueness for new rows that have a type assigned.
--    We use a partial unique index to handle nulls correctly in PostgreSQL.
create unique index if not exists reviews_activity_user_type_unique
  on reviews (activity_id, user_id, activity_type_id)
  where activity_type_id is not null;

-- 4. Back-fill existing reviews: assign activity_type_id from the first type
--    assigned to each activity (if any), so existing data stays consistent.
update reviews r
set activity_type_id = (
  select ata.activity_type_id
  from activity_type_assignments ata
  where ata.activity_id = r.activity_id
  order by ata.activity_type_id
  limit 1
)
where r.activity_type_id is null;
