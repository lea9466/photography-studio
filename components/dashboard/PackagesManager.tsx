'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPackage,
  deletePackage,
  updatePackage,
} from '@/lib/actions/package.actions'
import type { PhotographyPackage } from '@/lib/types/database.types'
import { PackageCard } from '@/components/dashboard/PackageCard'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type PackagesManagerProps = {
  initialPackages: PhotographyPackage[]
}

type PackageFormState = {
  name: string
  priceAmount: string
  durationText: string
  includesText: string
  isActive: boolean
  isFeatured: boolean
}

const EMPTY_FORM: PackageFormState = {
  name: '',
  priceAmount: '',
  durationText: '',
  includesText: '',
  isActive: true,
  isFeatured: false,
}

function packageToForm(pkg: PhotographyPackage): PackageFormState {
  return {
    name: pkg.name,
    priceAmount: String(pkg.price_amount),
    durationText: pkg.duration_text ?? '',
    includesText: pkg.includes.join('\n'),
    isActive: pkg.is_active,
    isFeatured: pkg.is_featured,
  }
}

export function PackagesManager({ initialPackages }: PackagesManagerProps) {
  const [packages, setPackages] = useState(initialPackages)
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PackageFormState>(EMPTY_FORM)

  function openCreateDialog() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEditDialog(pkg: PhotographyPackage) {
    setEditingId(pkg.id)
    setForm(packageToForm(pkg))
    setDialogOpen(true)
  }

  function handleSubmit() {
    const priceAmount = Number(form.priceAmount)

    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updatePackage(editingId, {
            name: form.name,
            priceAmount,
            durationText: form.durationText,
            includesText: form.includesText,
            isActive: form.isActive,
            isFeatured: form.isFeatured,
          })
          setPackages((current) =>
            current.map((pkg) => (pkg.id === updated.id ? updated : pkg))
          )
          toast.success('החבילה עודכנה')
        } else {
          const created = await createPackage({
            name: form.name,
            priceAmount,
            durationText: form.durationText,
            includesText: form.includesText,
          })
          setPackages((current) => [...current, created])
          toast.success('החבילה נוצרה')
        }
        setDialogOpen(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function handleDelete(packageId: string) {
    if (!window.confirm('למחוק את החבילה?')) {
      return
    }

    startTransition(async () => {
      try {
        await deletePackage(packageId)
        setPackages((current) => current.filter((pkg) => pkg.id !== packageId))
        toast.success('החבילה נמחקה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  const activeCount = packages.filter((pkg) => pkg.is_active).length

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[--border] bg-[--dashboard-surface] px-4 py-3 text-sm text-[--muted] space-y-2">
        <p>סקשן החבילות מוצג בדף הבית הציבורי רק כשיש לפחות חבילה פעילה אחת. חבילות מוסתרות לא נספרות.</p>
        <p className="text-[--foreground]">
          <span className="font-medium">מומלץ:</span> להגדיר בדיוק 3 חבילות פעילות — כך הן מוצגות בצורה מסודרת ומאוזנת בכל ערכות העיצוב.
        </p>
        {activeCount > 0 && activeCount !== 3 ? (
          <p className="text-xs">
            כרגע יש {activeCount} חבילות פעילות. לתצוגה מיטבית מומלץ לסיים עם 3.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[--muted]">
          {packages.length === 0
            ? 'עדיין אין חבילות — הוסיפי את הראשונה'
            : `${packages.length} חבילות`}
        </p>
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          חבילה חדשה
        </Button>
      </div>

      {packages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--border] px-6 py-12 text-center text-sm text-[--muted]">
          <p>עדיין אין חבילות — בינתיים סקשן החבילות לא יופיע בדף הבית.</p>
          <p className="mt-2">לדוגמה: חבילת פרימיום, ₪2,400, שעתיים צילום, ורשימת &quot;מה כלול&quot;</p>
        </div>
      ) : (
        <div
          className={
            packages.length === 1
              ? 'mx-auto grid max-w-sm grid-cols-1 gap-5'
              : packages.length === 2
                ? 'mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2'
                : 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'
          }
        >
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={() => openEditDialog(pkg)}
              onDelete={() => handleDelete(pkg.id)}
              actionsDisabled={isPending}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'עריכת חבילה' : 'חבילה חדשה'}
            </DialogTitle>
            <DialogDescription>
              שם, מחיר, משך צילום ורשימת &quot;מה כלול&quot; — שורה לכל פריט
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="package-name">שם החבילה</Label>
              <Input
                id="package-name"
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, name: e.target.value }))
                }
                placeholder="חבילת פרימיום"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-price">מחיר (₪)</Label>
              <Input
                id="package-price"
                type="number"
                min="1"
                step="1"
                value={form.priceAmount}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    priceAmount: e.target.value,
                  }))
                }
                placeholder="2400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-duration">משך צילום</Label>
              <Input
                id="package-duration"
                value={form.durationText}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    durationText: e.target.value,
                  }))
                }
                placeholder="שעתיים צילום"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-includes">מה כלול</Label>
              <Textarea
                id="package-includes"
                rows={7}
                value={form.includesText}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    includesText: e.target.value,
                  }))
                }
                placeholder={'70 תמונות ערוכות\nגלריה דיגיטלית פרטית\nאלבום מודפס איכותי'}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#c9c5cd] bg-white px-4 py-3">
              <div>
                <Label className="text-[#100d1f]">מוצגת ללקוחות</Label>
                <p className="mt-1 text-xs text-[#48464c]">
                  חבילות מוסתרות לא יופיעו בדף הציבורי
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#c9c5cd] bg-white px-4 py-3">
              <div>
                <Label className="text-[#100d1f]">מומלצת</Label>
                <p className="mt-1 text-xs text-[#48464c]">
                  חבילות מומלצות יופיעו עם מסגרת מודגשת בדף הציבורי
                </p>
              </div>
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(checked) =>
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
              {isPending ? 'שומר...' : editingId ? 'שמור שינויים' : 'צור חבילה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
