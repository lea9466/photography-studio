-- Align photography_packages with app schema (safe if already up to date)
-- Run only if you applied an earlier version with recommended_scenes / duration_minutes

-- Drop scenes table if it exists from an earlier migration
drop table if exists public.recommended_scenes cascade;

-- Add duration_text if missing
alter table public.photography_packages
  add column if not exists duration_text text;

-- Migrate duration_minutes → duration_text (older schema)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'photography_packages'
      and column_name = 'duration_minutes'
  ) then
    update public.photography_packages
    set duration_text = coalesce(
      duration_text,
      case
        when duration_minutes is null then null
        when duration_minutes % 60 = 0 and duration_minutes >= 60
          then (duration_minutes / 60)::text || ' שעות צילום'
        else duration_minutes::text || ' דקות צילום'
      end
    );

    alter table public.photography_packages
      drop column duration_minutes;
  end if;
end $$;

-- Drop unused columns from earlier schema
alter table public.photography_packages
  drop column if exists description,
  drop column if exists price_note,
  drop column if exists is_featured;

-- Ensure price is required
update public.photography_packages
set price_amount = 0
where price_amount is null;

alter table public.photography_packages
  alter column price_amount set not null;
