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
  CreditCard,
  Image as ImageIcon,
} from 'lucide-react'
import { createClientRecord } from '@/lib/actions/client.actions'
import { createClientGallery } from '@/lib/actions/gallery.actions'
import { uploadClientGalleryCover } from '@/lib/client-cover-upload'
import { DOWNLOAD_PERMISSIONS_ENABLED } from '@/lib/types/app.types'
import type { Client } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection'
import { ClientGalleryCoverPicker } from '@/components/gallery/ClientGalleryCoverPicker'
import { DisableWatermarkDialog } from '@/components/gallery/DisableWatermarkDialog'

const WIZARD_STEPS = ['בחירת לקוח', 'פרטי הגלריה', 'מגבלות והרשאות']

const INPUT_CLASS =
  'w-full rounded-xl border border-[#c9c5cd] bg-white px-4 py-3 outline-none transition-all focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20'

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

/** One bought, still-unused gallery-pass credit the photographer can spend on
 * the gallery she's creating. */
export type GalleryPassCreditView = {
  id: string
  name: string
  photoCap: number
  validityDays: number
}

type ClientGalleryWizardProps = {
  clients: Client[]
  defaultWatermarkText?: string
  downloadPermissionsEnabled?: boolean
  /** She has no tier slot — the "לפי המסלול" option is hidden and a credit must
   * be chosen. */
  tierBlocked?: boolean
  /** Credits she's holding. When any exist, the wizard shows a "how to create
   * this gallery" selector (tier vs. which credit). */
  availableCredits?: GalleryPassCreditView[]
  /** Link to the buy-a-pass panel, or null when nothing is for sale. */
  buyMoreHref?: string | null
}

export function ClientGalleryWizard({
  clients,
  defaultWatermarkText = '',
  downloadPermissionsEnabled: downloadPermissionsEnabledProp,
  tierBlocked = false,
  availableCredits = [],
  buyMoreHref = null,
}: ClientGalleryWizardProps) {
  const router = useRouter()
  const downloadPermissionsEnabled =
    downloadPermissionsEnabledProp ?? DOWNLOAD_PERMISSIONS_ENABLED

  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [disableWatermarkOpen, setDisableWatermarkOpen] = useState(false)
  // 'tier' = create against the subscription/free slot; otherwise a credit id.
  const [creationMode, setCreationMode] = useState<string>(
    tierBlocked ? (availableCredits[0]?.id ?? 'tier') : 'tier'
  )
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

  function buildGalleryInput(clientId: string) {
    return {
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
      passCreditId: creationMode === 'tier' ? undefined : creationMode,
    }
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
    if (tierBlocked && creationMode === 'tier') {
      toast.error('יש לבחור פאס לגלריה זו')
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

        const gallery = await createClientGallery(buildGalleryInput(clientId))

        // The cover lives inside the gallery's own gated storage prefix, so it can
        // only be uploaded once the gallery has an id. A failed upload must not
        // undo the gallery — it can be added later from the gallery settings.
        if (state.coverImageFile) {
          const cover = await uploadClientGalleryCover(gallery.id, state.coverImageFile)
          if (!cover.ok) {
            toast.warning(
              `הגלריה נוצרה, אבל תמונת הכיסוי לא הועלתה (${cover.error}). אפשר להוסיף אותה בהגדרות הגלריה.`
            )
            router.push(`/dashboard/galleries/${gallery.id}/photos`)
            return
          }
        }

        toast.success('הגלריה נוצרה — כעת העלי תמונות')
        router.push(`/dashboard/galleries/${gallery.id}/photos`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'יצירת הגלריה נכשלה')
      }
    })
  }

  const showModeSelector = availableCredits.length > 0 || tierBlocked

  // One-line digests for the folded cards.
  const selectionSummary = [
    state.albumSelectionEnabled
      ? `אלבום${state.maxAlbumSelection ? ` עד ${state.maxAlbumSelection}` : ''}`
      : null,
    state.editSelectionEnabled
      ? `עיבוד${state.maxEditSelection ? ` עד ${state.maxEditSelection}` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(' + ')
  const watermarkSummary = state.autoApplyWatermark
    ? state.watermarkText
      ? `פעיל · ${state.watermarkText}`
      : 'פעיל'
    : 'כבוי'
  const downloadSummary = !downloadPermissionsEnabled
    ? 'לא זמין כרגע'
    : [
        state.allowDownloadPreview ? 'תצוגה מקדימה' : null,
        state.allowDownloadOriginal ? 'קבצי מקור' : null,
      ]
        .filter(Boolean)
        .join(' + ') || 'ללא הורדה'

  return (
    <div className="w-full space-y-8">
      {buyMoreHref ? (
        <p className="text-xs text-[#48464c]">
          {tierBlocked && availableCredits.length === 0
            ? 'אין לך מנוי פעיל — '
            : 'צריכה גלריה גדולה או נוספת? '}
          <a href={buyMoreHref} className="font-semibold text-[#7D3A52] underline">
            רכשי פאס לגלריה בודדת
          </a>
        </p>
      ) : null}

      {showModeSelector ? (
        <div className="rounded-2xl border border-[#7c3aed]/25 bg-[#7c3aed]/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#100d1f]">
            <CreditCard className="h-4 w-4 text-[#6d28d9]" aria-hidden />
            איך ליצור את הגלריה הזו?
          </div>
          <div className="space-y-2">
            {!tierBlocked ? (
              <label className="flex cursor-pointer items-start gap-2 text-sm text-[#48464c]">
                <input
                  type="radio"
                  name="creation-mode"
                  className="mt-1"
                  checked={creationMode === 'tier'}
                  onChange={() => setCreationMode('tier')}
                />
                <span>לפי המסלול שלי (המכסה הרגילה)</span>
              </label>
            ) : null}
            {availableCredits.map((credit) => (
              <label
                key={credit.id}
                className="flex cursor-pointer items-start gap-2 text-sm text-[#48464c]"
              >
                <input
                  type="radio"
                  name="creation-mode"
                  className="mt-1"
                  checked={creationMode === credit.id}
                  onChange={() => setCreationMode(credit.id)}
                />
                <span>
                  פאס שרכשת — עד{' '}
                  <strong>{credit.photoCap.toLocaleString('he-IL')}</strong> תמונות (רגילות
                  + מעובדות), תוקף <strong>{credit.validityDays}</strong> ימים ללקוח מרגע
                  השליחה
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {/* Stepper — done steps are filled with a check, the current one is
          ringed, upcoming ones are hollow. */}
      <ol className="flex items-center gap-2" aria-label="שלבי יצירת הגלריה">
        {WIZARD_STEPS.map((label, index) => {
          const n = index + 1
          const done = step > n
          const current = step === n
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  done
                    ? 'bg-[#7D3A52] text-white'
                    : current
                      ? 'bg-[#7D3A52] text-white ring-4 ring-[#7D3A52]/20'
                      : 'border-2 border-[#c9c5cd] bg-white text-[#79767d]'
                }`}
                aria-current={current ? 'step' : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </span>
              <span
                className={`whitespace-nowrap text-sm ${
                  current ? 'font-bold text-[#100d1f]' : 'hidden text-[#79767d] sm:inline'
                }`}
              >
                {label}
              </span>
              {n < WIZARD_STEPS.length ? (
                <span
                  className={`h-0.5 flex-1 rounded-full ${done ? 'bg-[#7D3A52]' : 'bg-[#e5e1e3]'}`}
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>

      {/* Step 1 — client */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-[#100d1f]">מי הלקוח של הגלריה?</h3>
            <p className="mt-1 text-sm text-[#48464c]">גלריית לקוח תמיד משויכת ללקוח אחד.</p>
          </div>

          {state.clientMode === 'existing' && clients.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#79767d]" />
                <input
                  className={`${INPUT_CLASS} pr-11`}
                  placeholder="חיפוש לקוח לפי שם או אימייל..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#7D3A52] transition-colors hover:bg-[#7D3A52]/10"
                onClick={() => updateState('clientMode', 'new')}
              >
                <UserPlus className="h-4 w-4" />
                לקוח חדש
              </button>
            </div>
          ) : null}

          {state.clientMode === 'new' ? (
            <div className="space-y-4 rounded-2xl border border-[#7D3A52]/20 bg-[#7D3A52]/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-[#100d1f]">לקוח חדש</h4>
                {clients.length > 0 && (
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#7D3A52] hover:underline"
                    onClick={() => updateState('clientMode', 'existing')}
                  >
                    בחירת לקוח קיים
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#48464c]">שם</label>
                  <input
                    className={INPUT_CLASS}
                    placeholder="שם מלא"
                    type="text"
                    value={state.newClientName}
                    onChange={(e) => updateState('newClientName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#48464c]">אימייל</label>
                  <input
                    className={INPUT_CLASS}
                    placeholder="email@example.com"
                    type="email"
                    value={state.newClientEmail}
                    onChange={(e) => updateState('newClientEmail', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#48464c]">טלפון</label>
                  <input
                    className={INPUT_CLASS}
                    placeholder="050-0000000"
                    type="tel"
                    value={state.newClientPhone}
                    onChange={(e) => updateState('newClientPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : clients.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-[#e5e1e3] bg-[#fdf8fa] py-8 text-center text-sm text-[#48464c]">
              אין לקוחות עדיין — הוסיפי לקוח חדש
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                      className={`flex h-full items-center gap-3 rounded-xl border p-4 transition-all hover:border-[#7D3A52] hover:shadow-sm ${
                        selected
                          ? 'border-[#7D3A52] bg-[#7D3A52]/[0.06] ring-1 ring-[#7D3A52]/30'
                          : 'border-[#c9c5cd] bg-white'
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e5dff9] text-base font-bold text-[#100d1f]">
                        {client.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h4 className="truncate font-semibold text-[#100d1f]">{client.name}</h4>
                        <p className="truncate text-sm text-[#48464c]">
                          {client.email || 'אין אימייל'}
                        </p>
                      </div>
                      {selected && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7D3A52] text-white">
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
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xl font-semibold text-[#100d1f]" htmlFor="gallery-name">
              שם הגלריה
            </label>
            <p className="text-sm text-[#48464c]">השם שיופיע ללקוח בראש הדף ובקישור.</p>
            <input
              className={`${INPUT_CLASS} bg-[#f7f2f4] px-5 py-4 text-lg`}
              id="gallery-name"
              placeholder="למשל: ניו בורן / צילומי חוץ"
              type="text"
              value={state.title}
              onChange={(e) => updateState('title', e.target.value)}
            />
          </div>

          <p className="text-sm text-[#48464c]">
            שאר ההגדרות אופציונליות — אפשר לדלג, ולשנות אותן אחר כך בהגדרות הגלריה.
          </p>

          <CollapsibleSection
            tone="violet"
            icon={<ImageIcon className="h-5 w-5" />}
            title="תמונת כיסוי"
            summary={state.coverImageFile ? state.coverImageFile.name : 'ללא'}
          >
            <div className="space-y-3">
              <p className="text-sm text-[#48464c]">
                תוצג בראש הדף שהלקוח רואה. נפרדת מתמונות הגלריה ולא מקבלת סימן מים.
              </p>
              <ClientGalleryCoverPicker
                inputId="wizard-cover-image"
                file={state.coverImageFile}
                onFileChange={(file) => updateState('coverImageFile', file)}
                disabled={isPending}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            tone="violet"
            icon={<Calendar className="h-5 w-5" />}
            title="תפוגת גישה"
            summary={state.expiresAt ? state.expiresAt : 'ללא תפוגה'}
          >
            <div className="space-y-3">
              <p className="flex items-start gap-2 text-sm text-[#48464c]">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#6d28d9]" aria-hidden />
                אין צורך בסיסמה — הלקוח מקבל קוד כניסה חד-פעמי במייל בכל כניסה.
              </p>
              <div className="max-w-xs">
                <label className="mb-1.5 block text-xs font-semibold text-[#48464c]" htmlFor="gallery-expires">
                  תאריך תפוגה
                </label>
                <input
                  id="gallery-expires"
                  className={INPUT_CLASS}
                  type="date"
                  value={state.expiresAt}
                  onChange={(e) => updateState('expiresAt', e.target.value)}
                />
                <p className="mt-2 text-xs text-[#48464c]">
                  לאחר תאריך זה הגישה לגלריה תיחסם אוטומטית.
                </p>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Step 3 — limits & permissions */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-[#48464c]">
            ברירות המחדל מתאימות לרוב הגלריות — אפשר לשמור כמו שזה, או לפתוח כרטיס ולשנות.
          </p>

          <CollapsibleSection
            tone="burgundy"
            icon={<Zap className="h-5 w-5" />}
            title="מסלולי בחירה"
            summary={selectionSummary || 'לא נבחר מסלול'}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-[#c9c5cd] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#100d1f]">לאלבום</p>
                    <p className="mt-1 text-xs text-[#48464c]">
                      הלקוח מסמן אילו תמונות ייכנסו לאלבום
                    </p>
                  </div>
                  <Switch
                    checked={state.albumSelectionEnabled}
                    onCheckedChange={(checked) => updateState('albumSelectionEnabled', checked)}
                  />
                </div>
                {state.albumSelectionEnabled && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#48464c]">
                      מקסימום תמונות
                    </label>
                    <input
                      className={INPUT_CLASS}
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
              <div className="space-y-3 rounded-xl border border-[#c9c5cd] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#100d1f]">לעיבוד</p>
                    <p className="mt-1 text-xs text-[#48464c]">
                      הלקוח מסמן אילו תמונות לשלוח לעיבוד
                    </p>
                  </div>
                  <Switch
                    checked={state.editSelectionEnabled}
                    onCheckedChange={(checked) => updateState('editSelectionEnabled', checked)}
                  />
                </div>
                {state.editSelectionEnabled && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#48464c]">
                      מקסימום תמונות
                    </label>
                    <input
                      className={INPUT_CLASS}
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
          </CollapsibleSection>

          <CollapsibleSection
            tone="burgundy"
            icon={<Droplets className="h-5 w-5" />}
            title="סימן מים"
            summary={watermarkSummary}
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#100d1f]">החל סימן מים אוטומטי</p>
                  <p className="mt-1 text-xs text-[#48464c]">
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
                <label className="mb-1.5 block text-xs font-semibold text-[#48464c]">
                  טקסט לסימן מים
                </label>
                <input
                  className={INPUT_CLASS}
                  placeholder="טקסט למיתוג..."
                  type="text"
                  value={state.watermarkText}
                  onChange={(e) => updateState('watermarkText', e.target.value)}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            tone="burgundy"
            icon={<Download className="h-5 w-5" />}
            title="הרשאות הורדה"
            summary={downloadSummary}
          >
            {downloadPermissionsEnabled ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#100d1f]">הורדת תצוגה מקדימה</p>
                    <p className="text-xs text-[#48464c]">תמונות ברזולוציה נמוכה עם סימן מים</p>
                  </div>
                  <Switch
                    checked={state.allowDownloadPreview}
                    onCheckedChange={(checked) => updateState('allowDownloadPreview', checked)}
                  />
                </div>
                <div className="h-px w-full bg-[#c9c5cd] opacity-50" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#100d1f]">הורדת קבצי מקור</p>
                    <p className="text-xs text-[#48464c]">קבצי Full HD ללא סימן מים</p>
                  </div>
                  <Switch
                    checked={state.allowDownloadOriginal}
                    onCheckedChange={(checked) => updateState('allowDownloadOriginal', checked)}
                  />
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-[#48464c]">
                <span className="rounded-full bg-[#100d1f] px-2.5 py-0.5 text-xs font-semibold text-white">
                  בקרוב
                </span>
                הורדת תמונות על ידי הלקוח עדיין לא זמינה.
              </p>
            )}
          </CollapsibleSection>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-[#48464c]">
            <Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7D3A52]" aria-hidden />
            המייל ללקוח נשלח בשלב הבא — אחרי שתעלי את התמונות.
          </p>
        </div>
      )}

      {/* Nav */}
      <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#ebe7e9] pt-5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1 || isPending}
          className="rounded-xl px-6 py-3 font-semibold text-[#48464c] transition-colors hover:bg-[#f7f2f4] disabled:invisible"
        >
          חזרה
        </button>

        {step < WIZARD_STEPS.length ? (
          <Button
            type="button"
            size="lg"
            onClick={handleNext}
            disabled={isPending || !canContinue()}
            className="h-12 bg-[#7D3A52] px-10 text-white shadow-lg hover:bg-[#6a2f44] sm:w-auto"
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
