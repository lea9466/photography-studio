'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type LogoProps = {
  logoUrl?: string | null
  accentColor?: string
  shouldColorLogo?: boolean
  className?: string
}

export function Logo({ logoUrl, accentColor = '#7c3aed', shouldColorLogo = false, className = '' }: LogoProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [isSvg, setIsSvg] = useState(false)

  useEffect(() => {
    if (!logoUrl) {
      setIsSvg(false)
      setSvgContent(null)
      return
    }

    // Check if it's an SVG
    const isSvgFile = logoUrl.toLowerCase().endsWith('.svg') || logoUrl.includes('image/svg+xml')
    setIsSvg(isSvgFile)

    if (isSvgFile && shouldColorLogo) {
      // Fetch SVG content for inline rendering
      fetch(logoUrl)
        .then(res => res.text())
        .then(content => {
          setSvgContent(content)
        })
        .catch(() => {
          setIsSvg(false)
          setSvgContent(null)
        })
    } else {
      setSvgContent(null)
    }
  }, [logoUrl, shouldColorLogo])

  if (!logoUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <span className="text-2xl">📷</span>
      </div>
    )
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

  // Render as regular image
  return (
    <img 
      alt="Logo" 
      className={`w-full h-full object-contain ${className}`}
      src={logoUrl}
    />
  )
}
