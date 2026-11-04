-- Add 'spotlight' as a fourth testimonials layout option: one large centered
-- quote at a time, crossfading between testimonials, with dot navigation.
alter table public.users
  drop constraint if exists users_testimonial_layout_type_check;

alter table public.users
  add constraint users_testimonial_layout_type_check
  check (testimonial_layout_type in ('carousel', 'marquee', 'flip-cards', 'spotlight'));

comment on column public.users.testimonial_layout_type is 'Layout type for testimonials section: carousel (dots navigation), marquee (smooth infinite scroll), flip-cards (wide rectangular cards that flip to reveal the photo) or spotlight (one large centered quote that crossfades between testimonials)';
