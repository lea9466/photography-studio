import { z } from 'zod'

/** Shown at most this many times in total; closing it uses up one showing. */
export const LEARNING_SURVEY_MAX_SHOWS = 3
export const LEARNING_SURVEY_MIN_HOURS_BETWEEN_SHOWS = 24
/**
 * Longer than the market survey's delay, so when both are eligible on the same
 * visit the market survey claims first and this one sees it was just shown.
 */
export const LEARNING_SURVEY_DELAY_MS = 90_000
/** Not on the very first visits, which already carry onboarding. */
export const LEARNING_SURVEY_MIN_ACCOUNT_AGE_DAYS = 1
export const LEARNING_SURVEY_ENDS_AT = '2027-01-31T00:00:00+02:00'

export const LEARNED_AT_OPTIONS = [
  { value: 'self', label: 'למדתי לבד' },
  { value: 'school', label: 'בבית ספר / מכללה' },
  { value: 'online_course', label: 'קורס דיגיטלי' },
  { value: 'in_person_course', label: 'קורס פרונטלי' },
  { value: 'mentoring', label: 'הדרכה אישית אצל צלמת' },
] as const

type LearnedAt = (typeof LEARNED_AT_OPTIONS)[number]['value']

export const learningSurveySchema = z.object({
  learnedAt: z
    .array(z.enum(LEARNED_AT_OPTIONS.map((option) => option.value) as [LearnedAt, ...LearnedAt[]]))
    .min(1),
  teacherName: z.string().trim().max(300).optional(),
})

export type LearningSurveyAnswers = z.infer<typeof learningSurveySchema>
