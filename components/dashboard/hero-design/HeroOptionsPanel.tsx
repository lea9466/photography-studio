'use client'

import type { ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  heroFeatureApplies,
  type HeroFeatureKey,
  type HeroOptions,
  type HeroOptionTiers,
  type HeroSettings,
} from '@/lib/public-site/hero-settings'
import { cn } from '@/lib/utils'
import { ProBadge } from './ProBadge'

type HeroOptionsPanelProps = {
  settings: HeroSettings
  tiers: HeroOptionTiers
  onChange: (patch: Partial<HeroOptions>) => void
}

function OptionRow({
  label,
  feature,
  tiers,
  disabledHint,
  children,
  inline,
}: {
  label: string
  feature: HeroFeatureKey
  tiers: HeroOptionTiers
  /** Shown instead of the control's effect when the option does nothing on this layout. */
  disabledHint?: string | null
  children: ReactNode
  inline?: boolean
}) {
  const disabled = Boolean(disabledHint)
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn('flex gap-3', inline ? 'items-center justify-between' : 'flex-col')}>
        <span className={cn('flex items-center gap-2 text-sm text-(--foreground)', disabled && 'opacity-50')}>
          {label}
          {tiers[feature] === 'pro' ? <ProBadge /> : null}
        </span>
        <div className={cn(disabled && 'pointer-events-none opacity-50')}>{children}</div>
      </div>
      {disabledHint ? <p className="text-xs text-(--muted)">{disabledHint}</p> : null}
    </div>
  )
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-lg border border-(--border) bg-white p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-[13px] transition-colors',
            value === option.value ? 'bg-[#7D3A52] text-white' : 'text-(--foreground) hover:bg-black/[0.04]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-(--border) pt-5">
      <h3 className="text-xs font-semibold tracking-wide text-(--muted)">{title}</h3>
      {children}
    </section>
  )
}

export function HeroOptionsPanel({ settings, tiers, onChange }: HeroOptionsPanelProps) {
  const hint = (feature: HeroFeatureKey, text: string) =>
    heroFeatureApplies(feature, settings.layout) ? null : text

  return (
    <>
      <Group title="תמונות ותנועה">
        <OptionRow label="מעבר בין תמונות" feature="transition" tiers={tiers}>
          <Segmented
            label="מעבר בין תמונות"
            value={settings.transition}
            onChange={(transition) => onChange({ transition })}
            options={[
              { value: 'fade', label: 'עמעום' },
              { value: 'zoom', label: 'זום איטי' },
              { value: 'cut', label: 'חיתוך' },
            ]}
          />
        </OptionRow>
        <OptionRow label="החלפת תמונה כל" feature="speed" tiers={tiers}>
          <Segmented
            label="קצב החלפת תמונות"
            value={settings.speedSeconds}
            onChange={(speedSeconds) => onChange({ speedSeconds })}
            options={[
              { value: 3, label: '3 שניות' },
              { value: 5, label: '5 שניות' },
              { value: 8, label: '8 שניות' },
            ]}
          />
        </OptionRow>
        <OptionRow
          inline
          label="התמונה קבועה בגלילה"
          feature="pin_on_scroll"
          tiers={tiers}
          disabledHint={hint('pin_on_scroll', 'זמין בפריסות קולנועי ממורכז ופנורמה.')}
        >
          <Switch
            aria-label="התמונה קבועה בגלילה"
            checked={settings.pinOnScroll}
            onCheckedChange={(pinOnScroll) => onChange({ pinOnScroll })}
          />
        </OptionRow>
      </Group>

      <Group title="טקסט וכפתורים">
        <OptionRow label="גודל הכותרת" feature="title_size" tiers={tiers}>
          <Segmented
            label="גודל הכותרת"
            value={settings.titleSize}
            onChange={(titleSize) => onChange({ titleSize })}
            options={[
              { value: 'sm', label: 'קטן' },
              { value: 'md', label: 'רגיל' },
              { value: 'lg', label: 'גדול' },
            ]}
          />
        </OptionRow>
        <OptionRow inline label="שם הצלמת מעל הכותרת" feature="hide_eyebrow" tiers={tiers}>
          <Switch
            aria-label="שם הצלמת מעל הכותרת"
            checked={settings.showEyebrow}
            onCheckedChange={(showEyebrow) => onChange({ showEyebrow })}
          />
        </OptionRow>
        <OptionRow inline label="כפתור שני (לגלריות)" feature="hide_secondary_cta" tiers={tiers}>
          <Switch
            aria-label="כפתור שני"
            checked={settings.showSecondaryCta}
            onCheckedChange={(showSecondaryCta) => onChange({ showSecondaryCta })}
          />
        </OptionRow>
        <OptionRow
          label="הכהיית התמונה מתחת לטקסט"
          feature="shade"
          tiers={tiers}
          disabledHint={hint('shade', 'זמין בפריסה קולנועי ממורכז, שבה הטקסט יושב על התמונה.')}
        >
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={settings.shade}
            aria-label="הכהיית התמונה"
            onChange={(event) => onChange({ shade: Number(event.target.value) })}
            className="w-full accent-[#7D3A52]"
          />
        </OptionRow>
        <OptionRow
          inline
          label='סימן "גללו" בתחתית'
          feature="hide_scroll_cue"
          tiers={tiers}
          disabledHint={hint('hide_scroll_cue', 'זמין בפריסה קולנועי ממורכז.')}
        >
          <Switch
            aria-label='סימן "גללו"'
            checked={settings.showScrollCue}
            onCheckedChange={(showScrollCue) => onChange({ showScrollCue })}
          />
        </OptionRow>
      </Group>
    </>
  )
}
