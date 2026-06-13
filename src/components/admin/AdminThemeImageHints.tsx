'use client'

import { formatThemeImageHints } from '@/lib/image-recommendations'
import { type ThemeStyle } from '@/lib/theme-styles'

export default function AdminThemeImageHints({ theme }: { theme: ThemeStyle }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {formatThemeImageHints(theme)}
    </p>
  )
}
