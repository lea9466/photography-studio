'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search,
  UserPlus,
  Check,
  Lock,
  Calendar,
  Zap,
  Droplets,
  Download,
  Send,
} from 'lucide-react'
import { createClientRecord } from '@/lib/actions/client.actions'
import { createClientGallery } from '@/lib/actions/gallery.actions'
import { uploadGalleryCoverFile } from '@/lib/cover-upload-client'
import { DOWNLOAD_PERMISSIONS_ENABLED } from '@/lib/types/app.types'
import type { Client } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DisableWatermarkDialog } from '@/components/gallery/DisableWatermarkDialog'

const WIZARD_STEPS = ['בחירת לקוח', 'פרטי הגלריה', 'מגבלות והרשאות']

type ClientMode = 'existing' | 'new'

type WizardState = {
  clientMode: ClientMode
  clientId: string
  newClientName: string
  newClientEmail: string
  newClientPhone: string
  title: string
  expiresAt: string
  albumSelectionEnabled: boolean
  editSelectionEnabled: boolean
  maxAlbumSelection: string
  maxEditSelection: string
  allowDownloadPreview: boolean
  allowDownloadOriginal: boolean
  watermarkText: string
  autoApplyWatermark: boolean
  coverImageFile: File | null
}

type ClientGalleryWizardProps = {
  clients: Client[]
  defaultWatermarkText?: string
  downloadPermissionsEnabled?: boolean
}

export function ClientGalleryWizard({
  clients,
  defaultWatermarkText = '',
  downloadPermissionsEnabled: downloadPermissionsEnabledProp,
}: ClientGalleryWizardProps) {
  const router = useRouter()
  const downloadPermissionsEnabled =
    downloadPermissionsEnabledProp ?? DOWNLOAD_PERMISSIONS_ENABLED

  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [disableWatermarkOpen, setDisableWatermarkOpen] = useState(false)
  const [state, setState] = useState<WizardState>({
    clientMode: clients.length > 0 ? 'existing' : 'new',
    clientId: clients[0]?.id ?? '',
    newClientName: '',
    newClientEmail: '',
    newClientPhone: '',
    title: '',
    expiresAt: '',
    albumSelectionEnabled: true,
    editSelectionEnabled: true,
    maxAlbumSelection: '',
    maxEditSelection: '',
    allowDownloadPreview: false,
    allowDownloadOriginal: false,
    watermarkText: defaultWatermarkText,
    autoApplyWatermark: true,
    coverImageFile: null,
  })

  function updateState<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const filteredClients = search.trim()
    ? clients.filter((client) =>
        `${client.name} ${client.email ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())
      )
    : clients

  function canContinue() {
    if (step === 1) {
      return state.clientMode === 'existing'
        ? Boolean(state.clientId)
        : Boolean(state.newClientName.trim())
    }
    if (step === 2) {
      return Boolean(state.title.trim())
    }
    return true
  }

  function handleNext() {
    if (!canContinue()) {
      toast.error('נא למלא את השדות הנדרשים')
      return
    }
    setStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length))
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  function handlePublish() {
    if (!state.title.trim()) {
      toast.error('שם הגלריה הוא שדה חובה')
      return
    }
    if (!state.albumSelectionEnabled && !state.editSelectionEnabled) {
      toast.error('צריך להשאיר לפחות מסלול בחירה אחד פעיל — לאלבום או לעיבוד')
      return
    }

    startTransition(async () => {
      try {
        let clientId: string | null = state.clientId

        if (state.clientMode === 'new') {
          const client = await createClientRecord({
            name: state.newClientName,
            email: state.newClientEmail,
            phone: state.newClientPhone,
          })
          clientId = client.id
        }

        if (!clientId) {
          throw new Error('יש לבחור או ליצור לקוח')
        }

        let coverImageUrl: string | undefined
        if (state.coverImageFile) {
          try {
            coverImageUrl = await uploadGalleryCoverFile(state.coverImageFile)
          } catch (error) {
            console.error('Error uploading cover image:', error)
            toast.error(error instanceof Error ? error.message : 'העלאת תמונת השער נכשלה')
            return
          }
        }

        const gallery = await createClientGallery({
          title: state.title,
          clientId,
          expiresAt: state.expiresAt || undefined,
          albumSelectionEnabled: state.albumSelectionEnabled,
          editSelectionEnabled: state.editSelectionEnabled,
          maxAlbumSelection:
            state.albumSelectionEnabled && state.maxAlbumSelection
              ? Number(state.maxAlbumSelection)
              : undefined,
          maxEditSelection:
            state.editSelectionEnabled && state.maxEditSelection
              ? Number(state.maxEditSelection)
              : undefined,
          allowDownloadPreview: downloadPermissionsEnabled ? state.allowDownloadPreview : false,
          allowDownloadOriginal: downloadPermissionsEnabled ? state.allowDownloadOriginal : false,
          watermarkText: state.watermarkText || undefined,
          autoApplyWatermark: state.autoApplyWatermark,
          coverImage: coverImageUrl,
        })

        toast.success('הגלריה נוצרה — כעת העלי תמונות')
        router.push(`/dashboard/galleries/${gallery.id}/photos`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'יצירת הגלריה נכשלה')
      }
    })
  }

  return (
    <div className="w-full space-y-8">
      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:gap-4">
        {WIZARD_STEPS.map((label, index) => {
          const n = index + 1
          return (
            <div key={label} className="flex shrink-0 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  step === n ? 'bg-[#100d1f] text-white' : 'bg-[#252235] text-[#8d89a0]'
                }`}
              >
                {n}
              </div>
              <span
                className={`whitespace-nowrap text-sm font-medium sm:text-base ${
                  step === n ? 'font-bold text-[#100d1f]' : 'text-[#48464c]'
                }`}
              >
                {label}
              </span>
              {n < WIZARD_STEPS.length && <div className="h-px w-8 bg-[#c9c5cd] sm:w-16" />}
            </div>
          )
        })}
      </div>

      {/* Step 1 — client */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-right">
            <h3 className="mb-2 text-xl font-semibold text-[#1c1b1d]">מי הלקוח של הגלריה?</h3>
            <p className="text-base text-[#48464c]">גלריית לקוח תמיד משויכת ללקוח אחד.</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#79767d]" />
              <input
                className="w-full rounded-xl border border-[#c9c5cd] bg-white py-3 pr-11 text-base outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
                placeholder="חיפוש לקוח לפי שם או אימייל..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#100d1f] bg-white px-6 py-3 font-semibold text-[#100d1f] transition-colors hover:bg-[#f7f2f4] active:scale-95"
              onClick={() => updateState('clientMode', 'new')}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-base">הוספת לקוח חדש</span>
            </button>
          </div>

          {state.clientMode === 'new' ? (
            <div className="mx-auto max-w-md space-y-4 rounded-xl border border-[#c9c5cd] bg-white p-6">
              <h4 className="text-lg font-semibold text-[#100d1f]">יצירת לקוח חדש</h4>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#48464c]">שם הלקוח</label>
                <input
                  className="w-full rounded-xl border border-[#c9c5cd] bg-white px-4 py-3 outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
                  placeholder="הזן שם מלא"
                  type="text"
                  value={state.newClientName}
                  onChange={(e) => updateState('newClientName', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#48464c]">אימייל</label>
                <input
                  className="w-full rounded-xl border border-[#c9c5cd] bg-white px-4 py-3 outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
                  placeholder="email@example.com"
                  type="email"
                  value={state.newClientEmail}
                  onChange={(e) => updateState('newClientEmail', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#48464c]">טלפון</label>
                <input
                  className="w-full rounded-xl border border-[#c9c5cd] bg-white px-4 py-3 outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
                  placeholder="050-0000000"
                  type="tel"
                  value={state.newClientPhone}
                  onChange={(e) => updateState('newClientPhone', e.target.value)}
                />
              </div>
              {clients.length > 0 && (
                <button
                  type="button"
                  className="w-full rounded-xl bg-[#7D3A52] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#6a2f44]"
                  onClick={() => updateState('clientMode', 'existing')}
                >
                  בחר לקוח קיים במקום
                </button>
              )}
            </div>
          ) : clients.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-[#e5e1e3] bg-[#fdf8fa] py-8 text-center text-sm text-[#48464c]">
              אין לקוחות עדיין — הוסיפי לקוח חדש
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => {
                const selected = state.clientId === client.id
                return (
                  <label key={client.id} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="client_selection"
                      value={client.id}
                      checked={selected}
                      onChange={(e) => updateState('clientId', e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`flex h-full items-center gap-4 rounded-xl border bg-white p-6 transition-all hover:border-[#7D3A52] hover:shadow-sm ${
                        selected ? 'border-[#7D3A52] bg-[#f1edef]' : 'border-[#c9c5cd]'
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e5dff9] text-lg font-bold text-[#100d1f]">
                        {client.name.slice(0, 2)}
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <h4 className="truncate text-base font-semibold text-[#100d1f]">
                          {client.name}
                        </h4>
                        <p className="truncate text-sm text-[#48464c]">
                          {client.email || 'אין אימייל'}
                        </p>
                      </div>
                      {selected && (
                        <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#7D3A52] text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — gallery details */}
      {step === 2 && (
        <div className="max-w-2xl space-y-8">
          <section className="space-y-3">
            <label className="text-base font-semibold text-[#48464c]" htmlFor="gallery-name">
              שם הגלריה
            </label>
            <p className="text-sm text-[#48464c]/70">השם שיופיע ללקוח בראש הדף ובקישור.</p>
            <input
              className="w-full rounded-xl border border-[#c9c5cd] bg-[#f7f2f4] px-6 py-4 text-lg outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
              id="gallery-name"
              placeholder="למשל: ניו בורן / צילומי חוץ"
              type="text"
              value={state.title}
              onChange={(e) => updateState('title', e.target.value)}
            />
          </section>

          <hr className="border-[#c9c5cd]" />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#7D3A52]" />
              <h2 className="text-base font-semibold text-[#100d1f]">תפוגת גישה</h2>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-[#c9c5cd] bg-[#f7f2f4] px-4 py-3 text-sm leading-relaxed text-[#48464c]">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#7D3A52]" aria-hidden />
              <p>
                אין צורך להגדיר סיסמה — הלקוח מקבל קוד כניסה חד-פעמי במייל בכל
                כניסה, והקוד פג אוטומטית לאחר שימוש.
              </p>
            </div>
            <div className="max-w-xs">
              <label className="mb-2 block text-xs font-semibold text-[#48464c]" htmlFor="gallery-expires">
                תאריך תפוגה (אופציונלי)
              </label>
              <input
                id="gallery-expires"
                className="w-full rounded-xl border border-[#ebebe8] bg-white px-4 py-3 outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
                type="date"
                value={state.expiresAt}
                onChange={(e) => updateState('expiresAt', e.target.value)}
              />
              <p className="mt-2 text-sm italic text-[#48464c]">
                לאחר תאריך זה הגישה לגלריה תיחסם אוטומטית.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Step 3 — limits & permissions */}
      {step === 3 && (
        <div className="max-w-3xl space-y-6">
          <section className="rounded-xl border border-[#ebebe8] bg-white p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#7D3A52]" />
              <h2 className="text-base font-semibold text-[#100d1f]">מסלולי בחירה</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-[#ebebe8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#100d1f]">
                      בחירת תמונות לאלבום
                    </p>
                    <p className="mt-1 text-xs text-[#48464c]/80">
                      הלקוח מסמן אילו תמונות ייכנסו לאלבום
                    </p>
                  </div>
                  <Switch
                    checked={state.albumSelectionEnabled}
                    onCheckedChange={(checked) =>
                      updateState('albumSelectionEnabled', checked)
                    }
                  />
                </div>
                {state.albumSelectionEnabled && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#48464c]">
                      מקסימום תמונות לאלבום
                    </label>
                    <input
                      className="w-full rounded-xl border border-[#ebebe8] bg-white px-4 py-3 outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
                      placeholder="ללא הגבלה"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={state.maxAlbumSelection}
                      onChange={(e) =>
                        updateState('maxAlbumSelection', e.target.value.replace(/\D/g, ''))
                      }
                    />
                  </div>
                )}
              </div>
              <div className="space-y-3 rounded-xl border border-[#ebebe8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#100d1f]">
                      בחירת תמונות לעיבוד
                    </p>
                    <p className="mt-1 text-xs text-[#48464c]/80">
                      הלקוח מסמן אילו תמונות לשלוח לעיבוד
                    </p>
                  </div>
                  <Switch
                    checked={state.editSelectionEnabled}
                    onCheckedChange={(checked) =>
                      updateState('editSelectionEnabled', checked)
                    }
                  />
                </div>
                {state.editSelectionEnabled && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#48464c]">
                      מקסימום תמונות לעיבוד
                    </label>
                    <input
                      className="w-full rounded-xl border border-[#ebebe8] bg-white px-4 py-3 outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
                      placeholder="ללא הגבלה"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={state.maxEditSelection}
                      onChange={(e) =>
                        updateState('maxEditSelection', e.target.value.replace(/\D/g, ''))
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#ebebe8] bg-white p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-[#7D3A52]" />
              <h2 className="text-base font-semibold text-[#100d1f]">סימן מים</h2>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#48464c]">החל סימן מים אוטומטי</p>
                  <p className="mt-1 text-xs text-[#48464c]/80">
                    בעת העלאת תמונות, הטקסט יוחל על גרסת התצוגה
                  </p>
                </div>
                <Switch
                  checked={state.autoApplyWatermark}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setDisableWatermarkOpen(true)
                      return
                    }
                    updateState('autoApplyWatermark', true)
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#48464c]">טקסט לסימן מים</label>
                <input
                  className="w-full rounded-xl border border-[#ebebe8] bg-white px-4 py-3 outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20"
                  placeholder="הזן טקסט למיתוג..."
                  type="text"
                  value={state.watermarkText}
                  onChange={(e) => updateState('watermarkText', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section
            className={`relative rounded-xl border border-[#ebebe8] bg-white p-6 sm:p-8 ${
              downloadPermissionsEnabled ? '' : 'pointer-events-none select-none opacity-35'
            }`}
          >
            {!downloadPermissionsEnabled && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-[#100d1f] px-3 py-1 text-xs font-semibold text-white">
                לא זמין כרגע
              </span>
            )}
            <div className="mb-6 flex items-center gap-2">
              <Download className="h-5 w-5 text-[#7D3A52]" />
              <h2 className="text-base font-semibold text-[#100d1f]">הרשאות הורדה</h2>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-[#100d1f] sm:text-base">
                    אפשר הורדת תצוגה מקדימה
                  </h4>
                  <p className="text-sm text-[#48464c]">תמונות ברזולוציה נמוכה עם סימן מים</p>
                </div>
                <Switch
                  checked={state.allowDownloadPreview}
                  disabled={!downloadPermissionsEnabled}
                  onCheckedChange={(checked) => updateState('allowDownloadPreview', checked)}
                />
              </div>
              <div className="h-px w-full bg-[#c9c5cd] opacity-50" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-[#100d1f] sm:text-base">
                    אפשר הורדת קבצי מקור
                  </h4>
                  <p className="text-sm text-[#48464c]">קבצי Full HD ללא סימן מים</p>
                </div>
                <Switch
                  checked={state.allowDownloadOriginal}
                  disabled={!downloadPermissionsEnabled}
                  onCheckedChange={(checked) => updateState('allowDownloadOriginal', checked)}
                />
              </div>
            </div>
          </section>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#c9c5cd] bg-[#f7f2f4] px-4 py-3 text-sm leading-relaxed text-[#48464c]">
            <Send className="mt-0.5 h-4 w-4 shrink-0 text-[#7D3A52]" aria-hidden />
            <p>
              המייל ללקוח נשלח בשלב הבא — לאחר שתעלי את התמונות, מתוך מסך העלאת
              התמונות.
            </p>
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-4 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleBack}
          disabled={step === 1 || isPending}
          className="h-12 border-2 px-8 hover:bg-[#fdf8fa] sm:w-auto"
        >
          חזרה
        </Button>

        {step < WIZARD_STEPS.length ? (
          <Button
            type="button"
            size="lg"
            onClick={handleNext}
            disabled={isPending || !canContinue()}
            className="h-12 bg-[#7D3A52] px-8 text-white shadow-lg hover:bg-[#6a2f44] sm:w-auto"
          >
            הבא
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={handlePublish}
            disabled={isPending}
            className="h-12 bg-[#7D3A52] px-8 text-white shadow-lg hover:bg-[#6a2f44] sm:w-auto"
          >
            {isPending ? (
              'שומר גלריה...'
            ) : (
              <>
                <Send className="ml-2 h-5 w-5" />
                שמור גלריה והמשך להעלאת תמונות
              </>
            )}
          </Button>
        )}
      </div>

      <DisableWatermarkDialog
        open={disableWatermarkOpen}
        onOpenChange={setDisableWatermarkOpen}
        onConfirm={() => {
          updateState('autoApplyWatermark', false)
          setDisableWatermarkOpen(false)
        }}
      />
    </div>
  )
}
