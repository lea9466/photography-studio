'use client'

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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { PhotoEditCard } from '@/components/dashboard/photo-edits/photo-edit-card'
import type { PhotoEditComparison } from '@/lib/types/photo-edit-comparison'

type PhotoEditSortableListProps = {
  items: PhotoEditComparison[]
  signedUrls?: Record<string, string>
  disabled?: boolean
  onReorder: (next: PhotoEditComparison[]) => void
  onEdit: (item: PhotoEditComparison) => void
  onDelete: (item: PhotoEditComparison) => void
  onToggleActive: (item: PhotoEditComparison, isActive: boolean) => void
}

export function PhotoEditSortableList({
  items,
  signedUrls,
  disabled,
  onReorder,
  onEdit,
  onDelete,
  onToggleActive,
}: PhotoEditSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    onReorder(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item) => (
            <PhotoEditCard
              key={item.id}
              item={item}
              signedUrls={signedUrls}
              disabled={disabled}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
