-- Keep Reading & Writing rows compatible while making the same bank usable for
-- Math questions and student-produced responses.
alter table public.sat_questions
  add column if not exists test text not null default 'Reading and Writing',
  add column if not exists response_type text not null default 'multiple_choice',
  add column if not exists accepted_answers jsonb not null default '[]'::jsonb,
  add column if not exists answer_validation jsonb,
  add column if not exists source_metadata jsonb;

alter table public.sat_questions
  drop constraint if exists sat_questions_test_check,
  add constraint sat_questions_test_check
    check (test in ('Reading and Writing', 'Math')),
  drop constraint if exists sat_questions_response_type_check,
  add constraint sat_questions_response_type_check
    check (response_type in ('multiple_choice', 'student_produced_response')),
  drop constraint if exists sat_questions_accepted_answers_is_array,
  add constraint sat_questions_accepted_answers_is_array
    check (jsonb_typeof(accepted_answers) = 'array');

-- A consumer usually filters the bank by assessment, test, domain/skill, and
-- difficulty before selecting a session.
create index if not exists sat_questions_test_filter_idx
  on public.sat_questions (assessment, test, difficulty, domain, skill);
