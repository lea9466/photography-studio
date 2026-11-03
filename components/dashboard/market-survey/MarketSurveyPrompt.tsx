'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { claimMarketSurveyShow } from '@/lib/actions/market-survey.actions'
import { MARKET_SURVEY_DELAY_MS } from '@/lib/market-survey/questions'
import { cn } from '@/lib/utils'
import { MarketSurveyForm } from './MarketSurveyForm'

const CHECKED_THIS_SESSION_KEY = 'market-survey-checked'
/** Pages where someone may be typing card details. */
const PAYMENT_PATHS = ['/dashboard/subscription', '/dashboard/usage-packages', '/dashboard/custom-domain']

function checkedThisSession() {
  try {
    return sessionStorage.getItem(CHECKED_THIS_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function markCheckedThisSession() {
  try {
    sessionStorage.setItem(CHECKED_THIS_SESSION_KEY, '1')
  } catch {
    // Blocked storage only means one more server check, which stays capped.
  }
}

/**
 * Asks the server only once the delay has passed, so a short visit costs no
 * query. The server decides whether to show it and how many times it has.
 */
export function MarketSurveyPrompt({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const onPaymentPage = PAYMENT_PATHS.some((path) => pathname.startsWith(path))
  const [view, setView] = useState<'closed' | 'form' | 'thanks'>('closed')
  const [isSubscriber, setIsSubscriber] = useState(false)

  useEffect(() => {
    if (!enabled || onPaymentPage || checkedThisSession()) return

    const timer = setTimeout(async () => {
      markCheckedThisSession()
      const result = await claimMarketSurveyShow()
      if (result.show) {
        setIsSubscriber(result.isSubscriber)
        setView('form')
      }
    }, MARKET_SURVEY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [enabled, onPaymentPage])

  return (
    <Dialog open={view !== 'closed'} onOpenChange={(next) => !next && setView('closed')}>
      <DialogContent
        className={cn(
          'flex max-h-[90vh] max-w-xl flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl shadow-[#4c1d95]/30',
          view === 'thanks' ? 'max-w-md [&>button]:text-[#71717a]' : '[&>button]:text-white'
        )}
        overlayClassName="bg-[#1e1033]/55 backdrop-blur-sm"
        // A stray click outside shouldn't throw away half-filled answers.
        onInteractOutside={(event) => event.preventDefault()}
      >
        {view === 'thanks' ? (
          <div className="flex flex-col items-center px-8 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] shadow-lg shadow-[#7c3aed]/30">
              <Check aria-hidden className="h-7 w-7 text-white" strokeWidth={2} />
            </span>
            <DialogHeader className="mt-6 sm:text-center">
              <DialogTitle className="text-2xl font-light tracking-tight text-[#09090b]">תודה רבה</DialogTitle>
              <DialogDescription className="text-[15px] leading-6 text-[#71717a]">
                התשובות שלך יעזרו לנו להחליט מה לבנות הלאה.
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={() => setView('closed')}
              className="mt-7 h-11 rounded-xl bg-gradient-to-l from-[#7c3aed] to-[#4c1d95] px-10 font-medium text-white shadow-md shadow-[#7c3aed]/25 hover:scale-100"
            >
              סגירה
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="shrink-0 bg-gradient-to-l from-[#6d28d9] to-[#2e1065] px-5 pb-7 pt-8 text-right sm:px-8 sm:text-right">
              <p className="text-xs font-medium tracking-[0.2em] text-white/60">STG · סקר קצר</p>
              <DialogTitle className="pe-6 text-[28px] font-light leading-tight tracking-tight text-white">
                יש לך דקה בשבילנו?
              </DialogTitle>
              <DialogDescription className="text-[15px] leading-6 text-white/80">
                כמה שאלות קצרות שיעזרו לנו להבין מה באמת נכון לצלמות.
              </DialogDescription>
            </DialogHeader>
            <MarketSurveyForm isSubscriber={isSubscriber} onDone={() => setView('thanks')} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
