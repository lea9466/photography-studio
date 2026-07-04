'use client'

import { useEffect, useState } from 'react'

type HtmlFramePageProps = {
  html: string
  title: string
}

export function HtmlFramePage({ html, title }: HtmlFramePageProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <iframe
      srcDoc={html}
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title={title}
    />
  )
}
