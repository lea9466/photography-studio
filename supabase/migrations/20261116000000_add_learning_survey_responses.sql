-- One row per photographer for the one-question dashboard popup "where did you
-- learn photography?". Like market_survey_responses, the row is created the
-- first time the popup is shown and also counts the showings (capped in
-- lib/learning-survey/questions.ts).
--
-- answers = { learnedAt: string[], teacherName?: string }
-- Service-role only (written by learning-survey.actions, read by /manage).

begin;

create table public.learning_survey_responses (
  user_id uuid primary key references public.users (id) on delete cascade,
  shows_count integer not null default 0,
  last_shown_at timestamptz,
  -- null = shown but not answered.
  completed_at timestamptz,
  answers jsonb,
  created_at timestamptz not null default now()
);

comment on table public.learning_survey_responses is
  'Dashboard "where did you learn photography" popup: show counter plus the answer. completed_at null = shown but not answered.';

alter table public.learning_survey_responses enable row level security;

revoke all on table public.learning_survey_responses from anon, authenticated;

commit;
