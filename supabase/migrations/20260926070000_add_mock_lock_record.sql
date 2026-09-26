-- Whether a finished mock sitting ran in locked mode, and each time the
-- test-taker left full screen or switched away while it was locked.
alter table public.sat_mock_results
  add column if not exists locked boolean not null default false,
  add column if not exists lock_events jsonb not null default '[]'::jsonb;
