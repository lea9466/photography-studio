import {
  updateAboutSectionSchema,
  updateContactFormSchema,
  setSlugSchema,
  type AssistantActionType,
} from '@/lib/validations/dashboard-assistant'
import { ASSISTANT_FIELD_LABELS } from '@/lib/assistant/field-labels'
import type { AssistantProfileSnapshot } from '@/lib/assistant/studio-context'
import type { AssistantPreview, AssistantPreviewField } from './preview-types'

// Anthropic tool definitions. Calling one of these only produces a preview —
// no database write happens here. The actual write happens later, through
// confirmAssistantAction, only after the photographer clicks "אשר ומלא"
// (see lib/actions/assistant.actions.ts).
export const ASSISTANT_TOOLS = [
  {
    name: 'update_about_section',
    description:
      'הצעת עדכון לתוכן סקשן "אודות" בדף הבית: כותרת, כותרת משנה, תיאור מפורט, וטקסט קצר לאזור ההירו. אפשר למלא רק חלק מהשדות. הקריאה הזו רק מכינה תצוגה מקדימה לאישור — אינה שומרת בפועל.',
    input_schema: {
      type: 'object' as const,
      properties: {
        about_title: { type: 'string', description: 'כותרת סקשן האודות, עם מילות חיפוש טבעיות' },
        about_subtitle: { type: 'string', description: 'כותרת משנה — התמחות ואזור פעילות' },
        about_description: { type: 'string', description: 'גוף הטקסט המלא של סקשן האודות' },
        about_text: { type: 'string', description: 'טקסט קצר (2-3 שורות) לאזור ההירו בראש הדף' },
      },
    },
  },
  {
    name: 'update_contact_form',
    description:
      'הצעת עדכון לפרטי יצירת קשר וטקסטים בסקשן "יצירת קשר" בדף הבית: טלפון, אימייל, כותרת ותת-כותרת הסקשן. אפשר למלא רק חלק מהשדות. הקריאה הזו רק מכינה תצוגה מקדימה לאישור — אינה שומרת בפועל.',
    input_schema: {
      type: 'object' as const,
      properties: {
        phone: { type: 'string', description: 'מספר טלפון ליצירת קשר' },
        email: { type: 'string', description: 'כתובת אימייל לקבלת פניות מטופס יצירת הקשר' },
        contact_title: { type: 'string', description: 'הכותרת מעל טופס יצירת הקשר' },
        contact_subtitle: { type: 'string', description: 'טקסט ההסבר מתחת לכותרת' },
      },
    },
  },
  {
    name: 'set_slug',
    description:
      'הצעה להגדיר את כתובת האתר (slug) של הסטודיו — הכרחי כדי שהאתר יהיה נגיש בכתובת ציבורית ויוכל להופיע בתוצאות חיפוש בגוגל. רק אותיות אנגליות, מספרים ומקפים, ללא רווחים. הקריאה הזו רק מכינה תצוגה מקדימה לאישור.',
    input_schema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'כתובת האתר המוצעת — אותיות אנגליות/מספרים/מקפים בלבד' },
      },
      required: ['slug'],
    },
  },
]

const ACTION_TITLES: Partial<Record<AssistantActionType, string>> = {
  update_about_section: 'עדכון סקשן אודות',
  update_contact_form: 'עדכון יצירת קשר',
  set_slug: 'הגדרת כתובת אתר (Slug)',
}

export function buildAssistantPreview(
  toolName: string,
  rawInput: unknown,
  profile: AssistantProfileSnapshot
): { preview: AssistantPreview; payload: Record<string, string | undefined> } {
  if (toolName === 'update_about_section') {
    const parsed = updateAboutSectionSchema.parse(rawInput)
    return {
      payload: parsed,
      preview: buildPreview('update_about_section', parsed, profile),
    }
  }
  if (toolName === 'update_contact_form') {
    const parsed = updateContactFormSchema.parse(rawInput)
    return {
      payload: parsed,
      preview: buildPreview('update_contact_form', parsed, profile),
    }
  }
  if (toolName === 'set_slug') {
    const parsed = setSlugSchema.parse(rawInput)
    return {
      payload: parsed,
      preview: buildPreview('set_slug', parsed, profile),
    }
  }
  throw new Error(`כלי לא מוכר: ${toolName}`)
}

function buildPreview(
  actionType: AssistantActionType,
  parsed: Record<string, string | undefined>,
  profile: AssistantProfileSnapshot
): AssistantPreview {
  const fields: AssistantPreviewField[] = []
  for (const [key, after] of Object.entries(parsed)) {
    if (after === undefined) continue
    const before = (profile as unknown as Record<string, string | null>)[key] ?? ''
    fields.push({ key, label: ASSISTANT_FIELD_LABELS[key] ?? key, before, after })
  }
  return { actionType, title: ACTION_TITLES[actionType] ?? actionType, fields }
}
