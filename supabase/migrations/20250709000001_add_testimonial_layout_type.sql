-- Add testimonial layout type field to users table
alter table public.users
  add column if not exists testimonial_layout_type text not null default 'carousel'
  check (testimonial_layout_type in ('carousel', 'marquee'));

comment on column public.users.testimonial_layout_type is 'Layout type for testimonials section: carousel (dots navigation) or marquee (smooth infinite scroll)';
