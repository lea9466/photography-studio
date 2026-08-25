'use client'

import { useState } from 'react'
import { ClassicBeforeAfterPage } from '@/components/photographer/themes/classic/ClassicBeforeAfterPage'
import type { ClassicBeforeAfterDisplayStyle } from '@/components/photographer/themes/classic/classicBeforeAfterCopy'

/**
 * Throwaway preview route — NOT linked from any nav, not part of the real
 * public-site routing. Mirrors app/dev-preview/classic/page.tsx's pattern
 * (font <link> tags, `scroll-behavior: smooth`, mock data standing in for
 * what app/[slug]/before-after/page.tsx eventually loads from Supabase).
 *
 * The real page's `displayStyle` is a single per-studio setting (see
 * `normalizeBeforeAfterDisplayStyle` in lib/types/before-after-display-style.ts)
 * — never chosen per-visit. The buttons below are dev-preview-only chrome so
 * both display styles (the drag-divider slider and the hover/drag reveal
 * lens) can be exercised in one place instead of needing two routes; they
 * are not part of ClassicBeforeAfterPage itself.
 */
const MOCK_ACCENT = '#b5816a'

const MOCK_ITEMS = [
  {
    id: 'ba-1',
    title: 'רטרו וחם',
    description: 'טונציה חמה, ניגודיות עדינה והדגשת גווני עור טבעיים.',
    originalImageUrl: 'https://picsum.photos/seed/ba-1-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/ba-1-after/1400/1050',
  },
  {
    id: 'ba-2',
    title: 'שחור לבן דרמטי',
    description: 'המרה מונוכרומטית עם ניגודיות גבוהה לרגעים עוצמתיים.',
    originalImageUrl: 'https://picsum.photos/seed/ba-2-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/ba-2-after/1400/1050',
  },
  {
    id: 'ba-3',
    title: 'ניקוי עור עדין',
    description: 'רטוש עדין ללא איבוד מרקם טבעי של העור.',
    originalImageUrl: 'https://picsum.photos/seed/ba-3-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/ba-3-after/1400/1050',
  },
  {
    id: 'ba-4',
    title: 'שמיים דרמטיים',
    description: 'הדגשת עננים ושמיים לתחושת עומק ואווירה.',
    originalImageUrl: 'https://picsum.photos/seed/ba-4-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/ba-4-after/1400/1050',
  },
  {
    id: 'ba-5',
    title: 'תאורה קולנועית',
    description: 'דירוג צבע קולנועי עם צללים עמוקים ואור מכוון.',
    originalImageUrl: 'https://picsum.photos/seed/ba-5-before/1400/1050',
    editedImageUrl: 'https://picsum.photos/seed/ba-5-after/1400/1050',
  },
]

export default function ClassicBeforeAfterPreviewPage() {
  const [displayStyle, setDisplayStyle] = useState<ClassicBeforeAfterDisplayStyle>('split_slider')

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
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 9999,
          padding: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
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
            color: displayStyle === 'split_slider' ? '#fff' : '#2d2825',
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
            color: displayStyle === 'development' ? '#fff' : '#2d2825',
            fontSize: 13,
          }}
        >
          Lens
        </button>
      </div>

      <ClassicBeforeAfterPage
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
