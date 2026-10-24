'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveHeroSettings } from '@/lib/actions/hero-settings.actions'
import {
  DEFAULT_HERO_OPTIONS,
  HERO_LAYOUT_LABELS,
  heroOptionLabel,
  proHeroOptionsInUse,
  withoutProHeroOptions,
  type HeroLayoutId,
  type HeroOptions,
  type HeroOptionTiers,
  type HeroSettings,
} from '@/lib/public-site/hero-settings'
import { cn } from '@/lib/utils'
import { HeroLayoutPicker } from './HeroLayoutPicker'
import { HeroLivePreview } from './HeroLivePreview'
import { HeroOptionsPanel } from './HeroOptionsPanel'

type HeroDesignEditorProps = {
  initialSettings: HeroSettings | null
  tiers: HeroOptionTiers
  isPro: boolean
  /** Hebrew theme name, e.g. "קלאסית". */
  themeName: string
  /** Public homepage path for the live preview; null when the site has no address yet. */
  sitePath: string | null
}

function ThemeHeroBox({
  settings,
  themeName,
  onBackToTheme,
}: {
  settings: HeroSettings | null
  themeName: string
  onBackToTheme: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm leading-relaxed',
        settings ? 'border-(--border) bg-(--dashboard-surface)' : 'border-[#7D3A52]/40 bg-[#7D3A52]/[0.05]'
      )}
    >
      <p className="font-semibold text-(--foreground)">
        {settings ? `הירו בעיצוב אישי: ${HERO_LAYOUT_LABELS[settings.layout].name}` : 'ההירו של הערכה'}
      </p>
      <p className="text-(--muted)">
        {settings
          ? 'אפשר לבטל בכל רגע ולחזור להירו המקורי של הערכה.'
          : `מוצג ההירו המקורי של ערכת ${themeName}, כמו תמיד. בחרי פריסה כדי לעצב הירו אחר.`}
      </p>
      {settings ? (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={onBackToTheme}>
          ביטול וחזרה להירו של הערכה
        </Button>
      ) : null}
    </div>
  )
}

/**
 * Dashboard hero editor: pick a shared layout (or keep the theme's own hero),
 * tune its options, watch the real site update live, save. Free studios can
 * try every option; saving one that's PRO-only asks them to upgrade.
 */
export function HeroDesignEditor({ initialSettings, tiers, isPro, themeName, sitePath }: HeroDesignEditorProps) {
  const [settings, setSettings] = useState<HeroSettings | null>(initialSettings)
  const [saved, setSaved] = useState<HeroSettings | null>(initialSettings)
  const [saving, startSaving] = useTransition()

  const proUsed = settings && !isPro ? proHeroOptionsInUse(settings, tiers) : []
  const blocked = proUsed.length > 0
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved)

  const pickLayout = (layout: HeroLayoutId) =>
    setSettings((current) => (current ? { ...current, layout } : { layout, ...DEFAULT_HERO_OPTIONS }))
  const changeOptions = (patch: Partial<HeroOptions>) =>
    setSettings((current) => (current ? { ...current, ...patch } : current))

  function save() {
    startSaving(async () => {
      const result = await saveHeroSettings(settings)
      if (!result.ok) {
        toast.error(result.proOptions?.length ? `${result.error}: ${result.proOptions.join(', ')}` : result.error)
        return
      }
      setSaved(settings)
      toast.success(settings ? 'ההירו נשמר ומופיע עכשיו באתר' : 'האתר חזר להירו של הערכה')
    })
  }

  return (
    <section className="space-y-5 rounded-2xl border border-(--border)/80 bg-(--dashboard-surface) p-5 md:p-7">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-(--foreground)">עיצוב הסקשן הראשי</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-(--muted)">
          בחרי איך יסודרו התמונות, השם והכפתורים בראש דף הבית, בלי להחליף ערכת נושא. הצבעים והגופנים
          נשארים של הערכה שלך, והתמונות הן תמונות הסקשן הראשי שכבר העלית.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 rounded-xl border border-(--border) bg-white p-4">
          <ThemeHeroBox settings={settings} themeName={themeName} onBackToTheme={() => setSettings(null)} />

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-(--muted)">פריסה</h3>
            <HeroLayoutPicker selected={settings?.layout ?? null} tiers={tiers} onSelect={pickLayout} />
          </div>
        </div>

        {/* Preview + the chosen layout's own settings + save stay in view while
            scrolling through the layout picker. */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4">
          {sitePath ? (
            <HeroLivePreview sitePath={sitePath} settings={settings} />
          ) : (
            <p className="rounded-xl border border-dashed border-(--border) p-6 text-sm text-(--muted)">
              התצוגה החיה תופיע אחרי שלאתר תהיה כתובת. אפשר להגדיר אותה בהגדרות האתר.
            </p>
          )}

          <div className="flex flex-col gap-4 rounded-xl border border-(--border) bg-white p-4">
            {settings ? (
              <>
                <h3 className="text-sm font-semibold text-(--foreground)">
                  הגדרות לפריסת {HERO_LAYOUT_LABELS[settings.layout].name}
                </h3>
                <HeroOptionsPanel settings={settings} tiers={tiers} onChange={changeOptions} />
              </>
            ) : (
              <p className="text-sm text-(--muted)">בחרי פריסה כדי לראות את ההגדרות שלה.</p>
            )}

            <div className="flex flex-col gap-3 border-t border-(--border) pt-4">
              {blocked && settings ? (
                <div className="space-y-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[13px] leading-relaxed text-amber-900">
                  <p>
                    <b>בחרת אפשרויות של מנוי פרו:</b> {proUsed.map(heroOptionLabel).join(', ')}. אפשר לראות ולנסות
                    אותן בתצוגה, ולשמור רק במנוי פרו.
                  </p>
                  <button
                    type="button"
                    className="text-[13px] font-medium text-[#7D3A52] underline"
                    onClick={() => setSettings(withoutProHeroOptions(settings, tiers))}
                  >
                    חזרה לאפשרויות החינמיות
                  </button>
                </div>
              ) : null}
  
              {dirty && !blocked ? (
                <p className="flex items-center gap-2 text-[13px] font-medium text-[#7D3A52]">
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#7D3A52]" aria-hidden />
                  יש שינויים שלא נשמרו. הם מופיעים בתצוגה, אבל עוד לא באתר.
                </p>
              ) : null}

              <div className="flex items-center gap-2">
                {blocked ? (
                  <Button asChild size="lg" className="flex-1 bg-amber-600 font-semibold text-white hover:bg-amber-700">
                    <Link href="/dashboard/subscription">שדרגי לפרו כדי לשמור</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    className="flex-1 bg-[#7D3A52] font-semibold text-white shadow-md shadow-[#7D3A52]/30 hover:bg-[#6a2f44] disabled:shadow-none"
                    disabled={!dirty || saving}
                    onClick={save}
                  >
                    {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                    {saving ? 'שומרת...' : dirty ? 'שמירת עיצוב ההירו' : 'עיצוב ההירו שמור'}
                  </Button>
                )}
                <Button type="button" variant="outline" size="lg" disabled={!dirty || saving} onClick={() => setSettings(saved)}>
                  ביטול שינויים
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
