'use client'

import { useState, useTransition } from 'react'
import { Camera, Heading, ImageIcon, Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPackage,
  deletePackage,
  updatePackage,
  updatePackagesSectionHeadings,
} from '@/lib/actions/package.actions'
import type { PhotographyPackage } from '@/lib/types/database.types'
import { PACKAGES_SECTION_DEFAULTS } from '@/lib/packages-section-copy'
import { PackageCard } from '@/components/dashboard/PackageCard'
import { PackagesSectionBackground } from '@/components/dashboard/PackagesSectionBackground'
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
import { cn } from '@/lib/utils'

const INPUT_CLASS =
  'border-[#7D3A52]/10 bg-[#7D3A52]/[0.04] shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-[#7D3A52]/25 focus-visible:bg-[#7D3A52]/[0.07] focus-visible:ring-2 focus-visible:ring-[#7D3A52]/10'
const ACCENT_BUTTON_CLASS =
  'bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44] focus-visible:ring-[#7D3A52]/40'

function PackagesSection({
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

function PackagesSubPanel({
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

function PackagesSectionHeader({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: typeof Package
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

type PackagesManagerProps = {
  initialPackages: PhotographyPackage[]
  initialSectionTitle: string | null
  initialSectionSubtitle: string | null
  selectedTheme: string
  initialPackagesDesktopUrl: string | null
  initialPackagesMobileUrl: string | null
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

export function PackagesManager({
  initialPackages,
  initialSectionTitle,
  initialSectionSubtitle,
  selectedTheme,
  initialPackagesDesktopUrl,
  initialPackagesMobileUrl,
}: PackagesManagerProps) {
  const [packages, setPackages] = useState(initialPackages)
  const [sectionTitle, setSectionTitle] = useState(initialSectionTitle ?? '')
  const [sectionSubtitle, setSectionSubtitle] = useState(initialSectionSubtitle ?? '')
  const [isSectionPending, startSectionTransition] = useTransition()
  const themeDefaults =
    PACKAGES_SECTION_DEFAULTS[selectedTheme] ?? PACKAGES_SECTION_DEFAULTS.elegant
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

  function handleSectionHeadingsSave() {
    startSectionTransition(async () => {
      try {
        const updated = await updatePackagesSectionHeadings({
          title: sectionTitle,
          subtitle: sectionSubtitle,
        })
        setSectionTitle(updated.packages_title ?? '')
        setSectionSubtitle(updated.packages_subtitle ?? '')
        toast.success('כותרות הסקשן נשמרו')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PackagesSection>
        <PackagesSectionHeader
          index={1}
          icon={Heading}
          title="כותרות סקשן החבילות"
          description="הטקסטים מוצגים בדף הבית הציבורי. אם השדות ריקים, יוצגו ברירות המחדל של ערכת העיצוב הנוכחית."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="packages-section-title">כותרת</Label>
            <Input
              id="packages-section-title"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder={themeDefaults.title}
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packages-section-subtitle">כותרת משנה</Label>
            <Input
              id="packages-section-subtitle"
              value={sectionSubtitle}
              onChange={(e) => setSectionSubtitle(e.target.value)}
              placeholder={themeDefaults.subtitle}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleSectionHeadingsSave}
            disabled={isSectionPending}
            className="border-[#7D3A52]/20 text-[#7D3A52] hover:bg-[#7D3A52]/5"
          >
            {isSectionPending ? 'שומר...' : 'שמור כותרות'}
          </Button>
        </div>
      </PackagesSection>

      <PackagesSection>
        <PackagesSectionHeader
          index={2}
          icon={ImageIcon}
          title="רקע סקשן החבילות"
          description="תמונת רקע לסקשן החבילות בדף הבית · במובייל התמונה תהיה בהירה ותתמזג ברקע"
        />
        <PackagesSectionBackground
          initialDesktopUrl={initialPackagesDesktopUrl}
          initialMobileUrl={initialPackagesMobileUrl}
        />
      </PackagesSection>

      <PackagesSection>
        <PackagesSectionHeader
          index={3}
          icon={Package}
          title="החבילות שלי"
          description="צרי וערכי חבילות צילום עם מחיר, משך ורשימת מה כלול."
        />

        <PackagesSubPanel className="space-y-2 text-sm text-[--muted]">
          <p>סקשן החבילות מוצג בדף הבית הציבורי רק כשיש לפחות חבילה פעילה אחת. חבילות מוסתרות לא נספרות.</p>
          <p className="text-[--foreground]">
            <span className="font-medium">מומלץ:</span> להגדיר בדיוק 3 חבילות פעילות — כך הן מוצגות בצורה מסודרת ומאוזנת בכל ערכות העיצוב.
          </p>
          {activeCount > 0 && activeCount !== 3 ? (
            <p className="text-xs">
              כרגע יש {activeCount} חבילות פעילות. לתצוגה מיטבית מומלץ לסיים עם 3.
            </p>
          ) : null}
        </PackagesSubPanel>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[--muted]">
            {packages.length === 0
              ? 'עדיין אין חבילות — הוסיפי את הראשונה'
              : `${packages.length} חבילות`}
          </p>
          <Button type="button" onClick={openCreateDialog} className={ACCENT_BUTTON_CLASS}>
            <Plus className="h-4 w-4" />
            חבילה חדשה
          </Button>
        </div>

        {packages.length === 0 ? (
          <PackagesSubPanel className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52]">
              <Camera className="h-7 w-7" />
            </div>
            <p className="text-sm text-[--muted]">עדיין אין חבילות — בינתיים סקשן החבילות לא יופיע בדף הבית.</p>
            <p className="text-xs text-[--muted]">לדוגמה: חבילת פרימיום, ₪2,400, שעתיים צילום, ורשימת &quot;מה כלול&quot;</p>
            <Button type="button" onClick={openCreateDialog} className={ACCENT_BUTTON_CLASS}>
              <Plus className="h-4 w-4" />
              חבילה חדשה
            </Button>
          </PackagesSubPanel>
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
      </PackagesSection>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-[--border]/80 bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'עריכת חבילה' : 'חבילה חדשה'}
            </DialogTitle>
            <DialogDescription>
              שם, מחיר, משך צילום ורשימת &quot;מה כלול&quot; — שורה לכל פריט
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="package-name">שם החבילה</Label>
              <Input
                id="package-name"
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, name: e.target.value }))
                }
                placeholder="חבילת פרימיום"
                className={INPUT_CLASS}
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
                className={INPUT_CLASS}
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
                className={INPUT_CLASS}
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
                className={cn(INPUT_CLASS, 'resize-y')}
              />
            </div>

            <PackagesSubPanel className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <Label>מוצגת ללקוחות</Label>
                <p className="mt-1 text-xs text-[--muted]">
                  חבילות מוסתרות לא יופיעו בדף הציבורי
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </PackagesSubPanel>

            <PackagesSubPanel className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <Label>מומלצת</Label>
                <p className="mt-1 text-xs text-[--muted]">
                  חבילות מומלצות יופיעו עם מסגרת מודגשת בדף הציבורי
                </p>
              </div>
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isFeatured: checked }))
                }
              />
            </PackagesSubPanel>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              ביטול
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className={ACCENT_BUTTON_CLASS}
            >
              {isPending ? 'שומר...' : editingId ? 'שמור שינויים' : 'צור חבילה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
