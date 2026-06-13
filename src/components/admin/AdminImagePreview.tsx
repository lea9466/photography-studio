'use client'

import { useEffect, useState } from 'react'

type Props = {
  src: string | null
  pendingFile?: File | null
  emptyText?: string
}

export default function AdminImagePreview({
  src,
  pendingFile,
  emptyText,
}: Props) {
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const displaySrc = localUrl ?? src

  useEffect(() => {
    if (!pendingFile) {
      setLocalUrl(null)
      return
    }
    const url = URL.createObjectURL(pendingFile)
    setLocalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingFile])

  if (!displaySrc) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
        <svg
          className="mb-3 h-8 w-8 text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
        <p className="text-sm text-muted-foreground">
          {emptyText ?? 'עדיין לא הועלתה תמונה'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-56 items-center justify-center p-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={displaySrc}
        src={displaySrc}
        alt=""
        className="max-h-44 max-w-full object-contain"
      />
    </div>
  )
}
