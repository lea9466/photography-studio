'use client'

import { useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { updateClientRecord } from '@/lib/actions/client.actions'
import type { Client } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type ClientEditFormProps = {
  client: Client
  galleryId: string
}

export function ClientEditForm({ client, galleryId }: ClientEditFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(client.name)
  const [email, setEmail] = useState(client.email ?? '')
  const [phone, setPhone] = useState(client.phone ?? '')

  function handleCancel() {
    setName(client.name)
    setEmail(client.email ?? '')
    setPhone(client.phone ?? '')
    setIsEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateClientRecord(client.id, { name, email, phone, galleryId })
        toast.success('פרטי הלקוח עודכנו')
        setIsEditing(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>פרטי לקוח</CardTitle>
        {!isEditing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
            עריכה
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`client-name-${client.id}`}>שם</Label>
              <Input
                id={`client-name-${client.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`client-email-${client.id}`}>אימייל</Label>
              <Input
                id={`client-email-${client.id}`}
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`client-phone-${client.id}`}>טלפון</Label>
              <Input
                id={`client-phone-${client.id}`}
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-0000000"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? 'שומר...' : 'שמור'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                ביטול
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-[--muted]">שם: </span>
              {client.name}
            </p>
            <p>
              <span className="text-[--muted]">אימייל: </span>
              {client.email ?? '—'}
            </p>
            <p>
              <span className="text-[--muted]">טלפון: </span>
              {client.phone ?? '—'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
