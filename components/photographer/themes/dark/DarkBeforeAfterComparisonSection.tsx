'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { DarkBeforeAfterSlider } from './DarkBeforeAfterSlider'
import { DarkBeforeAfterLens, type DarkBeforeAfterLensReadyState } from './DarkBeforeAfterLens'
import {
  getDarkBeforeAfterCopy,
  padComparisonIndex,
  type DarkBeforeAfterDisplayStyle,
} from './darkBeforeAfterCopy'
import styles from './DarkBeforeAfterComparisonSection.module.css'

export type DarkBeforeAfterItem = {
  id: string
  title: string | null
  description: string | null
  originalImageUrl: string
  editedImageUrl: string
}

export type DarkBeforeAfterComparisonSectionProps = {
  item: DarkBeforeAfterItem
  index: number
  language: SiteLanguage
  accentColor: string
  displayStyle: DarkBeforeAfterDisplayStyle
}

/**
 * One before/after pair — same shape as
 * Classic/ModernBeforeAfterComparisonSection.tsx (merges both display styles
 * into one component since they share the same content column; only the
 * media column delegates to DarkBeforeAfterSlider or DarkBeforeAfterLens).
 */
export function DarkBeforeAfterComparisonSection({
  item,
  index,
  language,
  accentColor,
  displayStyle,
}: DarkBeforeAfterComparisonSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const copy = getDarkBeforeAfterCopy(language)

  // Only meaningful for the lens display style — the toggle button lives in
  // this content column, but flips state owned here and passed down as a
  // controlled prop to DarkBeforeAfterLens (see that component's header
  // comment for why).
  const [showFullOriginal, setShowFullOriginal] = useState(false)
  const [lensState, setLensState] = useState<DarkBeforeAfterLensReadyState>({
    ready: false,
    editedOnly: false,
  })

  const hasTitle = Boolean(item.title?.trim())
  const hasDescription = Boolean(item.description?.trim())
  const loading = index === 0 ? 'eager' : 'lazy'
  const trimmedTitle = item.title?.trim()
  const editedAlt = trimmedTitle
    ? language === 'en'
      ? `${trimmedTitle} — final edit`
      : `${trimmedTitle} — תוצאה סופית`
    : copy.statusEdited

  const toggleDisabled = !lensState.ready || lensState.editedOnly

  return (
    <section
      ref={ref}
      id={`ba-${item.id}`}
      className={`${styles.section} ${revealed ? styles.visible : ''}`}
    >
      <div className={styles.content}>
        <p className={styles.tag}>{copy.tag}</p>
        <div className={styles.numberRow} aria-hidden="true">
          <span
            className={styles.number}
            style={{ color: accentColor, '--number-glow': accentColor } as React.CSSProperties}
          >
            {padComparisonIndex(index)}
          </span>
          <span className={styles.numberLine} style={{ background: accentColor }} />
        </div>
        {hasTitle ? <h2 className={styles.title}>{trimmedTitle}</h2> : null}
        {hasDescription ? <p className={styles.desc}>{item.description!.trim()}</p> : null}
        <p className={styles.howto}>{displayStyle === 'split_slider' ? copy.sliderHowTo : copy.howTo}</p>
        {displayStyle === 'split_slider' ? null : (
          <button
            type="button"
            className={styles.toggle}
            disabled={toggleDisabled}
            aria-pressed={showFullOriginal}
            onClick={() => setShowFullOriginal((prev) => !prev)}
          >
            {showFullOriginal ? copy.showResult : copy.showOriginal}
          </button>
        )}
      </div>

      <div className={styles.media}>
        {displayStyle === 'split_slider' ? (
          <DarkBeforeAfterSlider
            originalImageUrl={item.originalImageUrl}
            editedImageUrl={item.editedImageUrl}
            editedAlt={editedAlt}
            accentColor={accentColor}
            labelOriginal={copy.statusOriginal}
            labelEdited={copy.statusEdited}
            ariaLabel={copy.sliderRegionLabel}
            sliderAriaLabel={copy.sliderLabel}
            loadErrorText={copy.loadError}
            loading={loading}
          />
        ) : (
          <DarkBeforeAfterLens
            originalImageUrl={item.originalImageUrl}
            editedImageUrl={item.editedImageUrl}
            editedAlt={editedAlt}
            lensLabel={copy.lensLabel}
            statusEdited={copy.statusEdited}
            statusOriginal={copy.statusOriginal}
            missingOriginalText={copy.missingOriginal}
            loadErrorText={copy.loadError}
            regionLabel={copy.regionLabel}
            loading={loading}
            showFullOriginal={showFullOriginal}
            onReadyChange={setLensState}
          />
        )}
      </div>
    </section>
  )
}
