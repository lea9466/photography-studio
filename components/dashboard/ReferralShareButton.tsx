'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { buildReferralShareText } from '@/lib/referral/referral-utils'

type ReferralShareButtonProps = {
  referralCode: string
  compact?: boolean
}

export function ReferralShareButton({
  referralCode,
  compact = false,
}: ReferralShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(buildReferralShareText(referralCode))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        compact
          ? 'flex h-10 w-10 items-center justify-center rounded-lg border border-[--dashboard-border] bg-[--dashboard-surface] text-[--dashboard-accent] hover:bg-[--dashboard-accent]/10 transition-colors'
          : 'flex w-full items-center gap-3 px-4 py-3 rounded-xl bg-[--dashboard-accent]/10 text-[--dashboard-accent] font-semibold border border-[--dashboard-accent]/20 hover:bg-[--dashboard-accent]/20 transition-all duration-200 mb-3'
      }
      aria-label="העתק קישור הפניה"
    >
      {copied ? (
        <Check className="h-5 w-5" />
      ) : (
        <Copy className="h-5 w-5" />
      )}
      {!compact && (
        <span className="text-sm">{copied ? 'הועתק!' : 'שתפי והרוויחי 30 יום'}</span>
      )}
    </button>
  )
}
