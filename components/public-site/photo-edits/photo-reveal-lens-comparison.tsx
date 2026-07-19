'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export type PhotoRevealLensComparisonProps = {
  originalImageUrl: string
  editedImageUrl: string
  title?: string | null
  description?: string | null
  priority?: boolean
  index?: number
  language?: 'he' | 'en'
  className?: string
}

type LoadState = 'loading' | 'ready' | 'edited-only' | 'error'

function copyFor(language: 'he' | 'en') {
  const he = language !== 'en'
  return {
    hintDesktop: he ? 'הזיזו כדי לחשוף את המקור' : 'Move to reveal the original',
    hintMobile: he ? 'גררו כדי לחשוף את המקור' : 'Drag to reveal the original',
    lensLabel: he ? 'מקור' : 'Original',
    labelOriginal: he ? 'מקור' : 'Original',
    labelFinal: he ? 'תוצאה סופית' : 'Final edit',
    showOriginal: he ? 'הציגו את המקור' : 'Show original',
    showResult: he ? 'חזרה לתוצאה' : 'Back to result',
    loadError: he ? 'לא הצלחנו לטעון את ההשוואה' : 'We could not load this comparison',
    regionLabel: he ? 'עדשת חשיפה — גררו כדי לראות את המקור' : 'Reveal lens — drag to see the original',
  }
}

export function PhotoRevealLensComparison({
  originalImageUrl,
  editedImageUrl,
  title,
  description,
  priority = false,
  index = 0,
  language = 'he',
  className,
}: PhotoRevealLensComparisonProps) {
  const copy = copyFor(language)
  const frameRef = useRef<HTMLDivElement>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [loaded, setLoaded] = useState({ original: false, edited: false })
  const [failed, setFailed] = useState({ original: false, edited: false })
  const [fullOriginal, setFullOriginal] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [coarse, setCoarse] = useState(false)
  const guidedRef = useRef(false)
  const draggingRef = useRef(false)
  const pendingRef = useRef<{ id: number; x: number; y: number } | null>(null)
  const lensRef = useRef({ x: 0.5, y: 0.5 })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = window.matchMedia('(pointer: coarse)')
    const sync = () => {
      setReducedMotion(motion.matches)
      setCoarse(pointer.matches)
    }
    sync()
    motion.addEventListener('change', sync)
    pointer.addEventListener('change', sync)
    return () => {
      motion.removeEventListener('change', sync)
      pointer.removeEventListener('change', sync)
    }
  }, [])

  useEffect(() => {
    if (failed.edited) {
      setLoadState('error')
      return
    }
    if (!loaded.edited) return
    if (failed.original) {
      setLoadState('edited-only')
      return
    }
    if (!loaded.original) return
    setLoadState('ready')
  }, [loaded, failed])

  useEffect(() => {
    if (loadState !== 'ready' || guidedRef.current || reducedMotion) return
    guidedRef.current = true
    setShowHint(true)
    const timer = window.setTimeout(() => setShowHint(false), 2600)
    return () => window.clearTimeout(timer)
  }, [loadState, reducedMotion])

  function applyLens() {
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const size = parseFloat(getComputedStyle(frame).getPropertyValue('--lens-size')) || 150
    const r = size / 2
    let x = lensRef.current.x * rect.width
    let y = lensRef.current.y * rect.height
    x = Math.max(r, Math.min(rect.width - r, x))
    y = Math.max(r, Math.min(rect.height - r, y))
    lensRef.current = { x: x / rect.width, y: y / rect.height }
    frame.style.setProperty('--lens-x', `${(lensRef.current.x * 100).toFixed(3)}%`)
    frame.style.setProperty('--lens-y', `${(lensRef.current.y * 100).toFixed(3)}%`)
  }

  function setFromClient(clientX: number, clientY: number) {
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    lensRef.current = {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    }
    applyLens()
  }

  useEffect(() => {
    applyLens()
    window.addEventListener('resize', applyLens)
    return () => window.removeEventListener('resize', applyLens)
  }, [loadState])

  const interactive = loadState === 'ready' && !fullOriginal
  const pad = String(index + 1).padStart(2, '0')
  const layout =
    index % 2 === 1 ? 'md:grid md:grid-cols-[0.9fr_1.7fr] md:items-center md:gap-10' : 'space-y-5'

  return (
    <figure className={cn('w-full', layout, className)}>
      <div className={cn(index % 2 === 1 ? 'md:order-2' : undefined)}>
        {(title || description) && (
          <div className={cn('mb-5', index % 2 === 0 && 'text-center')}>
            <p className="mb-2 text-xs tracking-[0.16em] opacity-40">{pad}</p>
            {title ? (
              <h2 className="text-2xl font-medium tracking-tight md:text-3xl">{title}</h2>
            ) : null}
            {description ? (
              <p
                className={cn(
                  'mt-2 max-w-xl text-sm leading-relaxed opacity-70 md:text-base',
                  index % 2 === 0 && 'mx-auto'
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
        )}
        {!title && !description ? (
          <p className={cn('mb-4 text-xs tracking-[0.16em] opacity-40', index % 2 === 0 && 'text-center')}>
            {pad}
          </p>
        ) : null}
      </div>

      <div className={cn(index % 2 === 1 ? 'md:order-1' : undefined)}>
        <div
          ref={frameRef}
          tabIndex={interactive ? 0 : -1}
          role="application"
          aria-label={copy.regionLabel}
          className={cn(
            'relative mx-auto aspect-[4/5] w-full max-w-[1100px] overflow-hidden bg-black/5 outline-none md:aspect-[3/4]',
            'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30',
            '[--lens-x:50%] [--lens-y:50%] [--lens-size:150px] md:[--lens-size:220px]',
            isDragging ? 'touch-none' : '[touch-action:pan-y]',
            fullOriginal && 'cursor-default'
          )}
          onPointerDown={(event) => {
            if (!interactive) return
            if (event.pointerType === 'mouse' && event.button !== 0) return
            if (event.pointerType === 'touch' || coarse) {
              pendingRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
              return
            }
            draggingRef.current = true
            setIsDragging(true)
            setShowHint(false)
            event.currentTarget.setPointerCapture(event.pointerId)
            setFromClient(event.clientX, event.clientY)
            event.preventDefault()
          }}
          onPointerMove={(event) => {
            if (!interactive) return
            const pending = pendingRef.current
            if (pending && event.pointerId === pending.id) {
              const dx = event.clientX - pending.x
              const dy = event.clientY - pending.y
              if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
              if (Math.abs(dy) > Math.abs(dx)) {
                pendingRef.current = null
                return
              }
              pendingRef.current = null
              draggingRef.current = true
              setIsDragging(true)
              setShowHint(false)
              event.currentTarget.setPointerCapture(event.pointerId)
              setFromClient(event.clientX, event.clientY)
              event.preventDefault()
              return
            }
            if (draggingRef.current) {
              setFromClient(event.clientX, event.clientY)
              event.preventDefault()
              return
            }
            if (event.pointerType === 'mouse' && !coarse) {
              setFromClient(event.clientX, event.clientY)
            }
          }}
          onPointerUp={(event) => {
            pendingRef.current = null
            if (!draggingRef.current) return
            draggingRef.current = false
            setIsDragging(false)
            try {
              event.currentTarget.releasePointerCapture(event.pointerId)
            } catch {
              // ignore
            }
          }}
          onKeyDown={(event) => {
            if (!interactive) return
            const step = event.shiftKey ? 0.08 : 0.03
            let handled = true
            if (event.key === 'ArrowLeft') lensRef.current.x -= step
            else if (event.key === 'ArrowRight') lensRef.current.x += step
            else if (event.key === 'ArrowUp') lensRef.current.y -= step
            else if (event.key === 'ArrowDown') lensRef.current.y += step
            else handled = false
            if (!handled) return
            event.preventDefault()
            applyLens()
            setShowHint(false)
          }}
        >
          {loadState === 'loading' ? (
            <div className="absolute inset-0 z-10 animate-pulse bg-neutral-200/60" aria-hidden />
          ) : null}

          {loadState === 'error' ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center text-sm text-neutral-600">
              {copy.loadError}
            </div>
          ) : null}

          <Image
            src={editedImageUrl}
            alt={title ? `${title} — ${copy.labelFinal}` : copy.labelFinal}
            fill
            sizes="(max-width: 768px) 100vw, min(1100px, 92vw)"
            priority={priority}
            className="object-cover"
            onLoad={() => setLoaded((current) => ({ ...current, edited: true }))}
            onError={() => setFailed((current) => ({ ...current, edited: true }))}
          />

          {!failed.original ? (
            <div
              aria-hidden
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                fullOriginal
                  ? 'opacity-100'
                  : '[mask-image:radial-gradient(circle_var(--lens-size)_at_var(--lens-x)_var(--lens-y),#000_0%,#000_96%,transparent_100%)] [-webkit-mask-image:radial-gradient(circle_var(--lens-size)_at_var(--lens-x)_var(--lens-y),#000_0%,#000_96%,transparent_100%)]'
              )}
            >
              <Image
                src={originalImageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, min(1100px, 92vw)"
                priority={priority}
                className="object-cover"
                onLoad={() => setLoaded((current) => ({ ...current, original: true }))}
                onError={() => setFailed((current) => ({ ...current, original: true }))}
              />
            </div>
          ) : null}

          {interactive ? (
            <>
              <span className="pointer-events-none absolute start-3.5 top-3.5 z-[3] text-[10px] uppercase tracking-[0.14em] text-white drop-shadow">
                {copy.labelOriginal}
              </span>
              <span className="pointer-events-none absolute end-3.5 top-3.5 z-[3] text-[10px] uppercase tracking-[0.14em] text-white drop-shadow">
                {copy.labelFinal}
              </span>
              <div
                aria-hidden
                className="pointer-events-none absolute z-[4] h-[var(--lens-size)] w-[var(--lens-size)] rounded-full border border-white/75 shadow-[0_12px_35px_rgba(0,0,0,0.18)]"
                style={{
                  left: 'var(--lens-x)',
                  top: 'var(--lens-y)',
                  transform: 'translate(-50%, -50%)',
                  background:
                    'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.16), transparent 55%)',
                }}
              >
                <span className="absolute inset-x-0 bottom-[14%] text-center text-[10px] uppercase tracking-[0.12em] text-white drop-shadow">
                  {copy.lensLabel}
                </span>
              </div>
              {showHint ? (
                <div className="pointer-events-none absolute bottom-4 left-1/2 z-[5] -translate-x-1/2 rounded-full bg-black/55 px-3.5 py-1.5 text-xs text-white">
                  {coarse ? copy.hintMobile : copy.hintDesktop}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {loadState === 'ready' || loadState === 'edited-only' ? (
          <>
            <div className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.12em] opacity-55">
              <span>{copy.labelOriginal}</span>
              <span>{copy.labelFinal}</span>
            </div>
            {loadState === 'ready' ? (
              <button
                type="button"
                className="mt-3 text-sm opacity-65 underline underline-offset-4 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                aria-pressed={fullOriginal}
                onClick={() => setFullOriginal((current) => !current)}
              >
                {fullOriginal ? copy.showResult : copy.showOriginal}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </figure>
  )
}
