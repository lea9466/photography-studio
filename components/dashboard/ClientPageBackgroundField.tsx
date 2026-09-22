'use client'

import { Check } from 'lucide-react'
import {
  CLIENT_PAGE_BACKGROUNDS,
  CLIENT_PAGE_BACKGROUND_LABELS,
  type ClientPageBackground,
} from '@/lib/branding/client-page-background'

type ClientPageBackgroundFieldProps = {
  value: ClientPageBackground
  onChange: (background: ClientPageBackground) => void
  disabled?: boolean
}

/** Light/dark swatches for the client-page background — see the live preview above for the real effect. */
export function ClientPageBackgroundField({ value, onChange, disabled = false }: ClientPageBackgroundFieldProps) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="רקע הדף">
      {CLIENT_PAGE_BACKGROUNDS.map((background) => {
        const selected = background === value
        const label = CLIENT_PAGE_BACKGROUND_LABELS[background]
        return (
          <button
            key={background}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(background)}
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
              selected
                ? 'border-[#6b2d43] bg-[#f7f2f4] text-[#100d1f]'
                : 'border-[#c9c5cd] text-[#48464c] hover:border-[#6b2d43]/50'
            }`}
          >
            <span
              className="h-5 w-5 rounded-full border border-black/10"
              style={{ backgroundColor: label.swatch }}
            />
            {label.name}
            {selected ? <Check className="h-4 w-4 text-[#6b2d43]" aria-hidden /> : null}
          </button>
        )
      })}
    </div>
  )
}
