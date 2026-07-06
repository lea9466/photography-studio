-- Add 'public' status for public/portfolio galleries (MVP public-only workflow)

alter table public.galleries drop constraint galleries_status_check;

alter table public.galleries
  add constraint galleries_status_check
  check (status in ('draft', 'public', 'selection', 'editing', 'delivery_ready', 'locked'));

-- Existing public/portfolio galleries should show as public
update public.galleries
set status = 'public'
where is_public = true or gallery_type = 'portfolio';
