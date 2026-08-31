-- Tracks the 3-group rollout of the custom-domain-addon announcement email
-- (lib/email/resend.ts's buildCustomDomainAddonAnnouncementEmail), split
-- across days to stay under a 100/day sending-provider quota. `group` is
-- assigned once (oldest studios first, newest in the last group) and never
-- reassigned; `sent_at` is the actual duplicate-prevention guard — a studio
-- is only ever emailed once, and re-running the group-send script for a day
-- that already ran is a safe no-op.
alter table public.users
  add column if not exists custom_domain_announcement_group smallint;

alter table public.users
  add column if not exists custom_domain_announcement_sent_at timestamptz;

comment on column public.users.custom_domain_announcement_group is
  'Which of the 3 rollout groups (1/2/3) this studio was assigned to for the custom-domain-addon announcement — assigned once, oldest studios in group 1.';
comment on column public.users.custom_domain_announcement_sent_at is
  'When the custom-domain-addon announcement email was actually sent to this studio. Null = not sent yet. The real duplicate-prevention guard.';
