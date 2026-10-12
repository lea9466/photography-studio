'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SectionTone = 'burgundy' | 'rose' | 'violet' | 'amber' | 'emerald' | 'red'

// Literal class strings (Tailwind can't see dynamically built names).
const TONES: Record<
  SectionTone,
  { bar: string; icon: string; open: string; closed: string; hover: string; border: string; borderOpen: string; chevron: string; divider: string }
> = {
  burgundy: { bar: 'bg-[#7D3A52]', icon: 'bg-[#7D3A52]/10 text-[#7D3A52] ring-[#7D3A52]/15', open: 'bg-[#7D3A52]/[0.07]', closed: 'bg-[#7D3A52]/[0.025]', hover: 'hover:bg-[#7D3A52]/[0.09]', border: 'border-[#e8d9df]', borderOpen: 'border-[#7D3A52]/30 shadow-[0_2px_14px_rgba(125,58,82,0.10)]', chevron: 'text-[#7D3A52]/70', divider: 'border-[#7D3A52]/15' },
  rose: { bar: 'bg-[#db2777]', icon: 'bg-[#db2777]/10 text-[#be185d] ring-[#db2777]/15', open: 'bg-[#db2777]/[0.07]', closed: 'bg-[#db2777]/[0.025]', hover: 'hover:bg-[#db2777]/[0.09]', border: 'border-[#f5d5e5]', borderOpen: 'border-[#db2777]/30 shadow-[0_2px_14px_rgba(219,39,119,0.10)]', chevron: 'text-[#be185d]/70', divider: 'border-[#db2777]/15' },
  violet: { bar: 'bg-[#7c3aed]', icon: 'bg-[#7c3aed]/10 text-[#6d28d9] ring-[#7c3aed]/15', open: 'bg-[#7c3aed]/[0.07]', closed: 'bg-[#7c3aed]/[0.025]', hover: 'hover:bg-[#7c3aed]/[0.09]', border: 'border-[#e4dbf7]', borderOpen: 'border-[#7c3aed]/30 shadow-[0_2px_14px_rgba(124,58,237,0.10)]', chevron: 'text-[#6d28d9]/70', divider: 'border-[#7c3aed]/15' },
  amber: { bar: 'bg-[#d97706]', icon: 'bg-[#d97706]/10 text-[#b45309] ring-[#d97706]/15', open: 'bg-[#d97706]/[0.08]', closed: 'bg-[#d97706]/[0.03]', hover: 'hover:bg-[#d97706]/[0.10]', border: 'border-[#f3e2c4]', borderOpen: 'border-[#d97706]/30 shadow-[0_2px_14px_rgba(217,119,6,0.10)]', chevron: 'text-[#b45309]/70', divider: 'border-[#d97706]/15' },
  emerald: { bar: 'bg-[#059669]', icon: 'bg-[#059669]/10 text-[#047857] ring-[#059669]/15', open: 'bg-[#059669]/[0.07]', closed: 'bg-[#059669]/[0.025]', hover: 'hover:bg-[#059669]/[0.09]', border: 'border-[#cfeadf]', borderOpen: 'border-[#059669]/30 shadow-[0_2px_14px_rgba(5,150,105,0.10)]', chevron: 'text-[#047857]/70', divider: 'border-[#059669]/15' },
  red: { bar: 'bg-[#dc2626]', icon: 'bg-[#dc2626]/10 text-[#b91c1c] ring-[#dc2626]/15', open: 'bg-[#dc2626]/[0.06]', closed: 'bg-[#dc2626]/[0.02]', hover: 'hover:bg-[#dc2626]/[0.08]', border: 'border-[#f3d4d4]', borderOpen: 'border-[#dc2626]/30 shadow-[0_2px_14px_rgba(220,38,38,0.10)]', chevron: 'text-[#b91c1c]/70', divider: 'border-[#dc2626]/15' },
}

type CollapsibleSectionProps = {
  /** Accent colour of the card — gives each topic its own identity. */
  tone?: SectionTone
  /** DOM id — also the value of `?section=` that force-opens this section. */
  id?: string
  icon?: React.ReactNode
  title: string
  /** One-line digest shown next to the title while collapsed. */
  summary?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  /** Extra classes applied only while open — e.g. `md:col-span-2` so a card
   * sitting in a two-column grid takes the full row once expanded. */
  openClassName?: string
}

/**
 * A dashboard section whose body can be folded behind its header. The body
 * stays mounted while closed (just `hidden`), so form state inside it survives
 * a collapse. A `?section=<id>` deep link (see ScrollToSection) opens it.
 */
export function CollapsibleSection({
  tone = 'burgundy',
  id,
  icon,
  title,
  summary,
  defaultOpen = false,
  children,
  className,
  openClassName,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (!id) return
    const target =
      new URLSearchParams(window.location.search).get('section') ||
      window.location.hash.replace(/^#/, '')
    if (target === id) setOpen(true)
  }, [id])

  const t = TONES[tone]
  const bodyId = id ? `${id}-body` : undefined

  return (
    <section
      id={id}
      className={cn(
        'relative scroll-mt-24 overflow-hidden rounded-2xl border bg-white transition-colors md:scroll-mt-8',
        open ? t.borderOpen : t.border,
        className,
        open && openClassName
      )}
    >
      <span className={cn('absolute inset-y-0 right-0 w-1', t.bar)} aria-hidden />
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={bodyId}
        className={cn(
          'flex w-full items-center gap-3 py-4 pl-5 pr-6 text-right transition-colors sm:pl-6 sm:pr-7',
          t.hover,
          open ? t.open : t.closed
        )}
      >
        {icon ? (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1', t.icon)}>
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-[#100d1f] sm:text-lg">
            {title}
          </span>
          {summary ? (
            <span className="mt-0.5 block truncate text-sm text-[#48464c]">{summary}</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 transition-transform duration-200',
            t.chevron,
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>
      <div id={bodyId} hidden={!open} className={cn('border-t p-5 sm:p-6', t.divider)}>
        {children}
      </div>
    </section>
  )
}
