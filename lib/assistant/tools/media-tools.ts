import { getBrandingPreviewUrl } from '@/lib/branding-preview-url'
import { ASSISTANT_FIELD_LABELS } from '@/lib/assistant/field-labels'
import { setHeroImageSchema } from '@/lib/validations/dashboard-assistant'
import type { AssistantStudioContext } from '@/lib/assistant/studio-context'
import type { AssistantPreview, AssistantPreviewField } from './preview-types'

// The image itself is never uploaded through the chat/model — it goes
// straight from the browser to R2 via the existing presigned-upload
// pipeline (lib/actions/branding.actions.ts), exactly like the regular
// dashboard branding screen. The model only ever sees the resulting storage
// path (posted into the conversation as plain text) and proposes setting it
// as the hero image — see AssistantWidget.tsx's hero-upload handler.
export const ASSISTANT_MEDIA_TOOLS = [
  {
    name: 'set_hero_image',
    description:
      'הצעה להגדיר תמונה שהועלתה כתמונת ההירו הראשית בדף הבית (דסקטופ, סלוט ראשון). יש להשתמש בנתיב (path) המדויק שמופיע בהודעת המערכת על ההעלאה למעלה בשיחה — לעולם לא להמציא נתיב.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'הנתיב הפנימי המדויק של הקובץ שהועלה' },
      },
      required: ['path'],
    },
  },
]

export function buildMediaPreview(
  toolName: string,
  rawInput: unknown,
  context: AssistantStudioContext
): { preview: AssistantPreview; payload: Record<string, unknown> } {
  if (toolName === 'set_hero_image') {
    const parsed = setHeroImageSchema.parse(rawInput)
    const field: AssistantPreviewField = {
      key: 'hero_image',
      label: ASSISTANT_FIELD_LABELS.hero_image ?? 'תמונת הירו',
      before: context.profile.hero_desktop_url ? 'יש תמונת הירו נוכחית' : '(אין תמונת הירו כרגע)',
      after: 'התמונה שהועלתה',
      imageUrl: getBrandingPreviewUrl(parsed.path) ?? undefined,
    }
    return {
      payload: parsed,
      preview: { actionType: 'set_hero_image', title: 'הגדרת תמונת הירו', fields: [field] },
    }
  }
  throw new Error(`כלי לא מוכר: ${toolName}`)
}
