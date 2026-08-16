'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Laptop, Smartphone } from 'lucide-react'
import { Reveal } from '@/components/marketing/Reveal'
import { ScaledFrame } from '@/components/marketing/ScaledFrame'

const EXAMPLE_SITE_PATH = '/lea-studio'
const EXAMPLE_SITE_NAME = 'לתפוס רגעים יפים'

// Keeps the phone mockup's rendered height equal to the desktop mockup's
// rendered height (both scale with viewport width), by deriving the phone's
// width from the desktop box's measured height and the phone's own aspect
// ratio + bezel border thickness.
const PHONE_ASPECT = 844 / 390
const PHONE_BEZEL_BORDER = 6

export function ExampleSiteShowcase() {
  const desktopRef = useRef<HTMLDivElement>(null)
  const [phoneWidth, setPhoneWidth] = useState(260)

  useEffect(() => {
    const el = desktopRef.current
    if (!el) return

    const update = () => {
      const contentHeight = el.offsetHeight - PHONE_BEZEL_BORDER * 2
      const width = contentHeight / PHONE_ASPECT + PHONE_BEZEL_BORDER * 2
      setPhoneWidth(Math.max(180, width))
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative overflow-hidden px-4 py-20" id="example">
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-400/10 blur-[100px]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight">
            אתר{' '}
            <span className="bg-gradient-to-l from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              דוגמה
            </span>{' '}
            — ככה יכול להיראות האתר שלך
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[--muted]">
            זהו אתר אמיתי שנבנה עם המערכת, לא הדמיה — אפשר לגלול וללחוץ בתוכו ממש כמו באתר החי.
            מתאים אוטומטית לכל סוגי המסכים, מחשב וטלפון כאחד.
          </p>
        </Reveal>

        <Reveal
          delayMs={120}
          className="mt-14 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center"
        >
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-center gap-1.5 pb-2 text-xs text-[--muted]">
              <Laptop className="h-3.5 w-3.5" />
              תצוגת מחשב
            </div>
            <div ref={desktopRef}>
              <div className="flex items-center gap-2 rounded-t-xl border border-[--border] bg-[--background] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="mx-auto flex items-center gap-1.5 rounded-full bg-[--foreground]/5 px-3 py-1 text-xs text-[--muted]">
                  studio-galleries.com{EXAMPLE_SITE_PATH}
                </span>
              </div>
              <div className="overflow-hidden rounded-b-xl border border-t-0 border-[--border] shadow-2xl shadow-black/10">
                <ScaledFrame
                  src={EXAMPLE_SITE_PATH}
                  title={`אתר דוגמה חי — ${EXAMPLE_SITE_NAME}`}
                  baseWidth={1280}
                  baseHeight={800}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0" style={{ width: phoneWidth }}>
            <div className="flex items-center justify-center gap-1.5 pb-2 text-xs text-[--muted]">
              <Smartphone className="h-3.5 w-3.5" />
              תצוגת טלפון
            </div>
            <div className="rounded-[2.2rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-2xl shadow-black/20">
              <div className="overflow-hidden rounded-[1.7rem]">
                <ScaledFrame
                  src={EXAMPLE_SITE_PATH}
                  title={`אתר דוגמה חי בתצוגת טלפון — ${EXAMPLE_SITE_NAME}`}
                  baseWidth={390}
                  baseHeight={844}
                />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={200}>
          <p className="mt-10 text-sm text-[--muted]">
            זהו אתר אמיתי שנבנה במערכת —{' '}
            <Link
              href={EXAMPLE_SITE_PATH}
              target="_blank"
              className="font-medium text-violet-600 underline underline-offset-4 hover:text-violet-700"
            >
              {EXAMPLE_SITE_NAME}
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
