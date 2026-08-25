'use client'

import { useState } from 'react'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { ClassicBeforeAfterSlider } from './ClassicBeforeAfterSlider'
import { ClassicBeforeAfterLens, type ClassicBeforeAfterLensReadyState } from './ClassicBeforeAfterLens'
import {
  getClassicBeforeAfterCopy,
  padComparisonIndex,
  type ClassicBeforeAfterDisplayStyle,
} from './classicBeforeAfterCopy'
import styles from './ClassicBeforeAfterComparisonSection.module.css'

export type ClassicBeforeAfterItem = {
  id: string
  title: string | null
  description: string | null
  originalImageUrl: string
  editedImageUrl: string
}

export type ClassicBeforeAfterComparisonSectionProps = {
  item: ClassicBeforeAfterItem
  index: number
  language: SiteLanguage
  accentColor: string
  displayStyle: ClassicBeforeAfterDisplayStyle
}

/**
 * One before/after pair — 1:1 port of `renderSplitSliderComparisonSection` /
 * `renderRevealLensComparisonSection` (lib/public-before-after-html.ts),
 * merged into a single component that branches on `displayStyle` since both
 * share the same content column (tag/number/title/description/how-to text).
 * Only the media column differs, delegated to ClassicBeforeAfterSlider or
 * ClassicBeforeAfterLens.
 */
export function ClassicBeforeAfterComparisonSection({
  item,
  index,
  language,
  accentColor,
  displayStyle,
}: ClassicBeforeAfterComparisonSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const copy = getClassicBeforeAfterCopy(language)

  // Only meaningful for the lens display style — the toggle button lives in
  // this content column, but flips state owned here and passed down as a
  // controlled prop to ClassicBeforeAfterLens (see that component's header
  // comment for why).
  const [showFullOriginal, setShowFullOriginal] = useState(false)
  const [lensState, setLensState] = useState<ClassicBeforeAfterLensReadyState>({
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
          <ClassicBeforeAfterSlider
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
          <ClassicBeforeAfterLens
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
