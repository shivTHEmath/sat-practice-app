-- Fixed-form mock exams. Each mock lists its modules in order; each module
-- carries its own timing and the exact question order to serve.
create table if not exists public.sat_mocks (
  id          text primary key,
  name        text not null,
  assessment  text not null default 'PSAT',
  sort_order  integer not null default 0,
  modules     jsonb not null,
  created_at  timestamptz not null default now(),
  constraint sat_mocks_assessment_check check (assessment in ('SAT', 'PSAT')),
  constraint sat_mocks_modules_is_array check (jsonb_typeof(modules) = 'array')
);

-- One row per completed mock sitting. Per-question answers also land in
-- sat_attempts under the same session_id so practice stats stay complete.
create table if not exists public.sat_mock_results (
  id            bigserial primary key,
  user_id       uuid not null references public.sat_users (id) on delete cascade,
  mock_id       text not null references public.sat_mocks (id) on delete cascade,
  session_id    uuid not null unique,
  rw_raw        integer not null,
  rw_total      integer not null,
  math_raw      integer not null,
  math_total    integer not null,
  rw_score      integer not null,
  math_score    integer not null,
  total_score   integer not null,
  answers       jsonb not null,
  completed_at  timestamptz not null default now()
);

create index if not exists sat_mock_results_user_idx
  on public.sat_mock_results (user_id, completed_at desc);

alter table public.sat_mocks        enable row level security;
alter table public.sat_mock_results enable row level security;

-- Same open, username-only model as the rest of the app.
drop policy if exists sat_mocks_read on public.sat_mocks;
create policy sat_mocks_read on public.sat_mocks for select using (true);

drop policy if exists sat_mock_results_all on public.sat_mock_results;
create policy sat_mock_results_all on public.sat_mock_results
  for all using (true) with check (true);
