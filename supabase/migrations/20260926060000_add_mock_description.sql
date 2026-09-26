-- A short note shown with a mock on the mock test page, such as how its
-- difficulty compares with Bluebook's own practice tests.
alter table public.sat_mocks
  add column if not exists description text;
