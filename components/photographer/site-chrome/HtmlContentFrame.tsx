'use client'

import { useEffect, useRef, useState } from 'react'

type HtmlContentFrameProps = {
  html: string
  title: string
}

/**
 * Like HtmlFramePage, but sized to its actual content height instead of a
 * fixed 100vh with its own internal scrolling — used only for classic-theme
 * pages, where header/footer are now persistent React rendered outside the
 * iframe (app/[slug]/layout.tsx) and the outer page is what scrolls, the
 * same way a plain content div would. srcDoc iframes are same-origin, so
 * the real content height can be read directly — no postMessage protocol
 * needed the way a cross-origin iframe would require.
 *
 * elegant/modern/dark pages are untouched and keep using HtmlFramePage
 * (fixed 100vh, self-scrolling, nav/footer still rendered inside).
 */
export function HtmlContentFrame({ html, title }: HtmlContentFrameProps) {
  const [mounted, setMounted] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function measure() {
      const doc = iframe?.contentDocument
      if (doc?.body) setHeight(doc.body.scrollHeight)
    }

    function handleLoad() {
      observerRef.current?.disconnect()
      measure()
      const doc = iframe?.contentDocument
      if (doc?.body && typeof ResizeObserver !== 'undefined') {
        observerRef.current = new ResizeObserver(measure)
        observerRef.current.observe(doc.body)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => {
      iframe.removeEventListener('load', handleLoad)
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [html])

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      style={{ width: '100%', height: height || '100vh', border: 'none', display: 'block' }}
      title={title}
    />
  )
}
