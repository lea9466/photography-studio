'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect } from 'react'
import { tenantPath } from '@/lib/tenant-paths'
import {
  getThemeBodyStyle,
  THEME_MANAGED_PROPS,
  usesFullBleedHero,
  type PhotographerColors,
  type ThemeStyle,
} from '@/lib/theme-styles'

type Props = {
  theme: ThemeStyle
  photographerSlug?: string
  primaryColor?: string | null
  secondaryColor?: string | null
}

function isHomePath(pathname: string, slug: string): boolean {
  const home = tenantPath(slug)
  return pathname === home || pathname === `${home}/`
}

export default function ThemeBodyInjector({
  theme,
  photographerSlug,
  primaryColor,
  secondaryColor,
}: Props) {
  const pathname = usePathname()
  const colors: PhotographerColors = { primaryColor, secondaryColor }
  const revealBodyOnHome =
    !!photographerSlug &&
    usesFullBleedHero(theme) &&
    isHomePath(pathname, photographerSlug)

  useLayoutEffect(() => {
    const style = getThemeBodyStyle(theme, colors)
    const body = document.body
    const previous = new Map<string, string>()
    const prevDataTheme = body.getAttribute('data-theme')
    const themeBackground = style.backgroundColor
      ? String(style.backgroundColor)
      : ''

    const html = document.documentElement

    const applyBodyBackground = () => {
      if (revealBodyOnHome && window.scrollY < 1) {
        body.style.backgroundColor = 'transparent'
        html.style.backgroundColor = 'transparent'
        return
      }
      body.style.backgroundColor = themeBackground
      html.style.backgroundColor = themeBackground
    }

    for (const key of THEME_MANAGED_PROPS) {
      previous.set(key, body.style.getPropertyValue(key))
      const value = style[key as keyof typeof style]
      if (value != null && value !== '') {
        body.style.setProperty(key, String(value))
      }
    }

    const prevHtmlBg = html.style.backgroundColor
    previous.set('backgroundColor', body.style.backgroundColor)
    previous.set('color', body.style.color)
    previous.set('fontFamily', body.style.fontFamily)

    applyBodyBackground()
    if (style.color) {
      body.style.color = String(style.color)
    }
    if (style.fontFamily) {
      body.style.fontFamily = String(style.fontFamily)
    }

    body.setAttribute('data-theme', theme)

    const onScroll = () => applyBodyBackground()
    if (revealBodyOnHome) {
      window.addEventListener('scroll', onScroll, { passive: true })
    }

    return () => {
      if (revealBodyOnHome) {
        window.removeEventListener('scroll', onScroll)
      }

      for (const key of THEME_MANAGED_PROPS) {
        const prev = previous.get(key)
        if (prev) body.style.setProperty(key, prev)
        else body.style.removeProperty(key)
      }

      body.style.backgroundColor = previous.get('backgroundColor') ?? ''
      html.style.backgroundColor = prevHtmlBg
      body.style.color = previous.get('color') ?? ''
      body.style.fontFamily = previous.get('fontFamily') ?? ''

      if (prevDataTheme) body.setAttribute('data-theme', prevDataTheme)
      else body.removeAttribute('data-theme')
    }
  }, [theme, primaryColor, secondaryColor, revealBodyOnHome])

  return null
}
