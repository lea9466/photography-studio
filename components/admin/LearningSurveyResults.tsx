'use client'

import { useEffect, useState } from 'react'
import {
  fetchLearningSurveyResponses,
  type AdminLearningSurveyResponse,
} from '@/lib/actions/admin.actions'
import { LEARNED_AT_OPTIONS } from '@/lib/learning-survey/questions'

/** Loose match key, so "רחלי כהן" and "רחלי  כהן." count as the same teacher. */
function nameKey(name: string) {
  return name.trim().replace(/["'.,״׳]/g, '').replace(/\s+/g, ' ').toLowerCase()
}

/** Named teachers/courses, most-mentioned first, with who mentioned them. */
function groupTeachers(rows: AdminLearningSurveyResponse[]) {
  const groups = new Map<string, { name: string; studios: string[] }>()
  for (const row of rows) {
    if (!row.teacherName) continue
    const key = nameKey(row.teacherName)
    const group = groups.get(key) ?? { name: row.teacherName.trim(), studios: [] }
    group.studios.push(row.studioName)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => b.studios.length - a.studios.length)
}

export function LearningSurveyResults() {
  const [rows, setRows] = useState<AdminLearningSurveyResponse[] | null>(null)

  useEffect(() => {
    fetchLearningSurveyResponses()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  const completed = rows?.filter((row) => row.completedAt) ?? []
  const teachers = groupTeachers(completed)

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">איפה למדו צילום</h2>
      {rows === null ? (
        <p className="mt-4 text-sm text-slate-500">טוען...</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-slate-500">
            הוצג ל-{rows.length} · ענו {completed.length}
          </p>

          {completed.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold text-slate-900">דרך הלימוד</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {LEARNED_AT_OPTIONS.map((option) => (
                    <li key={option.value} className="flex justify-between gap-3">
                      <span>{option.label}</span>
                      <span className="font-semibold">
                        {completed.filter((row) => row.learnedAt.includes(option.value)).length}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold text-slate-900">מורות וקורסים שהוזכרו</h3>
                {teachers.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">עדיין אין שמות</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {teachers.map((teacher) => (
                      <li key={teacher.name}>
                        <div className="flex justify-between gap-3">
                          <span className="font-medium text-slate-900">{teacher.name}</span>
                          <span className="font-semibold">{teacher.studios.length}</span>
                        </div>
                        <p className="text-xs text-slate-500">{teacher.studios.join(', ')}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
