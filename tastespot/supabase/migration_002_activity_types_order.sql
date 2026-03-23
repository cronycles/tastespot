-- Migration 002 — add display_order to activity_types
-- Apply this in Supabase SQL Editor (Database > SQL Editor > New query)

alter table activity_types
  add column if not exists display_order integer not null default 0;

-- Back-fill existing rows: assign sequential order by created_at per user
with ranked as (
  select id, row_number() over (partition by user_id order by created_at) - 1 as rn
  from activity_types
)
update activity_types
set display_order = ranked.rn
from ranked
where activity_types.id = ranked.id;
