import { createTestimonialSchema } from '@/lib/validations/dashboard-assistant'
import { ASSISTANT_FIELD_LABELS } from '@/lib/assistant/field-labels'
import type { AssistantPreview, AssistantPreviewField } from './preview-types'

// Used after the photographer uploads a screenshot of client feedback in the
// chat. Claude's vision reads the image directly (no separate OCR step) and
// proposes this tool call with the *extracted* text only — see the "iron
// rule" in system-prompt.ts: never invent wording that wasn't in the image.
// The source image itself is never stored (assistant spec §2.8) — it only
// ever exists as a base64 block in this one request.
export const ASSISTANT_TESTIMONIAL_TOOLS = [
  {
    name: 'create_testimonial',
    description:
      'הצעת המלצת לקוח חדשה, על בסיס טקסט שחולץ מתמונה שהמשתמשת העלתה (צילום מסך של מייל/וואטסאפ) או שנמסר בטקסט חופשי. יש להעביר רק את הטקסט שחולץ בפועל — לא לנסח ניסוח חדש. הקריאה הזו רק מכינה תצוגה מקדימה לאישור.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'כותרת קצרה להמלצה, למשל שם הלקוח או סוג הצילום' },
        content: { type: 'string', description: 'תוכן ההמלצה — הטקסט שחולץ מהתמונה (מקוצר/מנוקה בלבד, לא מומצא)' },
        shoot_type: { type: 'string', description: 'סוג הצילום שאליו מתייחסת ההמלצה (אופציונלי)' },
      },
      required: ['title', 'content'],
    },
  },
]

function field(key: string, before: string, after: string): AssistantPreviewField {
  return { key, label: ASSISTANT_FIELD_LABELS[key] ?? key, before, after }
}

export function buildTestimonialPreview(
  toolName: string,
  rawInput: unknown
): { preview: AssistantPreview; payload: Record<string, unknown> } {
  if (toolName === 'create_testimonial') {
    const parsed = createTestimonialSchema.parse(rawInput)
    const fields: AssistantPreviewField[] = [field('title', '', parsed.title), field('content', '', parsed.content)]
    if (parsed.shoot_type) fields.push(field('shoot_type', '', parsed.shoot_type))
    return {
      payload: parsed,
      preview: { actionType: 'create_testimonial', title: 'המלצת לקוח חדשה', fields },
    }
  }
  throw new Error(`כלי לא מוכר: ${toolName}`)
}
