'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import styles from './ClassicBeforeAfterSlider.module.css'

export type ClassicBeforeAfterSliderProps = {
  originalImageUrl: string
  editedImageUrl: string
  editedAlt: string
  accentColor: string
  labelOriginal: string
  labelEdited: string
  ariaLabel: string
  sliderAriaLabel: string
  loadErrorText: string
  loading: 'eager' | 'lazy'
}

/**
 * React port of the `split_slider` display style (SPLIT_SLIDER_CSS /
 * SPLIT_SLIDER_SCRIPT in lib/public-before-after-html.ts) — a draggable
 * vertical divider comparing the edited image against the original.
 *
 * The old vanilla-JS version drove the divider from a native
 * `<input type="range">` (fully transparent, stretched over the whole
 * frame, thumb widened to 48px via ::-webkit/-moz-slider-thumb) purely so
 * dragging AND keyboard arrows both come for free from native range
 * semantics — that's kept as-is here; `onChange` just mirrors the range's
 * value into `--split-position`, exactly like the old script's `updatePosition()`.
 */
export function ClassicBeforeAfterSlider(props: ClassicBeforeAfterSliderProps) {
  const {
    originalImageUrl,
    editedImageUrl,
    editedAlt,
    accentColor,
    labelOriginal,
    labelEdited,
    ariaLabel,
    sliderAriaLabel,
    loadErrorText,
    loading,
  } = props

  const editedImgRef = useRef<HTMLImageElement>(null)
  const originalImgRef = useRef<HTMLImageElement>(null)

  const [position, setPosition] = useState(50)
  const [editedLoaded, setEditedLoaded] = useState(false)
  const [originalLoaded, setOriginalLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<string | null>(null)

  // Cached images can already be `.complete` before a load listener attaches
  // (the same race the old waitForImage() promise guarded against) — check
  // both of this component's own image refs once on mount, in addition to
  // the onLoad handlers below.
  useEffect(() => {
    const edited = editedImgRef.current
    const original = originalImgRef.current
    if (edited?.complete && edited.naturalWidth > 0) {
      setEditedLoaded(true)
      setAspectRatio(`${edited.naturalWidth} / ${edited.naturalHeight}`)
    }
    if (original?.complete && original.naturalWidth > 0) setOriginalLoaded(true)
  }, [])

  const isReady = editedLoaded && originalLoaded && !hasError

  const frameStyle = {
    '--split-position': `${position}%`,
    ...(aspectRatio ? { '--comparison-aspect-ratio': aspectRatio } : {}),
  } as CSSProperties

  return (
    <div className={styles.frame} style={frameStyle} role="group" aria-label={ariaLabel}>
      {!isReady && !hasError ? <div className={styles.skeleton} aria-hidden="true" /> : null}
      {hasError ? <div className={styles.errorMessage}>{loadErrorText}</div> : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={editedImgRef}
        className={`${styles.image} ${styles.imageEdited}`}
        src={editedImageUrl}
        alt={editedAlt}
        loading={loading}
        decoding="async"
        onLoad={(event) => {
          const img = event.currentTarget
          setEditedLoaded(true)
          setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`)
        }}
        onError={() => setHasError(true)}
      />

      <div className={styles.originalLayer} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={originalImgRef}
          className={styles.image}
          src={originalImageUrl}
          alt=""
          loading={loading}
          decoding="async"
          onLoad={() => setOriginalLoaded(true)}
          onError={() => setHasError(true)}
        />
      </div>

      <span className={`${styles.label} ${styles.labelOriginal} ${!isReady ? styles.notReady : ''}`}>
        {labelOriginal}
      </span>
      <span className={`${styles.label} ${styles.labelEdited} ${!isReady ? styles.notReady : ''}`}>
        {labelEdited}
      </span>

      <div className={`${styles.divider} ${!isReady ? styles.notReady : ''}`} aria-hidden="true">
        <span className={styles.dividerHandle} style={{ background: accentColor }}>
          ↔
        </span>
      </div>

      <input
        className={styles.range}
        type="range"
        min={0}
        max={100}
        value={position}
        disabled={hasError}
        aria-label={sliderAriaLabel}
        onChange={(event) => setPosition(Number(event.target.value))}
      />
    </div>
  )
}
