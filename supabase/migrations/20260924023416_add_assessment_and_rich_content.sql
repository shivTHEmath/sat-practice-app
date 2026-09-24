alter table public.sat_questions
  add column if not exists assessment text not null default 'SAT',
  add column if not exists passage_html text,
  add column if not exists prompt_html text,
  add column if not exists choices_html jsonb,
  add column if not exists rationale_html text;

alter table public.sat_questions
  drop constraint if exists sat_questions_assessment_check;

alter table public.sat_questions
  add constraint sat_questions_assessment_check
  check (assessment in ('SAT', 'PSAT'));

create index if not exists sat_questions_assessment_filter_idx
  on public.sat_questions (assessment, difficulty, skill);
