'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
} from '@/lib/actions/testimonials.actions'
import { Badge } from '@/components/ui/badge'
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
import { CustomToggle } from '@/components/ui/custom-toggle'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

type Testimonial = {
  id: string
  user_id: string
  client_name: string
  content: string
  shoot_type: string | null
  created_at: string
  is_featured: boolean
  sort_order: number
}

type TestimonialsManagerProps = {
  initialTestimonials: Testimonial[]
}

type TestimonialFormState = {
  clientName: string
  content: string
  shootType: string
  isFeatured: boolean
}

const EMPTY_FORM: TestimonialFormState = {
  clientName: '',
  content: '',
  shootType: '',
  isFeatured: false,
}

function testimonialToForm(testimonial: Testimonial): TestimonialFormState {
  return {
    clientName: testimonial.client_name,
    content: testimonial.content,
    shootType: testimonial.shoot_type ?? '',
    isFeatured: testimonial.is_featured,
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function TestimonialsManager({ initialTestimonials }: TestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState(initialTestimonials)
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TestimonialFormState>(EMPTY_FORM)

  function openCreateDialog() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEditDialog(testimonial: Testimonial) {
    setEditingId(testimonial.id)
    setForm(testimonialToForm(testimonial))
    setDialogOpen(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        if (editingId) {
          await updateTestimonial(editingId, {
            clientName: form.clientName,
            content: form.content,
            shootType: form.shootType || undefined,
            isFeatured: form.isFeatured,
          })
          setTestimonials((current) =>
            current.map((t) =>
              t.id === editingId
                ? {
                    ...t,
                    client_name: form.clientName,
                    content: form.content,
                    shoot_type: form.shootType || null,
                    is_featured: form.isFeatured,
                  }
                : t
            )
          )
          toast.success('התגובה עודכנה')
        } else {
          await createTestimonial({
            clientName: form.clientName,
            content: form.content,
            shootType: form.shootType || undefined,
            isFeatured: form.isFeatured,
          })
          // Refresh the list
          const response = await fetch('/api/testimonials')
          const data = await response.json()
          setTestimonials(data)
          toast.success('התגובה נוצרה')
        }
        setDialogOpen(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function handleDelete(testimonialId: string) {
    if (!window.confirm('למחוק את התגובה?')) {
      return
    }

    startTransition(async () => {
      try {
        await deleteTestimonial(testimonialId)
        setTestimonials((current) => current.filter((t) => t.id !== testimonialId))
        toast.success('התגובה נמחקה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[--muted]">
          {testimonials.length === 0
            ? 'עדיין אין תגובות — הוסיפי את הראשונה'
            : `${testimonials.length} תגובות`}
        </p>
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          תגובה חדשה
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--border] px-6 py-12 text-center text-sm text-[--muted]">
          לדוגמה: &quot;הצילומים יצאו פשוט מדהימים! ממליצה בחום&quot; — דנה, חתונה
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{testimonial.client_name}</span>
                    {testimonial.is_featured && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        מומלצת
                      </Badge>
                    )}
                    {testimonial.shoot_type && (
                      <Badge variant="outline">{testimonial.shoot_type}</Badge>
                    )}
                    <span className="text-xs text-[--muted]">
                      {formatDate(testimonial.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{testimonial.content}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(testimonial)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(testimonial.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'עריכת תגובה' : 'תגובה חדשה'}
            </DialogTitle>
            <DialogDescription>
              שם הלקוח, תוכן התגובה וסוג הצילום
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">שם הלקוח</Label>
              <Input
                id="client-name"
                value={form.clientName}
                onChange={(e) =>
                  setForm((current) => ({ ...current, clientName: e.target.value }))
                }
                placeholder="דנה כהן"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shoot-type">סוג צילום (אופציונלי)</Label>
              <Input
                id="shoot-type"
                value={form.shootType}
                onChange={(e) =>
                  setForm((current) => ({ ...current, shootType: e.target.value }))
                }
                placeholder="חתונה, פורטרטים, משפחה..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">תוכן התגובה</Label>
              <Textarea
                id="content"
                rows={5}
                value={form.content}
                onChange={(e) =>
                  setForm((current) => ({ ...current, content: e.target.value }))
                }
                placeholder="הצילומים יצאו פשוט מדהימים! ממליצה בחום..."
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-[--border] px-4 py-3">
              <div>
                <Label htmlFor="testimonial-featured">מומלצת</Label>
                <p className="text-xs text-[--muted]">
                  תגובות מומלצות יופיעו ראשונות בדף הציבורי
                </p>
              </div>
              <CustomToggle
                checked={form.isFeatured}
                onCheckedChange={(checked: boolean) =>
                  setForm((current) => ({ ...current, isFeatured: checked }))
                }
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
              {isPending ? 'שומר...' : editingId ? 'שמור שינויים' : 'צור תגובה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
