'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Sparkles, X, Send, Paperclip, ImageOff, ImagePlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionPreviewCard, type ActionPreviewStatus } from './ActionPreviewCard'
import { confirmAssistantAction, undoLastAssistantAction } from '@/lib/actions/assistant.actions'
import { prepareBrandingUpload } from '@/lib/actions/branding.actions'
import { putToPresignedUrl } from '@/lib/r2/upload-client'
import type { AssistantActionType } from '@/lib/validations/dashboard-assistant'
import type { AssistantPreview } from '@/lib/assistant/tools/preview-types'

type TextBlock = { type: 'text'; text: string }
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: unknown }
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string }
type ContentBlock = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock

type ChatMessage = { role: 'user' | 'assistant'; content: string | ContentBlock[] }

type AttachedImage = { base64: string; mediaType: string; previewUrl: string }

type AssistantWidgetProps = {
  hasMissingContent?: boolean
  missingSlug?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Fully dismisses the widget (hides the floating button too) — reopened from the sidebar. */
  onDismiss?: () => void
}

const UNDO_WINDOW_MS = 10 * 60 * 1000
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_HERO_IMAGE_BYTES = 20 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DEFAULT_IMAGE_CAPTION =
  'זו תמונת מסך של תגובת לקוח (מייל/וואטסאפ). אנא חלצי מתוכה את הטקסט המדויק והציעי יצירת המלצה — בלי להוסיף ניסוח משלך.'
const IMAGE_PLACEHOLDER_TEXT = '[תמונה שצורפה — הטקסט כבר חולץ ולא נשמרה]'
const DASHBOARD_LINK_PATTERN = /(\/dashboard[\w-]*(?:\/[\w-]+)*)/g

// Turns any /dashboard/... path the assistant mentions into a real,
// same-tab clickable link — the chat widget lives in the dashboard layout
// so it survives client-side navigation instead of reloading.
function renderMessageText(text: string) {
  return text.split(DASHBOARD_LINK_PATTERN).map((part, index) =>
    part.startsWith('/dashboard') ? (
      <Link key={index} href={part} className="font-medium underline underline-offset-2">
        {part}
      </Link>
    ) : (
      <span key={index}>{part}</span>
    )
  )
}

// Shadows the public/theme-able CSS vars (--accent, --background, etc. —
// see app/globals.css: "can change based on photographer's theme") with the
// dashboard's own FIXED tokens, scoped to this widget's subtree only. Without
// this, the shared <Button> primitive (and anything else reading those
// vars) silently renders in whatever accent color the studio picked for
// their public site — which can be visually identical to the background.
const DASHBOARD_THEME_OVERRIDE = {
  '--accent': 'var(--dashboard-accent)',
  '--background': 'var(--dashboard-background)',
  '--foreground': 'var(--dashboard-foreground)',
  '--border': 'var(--dashboard-border)',
  '--muted': 'var(--dashboard-muted)',
} as React.CSSProperties

function AssistantLabel() {
  return (
    <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[--dashboard-muted]">
      <Sparkles className="h-3 w-3 text-amber-500" />
      עוזר האתר
    </p>
  )
}

export function AssistantWidget({
  hasMissingContent,
  missingSlug,
  open: openProp,
  onOpenChange,
  onDismiss,
}: AssistantWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  function setOpen(next: boolean) {
    onOpenChange ? onOpenChange(next) : setInternalOpen(next)
  }
  const [slugNudgeDismissed, setSlugNudgeDismissed] = useState(false)
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingToolUseIds, setPendingToolUseIds] = useState<string[]>([])
  const [previews, setPreviews] = useState<Record<string, AssistantPreview>>({})
  const [previewStatus, setPreviewStatus] = useState<Record<string, ActionPreviewStatus>>({})
  const [previewBusy, setPreviewBusy] = useState<Record<string, boolean>>({})
  const [previewError, setPreviewError] = useState<Record<string, string>>({})
  const [previewLogId, setPreviewLogId] = useState<Record<string, string>>({})
  const [previewApprovedAt, setPreviewApprovedAt] = useState<Record<string, number>>({})
  const [previewUndone, setPreviewUndone] = useState<Record<string, boolean>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const heroFileInputRef = useRef<HTMLInputElement>(null)

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImageError(null)

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('סוג קובץ לא נתמך — JPG, PNG או WebP בלבד')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('הקובץ גדול מדי — עד 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1] ?? ''
      setAttachedImage({ base64, mediaType: file.type, previewUrl: dataUrl })
    }
    reader.onerror = () => setImageError('שגיאה בקריאת הקובץ')
    reader.readAsDataURL(file)
  }

  async function handleHeroFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setHeroUploadError(null)

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setHeroUploadError('סוג קובץ לא נתמך — JPG, PNG או WebP בלבד')
      return
    }
    if (file.size > MAX_HERO_IMAGE_BYTES) {
      setHeroUploadError('הקובץ גדול מדי — עד 20MB')
      return
    }

    setUploadingHero(true)
    try {
      const { uploadUrl, path } = await prepareBrandingUpload({
        type: 'hero_desktop',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        slot: 0,
      })
      await putToPresignedUrl(uploadUrl, file)
      await sendContent(
        `תמונה חדשה הועלתה בהצלחה לאזור ההירו. path: ${path}. אנא הציעי להגדיר אותה כתמונת ההירו הראשית.`
      )
    } catch (error) {
      setHeroUploadError(error instanceof Error ? error.message : 'ההעלאה נכשלה')
    } finally {
      setUploadingHero(false)
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (sending || pendingToolUseIds.length > 0) return
    if (!text && !attachedImage) return

    const content: ChatMessage['content'] = attachedImage
      ? [
          { type: 'image', source: { type: 'base64', media_type: attachedImage.mediaType, data: attachedImage.base64 } },
          { type: 'text', text: text || DEFAULT_IMAGE_CAPTION },
        ]
      : text

    setInput('')
    setAttachedImage(null)
    setImageError(null)
    await sendContent(content)
  }

  async function sendContent(content: ChatMessage['content']) {
    if (sending || pendingToolUseIds.length > 0) return

    const nextHistory: ChatMessage[] = [...history, { role: 'user', content }]
    setHistory(nextHistory)
    setSending(true)
    setStreamingText('')
    setErrorMessage(null)
    scrollToBottom()

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextHistory }),
      })

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null)
        setErrorMessage(data?.error || 'שגיאה בתקשורת עם העוזר')
        setSending(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as Record<string, unknown>

          if (event.type === 'text_delta') {
            setStreamingText((prev) => prev + (event.text as string))
            scrollToBottom()
          } else if (event.type === 'tool_preview') {
            const toolUseId = event.toolUseId as string
            setPreviews((prev) => ({ ...prev, [toolUseId]: event.preview as AssistantPreview }))
            setPreviewStatus((prev) => ({ ...prev, [toolUseId]: 'pending' }))
            scrollToBottom()
          } else if (event.type === 'tool_error') {
            const toolUseId = event.toolUseId as string
            setPreviewStatus((prev) => ({ ...prev, [toolUseId]: 'error' }))
            setPreviewError((prev) => ({ ...prev, [toolUseId]: event.message as string }))
          } else if (event.type === 'message_end') {
            const responseContent = (event.content as ContentBlock[]) ?? []
            setHistory((prev) => {
              // Strip the image bytes from the user turn that triggered this
              // response — extraction is done, and resending the image on
              // every future request would be wasteful and pointless
              // (assistant spec §2.8: the image is never persisted).
              const sanitized = prev.map((message, index) => {
                if (index !== prev.length - 1 || !Array.isArray(message.content)) return message
                const hasImage = message.content.some((block) => block.type === 'image')
                if (!hasImage) return message
                return {
                  ...message,
                  content: message.content.map((block) =>
                    block.type === 'image' ? { type: 'text' as const, text: IMAGE_PLACEHOLDER_TEXT } : block
                  ),
                }
              })
              return [...sanitized, { role: 'assistant', content: responseContent }]
            })
            const toolUseIds = responseContent
              .filter((block): block is ToolUseBlock => block.type === 'tool_use')
              .map((block) => block.id)
            setPendingToolUseIds(toolUseIds)
            setStreamingText('')
          } else if (event.type === 'error') {
            setErrorMessage(event.message as string)
          }
        }
      }
    } catch {
      setErrorMessage('שגיאה בתקשורת עם העוזר')
    } finally {
      setSending(false)
      scrollToBottom()
    }
  }

  function resolveToolUse(toolUseId: string, resultText: string) {
    setPendingToolUseIds((prev) => {
      const remaining = prev.filter((id) => id !== toolUseId)
      if (remaining.length === 0 && prev.includes(toolUseId)) {
        setHistory((history) => {
          const allIds = history[history.length - 1]?.content
          const ids = Array.isArray(allIds)
            ? (allIds as ContentBlock[])
                .filter((block): block is ToolUseBlock => block.type === 'tool_use')
                .map((block) => block.id)
            : []
          const resultBlocks: ToolResultBlock[] = ids.map((id) => ({
            type: 'tool_result',
            tool_use_id: id,
            content: id === toolUseId ? resultText : previewResultText(id),
          }))
          return [...history, { role: 'user', content: resultBlocks }]
        })
      }
      return remaining
    })
  }

  function previewResultText(toolUseId: string): string {
    const status = previewStatus[toolUseId]
    if (status === 'approved') return 'המשתמשת אישרה — הפעולה בוצעה בהצלחה.'
    if (status === 'cancelled') return 'המשתמשת ביטלה את ההצעה — לא בוצע שינוי.'
    return 'ההצעה נדחתה.'
  }

  async function handleApprove(toolUseId: string) {
    const preview = previews[toolUseId]
    if (!preview) return
    setPreviewBusy((prev) => ({ ...prev, [toolUseId]: true }))
    try {
      const payload = Object.fromEntries(preview.fields.map((field) => [field.key, field.after]))
      const result = await confirmAssistantAction(preview.actionType as AssistantActionType, payload)
      setPreviewStatus((prev) => ({ ...prev, [toolUseId]: 'approved' }))
      setPreviewLogId((prev) => ({ ...prev, [toolUseId]: result.logId }))
      setPreviewApprovedAt((prev) => ({ ...prev, [toolUseId]: Date.now() }))
      resolveToolUse(toolUseId, 'המשתמשת אישרה — הפעולה בוצעה בהצלחה.')
    } catch (error) {
      setPreviewStatus((prev) => ({ ...prev, [toolUseId]: 'error' }))
      setPreviewError((prev) => ({
        ...prev,
        [toolUseId]: error instanceof Error ? error.message : 'שגיאה בביצוע הפעולה',
      }))
    } finally {
      setPreviewBusy((prev) => ({ ...prev, [toolUseId]: false }))
    }
  }

  function handleCancel(toolUseId: string) {
    setPreviewStatus((prev) => ({ ...prev, [toolUseId]: 'cancelled' }))
    resolveToolUse(toolUseId, 'המשתמשת ביטלה את ההצעה — לא בוצע שינוי.')
  }

  function handleUndo(toolUseId: string) {
    const logId = previewLogId[toolUseId]
    if (!logId) return
    startTransition(async () => {
      try {
        await undoLastAssistantAction(logId)
        setPreviewUndone((prev) => ({ ...prev, [toolUseId]: true }))
      } catch (error) {
        setPreviewError((prev) => ({
          ...prev,
          [toolUseId]: error instanceof Error ? error.message : 'לא ניתן היה לבטל את הפעולה',
        }))
      }
    })
  }

  const inputDisabled = sending || pendingToolUseIds.length > 0 || uploadingHero

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3" style={DASHBOARD_THEME_OVERRIDE}>
      {open ? (
        <div className="flex h-[32rem] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-[--dashboard-border] bg-[--dashboard-background] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[--dashboard-border] px-4 py-3">
            <p className="flex items-center gap-1.5 font-medium text-[--dashboard-foreground]">
              <Sparkles className="h-4 w-4 text-amber-500" />
              עוזר האתר
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (onDismiss ? onDismiss() : setOpen(false))}
              title="סגירת העוזר — ניתן לפתוח שוב מסרגל הצד"
              aria-label="סגירת העוזר"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {history.length === 0 && missingSlug && !slugNudgeDismissed ? (
              <div className="space-y-3 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-950">
                <p>
                  היי! שמתי לב שאין לך עדיין כתובת לאתר (slug). בלי זה האתר שלך לא יכול להיכנס לחיפוש של גוגל ואף
                  אחד לא יכול להגיע אליו. רוצה שאעזור לך להגדיר אחת עכשיו?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSlugNudgeDismissed(true)
                      sendContent('אין לי כתובת (slug) מוגדרת לאתר. עזרי לי לבחור ולהגדיר אחת.')
                    }}
                  >
                    כן, בואי נגדיר
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSlugNudgeDismissed(true)}>
                    אולי אחר כך
                  </Button>
                </div>
              </div>
            ) : null}

            {history.length === 0 && (!missingSlug || slugNudgeDismissed) ? (
              <p className="text-sm text-[--dashboard-muted]">
                שלום! אני כאן כדי לעזור לך למלא ולערוך את תוכן האתר — אודות, חבילות, בלוג, שאלות ותשובות, המלצות
                ועוד. אפשר גם לצרף תמונה של תגובת לקוח כדי להפוך אותה להמלצה. איך אפשר לעזור?
              </p>
            ) : null}

            {history.map((message, index) => (
              <ChatBubble
                key={index}
                message={message}
                previews={previews}
                previewStatus={previewStatus}
                previewBusy={previewBusy}
                previewError={previewError}
                previewApprovedAt={previewApprovedAt}
                previewUndone={previewUndone}
                onApprove={handleApprove}
                onCancel={handleCancel}
                onUndo={handleUndo}
              />
            ))}

            {streamingText ? (
              <div className="mr-auto max-w-[85%]">
                <AssistantLabel />
                <div className="rounded-lg rounded-bl-sm bg-[--dashboard-border] px-3 py-2 text-sm text-[--dashboard-foreground]">
                  {renderMessageText(streamingText)}
                </div>
              </div>
            ) : null}

            {sending && !streamingText && pendingToolUseIds.length === 0 ? (
              <div className="mr-auto max-w-[85%]">
                <AssistantLabel />
                <div className="flex items-center gap-2 rounded-lg rounded-bl-sm bg-[--dashboard-border] px-3 py-2.5 text-sm text-[--dashboard-muted]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  חושבת...
                </div>
              </div>
            ) : null}

            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          </div>

          <div className="border-t border-[--dashboard-border] p-3">
            {attachedImage ? (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-[--dashboard-border] p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachedImage.previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
                <p className="flex-1 text-xs text-[--dashboard-muted]">תמונה מצורפת — תישלח רק לחילוץ הטקסט, לא תישמר</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setAttachedImage(null)}
                  aria-label="הסרת תמונה"
                >
                  <ImageOff className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            {imageError ? <p className="mb-2 text-xs text-red-600">{imageError}</p> : null}
            {heroUploadError ? (
              <p className="mb-2 text-xs text-red-600">{heroUploadError}</p>
            ) : null}
            {uploadingHero ? <p className="mb-2 text-xs text-[--dashboard-muted]">מעלה תמונה לאזור ההירו...</p> : null}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={heroFileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                className="hidden"
                onChange={handleHeroFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={inputDisabled}
                onClick={() => fileInputRef.current?.click()}
                title="צירוף תמונה של תגובת לקוח (להמלצה)"
                aria-label="צירוף תמונת המלצה"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={inputDisabled}
                onClick={() => heroFileInputRef.current?.click()}
                title="העלאת תמונת הירו חדשה"
                aria-label="העלאת תמונת הירו"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={inputDisabled}
                placeholder={
                  pendingToolUseIds.length > 0
                    ? 'יש להשיב להצעה למעלה לפני שממשיכים...'
                    : attachedImage
                      ? 'רוצה להוסיף הערה? (לא חובה)'
                      : 'כתבי הודעה...'
                }
                rows={2}
                className="flex-1 resize-none rounded-md border border-[--dashboard-border] bg-transparent px-3 py-2 text-sm text-[--dashboard-foreground] outline-none focus-visible:ring-2 focus-visible:ring-[--dashboard-accent] disabled:opacity-50"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={inputDisabled || (!input.trim() && !attachedImage)}
                aria-label="שליחה"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Button
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative h-12 w-12 rounded-full shadow-lg"
        aria-label="עוזר האתר"
      >
        <Sparkles className="h-5 w-5" />
        {hasMissingContent && !open ? (
          <span className="absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-500 ring-2 ring-[--dashboard-background]" />
        ) : null}
      </Button>
    </div>
  )
}

function ChatBubble({
  message,
  previews,
  previewStatus,
  previewBusy,
  previewError,
  previewApprovedAt,
  previewUndone,
  onApprove,
  onCancel,
  onUndo,
}: {
  message: ChatMessage
  previews: Record<string, AssistantPreview>
  previewStatus: Record<string, ActionPreviewStatus>
  previewBusy: Record<string, boolean>
  previewError: Record<string, string>
  previewApprovedAt: Record<string, number>
  previewUndone: Record<string, boolean>
  onApprove: (id: string) => void
  onCancel: (id: string) => void
  onUndo: (id: string) => void
}) {
  if (message.role === 'user') {
    if (typeof message.content === 'string') {
      return (
        <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-[--dashboard-accent] px-3 py-2 text-sm text-[--dashboard-background]">
          {message.content}
        </div>
      )
    }

    const imageBlock = message.content.find((block): block is ImageBlock => block.type === 'image')
    const textBlock = message.content.find((block): block is TextBlock => block.type === 'text')
    if (!imageBlock && !textBlock) return null

    return (
      <div className="ml-auto max-w-[85%] space-y-1.5 rounded-lg rounded-br-sm bg-[--dashboard-accent] px-3 py-2 text-sm text-[--dashboard-background]">
        {imageBlock ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:${imageBlock.source.media_type};base64,${imageBlock.source.data}`}
            alt=""
            className="max-h-40 rounded object-cover"
          />
        ) : null}
        {textBlock ? <p>{textBlock.text}</p> : null}
      </div>
    )
  }

  const blocks = typeof message.content === 'string' ? [] : message.content
  const firstTextIndex = blocks.findIndex((block) => block.type === 'text' && block.text.trim())

  return (
    <div className="mr-auto max-w-[85%] space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'text' && block.text.trim()) {
          return (
            <div key={index}>
              {index === firstTextIndex ? <AssistantLabel /> : null}
              <div className="rounded-lg rounded-bl-sm bg-[--dashboard-border] px-3 py-2 text-sm text-[--dashboard-foreground]">
                {renderMessageText(block.text)}
              </div>
            </div>
          )
        }
        if (block.type === 'tool_use') {
          const preview = previews[block.id]
          if (!preview) return null
          const status = previewStatus[block.id] ?? 'pending'
          const approvedAt = previewApprovedAt[block.id]
          const undone = previewUndone[block.id]
          const undoAvailable = Boolean(
            status === 'approved' && !undone && approvedAt && Date.now() - approvedAt < UNDO_WINDOW_MS
          )
          return (
            <ActionPreviewCard
              key={index}
              preview={preview}
              status={status}
              busy={previewBusy[block.id]}
              errorMessage={previewError[block.id]}
              onApprove={() => onApprove(block.id)}
              onCancel={() => onCancel(block.id)}
              undoAvailable={undoAvailable}
              onUndo={() => onUndo(block.id)}
            />
          )
        }
        return null
      })}
    </div>
  )
}
