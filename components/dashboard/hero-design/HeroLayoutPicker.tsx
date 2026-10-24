'use client'

import {
  HERO_LAYOUT_IDS,
  HERO_LAYOUT_LABELS,
  layoutOptionKey,
  type HeroLayoutId,
  type HeroOptionTiers,
} from '@/lib/public-site/hero-settings'
import { cn } from '@/lib/utils'
import { LayoutThumb } from './LayoutThumb'
import { ProBadge } from './ProBadge'

type HeroLayoutPickerProps = {
  selected: HeroLayoutId | null
  tiers: HeroOptionTiers
  onSelect: (layout: HeroLayoutId) => void
}

export function HeroLayoutPicker({ selected, tiers, onSelect }: HeroLayoutPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {HERO_LAYOUT_IDS.map((id) => {
        const active = selected === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            title={HERO_LAYOUT_LABELS[id].description}
            onClick={() => onSelect(id)}
            className={cn(
              'flex flex-col gap-1.5 rounded-xl border p-1.5 text-right transition-colors',
              active
                ? 'border-[#7D3A52] bg-[#7D3A52]/[0.06] ring-1 ring-[#7D3A52]'
                : 'border-(--border) bg-white hover:border-[#7D3A52]/40'
            )}
          >
            <LayoutThumb layout={id} />
            <span className="flex items-center justify-between gap-1 px-1 pb-0.5 text-[13px] font-semibold text-(--foreground)">
              {HERO_LAYOUT_LABELS[id].name}
              {tiers[layoutOptionKey(id)] === 'pro' ? <ProBadge /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
