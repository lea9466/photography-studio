'use client'

import { useActionState, useState } from 'react'
import {
  deletePackageAction,
  savePackageAction,
  type ActionResult,
} from '@/app/admin/actions'
import type { PackagesRow } from '@/lib/database.types'
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCheckbox,
  AdminEmpty,
  AdminField,
  AdminMessage,
  AdminPanelToolbar,
  AdminSectionHeading,
} from './admin-ui'

const initial: ActionResult = { ok: false, message: '' }

function PackageForm({
  pkg,
  count,
  onCancel,
  disabled,
}: {
  pkg: PackagesRow | null
  count: number
  onCancel?: () => void
  disabled?: boolean
}) {
  const [state, action, pending] = useActionState(savePackageAction, initial)

  return (
    <AdminCard>
      <AdminSectionHeading
        title={pkg ? 'עריכת חבילה' : 'חבילה חדשה'}
        description="הגדירו שם, מחיר ומה כלול — יוצג בדף המחירון באתר."
      />

      <form action={action} className="mt-6 space-y-6">
        {pkg?.id ? (
          <input type="hidden" name="package_id" value={pkg.id} />
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <AdminField
            label="שם החבילה"
            name="title"
            defaultValue={pkg?.title ?? ''}
            required
          />
          <AdminField
            label="מחיר (₪ — אופציונלי)"
            name="price"
            type="number"
            min={0}
            defaultValue={pkg?.price ?? ''}
            hint="השאירו ריק כדי להציג 'לפי בקשה'"
          />
          <AdminField
            label="סדר תצוגה"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={pkg?.sort_order ?? count}
            hint="מספר נמוך = מוצג קודם"
          />
        </div>

        <AdminField
          label="תיאור קצר"
          name="description"
          rows={2}
          defaultValue={pkg?.description ?? ''}
        />

        <AdminField
          label="מה כלול (שורה לכל פריט)"
          name="features"
          rows={5}
          defaultValue={(pkg?.features ?? []).join('\n')}
          hint="כל שורה תוצג כפריט נפרד ברשימה"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <AdminCheckbox
            name="is_active"
            label="פעיל (מוצג במחירון)"
            defaultChecked={pkg ? pkg.is_active !== false : true}
            disabled={disabled}
          />
          <AdminCheckbox
            name="is_featured"
            label="חבילה מומלצת (הדגשה)"
            defaultChecked={pkg?.is_featured === true}
            disabled={disabled}
          />
        </div>

        <AdminMessage ok={state.ok} message={state.message} />

        <div className="flex flex-wrap gap-3">
          <AdminButton type="submit" disabled={disabled || pending}>
            {pending ? 'שומר...' : pkg ? 'עדכון חבילה' : 'יצירת חבילה'}
          </AdminButton>
          {onCancel ? (
            <AdminButton type="button" variant="secondary" onClick={onCancel}>
              ביטול
            </AdminButton>
          ) : null}
        </div>
      </form>
    </AdminCard>
  )
}

export default function PackagesPanel({
  packages,
  disabled,
}: {
  packages: PackagesRow[]
  disabled?: boolean
}) {
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list')
  const [editing, setEditing] = useState<PackagesRow | null>(null)

  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deletePackageAction,
    initial
  )

  return (
    <div className="space-y-6">
      {mode === 'list' ? (
        <>
          <AdminPanelToolbar
            count={packages.length}
            countLabel="חבילות תמחור"
            action={
              <AdminButton
                type="button"
                onClick={() => {
                  setEditing(null)
                  setMode('new')
                }}
                disabled={disabled}
              >
                + חבילה חדשה
              </AdminButton>
            }
          />

          <AdminMessage ok={deleteState.ok} message={deleteState.message} />

          {packages.length === 0 ? (
            <AdminEmpty>
              אין חבילות עדיין. צרו חבילה ראשונה שתופיע בדף המחירון באתר.
            </AdminEmpty>
          ) : (
            <ul className="space-y-3">
              {packages.map((pkg) => (
                <li key={pkg.id}>
                  <AdminCard hover className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-right">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                        {pkg.title?.trim() || 'ללא שם'}
                        {pkg.is_featured ? (
                          <AdminBadge variant="warning">מומלץ</AdminBadge>
                        ) : null}
                        {pkg.is_active === false ? (
                          <AdminBadge variant="muted">מוסתר</AdminBadge>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pkg.price != null
                          ? `₪${pkg.price.toLocaleString('he-IL')}`
                          : 'לפי בקשה'}
                        {pkg.features?.length
                          ? ` · ${pkg.features.length} פריטים`
                          : ''}
                      </p>
                      {pkg.description?.trim() ? (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80">
                          {pkg.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <AdminButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                          setEditing(pkg)
                          setMode('edit')
                        }}
                      >
                        עריכה
                      </AdminButton>
                      <form action={deleteFormAction}>
                        <input type="hidden" name="package_id" value={pkg.id} />
                        <AdminButton
                          type="submit"
                          variant="danger"
                          size="sm"
                          disabled={disabled || deletePending}
                        >
                          מחיקה
                        </AdminButton>
                      </form>
                    </div>
                  </AdminCard>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <PackageForm
          pkg={mode === 'edit' ? editing : null}
          count={packages.length}
          disabled={disabled}
          onCancel={() => {
            setMode('list')
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
