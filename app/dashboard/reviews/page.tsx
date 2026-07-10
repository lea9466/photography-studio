import { redirect } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { getTestimonials } from '@/lib/actions/testimonials.actions'
import { TestimonialsManager } from '@/components/dashboard/TestimonialsManager'
import type { Testimonial } from '@/lib/types/database.types'

export default async function ReviewsPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  const [{ data: profile }, testimonials] = await Promise.all([
    supabase
      .from('users')
      .select('logo_url, testimonials_title, selected_theme, testimonial_layout_type')
      .eq('id', userId)
      .maybeSingle<{
        logo_url: string | null
        testimonials_title: string | null
        selected_theme: string | null
        testimonial_layout_type: string | null
      }>(),
    getTestimonials() as Promise<Testimonial[]>,
  ])

  return (
    <div className="animate-fade-in space-y-6 p-6 md:p-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">תגובות לקוחות</h1>
        <p className="mt-1 text-sm text-[--muted]">
          נהלי תגובות שיוצגו בדף הבית שלך. אם אין תגובות — סקשן התגובות לא יופיע באתר.
        </p>
      </div>
      <TestimonialsManager
        initialTestimonials={testimonials}
        photographerLogoUrl={profile?.logo_url ?? null}
        initialSectionTitle={profile?.testimonials_title ?? null}
        initialLayoutType={profile?.testimonial_layout_type ?? null}
        selectedTheme={profile?.selected_theme ?? 'elegant'}
      />
    </div>
  )
}
