'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'stg_cookie_notice_ack'

// The site only sets strictly-necessary cookies (auth, sessions, gallery
// access) — see /privacy#cookies — so this is an informational notice with
// an acknowledgement, not an opt-in/opt-out consent manager.
export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function acknowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch {
      // storage blocked — banner simply reappears next visit
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="הודעת עוגיות"
      className="fixed inset-x-3 bottom-3 z-[9999] mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-[#e7e2dc] bg-white p-4 text-[#2b2623] shadow-xl sm:flex-row sm:items-center"
    >
      <p className="flex-1 text-sm leading-relaxed">
        האתר משתמש בעוגיות הכרחיות בלבד, לצורך התחברות, ניהול סשנים וגישה לגלריות.
        לא נעשה שימוש בעוגיות פרסום או מעקב.{' '}
        <Link href="/privacy#cookies" className="underline underline-offset-2">
          מדיניות פרטיות
        </Link>
      </p>
      <button
        type="button"
        onClick={acknowledge}
        className="shrink-0 rounded-full bg-[#2b2623] px-5 py-2 text-sm font-medium text-white transition hover:bg-black"
      >
        הבנתי
      </button>
    </div>
  )
}
