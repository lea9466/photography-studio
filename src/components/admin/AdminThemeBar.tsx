'use client'

import { THEME_LABELS, THEME_STYLES, type ThemeStyle } from '@/lib/theme-styles'
import AdminThemeImageHints from './AdminThemeImageHints'

export default function AdminThemeSection({
  previewTheme,
  primary,
  secondary,
  disabled,
  onThemeSelect,
  onPrimaryChange,
  onSecondaryChange,
}: {
  previewTheme: ThemeStyle
  primary: string
  secondary: string
  disabled?: boolean
  onThemeSelect: (theme: ThemeStyle) => void
  onPrimaryChange: (color: string) => void
  onSecondaryChange: (color: string) => void
}) {
  return (
    <section className="space-y-6 pb-10">
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">ערכת עיצוב</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          בחרו ערכה — התצוגה מתעדכנת מיד. השמירה מתבצעת בכפתור הצף למטה.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {THEME_STYLES.map((theme) => {
          const active = previewTheme === theme
          return (
            <button
              key={theme}
              type="button"
              disabled={disabled}
              onClick={() => onThemeSelect(theme)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'admin-tab-active'
                  : 'bg-muted/50 text-foreground/80 hover:bg-muted hover:text-foreground'
              }`}
            >
              {THEME_LABELS[theme]}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-end gap-8">
        <label className="space-y-2.5 text-sm text-foreground/80">
          <span className="font-medium">צבע ראשי</span>
          <input
            type="color"
            value={primary}
            disabled={disabled}
            onChange={(e) => onPrimaryChange(e.target.value)}
            className="block h-11 w-20 cursor-pointer rounded-xl bg-muted/40"
          />
        </label>
        <label className="space-y-2.5 text-sm text-foreground/80">
          <span className="font-medium">צבע משני</span>
          <input
            type="color"
            value={secondary}
            disabled={disabled}
            onChange={(e) => onSecondaryChange(e.target.value)}
            className="block h-11 w-20 cursor-pointer rounded-xl bg-muted/40"
          />
        </label>
      </div>

      <div className="pt-5">
        <AdminThemeImageHints theme={previewTheme} />
      </div>
    </section>
  )
}
