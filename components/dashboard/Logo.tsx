'use client'

import { useState, useEffect } from 'react'
import { Camera } from 'lucide-react'
import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'

type LogoProps = {
  logoUrl?: string | null
  accentColor?: string
  shouldColorLogo?: boolean
  className?: string
}

function DefaultLogoIcon({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <Camera className="h-6 w-6 text-current opacity-90" strokeWidth={1.75} />
    </div>
  )
}

export function Logo({ logoUrl, accentColor = '#7c3aed', shouldColorLogo = false, className = '' }: LogoProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const previewUrl = getBrandingPreviewUrl(logoUrl)

  const isSvg = Boolean(
    previewUrl && (previewUrl.toLowerCase().includes('.svg') || previewUrl.includes('image/svg+xml'))
  )
  const useMask = isSvg && shouldColorLogo

  useEffect(() => {
    setImageLoadFailed(false)

    if (!previewUrl || !useMask) return

    // A CSS mask has no load/error event of its own, so probe the URL via
    // Image() purely to detect unreachable files and fall back to the
    // default icon — same failure UX as the plain <img> branch below.
    // This never reads/parses the SVG's markup: browsers paint an SVG
    // loaded this way as a static image resource, so any <script> or
    // event-handler content inside an uploaded file cannot execute
    // (unlike the previous fetch + dangerouslySetInnerHTML approach).
    const probe = new Image()
    probe.onerror = () => setImageLoadFailed(true)
    probe.src = previewUrl

    return () => {
      probe.onerror = null
    }
  }, [previewUrl, useMask])

  if (!previewUrl || imageLoadFailed) {
    return <DefaultLogoIcon className={className} />
  }

  if (useMask) {
    // Recolors the logo with a CSS mask instead of injecting the SVG's raw
    // markup into the DOM. Callers always render Logo inside a fixed
    // square box (see SidebarNav/MobileHeader), so w-full h-full here
    // fills that box and mask-size: contain scales the shape to fit it —
    // the same visual result as object-contain on a normal <img>.
    return (
      <div
        role="img"
        aria-label=""
        className={`w-full h-full ${className}`}
        style={{
          backgroundColor: accentColor,
          maskImage: `url("${previewUrl}")`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url("${previewUrl}")`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
        } as React.CSSProperties}
      />
    )
  }

  return (
    <img 
      alt="" 
      className={`w-full h-full object-contain ${className}`}
      src={previewUrl}
      onError={() => setImageLoadFailed(true)}
    />
  )
}
