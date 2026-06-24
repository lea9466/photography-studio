'use client'

import { useState, useTransition, useImperativeHandle, forwardRef } from 'react'
import { Pencil, Mail, Phone } from 'lucide-react'
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

export interface ClientEditFormRef {
  save: () => Promise<void>
}

type ClientEditFormProps = {
  client: Client
  galleryId: string
  showSaveButton?: boolean
}

export const ClientEditForm = forwardRef<ClientEditFormRef, ClientEditFormProps>(
  ({ client, galleryId, showSaveButton = true }, ref) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState(client.name)
    const [email, setEmail] = useState(client.email ?? '')
    const [phone, setPhone] = useState(client.phone ?? '')

    useImperativeHandle(ref, () => ({
      save: async () => {
        return new Promise((resolve, reject) => {
          startTransition(async () => {
            try {
              await updateClientRecord(client.id, { name, email, phone, galleryId })
              toast.success('פרטי הלקוח עודכנו')
              setIsEditing(false)
              resolve()
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'שגיאה')
              reject(error)
            }
          })
        })
      }
    }))

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

    const colors = [
      { bg: '#e5dff9', text: '#100d1f' },
      { bg: '#ffd9e1', text: '#25020f' },
      { bg: '#ffd9e2', text: '#3b051d' },
      { bg: '#ddd9db', text: '#1c1b1d' },
      { bg: '#c9c3dc', text: '#484459' },
      { bg: '#f9b4c6', text: '#693747' }
    ]
    const colorIndex = client.name.charCodeAt(0) % colors.length
    const color = colors[colorIndex]

    return (
      <Card className="border-[#c9c5cd] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-[#100d1f]">פרטי לקוח</CardTitle>
          {!isEditing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-[#c9c5cd] hover:bg-[#f7f2f4]"
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
                <Label htmlFor={`client-name-${client.id}`} className="text-[#100d1f]">שם</Label>
                <Input
                  id={`client-name-${client.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`client-email-${client.id}`} className="text-[#100d1f]">אימייל</Label>
                <Input
                  id={`client-email-${client.id}`}
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`client-phone-${client.id}`} className="text-[#100d1f]">טלפון</Label>
                <Input
                  id={`client-phone-${client.id}`}
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="border-[#c9c5cd] focus:border-[#6b2d43] focus:ring-[#6b2d43]"
                />
              </div>
              {showSaveButton && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSave} disabled={isPending} className="bg-[#6b2d43] hover:bg-[#5a2538]">
                    {isPending ? 'שומר...' : 'שמור'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="border-[#c9c5cd] hover:bg-[#f7f2f4]"
                  >
                    ביטול
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0" style={{ backgroundColor: color.bg, color: color.text }}>
                {client.name.slice(0, 2)}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-semibold text-lg text-[#100d1f] truncate">{client.name}</h4>
                <div className="flex items-center gap-4 mt-1">
                  {client.email && (
                    <div className="flex items-center gap-1.5 text-sm text-[#48464c]">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate" dir="ltr">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-[#48464c]">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate" dir="ltr">{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
  )
})

ClientEditForm.displayName = 'ClientEditForm'
