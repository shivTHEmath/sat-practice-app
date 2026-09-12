-- SAT Reading & Writing practice: question bank, usernames, attempt log.
-- Auth here is username-only by design: there is no password and therefore no
-- real security boundary. Anyone who knows a username can open that account.

create table if not exists sat_users (
  id         uuid primary key default gen_random_uuid(),
  username   text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists sat_questions (
  id         text primary key,
  domain     text not null,
  skill      text not null,
  difficulty text not null,
  passage    text not null,
  prompt     text not null,
  choices    jsonb not null,
  correct    text not null,
  rationale  text not null,
  table_data jsonb
);

create index if not exists sat_questions_filter_idx
  on sat_questions (difficulty, skill);

create table if not exists sat_attempts (
  id          bigserial primary key,
  user_id     uuid not null references sat_users (id) on delete cascade,
  question_id text not null references sat_questions (id),
  session_id  uuid not null,
  selected    text,
  is_correct  boolean,
  ms_spent    integer,
  marked      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists sat_attempts_user_idx on sat_attempts (user_id, created_at desc);
create index if not exists sat_attempts_session_idx on sat_attempts (session_id);

alter table sat_users     enable row level security;
alter table sat_questions enable row level security;
alter table sat_attempts  enable row level security;

-- Open policies to match the password-free login model.
drop policy if exists sat_users_all on sat_users;
create policy sat_users_all on sat_users for all using (true) with check (true);

drop policy if exists sat_questions_read on sat_questions;
create policy sat_questions_read on sat_questions for select using (true);

drop policy if exists sat_attempts_all on sat_attempts;
create policy sat_attempts_all on sat_attempts for all using (true) with check (true);
