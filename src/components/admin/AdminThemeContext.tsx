'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import ThemeBodyInjector from '@/components/ThemeBodyInjector'
import { parseThemeStyle, type ThemeStyle } from '@/lib/theme-styles'

const AdminThemeContext = createContext<{
  previewTheme: ThemeStyle
  setPreviewTheme: (theme: ThemeStyle) => void
} | null>(null)

export function useAdminThemePreview() {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) {
    throw new Error('useAdminThemePreview must be used within AdminThemeShell')
  }
  return ctx
}

export function AdminThemeProvider({
  themeStyle,
  primaryColor,
  secondaryColor,
  children,
}: {
  themeStyle: string | null | undefined
  primaryColor?: string | null
  secondaryColor?: string | null
  children: React.ReactNode
}) {
  const [previewTheme, setPreviewTheme] = useState<ThemeStyle>(() =>
    parseThemeStyle(themeStyle)
  )

  useEffect(() => {
    setPreviewTheme(parseThemeStyle(themeStyle))
  }, [themeStyle])

  return (
    <AdminThemeContext.Provider value={{ previewTheme, setPreviewTheme }}>
      <ThemeBodyInjector
        theme={previewTheme}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
      <div
        data-admin="true"
        data-theme={previewTheme}
        className="admin-shell-bg min-h-screen text-foreground"
        dir="rtl"
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
