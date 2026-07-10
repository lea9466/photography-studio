import { redirect } from 'next/navigation'
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
    <div className="animate-fade-in space-y-6 p-6 md:p-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">שאלות נפוצות</h1>
        <p className="mt-1 text-sm text-[--muted]">
          {faqItems.length > 0
            ? `${faqItems.length} שאלות פעילות מוצגות כרגע בדף הבית הציבורי שלך.`
            : 'נהלי שאלות נפוצות שיוצגו בדף הבית הציבורי שלך. אם אין פריטים — הסקשן לא יופיע באתר.'}
        </p>
      </div>
      <FaqItemsForm initialItems={faqItems} />
    </div>
  )
}
