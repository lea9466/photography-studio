alter table public.users
  add column if not exists trial_end_date timestamptz not null default (now() + interval '1 month'),
  add column if not exists referral_code text,
  add column if not exists referred_by_user_id uuid references public.users (id) on delete set null,
  add column if not exists has_triggered_referral_bonus boolean not null default false,
  add column if not exists show_referral_popup boolean not null default false;

update public.users
set trial_end_date = created_at + interval '1 month'
where trial_end_date is null;

update public.users
set referral_code = slug
where slug is not null and referral_code is null;

create unique index if not exists users_referral_code_idx
  on public.users (referral_code)
  where referral_code is not null;

create or replace function public.sync_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.slug is not null then
    new.referral_code := new.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists users_sync_referral_code on public.users;

create trigger users_sync_referral_code
  before insert or update of slug on public.users
  for each row
  execute function public.sync_referral_code();

comment on column public.users.trial_end_date is 'Trial expiry; extended by referral bonuses';
comment on column public.users.referral_code is 'Share code derived from studio slug';
comment on column public.users.referred_by_user_id is 'Referring studio user id';
comment on column public.users.has_triggered_referral_bonus is 'True after 2nd gallery triggers referrer bonus';
comment on column public.users.show_referral_popup is 'Show referral success modal in dashboard';
