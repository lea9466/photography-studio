-- Add 'flip-cards' as a third testimonials layout option: wide rectangular
-- cards with the testimonial photo as a very light background, flipping on
-- hover / tap to reveal the photo in full colour.
alter table public.users
  drop constraint if exists users_testimonial_layout_type_check;

alter table public.users
  add constraint users_testimonial_layout_type_check
  check (testimonial_layout_type in ('carousel', 'marquee', 'flip-cards'));

comment on column public.users.testimonial_layout_type is 'Layout type for testimonials section: carousel (dots navigation), marquee (smooth infinite scroll) or flip-cards (wide rectangular cards that flip to reveal the photo)';
