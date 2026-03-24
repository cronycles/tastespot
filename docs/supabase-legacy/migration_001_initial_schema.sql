-- TasteSpot — Full database schema
-- Apply this in Supabase SQL Editor (Database > SQL Editor > New query)

-- ─────────────────────────────────────────
-- ACTIVITY TYPES
-- ─────────────────────────────────────────
create table if not exists activity_types (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  icon_key    text not null default 'restaurant-outline',
  created_at  timestamptz not null default now()
);

alter table activity_types enable row level security;

create policy "users manage own activity_types"
  on activity_types for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- ACTIVITIES
-- ─────────────────────────────────────────
create table if not exists activities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  address        text,
  lat            double precision,
  lng            double precision,
  phone          text,
  notes          text,
  tags           text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_viewed_at timestamptz
);

alter table activities enable row level security;

create policy "users manage own activities"
  on activities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger activities_updated_at
  before update on activities
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- ACTIVITY TYPE ASSIGNMENTS
-- ─────────────────────────────────────────
create table if not exists activity_type_assignments (
  activity_id      uuid not null references activities(id) on delete cascade,
  activity_type_id uuid not null references activity_types(id) on delete cascade,
  primary key (activity_id, activity_type_id)
);

alter table activity_type_assignments enable row level security;

create policy "users manage own assignments"
  on activity_type_assignments for all
  using (
    exists (
      select 1 from activities
      where activities.id = activity_type_assignments.activity_id
        and activities.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from activities
      where activities.id = activity_type_assignments.activity_id
        and activities.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────
create table if not exists reviews (
  id               uuid primary key default gen_random_uuid(),
  activity_id      uuid not null references activities(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  score_location   real,
  score_food       real,
  score_service    real,
  score_price      real,
  cost_per_person  real,
  liked            text,
  disliked         text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (activity_id, user_id)
);

alter table reviews enable row level security;

create policy "users manage own reviews"
  on reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger reviews_updated_at
  before update on reviews
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- FAVORITES
-- ─────────────────────────────────────────
create table if not exists favorites (
  user_id     uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, activity_id)
);

alter table favorites enable row level security;

create policy "users manage own favorites"
  on favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- ACTIVITY PHOTOS
-- ─────────────────────────────────────────
create table if not exists activity_photos (
  id            uuid primary key default gen_random_uuid(),
  activity_id   uuid not null references activities(id) on delete cascade,
  storage_path  text not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table activity_photos enable row level security;

create policy "users manage own photos"
  on activity_photos for all
  using (
    exists (
      select 1 from activities
      where activities.id = activity_photos.activity_id
        and activities.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from activities
      where activities.id = activity_photos.activity_id
        and activities.user_id = auth.uid()
    )
  );
