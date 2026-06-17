'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import {
  createClientRecord,
  updateClientRecord,
} from '@/lib/actions/client.actions'
import type { Client } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ClientsManagerProps = {
  initialClients: Client[]
}

type ClientFormState = {
  name: string
  email: string
  phone: string
}

const EMPTY_FORM: ClientFormState = {
  name: '',
  email: '',
  phone: '',
}

function clientToForm(client: Client): ClientFormState {
  return {
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
  }
}

export function ClientsManager({ initialClients }: ClientsManagerProps) {
  const [clients, setClients] = useState(initialClients)
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClientFormState>(EMPTY_FORM)

  function openCreateDialog() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEditDialog(client: Client) {
    setEditingId(client.id)
    setForm(clientToForm(client))
    setDialogOpen(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updateClientRecord(editingId, {
            name: form.name,
            email: form.email,
            phone: form.phone,
          })
          setClients((current) =>
            current.map((c) => (c.id === updated.id ? updated : c))
          )
          toast.success('הלקוח עודכן')
        } else {
          const created = await createClientRecord({
            name: form.name,
            email: form.email,
            phone: form.phone,
          })
          setClients((current) => [...current, created])
          toast.success('הלקוח נוצר')
        }
        setDialogOpen(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function handleDelete(clientId: string) {
    if (!window.confirm('למחוק את הלקוח?')) {
      return
    }

    startTransition(async () => {
      try {
        // Note: You'll need to add a deleteClientRecord action if you want this functionality
        toast.error('פונקציית מחיקה טרם מומשה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[--muted]">
          {clients.length === 0
            ? 'עדיין אין לקוחות — הוסיפי את הראשון'
            : `${clients.length} לקוחות`}
        </p>
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          לקוח חדש
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--border] px-6 py-12 text-center text-sm text-[--muted]">
          לדוגמה: ישראל ישראלי, israel@example.com, 050-1234567
        </div>
      ) : (
        <div className="rounded-xl border border-[--border] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[--background] border-b border-[--border]">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-[--muted]">
                  שם
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[--muted]">
                  אימייל
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[--muted]">
                  טלפון
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[--muted]">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-[--border] last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-[--foreground]">
                    {client.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-[--muted]">
                    {client.email ? (
                      <a
                        href={`mailto:${client.email}`}
                        className="flex items-center gap-2 hover:text-[--accent]"
                      >
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </a>
                    ) : (
                      <span className="text-[--muted]/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[--muted]">
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-2 hover:text-[--accent]"
                      >
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </a>
                    ) : (
                      <span className="text-[--muted]/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(client)}
                        disabled={isPending}
                      >
                        <Pencil className="h-4 w-4" />
                        עריכה
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        מחיקה
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'עריכת לקוח' : 'לקוח חדש'}
            </DialogTitle>
            <DialogDescription>
              מלאי את פרטי הלקוח
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">שם הלקוח *</Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, name: e.target.value }))
                }
                placeholder="ישראל ישראלי"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email">אימייל</Label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((current) => ({ ...current, email: e.target.value }))
                }
                placeholder="israel@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-phone">טלפון</Label>
              <Input
                id="client-phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((current) => ({ ...current, phone: e.target.value }))
                }
                placeholder="050-1234567"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              ביטול
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'שומר...' : editingId ? 'שמור שינויים' : 'צור לקוח'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
