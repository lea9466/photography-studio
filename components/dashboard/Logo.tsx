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
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [isSvg, setIsSvg] = useState(false)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const previewUrl = getBrandingPreviewUrl(logoUrl)

  useEffect(() => {
    setImageLoadFailed(false)
  }, [previewUrl])

  useEffect(() => {
    if (!previewUrl) {
      setIsSvg(false)
      setSvgContent(null)
      return
    }

    const isSvgFile =
      previewUrl.toLowerCase().includes('.svg') || previewUrl.includes('image/svg+xml')
    setIsSvg(isSvgFile)

    if (isSvgFile && shouldColorLogo) {
      fetch(previewUrl)
        .then((res) => res.text())
        .then((content) => {
          setSvgContent(content)
        })
        .catch(() => {
          setIsSvg(false)
          setSvgContent(null)
          setImageLoadFailed(true)
        })
    } else {
      setSvgContent(null)
    }
  }, [previewUrl, shouldColorLogo])

  if (!previewUrl || imageLoadFailed) {
    return <DefaultLogoIcon className={className} />
  }

  if (isSvg && shouldColorLogo && svgContent) {
    // Render inline SVG with color styling
    return (
      <div 
        className={`w-full h-full flex items-center justify-center ${className}`}
        style={{ '--brand-color': accentColor } as React.CSSProperties}
      >
        <style>{`
          svg path, svg circle, svg rect, svg ellipse, svg polygon, svg polyline, svg line {
            fill: var(--brand-color) !important;
            stroke: var(--brand-color) !important;
          }
        `}</style>
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      </div>
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
