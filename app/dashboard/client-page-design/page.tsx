import { redirect } from 'next/navigation'
import { Palette } from 'lucide-react'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { getClientPageDesign } from '@/lib/actions/client-page-design.actions'
import { ClientPageDesignExplainer } from '@/components/dashboard/ClientPageDesignExplainer'
import { ClientPageDesignForm } from '@/components/dashboard/ClientPageDesignForm'

/**
 * Studio-wide look of the page private-gallery clients see. One design for all
 * of her client galleries; the cover image is the only per-gallery part and is
 * set in each gallery's own settings.
 */
export default async function ClientPageDesignPage() {
  try {
    await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const result = await getClientPageDesign()

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 md:px-10 md:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-[--border] bg-[--dashboard-surface] px-7 py-6 md:px-9 md:py-7">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
              <Palette className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[--foreground] md:text-[1.65rem]">
                עיצוב גלריה פרטית
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[--muted]">
                איך נראה הדף שהלקוח רואה כשהוא נכנס לגלריה הפרטית שנשלחה אליו — אחד
                לכל הגלריות שלך.
              </p>
            </div>
          </div>
        </div>

        <ClientPageDesignExplainer />

        {result.ok ? (
          <ClientPageDesignForm design={result.design} />
        ) : (
          <p className="rounded-xl border border-[#7D3A52]/30 bg-[#7D3A52]/[0.06] px-5 py-4 text-sm text-[#7D3A52]">
            {result.error}
          </p>
        )}
      </div>
    </div>
  )
}
