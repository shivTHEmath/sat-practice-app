-- A result keeps the exact question order it was taken with, so editing a
-- mock later never changes a past score report.
alter table public.sat_mock_results
  add column if not exists modules jsonb;

update public.sat_mock_results r
set modules = m.modules
from public.sat_mocks m
where r.mock_id = m.id and r.modules is null;
