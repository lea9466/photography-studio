'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { submitMarketSurvey } from '@/lib/actions/market-survey.actions'
import {
  BLOCKER_OPTIONS,
  DELIVERY_TOOL_OPTIONS,
  MONTHLY_SHOOTS_OPTIONS,
  MONTHLY_SPEND_OPTIONS,
  PHOTOGRAPHY_TYPE_OPTIONS,
  SOURCE_OPTIONS,
} from '@/lib/market-survey/questions'
import { SurveyChoiceField, SurveyQuestionHeading } from './SurveyChoiceField'

const CONTACT_OPTIONS = [
  { value: 'yes', label: 'כן, בשמחה' },
  { value: 'no', label: 'לא עכשיו' },
] as const

const TEXT_INPUT_CLASS =
  'w-full rounded-xl border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm font-normal text-[#09090b] outline-none transition-shadow placeholder:text-[#a1a1aa] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20'

type MarketSurveyFormProps = {
  isSubscriber: boolean
  onDone: () => void
}

export function MarketSurveyForm({ isSubscriber, onDone }: MarketSurveyFormProps) {
  const [source, setSource] = useState('')
  const [sourceDetail, setSourceDetail] = useState('')
  const [photographyType, setPhotographyType] = useState('')
  const [monthlyShoots, setMonthlyShoots] = useState('')
  const [deliveryTools, setDeliveryTools] = useState<string[]>([])
  const [monthlySpend, setMonthlySpend] = useState('')
  const [blocker, setBlocker] = useState('')
  const [blockerDetail, setBlockerDetail] = useState('')
  const [churnReason, setChurnReason] = useState('')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // The optional free-text questions aren't in the count.
  const required = [
    source,
    photographyType,
    monthlyShoots,
    deliveryTools.length > 0,
    monthlySpend,
    contact,
    ...(isSubscriber ? [] : [blocker]),
  ]
  const answered = required.filter(Boolean).length
  const complete = answered === required.length

  function toggleDeliveryTool(value: string) {
    setDeliveryTools((prev) =>
      prev.includes(value) ? prev.filter((tool) => tool !== value) : [...prev, value]
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!complete) {
      setError('נשארו עוד כמה שאלות')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await submitMarketSurvey({
        source,
        sourceDetail: source === 'photographers_group' ? sourceDetail : undefined,
        photographyType,
        monthlyShoots,
        deliveryTools,
        monthlySpend,
        blocker: isSubscriber ? undefined : blocker,
        blockerDetail: !isSubscriber && blocker === 'missing_something' ? blockerDetail : undefined,
        churnReason: isSubscriber ? churnReason : undefined,
        canContact: contact === 'yes',
        notes,
      })
      if (result.ok) onDone()
      else setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-7 sm:px-8">
        <div>
          <SurveyChoiceField
            number={1}
            legend="איך שמעת עלינו?"
            name="source"
            options={SOURCE_OPTIONS}
            selected={[source]}
            onToggle={setSource}
          />
          {source === 'photographers_group' ? (
            <div className="mt-3 ps-9">
              <input
                type="text"
                value={sourceDetail}
                onChange={(event) => setSourceDetail(event.target.value)}
                maxLength={500}
                placeholder="איזו קבוצה?"
                aria-label="איזו קבוצה?"
                className={TEXT_INPUT_CLASS}
              />
            </div>
          ) : null}
        </div>

        <SurveyChoiceField
          number={2}
          legend="איזה סוג צילום הכי מרכזי אצלך?"
          name="photographyType"
          options={PHOTOGRAPHY_TYPE_OPTIONS}
          selected={[photographyType]}
          onToggle={setPhotographyType}
        />

        <SurveyChoiceField
          number={3}
          legend="בכמה צילומים בחודש את עובדת בדרך כלל?"
          name="monthlyShoots"
          options={MONTHLY_SHOOTS_OPTIONS}
          selected={[monthlyShoots]}
          onToggle={setMonthlyShoots}
        />

        <SurveyChoiceField
          number={4}
          legend="דרך מה את שולחת היום תמונות ללקוחות?"
          hint="אפשר לסמן כמה"
          name="deliveryTools"
          options={DELIVERY_TOOL_OPTIONS}
          selected={deliveryTools}
          onToggle={toggleDeliveryTool}
          multiple
        />

        <SurveyChoiceField
          number={5}
          legend="כמה את משלמת היום בחודש על כלים לעסק, כמו אתר או גלריות?"
          name="monthlySpend"
          options={MONTHLY_SPEND_OPTIONS}
          selected={[monthlySpend]}
          onToggle={setMonthlySpend}
        />

        {isSubscriber ? (
          <label className="block">
            <SurveyQuestionHeading number={6} text="מה יכול לגרום לך לא לחדש?" hint="לא חובה" />
            <span className="mt-3 block ps-9">
              <textarea
                value={churnReason}
                onChange={(event) => setChurnReason(event.target.value)}
                maxLength={500}
                rows={2}
                className={TEXT_INPUT_CLASS}
              />
            </span>
          </label>
        ) : (
          <div>
            <SurveyChoiceField
              number={6}
              legend="מה הכי עוצר אותך ממנוי?"
              name="blocker"
              options={BLOCKER_OPTIONS}
              selected={[blocker]}
              onToggle={setBlocker}
            />
            {blocker === 'missing_something' ? (
              <div className="mt-3 ps-9">
                <input
                  type="text"
                  value={blockerDetail}
                  onChange={(event) => setBlockerDetail(event.target.value)}
                  maxLength={500}
                  placeholder="מה חסר לך?"
                  aria-label="מה חסר לך?"
                  className={TEXT_INPUT_CLASS}
                />
              </div>
            ) : null}
          </div>
        )}

        <SurveyChoiceField
          number={7}
          legend="אפשר לחזור אלייך לשיחה קצרה?"
          name="contact"
          options={CONTACT_OPTIONS}
          selected={[contact]}
          onToggle={setContact}
        />

        <label className="block">
          <SurveyQuestionHeading number={8} text="יש לך משהו נוסף לומר? נשמח לשמוע" hint="לא חובה" />
          <span className="mt-3 block ps-9">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              rows={3}
              className={TEXT_INPUT_CLASS}
            />
          </span>
        </label>
      </div>

      <div className="border-t border-[#e5e5e5] bg-[#fafafa] px-5 py-4 sm:px-8">
        <div
          className="h-1 overflow-hidden rounded-full bg-[#ede9fe]"
          role="progressbar"
          aria-label="התקדמות בסקר"
          aria-valuemin={0}
          aria-valuemax={required.length}
          aria-valuenow={answered}
        >
          <div
            className="h-full rounded-full bg-gradient-to-l from-[#7c3aed] to-[#4c1d95] transition-[width] duration-300"
            style={{ width: `${(answered / required.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className={error ? 'text-sm text-red-600' : 'text-sm text-[#71717a]'}>
            {error ?? `${answered} מתוך ${required.length}`}
          </p>
          <Button
            type="submit"
            disabled={pending}
            className="h-11 shrink-0 rounded-xl bg-gradient-to-l from-[#7c3aed] to-[#4c1d95] px-8 font-medium text-white shadow-md shadow-[#7c3aed]/25 transition-shadow hover:scale-100 hover:shadow-lg hover:shadow-[#7c3aed]/30"
          >
            {pending ? 'שולח...' : 'שליחה'}
          </Button>
        </div>
      </div>
    </form>
  )
}
