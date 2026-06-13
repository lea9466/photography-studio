'use client'

import { useActionState, useState } from 'react'
import {
  deleteClientAction,
  saveClientAction,
  type ActionResult,
} from '@/app/admin/actions'
import type { ClientWithUser } from '@/lib/admin-db'
import {
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminField,
  AdminMessage,
  AdminPanelToolbar,
  AdminSectionHeading,
} from './admin-ui'

const initial: ActionResult = { ok: false, message: '' }

function ClientForm({
  client,
  onCancel,
  disabled,
}: {
  client: ClientWithUser | null
  onCancel?: () => void
  disabled?: boolean
}) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      saveClientAction(
        client?.id ?? null,
        client?.users?.id ?? client?.user_id ?? null,
        formData
      ),
    initial
  )

  return (
    <AdminCard>
      <AdminSectionHeading
        title={client ? 'עריכת לקוח' : 'לקוח חדש'}
        description={
          client
            ? 'עדכנו פרטים או קוד גישה לאזור האישי.'
            : 'הוסיפו לקוח חדש עם אימייל וקוד גישה.'
        }
      />

      <form action={action} className="mt-6 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminField
            label="שם מלא"
            name="full_name"
            defaultValue={client?.full_name ?? ''}
            required
          />
          <AdminField
            label="טלפון"
            name="phone"
            defaultValue={client?.phone ?? ''}
          />
          <AdminField
            label="אימייל (להתחברות לאזור הלקוח)"
            name="email"
            type="email"
            defaultValue={client?.users?.email ?? ''}
            required
          />
          <AdminField
            label="קוד גישה (לאזור הלקוח)"
            name="access_code"
            defaultValue={client?.users?.access_code ?? ''}
            hint="הלקוח מתחבר עם האימייל והקוד הזה. השאירו ריק כדי לחסום התחברות."
          />
        </div>

        <AdminMessage ok={state.ok} message={state.message} />

        <div className="flex flex-wrap gap-3">
          <AdminButton type="submit" disabled={disabled || pending}>
            {pending ? 'שומר...' : client ? 'עדכון לקוח' : 'הוספת לקוח'}
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

export default function ClientsPanel({
  clients,
  disabled,
}: {
  clients: ClientWithUser[]
  disabled?: boolean
}) {
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list')
  const [editing, setEditing] = useState<ClientWithUser | null>(null)

  const [deleteState, deleteFormAction, deletePending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const clientId = String(formData.get('client_id') ?? '')
      const userId = String(formData.get('user_id') ?? '')
      if (!clientId || !userId) {
        return { ok: false, message: 'חסר מזהה לקוח' }
      }
      return deleteClientAction(clientId, userId)
    },
    initial
  )

  return (
    <div className="space-y-6">
      {mode === 'list' ? (
        <>
          <AdminPanelToolbar
            count={clients.length}
            countLabel="לקוחות במערכת"
            action={
              <AdminButton
                type="button"
                onClick={() => setMode('new')}
                disabled={disabled}
              >
                + לקוח חדש
              </AdminButton>
            }
          />

          <AdminMessage ok={deleteState.ok} message={deleteState.message} />

          {clients.length === 0 ? (
            <AdminEmpty>
              אין לקוחות עדיין. לחצו &quot;לקוח חדש&quot; כדי להוסיף את הלקוח
              הראשון ולתת לו גישה לאזור האישי.
            </AdminEmpty>
          ) : (
            <ul className="space-y-3">
              {clients.map((client) => (
                <li key={client.id}>
                  <AdminCard hover className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-right">
                      <p className="font-medium text-foreground">
                        {client.full_name?.trim() || 'ללא שם'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {client.phone?.trim() || '—'} · {client.users?.email ?? '—'}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        קוד גישה:{' '}
                        {client.users?.access_code?.trim() ? (
                          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-foreground">
                            {client.users.access_code}
                          </code>
                        ) : (
                          'לא הוגדר'
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <AdminButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                          setEditing(client)
                          setMode('edit')
                        }}
                      >
                        עריכה
                      </AdminButton>
                      <form action={deleteFormAction}>
                        <input type="hidden" name="client_id" value={client.id} />
                        <input
                          type="hidden"
                          name="user_id"
                          value={client.user_id}
                        />
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
        <ClientForm
          client={mode === 'edit' ? editing : null}
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
