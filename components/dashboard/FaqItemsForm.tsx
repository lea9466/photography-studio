'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateFaqItems } from '@/lib/actions/faq.actions'
import { sanitizeFaqItems, type FaqItem } from '@/lib/faq'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const INPUT_CLASS =
  'border-[#7D3A52]/10 bg-[#7D3A52]/[0.04] shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-[#7D3A52]/25 focus-visible:bg-[#7D3A52]/[0.07] focus-visible:ring-2 focus-visible:ring-[#7D3A52]/10'
const ACCENT_BUTTON_CLASS =
  'bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44] focus-visible:ring-[#7D3A52]/40'

function FaqSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative space-y-7 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      {children}
    </section>
  )
}

function FaqSubPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'space-y-5 rounded-xl border border-[--border]/60 bg-white/80 p-5 shadow-sm shadow-[#7D3A52]/[0.03] md:p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

function FaqSectionHeader({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: typeof HelpCircle
  title: string
  description?: string
  index?: number
}) {
  return (
    <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {index !== undefined ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7D3A52]/10 px-1.5 text-[10px] font-semibold text-[#7D3A52]">
                {index}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold text-[--foreground]">{title}</h2>
          </div>
          {description ? (
            <p className="text-xs leading-relaxed text-[--muted]">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

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
    setItems((current) => [{ ...EMPTY_ITEM }, ...current])
    setEditingIndex(0)
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
    <div className="space-y-8 pb-12 md:pb-28">
      <FaqSection>
        <FaqSectionHeader
          index={1}
          icon={HelpCircle}
          title="השאלות שלי"
          description="סקשן השאלות הנפוצות מוצג בדף הבית הציבורי רק כשיש לפחות שאלה ותשובה מלאות."
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[--muted]">
            {savedItems.length === 0
              ? 'עדיין אין שאלות — הוסיפי את הראשונה'
              : `${savedItems.length} שאלות פעילות באתר`}
          </p>
          <Button type="button" onClick={addItem} disabled={isPending} className={ACCENT_BUTTON_CLASS}>
            <Plus className="h-4 w-4" />
            שאלה חדשה
          </Button>
        </div>

        {savedItems.length === 0 && items.length === 0 ? (
          <FaqSubPanel className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52]">
              <HelpCircle className="h-7 w-7" />
            </div>
            <p className="text-sm text-[--muted]">עדיין אין שאלות נפוצות — בינתיים הסקשן לא יופיע בדף הבית.</p>
            <p className="text-xs text-[--muted]">
              לדוגמה: &quot;כמה זמן לוקח לקבל את התמונות?&quot; — &quot;עד 3 שבועות מיום הצילום&quot;
            </p>
            <Button type="button" onClick={addItem} disabled={isPending} className={ACCENT_BUTTON_CLASS}>
              <Plus className="h-4 w-4" />
              שאלה חדשה
            </Button>
          </FaqSubPanel>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              const complete = isCompleteItem(item)
              const isEditing = editingIndex === index
              const isExpanded = expandedIndex === index
              const showPreview = complete && !isEditing

              return (
                <FaqSubPanel
                  key={`faq-${index}`}
                  className={cn('transition-colors', showPreview && 'hover:border-[#7D3A52]/20')}
                >
                {showPreview ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-[#7D3A52]/20 text-[#7D3A52]">
                            שאלה {index + 1}
                          </Badge>
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
                          <p className="whitespace-pre-line border-t border-[#7D3A52]/10 pt-3 text-sm leading-relaxed text-[--muted]">
                            {item.answer}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingIndex(index)
                            setExpandedIndex(index)
                          }}
                          disabled={isPending}
                          className="border-[#7D3A52]/15 hover:bg-[#7D3A52]/5"
                        >
                          <Pencil className="h-4 w-4" />
                          עריכה
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={isPending}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          מחיקה
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingIndex(null)}
                            disabled={isPending}
                            className="border-[#7D3A52]/15 hover:bg-[#7D3A52]/5"
                          >
                            סיום עריכה
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={isPending}
                          className="border-red-200 text-red-600 hover:bg-red-50"
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
                        className={INPUT_CLASS}
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
                        className={cn(INPUT_CLASS, 'resize-y')}
                      />
                    </div>
                  </div>
                )}
                </FaqSubPanel>
              )
            })}
          </div>
        )}
      </FaqSection>

      {(items.length > 0 || savedItems.length > 0) ? (
        <div className="fixed bottom-6 left-4 z-50 md:bottom-8 md:left-8">
          <div className="rounded-2xl border border-[#7D3A52]/15 bg-white/95 p-1.5 shadow-xl shadow-[#7D3A52]/10 backdrop-blur-md">
            <Button onClick={handleSave} disabled={isPending} size="lg" className={cn(ACCENT_BUTTON_CLASS, 'min-w-[180px] px-8 font-semibold')}>
              {isPending ? 'שומר...' : 'שמירת שאלות נפוצות'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
