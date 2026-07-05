import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTestimonials } from '@/lib/actions/testimonials.actions'
import { TestimonialsManager } from '@/components/dashboard/TestimonialsManager'
import type { Testimonial } from '@/lib/types/database.types'

export default async function ReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, testimonials] = await Promise.all([
    supabase
      .from('users')
      .select('logo_url')
      .eq('id', user.id)
      .maybeSingle<{ logo_url: string | null }>(),
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
      />
    </div>
  )
}
