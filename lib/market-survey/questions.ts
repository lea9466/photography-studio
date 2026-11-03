import { z } from 'zod'

/** Shown at most this many times in total; closing it uses up one showing. */
export const MARKET_SURVEY_MAX_SHOWS = 3
/** So that a second tab or a quick return doesn't count as a new "entry". */
export const MARKET_SURVEY_MIN_HOURS_BETWEEN_SHOWS = 24
export const MARKET_SURVEY_DELAY_MS = 60_000
/** Someone who just signed up has no answer to "what's stopping you". */
export const MARKET_SURVEY_MIN_ACCOUNT_AGE_DAYS = 7
/** The survey stops on its own after this date. */
export const MARKET_SURVEY_ENDS_AT = '2026-11-26T00:00:00+02:00'

export const SOURCE_OPTIONS = [
  { value: 'friend', label: 'חברה' },
  { value: 'photographers_group', label: 'קבוצת צלמות' },
  { value: 'google', label: 'גוגל' },
  { value: 'other', label: 'אחר' },
] as const

export const PHOTOGRAPHY_TYPE_OPTIONS = [
  { value: 'newborn', label: 'ניו בורן' },
  { value: 'family', label: 'משפחות' },
  { value: 'milestones', label: 'חלאקה ובת מצווה' },
  { value: 'events', label: 'חתונות ואירועים' },
  { value: 'other', label: 'אחר' },
] as const

export const MONTHLY_SHOOTS_OPTIONS = [
  { value: '1-2', label: '1–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-10', label: '6–10' },
  { value: '10+', label: 'יותר מ-10' },
] as const

export const DELIVERY_TOOL_OPTIONS = [
  { value: 'stg', label: 'STG' },
  { value: 'jumbo', label: "ג'מבו" },
  { value: 'drive', label: 'דרייב' },
  { value: 'pikando', label: 'פיקנדו' },
  { value: 'other', label: 'אחר' },
] as const

export const MONTHLY_SPEND_OPTIONS = [
  { value: 'none', label: 'כלום' },
  { value: 'up_to_30', label: 'עד ₪30' },
  { value: '30_60', label: '₪30–60' },
  { value: '60_100', label: '₪60–100' },
  { value: 'over_100', label: 'מעל ₪100' },
] as const

export const BLOCKER_OPTIONS = [
  { value: 'expensive', label: 'יקר לי' },
  { value: 'free_is_enough', label: 'מספיק לי החינמי' },
  { value: 'missing_something', label: 'חסר לי משהו' },
  { value: 'unclear', label: 'לא ברור לי מה כלול' },
  { value: 'inactive', label: 'לא פעילה כרגע' },
] as const

type Options = readonly { value: string; label: string }[]

function values<T extends Options>(options: T) {
  return options.map((option) => option.value) as [T[number]['value'], ...T[number]['value'][]]
}

const detail = z.string().trim().max(500).optional()

export const marketSurveySchema = z.object({
  source: z.enum(values(SOURCE_OPTIONS)),
  sourceDetail: detail,
  photographyType: z.enum(values(PHOTOGRAPHY_TYPE_OPTIONS)),
  monthlyShoots: z.enum(values(MONTHLY_SHOOTS_OPTIONS)),
  deliveryTools: z.array(z.enum(values(DELIVERY_TOOL_OPTIONS))).min(1),
  monthlySpend: z.enum(values(MONTHLY_SPEND_OPTIONS)),
  // Non-subscribers only; the server action enforces it, since only the server
  // knows who is really a subscriber.
  blocker: z.enum(values(BLOCKER_OPTIONS)).optional(),
  blockerDetail: detail,
  // Subscribers only, and optional.
  churnReason: detail,
  canContact: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
})

export type MarketSurveyAnswers = z.infer<typeof marketSurveySchema>

/** The question fields shown as counts on /manage, in display order. */
export const MARKET_SURVEY_SUMMARY = [
  { key: 'source', title: 'איך שמעו עלינו', options: SOURCE_OPTIONS },
  { key: 'photographyType', title: 'סוג צילום', options: PHOTOGRAPHY_TYPE_OPTIONS },
  { key: 'monthlyShoots', title: 'צילומים בחודש', options: MONTHLY_SHOOTS_OPTIONS },
  { key: 'deliveryTools', title: 'דרך מה שולחות תמונות', options: DELIVERY_TOOL_OPTIONS },
  { key: 'monthlySpend', title: 'משלמות היום בחודש', options: MONTHLY_SPEND_OPTIONS },
  { key: 'blocker', title: 'מה עצר ממנוי (לא מנויות)', options: BLOCKER_OPTIONS },
] as const
