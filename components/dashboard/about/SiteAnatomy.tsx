import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ABOUT_TONE, type AboutTone } from './AboutKit'

/**
 * A stylised browser window showing the public homepage as a stack of
 * labelled section blocks — the "what the site is built from" diagram.
 */
export function SiteAnatomy({
  sections,
}: {
  sections: { label: string; hint?: string; tone: AboutTone; pro?: boolean }[]
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[--border] bg-white shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-[--border] bg-[--dashboard-surface] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span
          dir="ltr"
          className="mr-2 truncate rounded-md bg-white px-2 py-0.5 text-[11px] text-[--muted] ring-1 ring-[--border]"
        >
          studio-galleries.com/my-studio
        </span>
      </div>
      <div className="space-y-2 p-3 md:p-4">
        {sections.map((section) => {
          const t = ABOUT_TONE[section.tone]
          return (
            <div
              key={section.label}
              className={cn(
                'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border px-4 py-3',
                t.surface
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[--foreground]">
                {section.label}
                {section.pro ? (
                  <span className="rounded-full bg-[#7D3A52]/10 px-2 py-0.5 text-[10px] font-bold text-[#7D3A52]">
                    פרו
                  </span>
                ) : null}
              </span>
              {section.hint ? (
                <span className="text-xs text-[--muted]">{section.hint}</span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * "Dashboard tab → the site section it fills" — a plain aligned list, tab on
 * the start edge, an arrow, the section it powers on the end edge.
 */
export function TabSectionMap({
  rows,
}: {
  rows: { icon: ReactNode; tab: string; section: string }[]
}) {
  return (
    <div className="divide-y divide-[--border] overflow-hidden rounded-2xl border border-[--border] bg-white">
      {rows.map((row) => (
        <div key={row.tab} className="flex items-center gap-3 px-4 py-3 md:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7D3A52]/10 text-[#7D3A52]">
            {row.icon}
          </span>
          <span className="flex-1 text-sm font-medium text-[--foreground]">
            {row.tab}
          </span>
          <ChevronLeft className="h-4 w-4 shrink-0 text-[--muted]" aria-hidden />
          <span className="flex-1 text-end text-sm text-[--muted]">
            {row.section}
          </span>
        </div>
      ))}
    </div>
  )
}
