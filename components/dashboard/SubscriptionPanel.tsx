'use client'

import { useState } from 'react'
import { Check, Copy, Gift, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buildReferralLink,
  buildReferralShareText,
  daysUntilTrialEnd,
} from '@/lib/referral/referral-utils'
import { cn } from '@/lib/utils'

const ACCENT_BUTTON_CLASS =
  'bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44] focus-visible:ring-[#7D3A52]/40'

function SubscriptionSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative space-y-6 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      {children}
    </section>
  )
}

function SubscriptionSubPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[--border]/60 bg-white/80 p-5 shadow-sm shadow-[#7D3A52]/[0.03] md:p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

function SubscriptionSectionHeader({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: typeof Sparkles
  title: string
  description?: string
  index?: number
}) {
  return (
    <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {index !== undefined ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7D3A52]/10 px-1.5 text-[10px] font-semibold text-[#7D3A52]">
                {index}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold text-[--foreground]">{title}</h2>
          </div>
          {description ? (
            <p className="text-xs leading-relaxed text-[--muted]">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type SubscriptionPanelProps = {
  trialEndDate: string
  referralCode: string
}

export function SubscriptionPanel({
  trialEndDate,
  referralCode,
}: SubscriptionPanelProps) {
  const [copied, setCopied] = useState(false)
  const daysLeft = daysUntilTrialEnd(trialEndDate)
  const shareText = buildReferralShareText(referralCode)
  const referralLink = buildReferralLink(referralCode)

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <SubscriptionSection>
        <SubscriptionSectionHeader
          index={1}
          icon={Sparkles}
          title="תקופת הניסיון"
          description="כמה ימים נשארו לך בתקופת הניסיון החינמית"
        />
        <SubscriptionSubPanel>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/10 text-[#7D3A52]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-[--muted]">ימים שנשארו</p>
              <p className="mt-1 text-4xl font-bold text-[--foreground]">
                {daysLeft}
                <span className="mr-2 text-lg font-semibold text-[--muted]">ימים</span>
              </p>
            </div>
          </div>
        </SubscriptionSubPanel>
      </SubscriptionSection>

      <SubscriptionSection>
        <SubscriptionSectionHeader
          index={2}
          icon={Gift}
          title="חברה מביאה חברה"
          description="שתפי את הקישור האישי שלך עם צלמות אחרות וקבלי 30 יום נוספים לתקופת הניסיון"
        />

        <SubscriptionSubPanel className="space-y-5">
          <p className="text-sm leading-relaxed text-[--muted]">
            כשחברה נרשמת דרך הקישור שלך ויוצרת את הגלריה השנייה שלה — תקבלי{' '}
            <strong className="text-[--foreground]">30 יום נוספים</strong> לתקופת הניסיון.
          </p>

          <div className="rounded-xl border border-[#7D3A52]/10 bg-[#7D3A52]/[0.04] p-4 md:p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[--foreground]">
              {shareText}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="break-all text-xs text-[--muted]">{referralLink}</p>
            <Button type="button" onClick={handleCopy} className={cn(ACCENT_BUTTON_CLASS, 'shrink-0 gap-2')}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'הועתק!' : 'העתיקי את ההודעה והקישור'}
            </Button>
          </div>
        </SubscriptionSubPanel>
      </SubscriptionSection>
    </div>
  )
}
