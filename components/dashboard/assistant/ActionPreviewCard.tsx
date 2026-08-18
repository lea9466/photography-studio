'use client'

import { Check, X, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AssistantPreview } from '@/lib/assistant/tools/preview-types'

export type ActionPreviewStatus = 'pending' | 'approved' | 'cancelled' | 'error'

type ActionPreviewCardProps = {
  preview: AssistantPreview
  status: ActionPreviewStatus
  busy?: boolean
  errorMessage?: string | null
  onApprove: () => void
  onCancel: () => void
  undoAvailable?: boolean
  onUndo?: () => void
  undoBusy?: boolean
}

// Deliberately not the shared <Card> primitive: Card uses the public
// site's theme-able CSS vars (--background/--foreground/--border, which
// change with the photographer's chosen accent color and can render this
// card invisible). Dashboard chrome always uses the fixed --dashboard-*
// tokens instead — same convention as SidebarNav.tsx.
export function ActionPreviewCard({
  preview,
  status,
  busy,
  errorMessage,
  onApprove,
  onCancel,
  undoAvailable,
  onUndo,
  undoBusy,
}: ActionPreviewCardProps) {
  return (
    <div className="max-w-md rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-background)] p-4 shadow-sm">
      <p className="text-base font-semibold text-[var(--dashboard-foreground)]">{preview.title}</p>

      <div className="mt-3 space-y-3">
        {preview.fields.map((field) => (
          <div key={field.key} className="space-y-1 text-sm">
            <p className="font-medium text-[var(--dashboard-foreground)]">{field.label}</p>
            {field.before ? (
              <p className="text-[var(--dashboard-muted)] line-through decoration-[var(--dashboard-muted)]/60">
                {field.before}
              </p>
            ) : null}
            <p className="whitespace-pre-wrap text-[var(--dashboard-foreground)]">{field.after || '(ריק)'}</p>
            {field.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={field.imageUrl}
                alt=""
                className="mt-1 h-32 w-full rounded-md border border-[var(--dashboard-border)] object-cover"
              />
            ) : null}
          </div>
        ))}

        {status === 'pending' ? (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={onApprove} disabled={busy} className="gap-1.5">
              <Check className="h-4 w-4" />
              אשר ומלא
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} disabled={busy} className="gap-1.5">
              <X className="h-4 w-4" />
              שנה / בטל
            </Button>
          </div>
        ) : null}

        {status === 'approved' ? (
          <div className="flex items-center justify-between gap-2 pt-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Check className="h-4 w-4" />
              בוצע ✓
            </p>
            {undoAvailable ? (
              <Button size="sm" variant="ghost" onClick={onUndo} disabled={undoBusy} className="gap-1.5">
                <Undo2 className="h-4 w-4" />
                בטל פעולה זו
              </Button>
            ) : null}
          </div>
        ) : null}

        {status === 'cancelled' ? (
          <p className="pt-2 text-sm text-[var(--dashboard-muted)]">בוטל — לא נשמר שינוי</p>
        ) : null}

        {status === 'error' ? (
          <p className="pt-2 text-sm text-red-600">{errorMessage || 'משהו השתבש — נסי שוב'}</p>
        ) : null}
      </div>
    </div>
  )
}
