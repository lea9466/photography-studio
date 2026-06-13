import type { TestimonialWithClient } from '@/lib/testimonials-db'

export default function HomeTestimonialsSection({
  testimonials,
}: {
  testimonials: TestimonialWithClient[]
}) {
  if (testimonials.length === 0) return null

  return (
    <section
      id="testimonials"
      className="relative scroll-mt-24 px-6 py-32 md:scroll-mt-28 md:py-44"
      dir="rtl"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 text-center">
          <p className="theme-label mb-6 text-[11px] uppercase tracking-[0.5em]">
            Testimonials · המלצות
          </p>
          <h2
            id="testimonials-heading"
            className="font-display text-5xl leading-[1] md:text-6xl"
          >
            לקוחות <span className="font-light italic">ממליצים</span>
          </h2>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {testimonials.map((item, index) => (
            <li
              key={item.id}
              className="theme-shaped animate-fade-in-up border border-border/60 bg-card/80 p-8 backdrop-blur-sm md:p-10"
              style={{ animationDelay: `${Math.min(index * 80, 400)}ms` }}
            >
              <span
                className="font-display text-5xl leading-none"
                style={{ color: 'color-mix(in oklab, var(--color-rose) 50%, transparent)' }}
                aria-hidden
              >
                &ldquo;
              </span>
              <blockquote className="-mt-4 text-lg leading-relaxed text-foreground/85">
                {item.content}
              </blockquote>
              <footer className="mt-6 border-t border-border/70 pt-5">
                <cite className="font-display text-lg not-italic text-foreground">
                  {item.client_name}
                </cite>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
