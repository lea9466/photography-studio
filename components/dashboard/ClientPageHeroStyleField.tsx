'use client'

import { Check } from 'lucide-react'
import { ClientPagePreview } from '@/components/dashboard/ClientPagePreview'
import type { ClientPageAccent } from '@/lib/branding/client-page-colors'
import type { ClientPageBackground } from '@/lib/branding/client-page-background'
import {
  CLIENT_PAGE_HERO_STYLES,
  CLIENT_PAGE_HERO_STYLE_LABELS,
  type ClientPageHeroStyle,
} from '@/lib/branding/client-page-hero-style'

type ClientPageHeroStyleFieldProps = {
  value: ClientPageHeroStyle
  onChange: (style: ClientPageHeroStyle) => void
  studioName: string | null
  accent: ClientPageAccent
  logoUrl: string | null
  background: ClientPageBackground
  headingFont: string | null
  disabled?: boolean
}

/**
 * Three real, live-rendered options — not labelled swatches — so what she
 * picks is exactly what the client will see, with her actual logo and colour.
 */
export function ClientPageHeroStyleField({
  value,
  onChange,
  studioName,
  accent,
  logoUrl,
  background,
  headingFont,
  disabled = false,
}: ClientPageHeroStyleFieldProps) {
  return (
    <div className="flex flex-col gap-4" role="radiogroup" aria-label="עיצוב ראש הדף">
      {CLIENT_PAGE_HERO_STYLES.map((style) => {
        const selected = style === value
        const label = CLIENT_PAGE_HERO_STYLE_LABELS[style]
        return (
          <button
            key={style}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(style)}
            className={`relative rounded-xl text-right transition disabled:opacity-50 ${
              selected ? 'ring-2 ring-[#6b2d43]' : 'ring-1 ring-[#c9c5cd] hover:ring-2 hover:ring-[#6b2d43]/50'
            }`}
          >
            {selected ? (
              <span className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#6b2d43] text-white">
                <Check className="h-4 w-4" />
              </span>
            ) : null}
            <ClientPagePreview
              studioName={studioName}
              accent={accent}
              logoUrl={logoUrl}
              heroStyle={style}
              background={background}
              headingFont={headingFont}
            />
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-[#100d1f]">{label.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#48464c]">{label.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
