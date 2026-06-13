'use client'

import { AdminThemeProvider } from './AdminThemeContext'

type Props = {
  themeStyle: string | null | undefined
  primaryColor?: string | null
  secondaryColor?: string | null
  children: React.ReactNode
}

export default function AdminThemeShell(props: Props) {
  return <AdminThemeProvider {...props} />
}
