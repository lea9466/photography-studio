'use client'

import { useState } from 'react'
import { ModernBeforeAfterPage } from '@/components/photographer/themes/modern/ModernBeforeAfterPage'
import type { ModernBeforeAfterDisplayStyle } from '@/components/photographer/themes/modern/modernBeforeAfterCopy'

/**
 * Throwaway preview route — mirrors app/dev-preview/classic/before-after/
 * page.tsx's exact pattern (font <link> tags, `scroll-behavior: smooth`, and
 * the dev-preview-only display-style toggle buttons — see that route's doc
 * comment for why they exist and why they're not part of
 * ModernBeforeAfterPage itself).
 */
const MOCK_ACCENT = '#4f46e5'

const MOCK_ITEMS = [
  {
    id: 'ba-1',
    title: 'רטרו וחם',
    description: 'טונציה חמה, ניגודיות עדינה והדגשת גווני עור טבעיים.',
    originalImageUrl: 'https://picsum.photos/seed/modern-ba-1-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/modern-ba-1-after/1400/1050',
  },
  {
    id: 'ba-2',
    title: 'שחור לבן דרמטי',
    description: 'המרה מונוכרומטית עם ניגודיות גבוהה לרגעים עוצמתיים.',
    originalImageUrl: 'https://picsum.photos/seed/modern-ba-2-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/modern-ba-2-after/1400/1050',
  },
  {
    id: 'ba-3',
    title: 'ניקוי עור עדין',
    description: 'רטוש עדין ללא איבוד מרקם טבעי של העור.',
    originalImageUrl: 'https://picsum.photos/seed/modern-ba-3-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/modern-ba-3-after/1400/1050',
  },
  {
    id: 'ba-4',
    title: 'שמיים דרמטיים',
    description: 'הדגשת עננים ושמיים לתחושת עומק ואווירה.',
    originalImageUrl: 'https://picsum.photos/seed/modern-ba-4-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/modern-ba-4-after/1400/1050',
  },
  {
    id: 'ba-5',
    title: 'תאורה קולנועית',
    description: 'דירוג צבע קולנועי עם צללים עמוקים ואור מכוון.',
    originalImageUrl: 'https://picsum.photos/seed/modern-ba-5-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/modern-ba-5-after/1400/1050',
  },
]

export default function ModernBeforeAfterPreviewPage() {
  const [displayStyle, setDisplayStyle] = useState<ModernBeforeAfterDisplayStyle>('split_slider')

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 16,
          insetInlineEnd: 16,
          zIndex: 999,
          display: 'flex',
          gap: 8,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(15,23,42,0.12)',
          borderRadius: 9999,
          padding: 6,
          boxShadow: '0 8px 24px rgba(15,23,42,0.15)',
        }}
      >
        <button
          type="button"
          data-preview-style-button="split_slider"
          onClick={() => setDisplayStyle('split_slider')}
          style={{
            padding: '6px 14px',
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            background: displayStyle === 'split_slider' ? MOCK_ACCENT : 'transparent',
            color: displayStyle === 'split_slider' ? '#fff' : '#0f172a',
            fontSize: 13,
          }}
        >
          Slider
        </button>
        <button
          type="button"
          data-preview-style-button="development"
          onClick={() => setDisplayStyle('development')}
          style={{
            padding: '6px 14px',
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            background: displayStyle === 'development' ? MOCK_ACCENT : 'transparent',
            color: displayStyle === 'development' ? '#fff' : '#0f172a',
            fontSize: 13,
          }}
        >
          Lens
        </button>
      </div>

      <ModernBeforeAfterPage
        accentColor={MOCK_ACCENT}
        language="he"
        pageTitle="לפני ואחרי עיבוד"
        intro="הזיזו את העדשה או גררו את המחיצה כדי לגלות את הדרך מהתמונה המקורית אל התוצאה הסופית."
        displayStyle={displayStyle}
        items={MOCK_ITEMS}
      />
    </>
  )
}
