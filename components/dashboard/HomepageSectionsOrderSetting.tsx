'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, GripVertical, Lock, LayoutList, RotateCcw } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateHomepageSections } from '@/lib/actions/site-settings.actions'
import {
  HOMEPAGE_SECTION_IDS,
  HOMEPAGE_SECTION_LABELS,
  defaultHomepageSectionLayout,
  type HomepageSectionEntry,
  type HomepageSectionId,
  type HomepageSectionLayout,
} from '@/lib/public-site/homepage-sections'
import type { SectionPreviewData } from '@/lib/public-site/homepage-section-previews'
import { HomepageSectionThumbnail } from '@/components/dashboard/HomepageSectionThumbnail'
import { cn } from '@/lib/utils'

const SECTION_HINTS: Partial<Record<HomepageSectionId, string>> = {
  galleries: 'מוצג רק במצב תצוגת גלריות "מופרד"',
  packages: 'מוצג רק אם הוגדרה לפחות חבילה אחת',
}

function FixedRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-[--border]/80 bg-white/50 px-4 py-3 text-[--muted]">
      <Lock className="h-4 w-4 shrink-0" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

function SortableRow({
  entry,
  disabled,
  preview,
  onToggle,
}: {
  entry: HomepageSectionEntry
  disabled: boolean
  preview?: SectionPreviewData
  onToggle: (id: HomepageSectionId) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    disabled,
  })
  const hint = SECTION_HINTS[entry.id]

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-white px-3 py-3 sm:px-4',
        entry.visible ? 'border-[--border]/80' : 'border-[--border]/60 bg-white/50',
        isDragging && 'relative z-10 shadow-lg'
      )}
    >
      <button
        type="button"
        aria-label={`גרירה של הסקשן ${HOMEPAGE_SECTION_LABELS[entry.id]}`}
        className="shrink-0 cursor-grab touch-none rounded-md p-1 text-[--muted] hover:bg-[#7D3A52]/[0.06] active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className={cn('shrink-0', !entry.visible && 'opacity-40 grayscale')}>
        <HomepageSectionThumbnail id={entry.id} preview={preview} />
      </div>

      <div className={cn('min-w-0 flex-1', !entry.visible && 'opacity-50')}>
        <p className="text-sm font-semibold text-[--foreground]">
          {HOMEPAGE_SECTION_LABELS[entry.id]}
        </p>
        {hint ? <p className="text-xs text-[--muted]">{hint}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => onToggle(entry.id)}
        disabled={disabled}
        aria-pressed={entry.visible}
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
          entry.visible
            ? 'bg-[#7D3A52]/10 text-[#7D3A52] hover:bg-[#7D3A52]/15'
            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
        )}
      >
        {entry.visible ? (
          <>
            <Eye className="h-3.5 w-3.5" /> מוצג
          </>
        ) : (
          <>
            <EyeOff className="h-3.5 w-3.5" /> מוסתר
          </>
        )}
      </button>
    </div>
  )
}

export function HomepageSectionsOrderSetting({
  initialLayout,
  preview,
}: {
  initialLayout: HomepageSectionLayout
  preview?: SectionPreviewData
}) {
  const [layout, setLayout] = useState<HomepageSectionLayout>(initialLayout)
  const [isPending, startTransition] = useTransition()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function save(next: HomepageSectionLayout) {
    const previous = layout
    setLayout(next)
    startTransition(async () => {
      const result = await updateHomepageSections(next)
      if (!result.ok) {
        setLayout(previous)
        toast.error(result.error)
        return
      }
      toast.success('סידור הסקשנים נשמר')
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = layout.findIndex((entry) => entry.id === active.id)
    const to = layout.findIndex((entry) => entry.id === over.id)
    if (from < 0 || to < 0) return
    save(arrayMove(layout, from, to))
  }

  const isDefault = layout.every(
    (entry, index) => entry.id === HOMEPAGE_SECTION_IDS[index] && entry.visible
  )

  function handleReset() {
    save(defaultHomepageSectionLayout())
  }

  function handleToggle(id: HomepageSectionId) {
    save(layout.map((entry) => (entry.id === id ? { ...entry, visible: !entry.visible } : entry)))
  }

  return (
    <section className="relative space-y-5 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8">
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
            <LayoutList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-lg font-semibold text-[--foreground]">הסדר בדף הבית שלך</h2>
            <p className="text-xs leading-relaxed text-[--muted]">
              מלמעלה למטה, בדיוק כמו שהמבקרים יראו את הדף.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <FixedRow label="סקשן ראשי (קבוע)" />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={layout.map((entry) => entry.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {layout.map((entry) => (
                <SortableRow
                  key={entry.id}
                  entry={entry}
                  disabled={isPending}
                  preview={preview}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <FixedRow label="צור קשר (קבוע)" />
      </div>

      <div className="flex justify-end border-t border-[#7D3A52]/10 pt-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending || isDefault}
          className="inline-flex items-center gap-2 rounded-lg border border-[--border]/80 bg-white px-3.5 py-2 text-sm font-medium text-[--foreground] transition-colors hover:border-[#7D3A52]/40 hover:text-[#7D3A52] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          איפוס לסדר ברירת המחדל
        </button>
      </div>
    </section>
  )
}
