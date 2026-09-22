'use client'

import { useEffect, useId, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  CLIENT_PAGE_ACCENT_PRESETS,
  normalizeHexColor,
  readableTextColor,
} from '@/lib/branding/client-page-colors'

type ClientPageColorFieldProps = {
  /** The colour currently shown, as a normalized `#rrggbb`. */
  value: string
  onChange: (hex: string) => void
  disabled?: boolean
}

const RAINBOW =
  'conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)'

/**
 * Preset swatches plus a "pick any colour" circle at the end of the same row,
 * and a hex box — all editing the same colour. When the current colour isn't
 * one of the presets, the last circle takes that colour and shows as selected.
 */
export function ClientPageColorField({ value, onChange, disabled = false }: ClientPageColorFieldProps) {
  const hexInputId = useId()
  const [text, setText] = useState(value)
  const isCustom = !CLIENT_PAGE_ACCENT_PRESETS.some((preset) => preset.hex === value)

  // A swatch or the picker changed the colour from outside the text box.
  useEffect(() => {
    setText(value)
  }, [value])

  function handleText(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    setText(next)
    const normalized = normalizeHexColor(next.startsWith('#') ? next : `#${next}`)
    if (normalized) onChange(normalized)
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center gap-2.5"
        role="group"
        aria-label="צבעים מוכנים ובחירת צבע אחר"
      >
        {CLIENT_PAGE_ACCENT_PRESETS.map((preset) => {
          const selected = preset.hex === value
          return (
            <button
              key={preset.hex}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(preset.hex)}
              className={`h-9 w-9 rounded-full ring-offset-2 transition disabled:opacity-50 ${
                selected ? 'ring-2 ring-[#100d1f]' : 'ring-1 ring-[#c9c5cd] hover:ring-2'
              }`}
              style={{ backgroundColor: preset.hex }}
            />
          )
        })}

        {/* The native picker sits invisibly over the circle, so a click opens it directly. */}
        <div
          title="בחירת צבע אחר"
          className={`relative h-9 w-9 overflow-hidden rounded-full ring-offset-2 transition focus-within:ring-2 focus-within:ring-[#100d1f] ${
            isCustom ? 'ring-2 ring-[#100d1f]' : 'ring-1 ring-[#c9c5cd] hover:ring-2'
          } ${disabled ? 'opacity-50' : ''}`}
          style={{ background: isCustom ? value : RAINBOW }}
        >
          <Plus
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto h-4 w-4 drop-shadow"
            style={{ color: isCustom ? readableTextColor(value) : '#ffffff' }}
          />
          <input
            type="color"
            aria-label="בחירת צבע אחר"
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor={hexInputId} className="text-sm text-[#48464c]">
          קוד צבע
        </label>
        <input
          id={hexInputId}
          dir="ltr"
          value={text}
          maxLength={7}
          disabled={disabled}
          onChange={handleText}
          placeholder="#6b2d43"
          className="h-11 w-32 rounded-xl border border-[#c9c5cd] bg-white px-3 text-sm outline-none focus:border-[#6b2d43] focus:ring-2 focus:ring-[#6b2d43]/20 disabled:opacity-50"
        />
      </div>
    </div>
  )
}
