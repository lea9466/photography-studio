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
// as the hero image — see AssistantWidget.tsx's hero-upload handler. The
// slot (1-3) is chosen by the photographer in the upload UI itself, not
// inferred by the model, and is echoed back in that same system message.
export const ASSISTANT_MEDIA_TOOLS = [
  {
    name: 'set_hero_image',
    description:
      'הצעה להגדיר תמונה שהועלתה כתמונת הירו בדף הבית (דסקטופ). באתר יש 3 סלוטים קבועים לתמונות הירו (סליידר) — לא סלוט אחד. יש להשתמש בנתיב (path) ובמספר הסלוט (slot, 1-3) בדיוק כפי שמופיעים בהודעת המערכת על ההעלאה למעלה בשיחה — לעולם לא להמציא אותם.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'הנתיב הפנימי המדויק של הקובץ שהועלה' },
        slot: { type: 'number', description: 'מספר הסלוט (1, 2 או 3) שנבחר להעלאה' },
      },
      required: ['path', 'slot'],
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
    const currentUrl = context.heroDesktopSlots[parsed.slot - 1] ?? null
    const field: AssistantPreviewField = {
      key: 'hero_image',
      label: `${ASSISTANT_FIELD_LABELS.hero_image ?? 'תמונת הירו'} — סלוט ${parsed.slot}`,
      before: currentUrl ? 'התמונה הנוכחית בסלוט זה' : '(סלוט ריק כרגע)',
      after: 'התמונה שהועלתה',
      imageUrl: getBrandingPreviewUrl(parsed.path) ?? undefined,
    }
    return {
      payload: parsed,
      preview: { actionType: 'set_hero_image', title: `הגדרת תמונת הירו — סלוט ${parsed.slot}`, fields: [field] },
    }
  }
  throw new Error(`כלי לא מוכר: ${toolName}`)
}
