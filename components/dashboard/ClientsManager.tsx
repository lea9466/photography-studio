'use client'

import { useMemo, useState, useTransition } from 'react'
import { Pencil, Plus, Trash2, Mail, Phone, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
} from '@/lib/actions/client.actions'
import type { Client } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'
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

/** Two-letter monogram for the avatar circle — matches the gallery wizard's client cards. */
function clientInitials(name: string): string {
  return name.trim().slice(0, 2) || '?'
}

export function ClientsManager({ initialClients }: ClientsManagerProps) {
  const [clients, setClients] = useState(initialClients)
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClientFormState>(EMPTY_FORM)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const visibleClients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    )
  }, [clients, search])

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
        await deleteClientRecord(clientId)
        setClients((current) => current.filter((c) => c.id !== clientId))
        toast.success('הלקוח נמחק')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!window.confirm(`למחוק ${selectedIds.size} לקוחות?`)) {
      return
    }

    startTransition(async () => {
      try {
        await Promise.all(Array.from(selectedIds).map((id) => deleteClientRecord(id)))
        setClients((current) => current.filter((c) => !selectedIds.has(c.id)))
        setSelectedIds(new Set())
        toast.success('הלקוחות נמחקו')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  const allVisibleSelected =
    visibleClients.length > 0 &&
    visibleClients.every((c) => selectedIds.has(c.id))

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleClients.forEach((c) => next.delete(c.id))
      } else {
        visibleClients.forEach((c) => next.add(c.id))
      }
      return next
    })
  }

  function toggleSelect(clientId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-[--muted]">
            {clients.length === 0
              ? 'עדיין אין לקוחות — הוסיפי את הראשון'
              : `${clients.length} לקוחות`}
          </p>
          {clients.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm font-medium text-[#7D3A52] transition-colors hover:text-[#6a2f44]"
            >
              {allVisibleSelected ? 'ביטול סימון' : 'סימון הכל'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
              מחק נבחרים ({selectedIds.size})
            </Button>
          )}
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            לקוח חדש
          </Button>
        </div>
      </div>

      {clients.length > 0 && (
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--muted]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לקוח לפי שם או אימייל..."
            className="w-full rounded-xl border border-[--border] bg-white py-2.5 pr-10 pl-3 text-sm outline-none transition-colors focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/15"
          />
        </div>
      )}

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--border] px-6 py-12 text-center text-sm text-[--muted]">
          לדוגמה: ישראל ישראלי, israel@example.com, 050-1234567
        </div>
      ) : visibleClients.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[--border] px-6 py-10 text-center text-sm text-[--muted]">
          לא נמצאו לקוחות שמתאימים לחיפוש
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleClients.map((client) => {
            const selected = selectedIds.has(client.id)
            return (
              <div
                key={client.id}
                className={cn(
                  'relative flex flex-col rounded-xl border bg-white p-5 transition-all hover:shadow-sm',
                  selected
                    ? 'border-[#7D3A52] bg-[#f1edef]'
                    : 'border-[--border] hover:border-[#7D3A52]/40'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e5dff9] text-base font-bold text-[#100d1f]">
                    {clientInitials(client.name)}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <h3 className="truncate text-base font-semibold text-[--foreground]">
                      {client.name}
                    </h3>
                    {client.email ? (
                      <a
                        href={`mailto:${client.email}`}
                        className="mt-1 flex items-center gap-1.5 text-sm text-[--muted] transition-colors hover:text-[#7D3A52]"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-[--muted]/60">אין אימייל</p>
                    )}
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="mt-1 flex items-center gap-1.5 text-sm text-[--muted] transition-colors hover:text-[#7D3A52]"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate" dir="ltr">
                          {client.phone}
                        </span>
                      </a>
                    ) : null}
                  </div>
                  <label className="shrink-0 cursor-pointer p-1" title="בחירה למחיקה מרובה">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelect(client.id)}
                      className="h-4 w-4 accent-[#7D3A52]"
                    />
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 border-t border-[--border] pt-3">
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
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    מחיקה
                  </Button>
                </div>
              </div>
            )
          })}
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
