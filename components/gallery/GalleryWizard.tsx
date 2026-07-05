'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  ImagePlus, 
  Send, 
  Search, 
  UserPlus, 
  Check, 
  Edit, 
  UserCheck, 
  Image as ImageIcon, 
  Eye, 
  ArrowLeft, 
  Lock, 
  Key, 
  Calendar, 
  Zap, 
  Droplets, 
  Download, 
  CloudUpload, 
  Filter, 
  Plus, 
  Info 
} from 'lucide-react'
import { createClientRecord } from '@/lib/actions/client.actions'
import { createGallery } from '@/lib/actions/gallery.actions'
import { GALLERY_TYPE_LABELS } from '@/lib/types/app.types'
import type { Client, GalleryType } from '@/lib/types/database.types'
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
import { Switch } from '@/components/ui/switch'

const WIZARD_STEPS = ['בחירת לקוח', 'סוג גלריה', 'הגדרות מתקדמות']

const GALLERY_TYPES: GalleryType[] = ['selection', 'portfolio']

type GalleryWizardProps = {
  clients: Client[]
  defaultWatermarkText?: string
}

type WizardState = {
  clientMode: 'existing' | 'new' | 'public'
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
  isPublic: boolean
  coverImage: string
  coverImageFile: File | null
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
  isPublic: false,
  coverImage: '',
  coverImageFile: null,
}

export function GalleryWizard({
  clients,
  defaultWatermarkText = '',
}: GalleryWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>({
    ...initialState,
    clientId: clients[0]?.id ?? '',
    clientMode: clients.length > 0 ? 'existing' : 'new',
    watermarkText: defaultWatermarkText,
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
      if (state.clientMode === 'public') {
        return true
      }
      if (state.clientMode === 'existing') {
        return Boolean(state.clientId)
      }
      return Boolean(state.newClientName.trim())
    }
    if (step === 2) {
      return Boolean(state.title.trim())
    }
    if (step === 3) {
      return true
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
        let clientId: string | null = state.clientId

        if (state.clientMode === 'new') {
          const client = await createClientRecord({
            name: state.newClientName,
            email: state.newClientEmail,
            phone: state.newClientPhone,
          })
          clientId = client.id
        }

        if (state.clientMode === 'public') {
          clientId = null
        }

        if (!clientId && state.clientMode !== 'public') {
          throw new Error('יש לבחור או ליצור לקוח')
        }

        // Upload cover image if file is selected
        let coverImageUrl: string | undefined = undefined
        if (state.coverImageFile) {
          try {
            const formData = new FormData()
            formData.append('file', state.coverImageFile)
            formData.append('type', 'cover')
            
            const uploadResponse = await fetch('/api/upload-cover', {
              method: 'POST',
              body: formData,
            })

            const uploadData = await uploadResponse.json().catch(() => ({}))

            if (!uploadResponse.ok) {
              throw new Error(
                typeof uploadData.error === 'string'
                  ? uploadData.error
                  : 'העלאת תמונת השער נכשלה'
              )
            }

            coverImageUrl = uploadData.path ?? uploadData.url
          } catch (error) {
            console.error('Error uploading cover image:', error)
            toast.error(error instanceof Error ? error.message : 'העלאת תמונת השער נכשלה')
            return
          }
        }

        const gallery = await createGallery({
          title: state.title,
          clientId: clientId,
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
          sendToClient: state.clientMode === 'public' ? false : state.sendToClient,
          isPublic: state.clientMode === 'public' ? true : state.isPublic,
          coverImage: coverImageUrl,
        })

        toast.success(
          state.clientMode === 'public'
            ? 'גלריה ציבורית נוצרה בהצלחה'
            : state.sendToClient
            ? 'הגלריה נוצרה וסומנה כנשלחה'
            : 'הגלריה נוצרה בהצלחה'
        )
        router.push(`/dashboard/galleries/${gallery.id}/photos`)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'יצירת הגלריה נכשלה'
        )
      }
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
      {/* Progress Stepper - Visible on all steps */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            step === 1 ? 'bg-[#100d1f] text-white' : 'bg-[#252235] text-[#8d89a0]'
          }`}>1</div>
          <span className={`font-medium transition-colors ${
            step === 1 ? 'text-[#100d1f] font-bold' : 'text-[#48464c]'
          }`}>בחירת לקוח</span>
        </div>
        <div className="h-[1px] w-16 bg-[#c9c5cd]"></div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            step === 2 ? 'bg-[#100d1f] text-white' : 'bg-[#252235] text-[#8d89a0]'
          }`}>2</div>
          <span className={`font-medium transition-colors ${
            step === 2 ? 'text-[#100d1f] font-bold' : 'text-[#48464c]'
          }`}>סוג גלריה</span>
        </div>
        <div className="h-[1px] w-16 bg-[#c9c5cd]"></div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            step === 3 ? 'bg-[#100d1f] text-white' : 'bg-[#252235] text-[#8d89a0]'
          }`}>3</div>
          <span className={`font-medium transition-colors ${
            step === 3 ? 'text-[#100d1f] font-bold' : 'text-[#48464c]'
          }`}>הגדרות מתקדמות</span>
        </div>
      </div>

      {step === 1 ? (
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold text-[#1c1b1d] mb-2">מי הלקוח של הגלריה הזו?</h3>
            <p className="text-base text-[#48464c]">בחר לקוח קיים מהרשימה או צור לקוח חדש כדי להמשיך בתהליך.</p>
          </div>
          
          {/* Actions Row */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#79767d] w-5 h-5" />
              <input 
                className="w-full pr-11 py-3 bg-white border border-[#c9c5cd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7D3A52]/20 focus:border-[#7D3A52] transition-all text-base" 
                placeholder="חיפוש לקוח לפי שם או אימייל..." 
                type="text"
              />
            </div>
            <button 
              className="flex items-center gap-2 px-6 py-3 bg-white border border-[#100d1f] text-[#100d1f] rounded-xl font-semibold hover:bg-[#f7f2f4] transition-colors active:scale-95"
              onClick={() => updateState('clientMode', 'new')}
            >
              <UserPlus className="w-5 h-5" />
              <span className="text-base">הוספת לקוח חדש</span>
            </button>
          </div>
          
          {/* Client Grid - Show when clientMode is 'existing' or 'public' */}
          {state.clientMode !== 'new' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Public Showcase Option - Always at the top */}
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="client_selection"
                  value="public"
                  checked={state.clientMode === 'public'}
                  onChange={() => {
                    updateState('clientMode', 'public')
                    updateState('isPublic', true)
                  }}
                  className="sr-only client-card-radio"
                />
                <div className={`client-card-inner h-full p-6 bg-white border border-[#c9c5cd] rounded-xl transition-all duration-200 hover:border-[#7D3A52] hover:shadow-sm flex items-center gap-4 ${
                  state.clientMode === 'public'
                    ? 'border-[#7D3A52] bg-[#f1edef]'
                    : ''
                }`}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-[#7D3A52] to-[#5a2f44] text-white">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <h4 className="font-semibold text-base text-[#100d1f]">ללא לקוח (גלריה ציבורית לתיק עבודות)</h4>
                    <p className="text-sm text-[#48464c] truncate">No Client (Public Showcase)</p>
                  </div>
                  {state.clientMode === 'public' && (
                    <div className="check-icon absolute top-3 left-3 w-6 h-6 rounded-full bg-[#7D3A52] text-white items-center justify-center flex">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </label>

              {clients.map((client, index) => {
                const colors = [
                  { bg: '#e5dff9', text: '#100d1f' },
                  { bg: '#ffd9e1', text: '#25020f' },
                  { bg: '#ffd9e2', text: '#3b051d' },
                  { bg: '#ddd9db', text: '#1c1b1d' },
                  { bg: '#c9c3dc', text: '#484459' },
                  { bg: '#f9b4c6', text: '#693747' }
                ]
                const color = colors[index % colors.length]
                return (
                  <label
                    key={client.id}
                    className="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="client_selection"
                      value={client.id}
                      checked={state.clientId === client.id && state.clientMode === 'existing'}
                      onChange={(e) => {
                        updateState('clientId', e.target.value)
                        updateState('clientMode', 'existing')
                        updateState('isPublic', false)
                      }}
                      className="sr-only client-card-radio"
                    />
                    <div className={`client-card-inner h-full p-6 bg-white border border-[#c9c5cd] rounded-xl transition-all duration-200 hover:border-[#7D3A52] hover:shadow-sm flex items-center gap-4 ${
                      state.clientId === client.id && state.clientMode === 'existing'
                        ? 'border-[#7D3A52] bg-[#f1edef]'
                        : ''
                    }`}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: color.bg, color: color.text }}>
                        {client.name.slice(0, 2)}
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <h4 className="font-semibold text-base text-[#100d1f] truncate">{client.name}</h4>
                        <p className="text-sm text-[#48464c] truncate">{client.email || 'אין אימייל'}</p>
                      </div>
                      {state.clientId === client.id && state.clientMode === 'existing' && (
                        <div className="check-icon absolute top-3 left-3 w-6 h-6 rounded-full bg-[#7D3A52] text-white items-center justify-center flex">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          {/* New Client Form - Show when clientMode is 'new' */}
          {state.clientMode === 'new' && (
            <div className="max-w-md mx-auto bg-white border border-[#c9c5cd] rounded-xl p-6 space-y-4">
              <h4 className="text-lg font-semibold text-[#100d1f]">יצירת לקוח חדש</h4>
              <div>
                <label className="block text-sm font-semibold text-[#48464c] mb-2">שם הלקוח</label>
                <input
                  className="w-full bg-white border border-[#c9c5cd] rounded-xl px-4 py-3 focus:outline-none focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all"
                  placeholder="הזן שם מלא"
                  type="text"
                  value={state.newClientName}
                  onChange={(e) => updateState('newClientName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#48464c] mb-2">אימייל</label>
                <input
                  className="w-full bg-white border border-[#c9c5cd] rounded-xl px-4 py-3 focus:outline-none focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all"
                  placeholder="email@example.com"
                  type="email"
                  value={state.newClientEmail}
                  onChange={(e) => updateState('newClientEmail', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#48464c] mb-2">טלפון</label>
                <input
                  className="w-full bg-white border border-[#c9c5cd] rounded-xl px-4 py-3 focus:outline-none focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all"
                  placeholder="050-0000000"
                  type="tel"
                  value={state.newClientPhone}
                  onChange={(e) => updateState('newClientPhone', e.target.value)}
                />
              </div>
              <button
                className="w-full mt-4 px-6 py-3 bg-[#7D3A52] text-white rounded-xl font-semibold hover:bg-[#6a2f44] transition-colors"
                onClick={() => updateState('clientMode', 'existing')}
              >
                בחר לקוח קיים במקום
              </button>
            </div>
          )}
          
          {clients.length === 0 && state.clientMode === 'existing' ? (
            <p className="text-sm text-[#48464c] text-center py-8 bg-[#fdf8fa] rounded-xl border-2 border-dashed border-[#e5e1e3]">
              אין לקוחות עדיין — צרי לקוח חדש
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Section 1: Gallery Name */}
          <section className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-base font-semibold text-[#48464c]" htmlFor="gallery-name">שם הגלריה</label>
              <p className="text-base text-[#48464c]/70">זהו השם שיופיע ללקוחות שלך בראש הדף ובקישור.</p>
            </div>
            <div className="relative max-w-xl">
              <input 
                className="w-full bg-[#f7f2f4] border border-[#c9c5cd] rounded-xl px-6 py-4 text-lg focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all outline-none" 
                id="gallery-name" 
                placeholder="למשל: חתונה של דנה ואבי" 
                type="text"
                value={state.title}
                onChange={(e) => updateState('title', e.target.value)}
              />
              <Edit className="absolute left-4 top-1/2 -translate-y-1/2 text-[#79767d] w-5 h-5" />
            </div>
          </section>
          
          <hr className="border-[#c9c5cd]"/>
          
          {/* Section 2: Gallery Type Selection */}
          <section className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-base font-semibold text-[#48464c]">בחירת סוג גלריה</label>
              <p className="text-base text-[#48464c]/70">איך הלקוח יתקשר עם התמונות שלך?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {GALLERY_TYPES.map((type) => (
                <label key={type} className="cursor-pointer">
                  <input 
                    className="hidden peer" 
                    name="gallery_type" 
                    type="radio" 
                    value={type}
                    checked={state.galleryType === type}
                    onChange={() => updateState('galleryType', type)}
                  />
                  <div className={`selection-card h-full p-8 rounded-xl border border-[#c9c5cd] flex flex-col gap-4 text-right peer-checked:border-[#7D3A52] peer-checked:bg-[#7D3A52]/[0.03] peer-checked:ring-1 peer-checked:ring-[#7D3A52] group transition-all duration-300 ${
                    state.galleryType === type
                      ? 'border-[#7D3A52] bg-[#7D3A52]/[0.03] ring-1 ring-[#7D3A52]'
                      : 'hover:border-[#7D3A52] hover:shadow-sm'
                  }`}>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      state.galleryType === type
                        ? 'bg-[#7D3A52] text-white'
                        : 'bg-[#ebe7e9] text-[#7D3A52] group-hover:bg-[#7D3A52] group-hover:text-white'
                    }`}>
                      {type === 'selection' ? (
                        <UserCheck className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-[#100d1f]">{GALLERY_TYPE_LABELS[type]}</h3>
                    <p className="text-sm text-[#48464c] leading-relaxed">
                      {type === 'selection'
                        ? 'אידיאלי לתהליכי עבודה. הלקוח יכול לסמן לבבות על תמונות נבחרות לצורך עריכה או הדפסה.'
                        : 'גלריה ציבורית להצגת מיטב העבודות שלך. בדף הבית — עד 4 גלריות: כרטיס עם תמונת שער + 4 תמונות בסקשן "תמונות אחרונות".'}
                    </p>
                    <div className="mt-auto pt-4 flex items-center gap-2 text-[#7D3A52] font-semibold text-sm">
                      <span>
                        {type === 'selection' ? 'הוסף לשלב העריכה' : 'הצגה לציבור'}
                      </span>
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="max-w-7xl mx-auto">
          {/* Bento Grid Layout for Sections */}
          <form className="grid grid-cols-12 gap-6">
            {/* Security Section */}
            <section className="col-span-12 lg:col-span-7 bg-white border border-[#ebebe8] rounded-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-[#7D3A52]" />
                <h2 className="text-base font-semibold text-[#100d1f]">אבטחה ופרטיות</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#48464c] mb-2">סיסמת גלריה</label>
                  <div className="relative">
                    <input
                      className="w-full bg-white border border-[#ebebe8] rounded-xl px-4 py-3 focus:outline-none focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all pr-10"
                      placeholder="הזן סיסמה... (אם לא תזין, תיווצר אוטומטית)"
                      type="password"
                      value={state.password}
                      onChange={(e) => updateState('password', e.target.value)}
                    />
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48464c] w-5 h-5" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#48464c] mb-2">תאריך תפוגה</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-white border border-[#ebebe8] rounded-xl px-4 py-3 focus:outline-none focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all pr-10" 
                      type="date"
                      value={state.expiresAt}
                      onChange={(e) => updateState('expiresAt', e.target.value)}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#48464c] w-5 h-5" />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#48464c] italic">לאחר תאריך התפוגה, הגישה לגלריה תיחסם אוטומטית.</p>
            </section>
            
            {/* Limits Section */}
            <section className="col-span-12 lg:col-span-5 bg-white border border-[#ebebe8] rounded-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-[#7D3A52]" />
                <h2 className="text-base font-semibold text-[#100d1f]">מגבלות אלבום</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#48464c] mb-2">מקסימום תמונות בגלריה</label>
                  <input 
                    className="w-full bg-white border border-[#ebebe8] rounded-xl px-4 py-3 focus:outline-none focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all" 
                    placeholder="ללא הגבלה" 
                    type="number"
                    value={state.maxAlbumSelection}
                    onChange={(e) => updateState('maxAlbumSelection', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#48464c] mb-2">מקסימום תמונות לעריכה</label>
                  <input 
                    className="w-full bg-white border border-[#ebebe8] rounded-xl px-4 py-3 focus:outline-none focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all" 
                    placeholder="50" 
                    type="number"
                    value={state.maxEditSelection}
                    onChange={(e) => updateState('maxEditSelection', e.target.value)}
                  />
                </div>
              </div>
            </section>
            
            {/* Content & Watermark Section */}
            <section className="col-span-12 lg:col-span-6 bg-white border border-[#ebebe8] rounded-xl p-8 overflow-hidden relative">
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#e5dff9] opacity-10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-2 mb-6">
                <Droplets className="w-5 h-5 text-[#7D3A52]" />
                <h2 className="text-base font-semibold text-[#100d1f]">תוכן וסימן מים</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#48464c] mb-2">טקסט לסימן מים</label>
                  <input 
                    className="w-full bg-white border border-[#ebebe8] rounded-xl px-4 py-3 focus:outline-none focus:border-[#7D3A52] focus:ring-2 focus:ring-[#7D3A52]/20 transition-all" 
                    placeholder="הזן טקסט למיתוג..." 
                    type="text"
                    value={state.watermarkText}
                    onChange={(e) => updateState('watermarkText', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#48464c] mb-2">
                    תמונת שער לאתר הציבורי
                    <span className="text-[#7D3A52] font-normal mr-1">(מוצג רק כאשר הגלריה מופיעה באתר הציבורי)</span>
                  </label>
                  <div className="space-y-3">
                    {state.coverImageFile ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-[#ebebe8]">
                        <img
                          src={URL.createObjectURL(state.coverImageFile)}
                          alt="תמונת שער"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateState('coverImageFile', null)
                            updateState('coverImage', '')
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#c9c5cd] rounded-lg p-6 text-center hover:border-[#7D3A52] transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              updateState('coverImageFile', file)
                              updateState('coverImage', URL.createObjectURL(file))
                            }
                          }}
                          className="hidden"
                          id="cover-image-upload"
                        />
                        <label
                          htmlFor="cover-image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#48464c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-[#48464c]">לחץ לבחירת תמונה</span>
                          <span className="text-xs text-[#48464c]">או גרור קובץ לכאן</span>
                        </label>
                      </div>
                    )}
                    <p className="text-xs text-[#48464c]">
                      אם לא תוזן, תוצג התמונה הראשונה מהגלריה
                    </p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Download Permissions Section */}
            <section className="col-span-12 lg:col-span-6 bg-white border border-[#ebebe8] rounded-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Download className="w-5 h-5 text-[#7D3A52]" />
                <h2 className="text-base font-semibold text-[#100d1f]">הרשאות הורדה</h2>
              </div>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-[#100d1f]">אפשר הורדת תצוגה מקדימה</h4>
                    <p className="text-sm text-[#48464c]">הורדת תמונות ברזולוציה נמוכה עם סימן מים</p>
                  </div>
                  <Switch
                    checked={state.allowDownloadPreview}
                    onCheckedChange={(checked) => updateState('allowDownloadPreview', checked)}
                  />
                </div>
                <div className="h-[1px] w-full bg-[#c9c5cd] opacity-50"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-[#100d1f]">אפשר הורדת קבצי מקור</h4>
                    <p className="text-sm text-[#48464c]">הורדת קבצי Full HD ללא סימן מים (ללקוחות משלמים בלבד)</p>
                  </div>
                  <Switch
                    checked={state.allowDownloadOriginal}
                    onCheckedChange={(checked) => updateState('allowDownloadOriginal', checked)}
                  />
                </div>
              </div>
            </section>
          </form>
        </div>
      ) : null}

      {step < WIZARD_STEPS.length ? (
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleBack}
            disabled={step === 1 || isPending}
            className="border-2 hover:bg-[#fdf8fa] h-12 px-8"
          >
            חזרה
          </Button>

          {step < WIZARD_STEPS.length ? (
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              disabled={isPending || !canContinue()}
              className="bg-[#7D3A52] text-white hover:bg-[#6a2f44] shadow-lg h-12 px-8"
            >
              הבא
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="fixed bottom-8 left-8 z-50">
          <Button
            type="button"
            size="lg"
            onClick={handlePublish}
            disabled={isPending}
            className="bg-[#7D3A52] text-white hover:bg-[#6a2f44] shadow-lg h-12 px-8"
          >
            {isPending ? (
              'שומר גלריה...'
            ) : (
              <>
                <Send className="h-5 w-5 ml-2" />
                שמור גלריה והמשך להעלאת תמונות
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
