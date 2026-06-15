'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPackage,
  deletePackage,
  updatePackage,
} from '@/lib/actions/package.actions'
import type { PhotographyPackage } from '@/lib/types/database.types'
import { PackageCard } from '@/components/dashboard/PackageCard'
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
}

const EMPTY_FORM: PackageFormState = {
  name: '',
  priceAmount: '',
  durationText: '',
  includesText: '',
  isActive: true,
}

function packageToForm(pkg: PhotographyPackage): PackageFormState {
  return {
    name: pkg.name,
    priceAmount: String(pkg.price_amount),
    durationText: pkg.duration_text ?? '',
    includesText: pkg.includes.join('\n'),
    isActive: pkg.is_active,
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

  return (
    <div className="space-y-6">
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
          לדוגמה: חבילת פרימיום, ₪2,400, שעתיים צילום, ורשימת &quot;מה כלול&quot;
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                {!pkg.is_active ? (
                  <Badge variant="secondary">מוסתרת</Badge>
                ) : (
                  <span />
                )}
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(pkg)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                    עריכה
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pkg.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    מחיקה
                  </Button>
                </div>
              </div>
              <PackageCard
                pkg={pkg}
                className={!pkg.is_active ? 'opacity-60' : undefined}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
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

            {editingId ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[--border] px-4 py-3">
                <div>
                  <Label htmlFor="package-active">מוצגת ללקוחות</Label>
                  <p className="text-xs text-[--muted]">
                    חבילות מוסתרות לא יופיעו בדף הציבורי
                  </p>
                </div>
                <Switch
                  id="package-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, isActive: checked }))
                  }
                />
              </div>
            ) : null}
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
