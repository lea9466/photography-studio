-- Studio Gallery — testimonials RLS policies
-- Photographers: full access to own testimonials
-- Public read for testimonials on photographer's public site

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
alter table public.testimonials enable row level security;

create policy "testimonials_select_own"
  on public.testimonials for select
  using (user_id = auth.uid());

create policy "testimonials_insert_own"
  on public.testimonials for insert
  with check (user_id = auth.uid());

create policy "testimonials_update_own"
  on public.testimonials for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "testimonials_delete_own"
  on public.testimonials for delete
  using (user_id = auth.uid());

-- Public read for testimonials (no auth required) - displayed on photographer's public site
create policy "testimonials_select_public"
  on public.testimonials for select
  using (true);
