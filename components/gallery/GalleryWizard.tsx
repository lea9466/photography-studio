'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ImagePlus, Send } from 'lucide-react'
import { createClientRecord } from '@/lib/actions/client.actions'
import { createGallery } from '@/lib/actions/gallery.actions'
import { GALLERY_TYPE_LABELS } from '@/lib/types/app.types'
import type { Client, GalleryType } from '@/lib/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stepper } from '@/components/ui/stepper'
import { Switch } from '@/components/ui/switch'

const WIZARD_STEPS = ['לקוח', 'סוג גלריה', 'העלאת תמונות', 'פרסום']

const GALLERY_TYPES: GalleryType[] = ['selection', 'delivery', 'portfolio']

type GalleryWizardProps = {
  clients: Client[]
}

type WizardState = {
  clientMode: 'existing' | 'new'
  clientId: string
  newClientName: string
  newClientEmail: string
  newClientPhone: string
  title: string
  galleryType: GalleryType
  password: string
  expiresAt: string
  maxAlbumSelection: string
  maxEditSelection: string
  allowDownloadPreview: boolean
  allowDownloadOriginal: boolean
  watermarkText: string
  sendToClient: boolean
}

const initialState: WizardState = {
  clientMode: 'existing',
  clientId: '',
  newClientName: '',
  newClientEmail: '',
  newClientPhone: '',
  title: '',
  galleryType: 'selection',
  password: '',
  expiresAt: '',
  maxAlbumSelection: '',
  maxEditSelection: '',
  allowDownloadPreview: false,
  allowDownloadOriginal: false,
  watermarkText: '',
  sendToClient: false,
}

export function GalleryWizard({ clients }: GalleryWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>({
    ...initialState,
    clientId: clients[0]?.id ?? '',
    clientMode: clients.length > 0 ? 'existing' : 'new',
  })
  const [isPending, startTransition] = useTransition()

  function updateState<K extends keyof WizardState>(
    key: K,
    value: WizardState[K]
  ) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function canContinue() {
    if (step === 1) {
      if (state.clientMode === 'existing') {
        return Boolean(state.clientId)
      }
      return Boolean(state.newClientName.trim())
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

    startTransition(async () => {
      try {
        let clientId = state.clientId

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

        const gallery = await createGallery({
          title: state.title,
          clientId,
          galleryType: state.galleryType,
          password: state.password || undefined,
          expiresAt: state.expiresAt || undefined,
          maxAlbumSelection: state.maxAlbumSelection
            ? Number(state.maxAlbumSelection)
            : undefined,
          maxEditSelection: state.maxEditSelection
            ? Number(state.maxEditSelection)
            : undefined,
          allowDownloadPreview: state.allowDownloadPreview,
          allowDownloadOriginal: state.allowDownloadOriginal,
          watermarkText: state.watermarkText || undefined,
          sendToClient: state.sendToClient,
        })

        toast.success(
          state.sendToClient
            ? 'הגלריה נוצרה וסומנה כנשלחה'
            : 'הגלריה נוצרה בהצלחה'
        )
        router.push(`/dashboard/galleries/${gallery.id}`)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'יצירת הגלריה נכשלה'
        )
      }
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Stepper steps={WIZARD_STEPS} currentStep={step} />

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>לקוח</CardTitle>
            <CardDescription>בחרי לקוח קיים או צרי חדש</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={state.clientMode === 'existing' ? 'default' : 'outline'}
                size="sm"
                disabled={clients.length === 0}
                onClick={() => updateState('clientMode', 'existing')}
              >
                לקוח קיים
              </Button>
              <Button
                type="button"
                variant={state.clientMode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateState('clientMode', 'new')}
              >
                לקוח חדש
              </Button>
            </div>

            {state.clientMode === 'existing' ? (
              <div className="space-y-2">
                <Label>בחירת לקוח</Label>
                <Select
                  value={state.clientId}
                  onValueChange={(value) => updateState('clientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחרי לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients.length === 0 ? (
                  <p className="text-sm text-[--muted]">
                    אין לקוחות עדיין — צרי לקוח חדש
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="client-name">שם הלקוח</Label>
                  <Input
                    id="client-name"
                    value={state.newClientName}
                    onChange={(e) =>
                      updateState('newClientName', e.target.value)
                    }
                    placeholder="שם מלא"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">אימייל</Label>
                  <Input
                    id="client-email"
                    type="email"
                    dir="ltr"
                    value={state.newClientEmail}
                    onChange={(e) =>
                      updateState('newClientEmail', e.target.value)
                    }
                    placeholder="client@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">טלפון</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    dir="ltr"
                    value={state.newClientPhone}
                    onChange={(e) =>
                      updateState('newClientPhone', e.target.value)
                    }
                    placeholder="050-0000000"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>סוג גלריה</CardTitle>
            <CardDescription>בחרי את סוג הגלריה ושם</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gallery-title">שם הגלריה</Label>
              <Input
                id="gallery-title"
                value={state.title}
                onChange={(e) => updateState('title', e.target.value)}
                placeholder="לדוגמה: חתונה — דנה ויוסי"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {GALLERY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateState('galleryType', type)}
                  className={`rounded-xl border p-4 text-right transition-shadow hover:shadow-md ${
                    state.galleryType === type
                      ? 'border-[--accent] shadow-sm'
                      : 'border-[--border]'
                  }`}
                >
                  <p className="font-medium">{GALLERY_TYPE_LABELS[type]}</p>
                  <p className="mt-2 text-sm text-[--muted]">
                    {type === 'selection'
                      ? 'לקוח בוחר תמונות לאלבום ולעיבוד'
                      : type === 'delivery'
                        ? 'מסירת תמונות מעובדות בלבד'
                        : 'תיק עבודות ציבורי'}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>העלאת תמונות</CardTitle>
            <CardDescription>
              לאחר יצירת הגלריה — העלי תמונות בטאב &quot;תמונות&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[--border] bg-[--background] p-8 text-center">
              <ImagePlus className="h-10 w-10 text-[--muted]" />
              <p className="text-sm text-[--muted]">
                גררי תמונות לכאן או לחצי להעלאה
              </p>
              <Badge variant="muted">יהיה זמין לאחר יצירת הגלריה</Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card>
          <CardHeader>
            <CardTitle>פרסום</CardTitle>
            <CardDescription>הגדרות גישה, בחירות ושליחה ללקוח</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">סיסמת גלריה</Label>
                <Input
                  id="password"
                  dir="ltr"
                  value={state.password}
                  onChange={(e) => updateState('password', e.target.value)}
                  placeholder="אוטומטי אם ריק"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">תאריך תפוגה</Label>
                <Input
                  id="expires"
                  type="date"
                  value={state.expiresAt}
                  onChange={(e) => updateState('expiresAt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-album">מקסימום לאלבום</Label>
                <Input
                  id="max-album"
                  type="number"
                  min={0}
                  value={state.maxAlbumSelection}
                  onChange={(e) =>
                    updateState('maxAlbumSelection', e.target.value)
                  }
                  placeholder="ללא הגבלה"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-edit">מקסימום לעיבוד</Label>
                <Input
                  id="max-edit"
                  type="number"
                  min={0}
                  value={state.maxEditSelection}
                  onChange={(e) =>
                    updateState('maxEditSelection', e.target.value)
                  }
                  placeholder="ללא הגבלה"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="watermark">טקסט סימן מים</Label>
              <Input
                id="watermark"
                value={state.watermarkText}
                onChange={(e) => updateState('watermarkText', e.target.value)}
                placeholder="שם הסטודיו"
              />
            </div>

            <div className="space-y-4 rounded-xl border border-[--border] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">הורדת תצוגה מקדימה</p>
                  <p className="text-sm text-[--muted]">לאפשר ללקוח להוריד previews</p>
                </div>
                <Switch
                  checked={state.allowDownloadPreview}
                  onCheckedChange={(checked) =>
                    updateState('allowDownloadPreview', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">הורדת מקור</p>
                  <p className="text-sm text-[--muted]">לאפשר הורדת קבצי מקור</p>
                </div>
                <Switch
                  checked={state.allowDownloadOriginal}
                  onCheckedChange={(checked) =>
                    updateState('allowDownloadOriginal', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">שליחה ללקוח</p>
                  <p className="text-sm text-[--muted]">
                    סמן כנשלח — מייל יתווסף בשלב 12
                  </p>
                </div>
                <Switch
                  checked={state.sendToClient}
                  onCheckedChange={(checked) =>
                    updateState('sendToClient', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || isPending}
        >
          חזרה
        </Button>

        {step < WIZARD_STEPS.length ? (
          <Button type="button" onClick={handleNext} disabled={isPending}>
            המשך
          </Button>
        ) : (
          <Button type="button" onClick={handlePublish} disabled={isPending}>
            {isPending ? (
              'יוצר גלריה...'
            ) : (
              <>
                <Send className="h-4 w-4" />
                {state.sendToClient ? 'צור ושלח' : 'צור גלריה'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
