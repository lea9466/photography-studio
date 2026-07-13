'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Languages } from 'lucide-react'
import {
  fetchSiteLanguage,
  updateSiteLanguage,
} from '@/lib/actions/site-settings.actions'
import type { SiteLanguage } from '@/lib/site-language'
import { cn } from '@/lib/utils'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { SITE_SETTINGS_HELP } from '@/lib/dashboard/site-settings-help'

type SiteLanguageSettingProps = {
  initialLanguage: SiteLanguage
}

const LANGUAGE_OPTIONS: {
  value: SiteLanguage
  title: string
  subtitle: string
  description: string
  directionLabel: string
}[] = [
  {
    value: 'he',
    title: 'עברית',
    subtitle: 'Hebrew',
    description: 'פריסה מימין לשמאל (RTL) — ברירת המחדל לסטודיו בישראל.',
    directionLabel: 'RTL',
  },
  {
    value: 'en',
    title: 'English',
    subtitle: 'אנגלית',
    description: 'פריסה משמאל לימין (LTR) — מתאים ללקוחות בינלאומיים ולתוכן באנגלית.',
    directionLabel: 'LTR',
  },
]

export function SiteLanguageSetting({ initialLanguage }: SiteLanguageSettingProps) {
  const [language, setLanguage] = useState<SiteLanguage>(initialLanguage)
  const [isPending, startTransition] = useTransition()

  function handleSelect(nextLanguage: SiteLanguage) {
    if (nextLanguage === language || isPending) return

    startTransition(async () => {
      try {
        await updateSiteLanguage(nextLanguage)
        setLanguage(nextLanguage)
        toast.success(
          nextLanguage === 'en'
            ? 'שפת האתר עודכנה לאנגלית'
            : 'שפת האתר עודכנה לעברית'
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון שפת האתר')
        const current = await fetchSiteLanguage()
        setLanguage(current)
      }
    })
  }

  return (
    <section className="relative space-y-7 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8">
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
            <Languages className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[--foreground]">שפת האתר הציבורי</h2>
              <HelpTooltip
                content={SITE_SETTINGS_HELP.fields.siteLanguage.content}
                where={SITE_SETTINGS_HELP.fields.siteLanguage.where}
              />
            </div>
            <p className="text-xs leading-relaxed text-[--muted]">
              {SITE_SETTINGS_HELP.fields.siteLanguage.where}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = language === option.value

          return (
            <button
              key={option.value}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'rounded-xl border-2 p-4 text-right transition-all',
                selected
                  ? 'border-[#7D3A52] bg-[#7D3A52]/5 shadow-sm'
                  : 'border-[--border]/80 bg-white/80 hover:border-[#7D3A52]/35',
                isPending && 'cursor-wait opacity-60'
              )}
            >
              <div className="flex flex-row-reverse items-start gap-3">
                <div
                  className={cn(
                    'shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                    selected
                      ? 'bg-[#7D3A52] text-white'
                      : 'bg-[#7D3A52]/[0.08] text-[#7D3A52]'
                  )}
                >
                  {option.directionLabel}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[--foreground]">{option.title}</p>
                    <span className="text-xs text-[--muted]">{option.subtitle}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[--muted]">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
