-- One row per photographer for the short dashboard survey on pricing, tools
-- and how she heard about us. The row is created the first time the popup is
-- shown, so it also counts how many times it was shown (capped at 3 in
-- lib/market-survey/questions.ts) even if she never answers.
--
-- Service-role only (written by market-survey.actions, read by /manage).

begin;

create table public.market_survey_responses (
  user_id uuid primary key references public.users (id) on delete cascade,
  shows_count integer not null default 0,
  last_shown_at timestamptz,
  -- null = shown but not answered.
  completed_at timestamptz,
  -- Whether she had a live paid subscription when she answered.
  was_subscriber boolean,
  answers jsonb,
  can_contact boolean,
  created_at timestamptz not null default now()
);

comment on table public.market_survey_responses is
  'Dashboard market survey: popup show counter plus the answers. completed_at null = shown but not answered.';

alter table public.market_survey_responses enable row level security;

revoke all on table public.market_survey_responses from anon, authenticated;

commit;
