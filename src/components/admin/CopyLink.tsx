'use client'

import { useEffect, useState } from 'react'
import { AdminButton } from './admin-ui'

export default function CopyLink({
  path,
  label,
}: {
  path: string
  label?: string
}) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const url = `${origin}${path}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-2">
      {label ? (
        <span className="block text-sm font-medium text-foreground">{label}</span>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          readOnly
          dir="ltr"
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="admin-input w-full py-2 text-xs"
        />
        <AdminButton type="button" size="sm" onClick={copy}>
          {copied ? 'הועתק ✓' : 'העתקה'}
        </AdminButton>
      </div>
    </div>
  )
}
