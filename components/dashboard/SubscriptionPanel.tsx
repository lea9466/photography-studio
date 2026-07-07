'use client'

import { useState } from 'react'
import { Check, Copy, Gift, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buildReferralLink,
  buildReferralShareText,
  daysUntilTrialEnd,
} from '@/lib/referral/referral-utils'

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
    <div className="space-y-6">
      <section className="rounded-2xl border border-[--dashboard-border] bg-gradient-to-br from-[--dashboard-accent]/10 to-white p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[--dashboard-accent]/15 text-[--dashboard-accent]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-[--dashboard-muted]">תקופת הניסיון שלך</p>
            <p className="mt-1 text-4xl font-bold text-[--dashboard-foreground]">
              {daysLeft}
              <span className="mr-2 text-lg font-semibold text-[--dashboard-muted]">
                ימים נשארו
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[--dashboard-border] bg-white p-6 md:p-8 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Gift className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[--dashboard-foreground]">
              חברה מביאה חברה
            </h2>
            <p className="text-sm leading-relaxed text-[--dashboard-muted]">
              שתפי את הקישור האישי שלך עם צלמות אחרות. כשחברה נרשמת דרך הקישור שלך
              ויוצרת את הגלריה השנייה שלה — תקבלי{' '}
              <strong className="text-[--dashboard-foreground]">30 יום נוספים</strong>{' '}
              לתקופת הניסיון.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[--dashboard-border] bg-[--dashboard-surface] p-4 md:p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[--dashboard-foreground]">
            {shareText}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[--dashboard-muted] break-all">{referralLink}</p>
          <Button
            type="button"
            onClick={handleCopy}
            className="shrink-0 gap-2 bg-[--dashboard-accent] hover:bg-[--dashboard-accent]/90"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'הועתק!' : 'העתיקי את ההודעה והקישור'}
          </Button>
        </div>
      </section>
    </div>
  )
}
