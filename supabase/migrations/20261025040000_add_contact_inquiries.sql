-- Every contact-form submission from a photographer's public site, saved
-- BEFORE the notification email is sent. Until now the email was the only
-- record: on 25/10 Resend's daily quota ran out and two leads were lost for
-- good because the fallback send failed too. Now a failed send leaves a row
-- (email_sent_at null + email_error) that /manage lists with a resend button.
--
-- Service-role only for now (written by submitContactInquiry, read by /manage);
-- a photographer-facing inbox can add a select-own policy later.

begin;

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.users (id) on delete cascade,
  client_name text not null,
  client_email text not null,
  client_phone text,
  subject text,
  message text not null,
  -- null = the notification email has not gone out (yet). Set on success.
  email_sent_at timestamptz,
  email_error text,
  email_attempts integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.contact_inquiries is
  'Contact-form submissions from public sites. email_sent_at null = the photographer has NOT been notified; /manage lists these for a manual resend.';

create index contact_inquiries_unsent_idx
  on public.contact_inquiries (created_at desc)
  where email_sent_at is null;

alter table public.contact_inquiries enable row level security;

revoke all on table public.contact_inquiries from anon, authenticated;

commit;
