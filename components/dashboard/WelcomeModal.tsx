'use client'

import { useEffect, useState, useTransition } from 'react'
import { dismissWelcomePopup } from '@/lib/actions/onboarding.actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, Globe, Image, Palette, Sparkles } from 'lucide-react'

type WelcomeModalProps = {
  open: boolean
  previewUrl?: string | null
}

const STEPS = [
  {
    icon: Globe,
    title: 'כתובת האתר (Slug)',
    description:
      'דבר ראשון — בחרי כתובת קצרה לאתר שלך. עד שלא תגדירי slug ותשמרי, האתר לא יהיה זמין לצפייה.',
  },
  {
    icon: Palette,
    title: 'מיתוג ועיצוב',
    description:
      'בחרי את צבע המותג שלך — הוא משמש לקישורים, הדגשות, כפתורים וקווים מודגשים בכל האתר. בחרי גם ערכת נושא, שמרי שינויים, ורק אז תוכלי לפתוח את האתר ולראות איך זה נראה.',
  },
  {
    icon: Image,
    title: 'תמונות ותוכן',
    description:
      'העלי תמונות רקע, צרי גלריות, הגדירי שאלות ותשובות וחבילות — ובמקביל תראי את האתר מתעדכן.',
  },
] as const

export function WelcomeModal({ open, previewUrl }: WelcomeModalProps) {
  const [visible, setVisible] = useState(open)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setVisible(open)
  }, [open])

  function focusSlugField() {
    requestAnimationFrame(() => {
      const slugInput = document.getElementById('slug')
      slugInput?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      slugInput?.focus()
    })
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissWelcomePopup()
      setVisible(false)
      focusSlugField()
    })
  }

  function handleOpenPreview() {
    if (!previewUrl) return
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={visible} onOpenChange={(next) => !next && handleDismiss()}>
      <DialogContent className="max-w-lg overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-amber-500" />
            ברוכה הבאה!
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            שמחים שהצטרפת אלינו. הנה בקצרה מה כדאי לעשות כדי להקים את האתר שלך:
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 py-2">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="flex min-w-0 gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[--border]/40 text-sm font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="flex items-center gap-1.5 font-medium text-[--foreground]">
                  <Icon className="h-4 w-4 shrink-0 text-[--muted]" />
                  {title}
                </p>
                <p className="text-sm leading-relaxed text-[--muted]">{description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm leading-relaxed text-[--foreground] dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="flex items-start gap-2">
            <Palette className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <span className="font-semibold">צבע המותג</span> — בחרי אותו תחת &quot;הגדרות אתר&quot;. הוא
              קובע את צבע הקישורים, ההדגשות, הכפתורים והקווים המודגשים באתר שלך.
            </span>
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
        <span>האתר בהרצה קבלי בהנה אם יש שגיאות או באגים ונשמח אם תעדכני אותנו😊</span>
          <Button onClick={handleDismiss} disabled={pending} className="w-full">
            בואי נתחיל!
          </Button>
          {previewUrl ? (
            <>
              <p className="w-full text-center text-sm font-medium text-[--foreground]">
                כדי לראות את האתר — יש לשמור שינויים קודם, ואז יפתח כפתור לצפייה באתר .
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenPreview}
                className="w-full gap-2"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                פתיחת האתר בכרטיסייה חדשה
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
