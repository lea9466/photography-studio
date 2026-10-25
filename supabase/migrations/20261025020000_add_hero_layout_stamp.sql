-- New hero layout "stamp" (חותמת): inset photo with two rounded corners, the
-- title on the photo and a turning seal on its corner. PRO by default, like
-- every layout except cinema/split; the admin can flip it in /manage.

insert into public.hero_option_tiers (option_key, tier)
values ('layout:stamp', 'pro')
on conflict (option_key) do nothing;
