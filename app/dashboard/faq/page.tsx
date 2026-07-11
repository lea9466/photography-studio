import { redirect } from 'next/navigation'
import { HelpCircle } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { FaqItemsForm } from '@/components/dashboard/FaqItemsForm'
import { parseFaqItems, sanitizeFaqItems } from '@/lib/faq'

export default async function FaqPage() {
  let context
  try {
    context = await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const { userId, supabase } = context

  const { data, error } = await supabase
    .from('users')
    .select('faq_items')
    .eq('id', userId)
    .maybeSingle<{ faq_items: unknown }>()

  if (error && error.code !== 'PGRST116') {
    console.error('[FaqPage] failed to load faq_items:', error.message)
  }

  const faqItems = sanitizeFaqItems(parseFaqItems(data?.faq_items))

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                שאלות נפוצות
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                {faqItems.length > 0
                  ? `${faqItems.length} שאלות פעילות מוצגות כרגע בדף הבית הציבורי שלך.`
                  : 'נהלי שאלות נפוצות שיוצגו בדף הבית הציבורי. אם אין פריטים — הסקשן לא יופיע באתר.'}
              </p>
            </div>
          </div>
        </div>
        <FaqItemsForm initialItems={faqItems} />
      </div>
    </div>
  )
}
