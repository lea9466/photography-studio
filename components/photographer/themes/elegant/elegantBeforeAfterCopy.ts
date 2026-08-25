import type { SiteLanguage } from '@/lib/site-language'

/**
 * 1:1 port of the "development" (`reveal_lens`) / "split_slider" wording
 * from `pageCopy()` in lib/public-before-after-html.ts — same strings as
 * Classic/Dark/ModernBeforeAfterCopy.ts, kept local to
 * components/photographer/themes/elegant/ per the "define local prop types,
 * don't import old lib types" convention for this rebuild (see those files'
 * doc comments).
 */
export type ElegantBeforeAfterDisplayStyle = 'development' | 'split_slider'

export type ElegantBeforeAfterCopy = {
  eyebrow: string
  tag: string
  howTo: string
  lensLabel: string
  statusEdited: string
  statusOriginal: string
  showOriginal: string
  showResult: string
  loadError: string
  missingOriginal: string
  regionLabel: string
  sliderHowTo: string
  sliderRegionLabel: string
  sliderLabel: string
}

export function getElegantBeforeAfterCopy(language: SiteLanguage): ElegantBeforeAfterCopy {
  const he = language !== 'en'
  return {
    eyebrow: he ? 'תהליך העריכה' : 'THE EDITING PROCESS',
    tag: he ? 'לפני ואחרי עיבוד' : 'Before & after editing',
    howTo: he
      ? 'גררו על התמונה או השתמשו בכפתור כדי לראות את המקור.'
      : 'Drag across the image or use the button to see the original.',
    lensLabel: he ? 'מקור' : 'Original',
    statusEdited: he ? 'תוצאה סופית' : 'Final edit',
    statusOriginal: he ? 'מקור' : 'Original',
    showOriginal: he ? 'הצגת המקור' : 'Show original',
    showResult: he ? 'חזרה לתוצאה המעובדת' : 'Back to the edited result',
    loadError: he ? 'לא הצלחנו לטעון את ההשוואה' : 'We could not load this comparison',
    missingOriginal: he
      ? 'תמונת המקור אינה זמינה כרגע'
      : 'The original image is unavailable right now',
    regionLabel: he
      ? 'עדשת חשיפה — הזיזו כדי לראות את המקור'
      : 'Reveal lens — move to see the original',
    sliderHowTo: he
      ? 'גררו את המחיצה כדי להשוות בין המקור לתוצאה הסופית.'
      : 'Drag the divider to compare the original with the final edit.',
    sliderRegionLabel: he
      ? 'השוואת לפני ואחרי — גררו את המחיצה'
      : 'Before and after comparison — drag the divider',
    sliderLabel: he ? 'מיקום מחיצת ההשוואה' : 'Comparison divider position',
  }
}

export function padComparisonIndex(index: number): string {
  return String(index + 1).padStart(2, '0')
}
