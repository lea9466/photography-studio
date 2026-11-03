import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SurveyQuestionHeading({
  number,
  text,
  hint,
}: {
  number: number
  text: string
  hint?: string
}) {
  return (
    <span className="flex items-start gap-3 text-[15px] font-medium leading-6 text-[#09090b]">
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f3edfe] text-xs font-semibold text-[#6d28d9]"
      >
        {number}
      </span>
      <span>
        {text}
        {hint ? <span className="ms-1.5 text-[13px] font-normal text-[#71717a]">({hint})</span> : null}
      </span>
    </span>
  )
}

type SurveyChoiceFieldProps = {
  number: number
  legend: string
  name: string
  options: readonly { value: string; label: string }[]
  selected: readonly string[]
  onToggle: (value: string) => void
  multiple?: boolean
  hint?: string
}

/** One question: native radios or checkboxes, styled as soft chips. */
export function SurveyChoiceField({
  number,
  legend,
  name,
  options,
  selected,
  onToggle,
  multiple = false,
  hint,
}: SurveyChoiceFieldProps) {
  return (
    <fieldset>
      <legend>
        <SurveyQuestionHeading number={number} text={legend} hint={hint} />
      </legend>
      <div className="mt-3 flex flex-wrap gap-2 ps-9">
        {options.map((option) => {
          const checked = selected.includes(option.value)
          return (
            <label
              key={option.value}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-sm transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#7c3aed]/30',
                checked
                  ? 'border-[#7c3aed] bg-[#f3edfe] font-medium text-[#6d28d9] shadow-sm'
                  : 'border-[#e5e5e5] bg-white text-[#27272a] hover:border-[#c4b5fd] hover:bg-[#faf8ff]'
              )}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onToggle(option.value)}
                className="sr-only"
              />
              {checked ? <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
