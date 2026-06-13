'use client'

import { useActionState } from 'react'
import {
  approveTestimonialAction,
  deleteTestimonialAction,
  rejectTestimonialAction,
  unpublishTestimonialAction,
  type ActionResult,
} from '@/app/admin/actions'
import type { TestimonialWithClient } from '@/lib/testimonials-db'
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminMessage,
  AdminSectionHeading,
} from './admin-ui'

const initial: ActionResult = { ok: false, message: '' }

function statusBadge(status: string) {
  const variants: Record<string, 'warning' | 'success' | 'muted'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'muted',
  }
  const labels: Record<string, string> = {
    pending: 'ממתין',
    approved: 'מאושר (באתר)',
    rejected: 'נדחה',
  }
  return (
    <AdminBadge variant={variants[status] ?? 'default'}>
      {labels[status] ?? status}
    </AdminBadge>
  )
}

function TestimonialActions({
  item,
  disabled,
}: {
  item: TestimonialWithClient
  disabled?: boolean
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveTestimonialAction,
    initial
  )
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectTestimonialAction,
    initial
  )
  const [unpublishState, unpublishAction, unpublishPending] = useActionState(
    unpublishTestimonialAction,
    initial
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTestimonialAction,
    initial
  )

  const busy =
    approvePending || rejectPending || unpublishPending || deletePending

  return (
    <div className="mt-5 space-y-3 border-t border-border pt-5">
      {item.status === 'pending' ? (
        <div className="flex flex-wrap gap-2">
          <form action={approveAction}>
            <input type="hidden" name="testimonial_id" value={item.id} />
            <AdminButton type="submit" size="sm" disabled={disabled || busy}>
              אישור ופרסום באתר
            </AdminButton>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="testimonial_id" value={item.id} />
            <AdminButton
              type="submit"
              variant="secondary"
              size="sm"
              disabled={disabled || busy}
            >
              דחייה
            </AdminButton>
          </form>
        </div>
      ) : null}

      {item.status === 'approved' ? (
        <form action={unpublishAction}>
          <input type="hidden" name="testimonial_id" value={item.id} />
          <AdminButton
            type="submit"
            variant="secondary"
            size="sm"
            disabled={disabled || busy}
          >
            הסרה מהאתר
          </AdminButton>
        </form>
      ) : null}

      <form action={deleteAction}>
        <input type="hidden" name="testimonial_id" value={item.id} />
        <AdminButton
          type="submit"
          variant="danger"
          size="sm"
          disabled={disabled || busy}
        >
          מחיקה
        </AdminButton>
      </form>

      <AdminMessage
        ok={
          approveState.ok ||
          rejectState.ok ||
          unpublishState.ok ||
          deleteState.ok
        }
        message={
          approveState.message ||
          rejectState.message ||
          unpublishState.message ||
          deleteState.message
        }
      />
    </div>
  )
}

export default function TestimonialsPanel({
  testimonials,
  disabled,
}: {
  testimonials: TestimonialWithClient[]
  disabled?: boolean
}) {
  const pending = testimonials.filter((t) => t.status === 'pending')
  const rest = testimonials.filter((t) => t.status !== 'pending')

  if (testimonials.length === 0) {
    return (
      <AdminEmpty>
        אין המלצות עדיין. לקוחות יוכלו לשלוח המלצות מהאזור האישי — והן יופיעו
        כאן לאישור.
      </AdminEmpty>
    )
  }

  const renderList = (items: TestimonialWithClient[], title: string) =>
    items.length === 0 ? null : (
      <div className="space-y-4">
        <AdminSectionHeading title={title} />
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <AdminCard>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{item.client_name}</p>
                  {statusBadge(item.status)}
                </div>
                <p className="mt-4 leading-relaxed text-foreground/85">
                  &ldquo;{item.content}&rdquo;
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  נשלח:{' '}
                  {new Date(item.created_at).toLocaleDateString('he-IL')}
                  {item.reviewed_at
                    ? ` · טופל: ${new Date(item.reviewed_at).toLocaleDateString('he-IL')}`
                    : ''}
                </p>
                <TestimonialActions item={item} disabled={disabled} />
              </AdminCard>
            </li>
          ))}
        </ul>
      </div>
    )

  return (
    <div className="space-y-10">
      {renderList(pending, `ממתינות לאישור (${pending.length})`)}
      {renderList(rest, 'היסטוריה')}
    </div>
  )
}
