'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateFaqItems } from '@/lib/actions/faq.actions'
import { sanitizeFaqItems, type FaqItem } from '@/lib/faq'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type FaqItemsFormProps = {
  initialItems: FaqItem[]
}

const EMPTY_ITEM: FaqItem = { question: '', answer: '' }

function isCompleteItem(item: FaqItem) {
  return Boolean(item.question.trim() && item.answer.trim())
}

export function FaqItemsForm({ initialItems }: FaqItemsFormProps) {
  const [items, setItems] = useState<FaqItem[]>(initialItems)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    setItems(initialItems)
    setEditingIndex(null)
    setExpandedIndex(null)
  }, [initialItems])

  const savedItems = sanitizeFaqItems(items)

  function updateItem(index: number, field: keyof FaqItem, value: string) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function addItem() {
    setItems((current) => [...current, { ...EMPTY_ITEM }])
    setEditingIndex(items.length)
    setExpandedIndex(null)
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index))
    setEditingIndex((current) => {
      if (current === null) return null
      if (current === index) return null
      return current > index ? current - 1 : current
    })
    setExpandedIndex((current) => {
      if (current === null) return null
      if (current === index) return null
      return current > index ? current - 1 : current
    })
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateFaqItems(items)
        const saved = sanitizeFaqItems(items)
        setItems(saved)
        setEditingIndex(null)
        setExpandedIndex(null)
        router.refresh()
        toast.success('שאלות נפוצות נשמרו')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[--border] bg-[--dashboard-surface] px-4 py-3 text-sm text-[--muted]">
        סקשן השאלות הנפוצות מוצג בדף הבית הציבורי רק כשיש לפחות שאלה ותשובה מלאות.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[--muted]">
          {savedItems.length === 0
            ? 'עדיין אין שאלות — הוסיפי את הראשונה'
            : `${savedItems.length} שאלות פעילות באתר`}
        </p>
        <Button type="button" onClick={addItem} disabled={isPending}>
          <Plus className="h-4 w-4" />
          שאלה חדשה
        </Button>
      </div>

      {savedItems.length === 0 && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--border] px-6 py-12 text-center text-sm text-[--muted]">
          <p>עדיין אין שאלות נפוצות — בינתיים הסקשן לא יופיע בדף הבית.</p>
          <p className="mt-2">
            לדוגמה: &quot;כמה זמן לוקח לקבל את התמונות?&quot; — &quot;עד 3 שבועות מיום הצילום&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const complete = isCompleteItem(item)
            const isEditing = editingIndex === index
            const isExpanded = expandedIndex === index
            const showPreview = complete && !isEditing

            return (
              <Card key={`faq-${index}`} className="overflow-hidden">
                {showPreview ? (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">שאלה {index + 1}</Badge>
                          <Badge variant="default">פעילה באתר</Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedIndex((current) => (current === index ? null : index))
                          }
                          className="flex w-full items-start justify-between gap-3 text-right"
                        >
                          <span className="font-semibold text-[--foreground]">{item.question}</span>
                          <ChevronDown
                            className={cn(
                              'mt-1 h-4 w-4 shrink-0 text-[--muted] transition-transform',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </button>
                        {isExpanded ? (
                          <p className="text-sm leading-relaxed text-[--muted] whitespace-pre-line border-t border-[--border] pt-3">
                            {item.answer}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingIndex(index)
                            setExpandedIndex(index)
                          }}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                          עריכה
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          מחיקה
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[--foreground]">
                          {complete ? `עריכת שאלה ${index + 1}` : `שאלה חדשה ${index + 1}`}
                        </span>
                        {!complete ? <Badge variant="muted">טיוטה</Badge> : null}
                      </div>
                      <div className="flex gap-1">
                        {isEditing && complete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingIndex(null)}
                            disabled={isPending}
                          >
                            סיום עריכה
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          מחיקה
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`faq-question-${index}`}>שאלה</Label>
                      <Input
                        id={`faq-question-${index}`}
                        value={item.question}
                        onChange={(e) => updateItem(index, 'question', e.target.value)}
                        placeholder="לדוגמה: כמה זמן לוקח לקבל את התמונות?"
                        className="bg-white dark:bg-zinc-900 border-[--border]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`faq-answer-${index}`}>תשובה</Label>
                      <Textarea
                        id={`faq-answer-${index}`}
                        value={item.answer}
                        onChange={(e) => updateItem(index, 'answer', e.target.value)}
                        rows={3}
                        placeholder="כתבי את התשובה..."
                        className="bg-white dark:bg-zinc-900 border-[--border] resize-y"
                      />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {(items.length > 0 || savedItems.length > 0) && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'שומר...' : 'שמירת שאלות נפוצות'}
          </Button>
        </div>
      )}
    </div>
  )
}
