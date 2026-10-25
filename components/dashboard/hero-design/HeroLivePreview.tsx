'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import type { HeroSettings } from '@/lib/public-site/hero-settings'
import {
  HERO_PREVIEW_READY_MESSAGE,
  HERO_PREVIEW_SETTINGS_MESSAGE,
  heroPreviewPath,
  type HeroPreviewSettingsMessage,
} from '@/lib/public-site/hero-preview'
import { cn } from '@/lib/utils'

type Size = { width: number; height: number }
type Device = 'desktop' | 'mobile'

const MOBILE_SIZE: Size = { width: 390, height: 780 }
const FALLBACK_DESKTOP_SIZE: Size = { width: 1280, height: 800 }
const MIN_DESKTOP_WIDTH = 1024

/**
 * Desktop preview = this browser window's own size — the size she'd see her
 * site at. The layouts respond to width, so a fixed 1280px frame looked
 * different from the real site on a wider screen.
 */
function currentDesktopSize(): Size {
  return { width: Math.max(MIN_DESKTOP_WIDTH, window.innerWidth), height: window.innerHeight }
}

type HeroLivePreviewProps = {
  /** The studio's public homepage path, e.g. "/my-studio". */
  sitePath: string
  settings: HeroSettings | null
}

/**
 * The studio's real homepage in an iframe at a real desktop/phone width
 * (so its own media queries and viewport units apply), scaled down to fit.
 * Unsaved hero settings are posted into it on every change — see
 * lib/public-site/hero-preview.ts.
 */
export function HeroLivePreview({ sitePath, settings }: HeroLivePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const settingsRef = useRef(settings)
  const [device, setDevice] = useState<Device>('desktop')
  const [availableWidth, setAvailableWidth] = useState(0)
  const [desktopSize, setDesktopSize] = useState<Size>(FALLBACK_DESKTOP_SIZE)

  const post = (value: HeroSettings | null) => {
    const message: HeroPreviewSettingsMessage = { type: HERO_PREVIEW_SETTINGS_MESSAGE, settings: value }
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin)
  }

  useEffect(() => {
    settingsRef.current = settings
    post(settings)
  }, [settings])

  // The site announces when it's listening (first load, or after navigating
  // inside the frame) — answer with the current settings.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      if ((event.data as { type?: unknown } | null)?.type === HERO_PREVIEW_READY_MESSAGE) post(settingsRef.current)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const update = () => setDesktopSize(currentDesktopSize())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const size = device === 'desktop' ? desktopSize : MOBILE_SIZE
  const scale = availableWidth ? Math.min(1, availableWidth / size.width, device === 'mobile' ? 0.9 : 1) : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs text-(--muted)">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          תצוגה חיה של האתר שלך. כל שינוי מופיע מיד, ואפשר לגלול בתוכה.
        </span>
        <div role="group" aria-label="גודל תצוגה" className="inline-flex gap-0.5 rounded-lg border border-(--border) bg-white p-0.5">
          {(
            [
              ['desktop', 'מחשב', Monitor],
              ['mobile', 'נייד', Smartphone],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px]',
                device === id ? 'bg-[#7D3A52] text-white' : 'text-(--foreground) hover:bg-black/[0.04]'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="flex w-full justify-center">
        <div
          className={cn(
            'relative overflow-hidden bg-black shadow-xl ring-1 ring-black/10',
            device === 'mobile' ? 'rounded-[28px] ring-[8px] ring-[#1b1719]' : 'rounded-xl'
          )}
          style={{ width: size.width * scale, height: size.height * scale }}
        >
          <iframe
            ref={iframeRef}
            src={heroPreviewPath(sitePath)}
            title="תצוגה מקדימה של האתר"
            className="absolute top-0 left-0 origin-top-left border-0 bg-white"
            style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}
            onLoad={() => post(settingsRef.current)}
          />
        </div>
      </div>
    </div>
  )
}
