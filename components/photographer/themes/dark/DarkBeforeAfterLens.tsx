'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import styles from './DarkBeforeAfterLens.module.css'

export type DarkBeforeAfterLensReadyState = {
  ready: boolean
  /** True once the edited image loaded but the original failed — lens/toggle
   * get disabled and a "missing original" badge shows instead, mirroring
   * `markEditedOnly()` in the old REVEAL_LENS_SCRIPT. */
  editedOnly: boolean
}

export type DarkBeforeAfterLensProps = {
  originalImageUrl: string
  editedImageUrl: string
  editedAlt: string
  lensLabel: string
  statusEdited: string
  statusOriginal: string
  missingOriginalText: string
  loadErrorText: string
  regionLabel: string
  loading: 'eager' | 'lazy'
  /**
   * Owned by the parent section (the toggle button lives in the content
   * column, not inside this frame) — this component is a controlled
   * consumer of it, and reports readiness back up via `onReadyChange` so the
   * parent can enable/label that button correctly.
   */
  showFullOriginal: boolean
  onReadyChange: (state: DarkBeforeAfterLensReadyState) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/** `-webkit-clip-path` has no typed `CSSStyleDeclaration` property (Safari-only
 * prefix, dropped from lib.dom.d.ts) — set via `setProperty` instead. */
function setClipPath(element: HTMLElement, value: string) {
  element.style.setProperty('clip-path', value)
  element.style.setProperty('-webkit-clip-path', value)
}

/**
 * Dark-theme "development" (reveal-lens) display style — identical pointer/
 * keyboard state machine to Classic/ModernBeforeAfterLens.tsx (a circular
 * lens that follows the pointer, clipping the original image into view
 * where it hovers; the touch-drag-vs-vertical-scroll disambiguation via an
 * 8px-move threshold; keyboard arrow-key nudging) — reused verbatim per this
 * session's established convention (pure interaction behavior, not
 * theme-specific — see ModernBeforeAfterLens.tsx's doc comment for the same
 * call). Only the CSS module differs (dark's TOKENS values).
 */
export function DarkBeforeAfterLens(props: DarkBeforeAfterLensProps) {
  const {
    originalImageUrl,
    editedImageUrl,
    editedAlt,
    lensLabel,
    statusEdited,
    statusOriginal,
    missingOriginalText,
    loadErrorText,
    regionLabel,
    loading,
    showFullOriginal,
    onReadyChange,
  } = props

  const frameRef = useRef<HTMLDivElement>(null)
  const originalLayerRef = useRef<HTMLDivElement>(null)
  const editedImgRef = useRef<HTMLImageElement>(null)
  const originalImgRef = useRef<HTMLImageElement>(null)
  const pendingRef = useRef<{ id: number; x: number; y: number } | null>(null)

  const [editedLoaded, setEditedLoaded] = useState(false)
  const [editedError, setEditedError] = useState(false)
  const [originalLoaded, setOriginalLoaded] = useState(false)
  const [originalError, setOriginalError] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<string | null>(null)
  const [interacting, setInteracting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [lensPercent, setLensPercent] = useState({ x: 50, y: 50 })

  // 1:1 port of `waitForImage`/`promoteLazyImage`/the promotion
  // IntersectionObserver from REVEAL_LENS_SCRIPT (lib/public-before-after-html.ts)
  // — the real source already solved this exact problem, so this replaces an
  // earlier ad-hoc polling loop with the same event-driven mechanism.
  //
  // `waitForImage` resolves once an image is genuinely usable (`complete` +
  // real natural dimensions), rejects on a real load error, and is careful
  // about the two edge cases a naive `onLoad` handler misses: (1) the load
  // can happen in the narrow window between mount and this effect attaching
  // its listeners — handled by re-checking `.complete` immediately after
  // `addEventListener`; (2) `load` can fire before `naturalWidth` is
  // populated for some cached/lazy images — handled by falling back to
  // `image.decode()` then a `requestAnimationFrame` re-check.
  //
  // `promoteLazyImage`, run from an `IntersectionObserver` with a 240px
  // margin, forces a `loading="lazy"` image to `eager` once its frame nears
  // the viewport — this is what actually prevents a pair below the first
  // from sitting stuck on the browser's own lazy-load heuristic during a
  // slow, real (non-instant) scroll.
  useEffect(() => {
    const edited = editedImgRef.current
    const original = originalImgRef.current
    if (!edited || !original) return

    let cancelled = false

    function hasDimensions(image: HTMLImageElement) {
      return image.naturalWidth > 0 && image.naturalHeight > 0
    }

    function waitForImage(image: HTMLImageElement): Promise<void> {
      return new Promise((resolve, reject) => {
        if (image.complete && hasDimensions(image)) {
          resolve()
          return
        }

        let settled = false

        function finishOk() {
          if (settled) return
          settled = true
          cleanup()
          resolve()
        }

        function finishErr(message: string) {
          if (settled) return
          settled = true
          cleanup()
          reject(new Error(message))
        }

        function cleanup() {
          image.removeEventListener('load', onLoad)
          image.removeEventListener('error', onError)
        }

        function confirmDimensions() {
          if (hasDimensions(image)) {
            finishOk()
            return
          }
          if (typeof image.decode === 'function') {
            image
              .decode()
              .then(() => {
                if (hasDimensions(image)) finishOk()
                else finishErr(`Image loaded without dimensions: ${image.currentSrc || image.src}`)
              })
              .catch(() => {
                if (hasDimensions(image)) {
                  finishOk()
                } else {
                  requestAnimationFrame(() => {
                    if (hasDimensions(image)) finishOk()
                    else finishErr(`Image loaded without dimensions: ${image.currentSrc || image.src}`)
                  })
                }
              })
            return
          }
          requestAnimationFrame(() => {
            if (hasDimensions(image)) finishOk()
            else finishErr(`Image loaded without dimensions: ${image.currentSrc || image.src}`)
          })
        }

        function onLoad() {
          confirmDimensions()
        }

        function onError() {
          finishErr(`Failed to load image: ${image.currentSrc || image.src}`)
        }

        image.addEventListener('load', onLoad, { once: true })
        image.addEventListener('error', onError, { once: true })

        if (image.complete && hasDimensions(image)) {
          finishOk()
          return
        }

        if (image.complete && !hasDimensions(image) && image.getAttribute('loading') !== 'lazy') {
          finishErr(`Image has no natural dimensions: ${image.currentSrc || image.src}`)
        }
      })
    }

    function promoteLazyImage(image: HTMLImageElement | null) {
      if (!image || image.getAttribute('loading') !== 'lazy') return
      if (image.complete && hasDimensions(image)) return
      image.loading = 'eager'
    }

    let observer: IntersectionObserver | null = null
    const frame = frameRef.current
    if (frame && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            promoteLazyImage(edited)
            promoteLazyImage(original)
            observer?.disconnect()
          }
        },
        { root: null, rootMargin: '240px 0px', threshold: 0.01 }
      )
      observer.observe(frame)
    } else {
      promoteLazyImage(edited)
      promoteLazyImage(original)
    }

    waitForImage(edited)
      .then(() => {
        if (cancelled) return
        setEditedLoaded(true)
        setAspectRatio(`${edited.naturalWidth} / ${edited.naturalHeight}`)
        return waitForImage(original)
          .then(() => {
            if (cancelled) return
            setOriginalLoaded(true)
          })
          .catch(() => {
            if (cancelled) return
            setOriginalError(true)
          })
      })
      .catch(() => {
        if (cancelled) return
        setEditedError(true)
      })

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [])

  const isReady = editedLoaded && !editedError && (originalLoaded || originalError)
  const isEditedOnly = isReady && originalError
  const canInteract = isReady && !isEditedOnly && !showFullOriginal

  useEffect(() => {
    onReadyChange({ ready: isReady, editedOnly: isEditedOnly })
    // onReadyChange is expected to be a stable setState-style callback from
    // the parent — only the two booleans it actually needs matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isEditedOnly])

  const lensRadiusPx = useCallback(() => {
    const frame = frameRef.current
    if (!frame) return 105
    const raw = getComputedStyle(frame).getPropertyValue('--lens-radius').trim()
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 105
  }, [])

  const updatePosition = useCallback(
    (clientX: number, clientY: number, withReveal: boolean) => {
      const frame = frameRef.current
      if (!frame) return
      const rect = frame.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const x = clamp(clientX - rect.left, 0, rect.width)
      const y = clamp(clientY - rect.top, 0, rect.height)
      setLensPercent({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 })

      if (showFullOriginal) return
      if (withReveal) {
        const layer = originalLayerRef.current
        if (layer) {
          const radius = lensRadiusPx()
          const clip = `circle(${radius}px at ${x.toFixed(2)}px ${y.toFixed(2)}px)`
          setClipPath(layer, clip)
        }
      }
    },
    [lensRadiusPx, showFullOriginal]
  )

  const hideLens = useCallback(() => {
    setInteracting(false)
    setDragging(false)
    if (showFullOriginal) return
    const layer = originalLayerRef.current
    if (layer) {
      setClipPath(layer, 'circle(0px at 50% 50%)')
    }
  }, [showFullOriginal])

  // Full-original toggle flips externally (parent-owned button) — react to
  // it the same way the old script's toggle click handler did.
  useEffect(() => {
    const layer = originalLayerRef.current
    if (!layer) return
    if (showFullOriginal) {
      setInteracting(false)
      setClipPath(layer, 'circle(150% at 50% 50%)')
    } else {
      hideLens()
    }
    // hideLens is stable enough per showFullOriginal value; re-running this
    // effect on every render would fight the pointer handlers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFullOriginal])

  function handlePointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canInteract || event.pointerType === 'touch') return
    updatePosition(event.clientX, event.clientY, true)
    setInteracting(true)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canInteract) return
    const pending = pendingRef.current

    if (pending && event.pointerId === pending.id) {
      const dx = event.clientX - pending.x
      const dy = event.clientY - pending.y
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      if (Math.abs(dy) > Math.abs(dx)) {
        pendingRef.current = null
        hideLens()
        return
      }
      pendingRef.current = null
      setDragging(true)
      setInteracting(true)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture can throw if the pointer already went away — safe to ignore.
      }
      updatePosition(event.clientX, event.clientY, true)
      event.preventDefault()
      return
    }

    if (event.pointerType === 'touch' && !event.currentTarget.hasPointerCapture(event.pointerId)) {
      return
    }

    if (dragging || interacting) {
      updatePosition(event.clientX, event.clientY, true)
      if (dragging) event.preventDefault()
    }
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' || dragging) return
    hideLens()
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canInteract) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    if (event.pointerType !== 'mouse') {
      pendingRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      updatePosition(event.clientX, event.clientY, true)
      setInteracting(true)
      return
    }

    updatePosition(event.clientX, event.clientY, true)
    setInteracting(true)
  }

  function endInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    pendingRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // Already released — safe to ignore.
      }
    }
    setDragging(false)
    if (event.pointerType === 'touch') hideLens()
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!canInteract) return
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    let x = (lensPercent.x / 100) * rect.width
    let y = (lensPercent.y / 100) * rect.height
    const stepX = rect.width * (event.shiftKey ? 0.08 : 0.03)
    const stepY = rect.height * (event.shiftKey ? 0.08 : 0.03)
    let handled = true
    if (event.key === 'ArrowLeft') x -= stepX
    else if (event.key === 'ArrowRight') x += stepX
    else if (event.key === 'ArrowUp') y -= stepY
    else if (event.key === 'ArrowDown') y += stepY
    else handled = false
    if (!handled) return
    event.preventDefault()
    updatePosition(rect.left + x, rect.top + y, true)
    setInteracting(true)
  }

  const frameStyle = {
    '--lens-x': `${lensPercent.x}%`,
    '--lens-y': `${lensPercent.y}%`,
    ...(aspectRatio ? { '--comparison-aspect-ratio': aspectRatio } : {}),
  } as CSSProperties

  const frameClassName = [
    styles.frame,
    isReady ? styles.ready : '',
    interacting ? styles.interacting : '',
    dragging ? styles.dragging : '',
    showFullOriginal ? styles.showFull : '',
    editedError ? styles.error : '',
    isEditedOnly ? styles.editedOnly : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.media}>
      <div
        ref={frameRef}
        className={frameClassName}
        style={frameStyle}
        tabIndex={0}
        role="application"
        aria-label={regionLabel}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        onKeyDown={handleKeyDown}
      >
        {!isReady && !editedError ? <div className={styles.skeleton} aria-hidden="true" /> : null}
        {editedError ? <div className={styles.errorMessage}>{loadErrorText}</div> : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={editedImgRef}
          className={`${styles.image} ${styles.imageEdited}`}
          src={editedImageUrl}
          alt={editedAlt}
          loading={loading}
          decoding="async"
        />

        <div ref={originalLayerRef} className={styles.originalLayer} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={originalImgRef}
            className={styles.image}
            src={originalImageUrl}
            alt=""
            loading={loading}
            decoding="async"
          />
        </div>

        <div className={styles.lens} aria-hidden="true">
          <span>{lensLabel}</span>
        </div>

        {isEditedOnly ? <span className={styles.missingOriginal}>{missingOriginalText}</span> : null}
      </div>

      <span className={`${styles.status} ${isReady ? styles.statusVisible : ''}`}>
        {showFullOriginal ? statusOriginal : statusEdited}
      </span>
    </div>
  )
}
