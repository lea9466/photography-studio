'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type ImpersonationBannerProps = {
  studioName?: string | null
}

export function ImpersonationBanner({ studioName }: ImpersonationBannerProps) {
  const [pending, setPending] = useState(false)

  async function handleExitImpersonation() {
    setPending(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('יציאה ממצב תמיכה נכשלה')
      }

      window.location.href = '/manage'
    } catch {
      setPending(false)
      window.alert('יציאה ממצב תמיכה נכשלה. נסי שוב.')
    }
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[60] border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-950 shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">
          מצב תמיכה פעיל
          {studioName ? (
            <span className="font-normal text-amber-900"> — {studioName}</span>
          ) : null}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-400 bg-white hover:bg-amber-100"
          onClick={handleExitImpersonation}
          disabled={pending}
        >
          {pending ? 'יוצא...' : 'חזרה לניהול מנהל'}
        </Button>
      </div>
    </div>
  )
}
