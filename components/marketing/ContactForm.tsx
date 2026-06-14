'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { submitFeedback } from '@/lib/actions/feedback.actions'
import type { FeedbackType } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const TYPES: FeedbackType[] = ['משוב', 'תקלה', 'פיצ׳ר', 'אחר']

export function ContactForm() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [type, setType] = useState<FeedbackType>('משוב')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await submitFeedback({
          type,
          name: String(form.get('name')),
          email: String(form.get('email')),
          message: String(form.get('message')),
          studio: String(form.get('studio') || ''),
        })
        setSent(true)
        toast.success('נשלח ✔')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium">נשלח ✔</p>
          <p className="mt-2 text-sm text-[--muted]">תודה על הפנייה!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>יצירת קשר</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>סוג פנייה</Label>
            <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">שם</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">מייל</Label>
              <Input id="email" name="email" type="email" dir="ltr" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="studio">סטודיו (אופציונלי)</Label>
            <Input id="studio" name="studio" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">הודעה</Label>
            <Textarea id="message" name="message" rows={4} required />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'שולח...' : 'שלח משוב ✦'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
