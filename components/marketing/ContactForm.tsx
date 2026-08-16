'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, MessageCircle, Send } from 'lucide-react'
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
  CardDescription,
} from '@/components/ui/card'

const TYPES: FeedbackType[] = ['משוב', 'תקלה', 'פיצ׳ר', 'אחר']

const FIELD_CLASS =
  'rounded-xl focus-visible:ring-violet-500 focus-visible:border-violet-300'

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
      <Card className="border-violet-100 shadow-xl shadow-violet-900/10">
        <CardContent className="py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-float-up">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="mt-4 text-lg font-semibold">ההודעה נשלחה!</p>
          <p className="mt-2 text-sm text-[--muted]">תודה על הפנייה, נשמח לחזור אליך בהקדם.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden border-violet-100 shadow-xl shadow-violet-900/10">
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-violet-400/10 blur-[80px]"
        aria-hidden
      />
      <CardHeader className="relative flex-row items-center gap-3.5 space-y-0">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-sm shadow-violet-900/20">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <CardTitle>יצירת קשר</CardTitle>
          <CardDescription className="mt-0.5">נשמח לשמוע ממך, נחזור בהקדם</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>סוג פנייה</Label>
            <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
              <SelectTrigger className={FIELD_CLASS}>
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
              <Input id="name" name="name" required className={FIELD_CLASS} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">מייל</Label>
              <Input id="email" name="email" type="email" dir="ltr" required className={FIELD_CLASS} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="studio">סטודיו (אופציונלי)</Label>
            <Input id="studio" name="studio" className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">הודעה</Label>
            <Textarea id="message" name="message" rows={4} required className={FIELD_CLASS} />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full gap-2 bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-sm shadow-violet-900/20 hover:shadow-md hover:shadow-violet-900/25"
          >
            {isPending ? 'שולח...' : (
              <>
                שליחת הודעה
                <Send className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
