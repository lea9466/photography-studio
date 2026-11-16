'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { submitLearningSurvey } from '@/lib/actions/learning-survey.actions'
import { LEARNED_AT_OPTIONS } from '@/lib/learning-survey/questions'
import { SurveyChoiceField, SurveyQuestionHeading } from '../market-survey/SurveyChoiceField'

const TEXT_INPUT_CLASS =
  'w-full rounded-xl border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm font-normal text-[#09090b] outline-none transition-shadow placeholder:text-[#a1a1aa] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20'

export function LearningSurveyForm({ onDone }: { onDone: () => void }) {
  const [learnedAt, setLearnedAt] = useState<string[]>([])
  const [teacherName, setTeacherName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function toggle(value: string) {
    setLearnedAt((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (learnedAt.length === 0) {
      setError('נא לבחור לפחות תשובה אחת')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await submitLearningSurvey({ learnedAt, teacherName })
      if (result.ok) onDone()
      else setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-7 sm:px-8">
        <SurveyChoiceField
          number={1}
          legend="איפה למדת צילום?"
          hint="אפשר לסמן כמה"
          name="learnedAt"
          options={LEARNED_AT_OPTIONS}
          selected={learnedAt}
          onToggle={toggle}
          multiple
        />

        <label className="block">
          <SurveyQuestionHeading
            number={2}
            text="אצל מי למדת? שם המורה, הקורס או בית הספר"
            hint="לא חובה"
          />
          <span className="mt-3 block ps-9">
            <input
              type="text"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              maxLength={300}
              className={TEXT_INPUT_CLASS}
            />
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[#e5e5e5] bg-[#fafafa] px-5 py-4 sm:px-8">
        <p className={error ? 'text-sm text-red-600' : 'text-sm text-[#71717a]'}>{error ?? ''}</p>
        <Button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-xl bg-gradient-to-l from-[#7c3aed] to-[#4c1d95] px-8 font-medium text-white shadow-md shadow-[#7c3aed]/25 transition-shadow hover:scale-100 hover:shadow-lg hover:shadow-[#7c3aed]/30"
        >
          {pending ? 'שולח...' : 'שליחה'}
        </Button>
      </div>
    </form>
  )
}
