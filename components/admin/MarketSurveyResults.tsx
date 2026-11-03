'use client'

import { useEffect, useState } from 'react'
import {
  fetchMarketSurveyResponses,
  type AdminMarketSurveyResponse,
} from '@/lib/actions/admin.actions'
import { MARKET_SURVEY_SUMMARY } from '@/lib/market-survey/questions'

function countAnswers(responses: AdminMarketSurveyResponse[], key: string, value: string) {
  return responses.filter((response) => {
    const answer = response.answers?.[key]
    return Array.isArray(answer) ? answer.includes(value) : answer === value
  }).length
}

function textAnswers(response: AdminMarketSurveyResponse) {
  const labels = [
    ['sourceDetail', 'קבוצה'],
    ['blockerDetail', 'מה חסר'],
    ['churnReason', 'מה יגרום לא לחדש'],
    ['notes', 'משהו נוסף'],
  ] as const
  return labels.flatMap(([key, label]) => {
    const text = response.answers?.[key]
    return typeof text === 'string' && text ? [{ label, text }] : []
  })
}

/** One photographer's multiple-choice answers, as labels, in question order. */
function choiceAnswers(response: AdminMarketSurveyResponse) {
  return MARKET_SURVEY_SUMMARY.flatMap((question) => {
    const answer = response.answers?.[question.key]
    const picked = Array.isArray(answer) ? answer : answer ? [answer] : []
    const labels = question.options
      .filter((option) => picked.includes(option.value))
      .map((option) => option.label)
    return labels.length > 0 ? [{ label: question.title, text: labels.join(', ') }] : []
  })
}

/** Counts per question, plus each photographer's own answers to a call and any free-text answers. */
export function MarketSurveyResults() {
  const [rows, setRows] = useState<AdminMarketSurveyResponse[] | null>(null)

  useEffect(() => {
    fetchMarketSurveyResponses()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  const completed = rows?.filter((row) => row.completedAt) ?? []
  const subscribers = completed.filter((row) => row.wasSubscriber).length

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">סקר צלמות</h2>
      {rows === null ? (
        <p className="mt-4 text-sm text-slate-500">טוען...</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-slate-500">
            הוצג ל-{rows.length} · ענו {completed.length} ({subscribers} מנויות)
          </p>

          {completed.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MARKET_SURVEY_SUMMARY.map((question) => (
                <div key={question.key} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{question.title}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {question.options.map((option) => (
                      <li key={option.value} className="flex justify-between gap-3">
                        <span>{option.label}</span>
                        <span className="font-semibold">
                          {countAnswers(completed, question.key, option.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {completed.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-900">תשובות לפי צלמת</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {completed.map((row) => (
                  <li key={row.userId}>
                    <details className="group rounded-xl border border-slate-200 bg-slate-50/70 text-sm">
                      <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 p-3 font-semibold text-slate-900">
                        <span>{row.studioName}</span>
                        {row.wasSubscriber ? <span className="text-xs font-normal text-violet-700">מנויה</span> : null}
                        {row.canContact ? <span className="text-xs font-normal text-emerald-700">אפשר לחזור אליה</span> : null}
                        {row.completedAt ? (
                          <span className="ms-auto text-xs font-normal text-slate-500">
                            {new Date(row.completedAt).toLocaleDateString('he-IL')}
                          </span>
                        ) : null}
                      </summary>
                      <div className="border-t border-slate-200 px-3 pb-3 pt-2">
                        {row.canContact ? (
                          <p className="text-xs text-slate-500">
                            {row.email ?? 'אין מייל'}
                            {row.phone ? ` · ${row.phone}` : ''}
                          </p>
                        ) : null}
                        {[...choiceAnswers(row), ...textAnswers(row)].map((answer) => (
                          <p key={answer.label} className="mt-1 whitespace-pre-line text-slate-700">
                            <span className="text-slate-500">{answer.label}:</span> {answer.text}
                          </p>
                        ))}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
