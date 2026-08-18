import {
  createPackageSchema,
  updatePackageSchema,
  deletePackageSchema,
  createBlogPostSchema,
  addFaqItemSchema,
  updateThemeSchema,
} from '@/lib/validations/dashboard-assistant'
import { ASSISTANT_FIELD_LABELS } from '@/lib/assistant/field-labels'
import { THEME_OPTIONS } from '@/lib/dashboard/site-settings-help'
import type { AssistantStudioContext } from '@/lib/assistant/studio-context'
import type { AssistantPreview, AssistantPreviewField } from './preview-types'

// Same pattern as content-tools.ts: calling a tool only produces a preview.
// No database write happens until the photographer approves it explicitly
// (see lib/assistant/action-handlers.ts).
export const ASSISTANT_STRUCTURE_TOOLS = [
  {
    name: 'create_package',
    description:
      'הצעת יצירת חבילת צילום חדשה: שם, מחיר, משך זמן ורשימת "מה כלול". הקריאה הזו רק מכינה תצוגה מקדימה לאישור — אינה שומרת בפועל.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'שם החבילה, למשל "חבילת חתונה"' },
        price_amount: { type: 'number', description: 'מחיר בשקלים' },
        duration_text: { type: 'string', description: 'משך הצילום, למשך "3 שעות"' },
        includes: {
          type: 'array',
          items: { type: 'string' },
          description: 'רשימת מה כלול בחבילה — כל פריט כמחרוזת נפרדת',
        },
      },
      required: ['name', 'price_amount', 'includes'],
    },
  },
  {
    name: 'update_package',
    description:
      'הצעת עדכון לחבילת צילום קיימת. יש להשתמש ב-package_id המדויק מרשימת החבילות הקיימות בהקשר השיחה. אפשר למלא רק חלק מהשדות.',
    input_schema: {
      type: 'object' as const,
      properties: {
        package_id: { type: 'string', description: 'המזהה המדויק של החבילה הקיימת' },
        name: { type: 'string', description: 'שם חדש לחבילה' },
        price_amount: { type: 'number', description: 'מחיר חדש בשקלים' },
        duration_text: { type: 'string', description: 'משך זמן חדש' },
        includes: { type: 'array', items: { type: 'string' }, description: 'רשימת "מה כלול" מעודכנת' },
      },
      required: ['package_id'],
    },
  },
  {
    name: 'delete_package',
    description: 'הצעת מחיקת חבילת צילום קיימת לפי package_id מדויק מרשימת החבילות הקיימות.',
    input_schema: {
      type: 'object' as const,
      properties: {
        package_id: { type: 'string', description: 'המזהה המדויק של החבילה למחיקה' },
      },
      required: ['package_id'],
    },
  },
  {
    name: 'create_blog_post',
    description:
      'הצעת פוסט בלוג חדש: כותרת, כותרת משנה אופציונלית, ותוכן. הקריאה הזו רק מכינה תצוגה מקדימה לאישור.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'כותרת הפוסט' },
        subtitle: { type: 'string', description: 'כותרת משנה קצרה (אופציונלי)' },
        content: { type: 'string', description: 'תוכן הפוסט המלא' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'add_faq_item',
    description: 'הצעת פריט שאלות ותשובות חדש להוספה לרשימה הקיימת. שאלה אחת ותשובה אחת בכל קריאה.',
    input_schema: {
      type: 'object' as const,
      properties: {
        question: { type: 'string', description: 'השאלה' },
        answer: { type: 'string', description: 'התשובה' },
      },
      required: ['question', 'answer'],
    },
  },
  {
    name: 'update_theme',
    description: `הצעת שינוי ערכת העיצוב של האתר. ערכות אפשריות: ${THEME_OPTIONS.map((t) => `${t.id} (${t.name})`).join(', ')}.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        selected_theme: { type: 'string', description: 'מזהה ערכת העיצוב הרצויה' },
      },
      required: ['selected_theme'],
    },
  },
]

const ACTION_TITLES: Record<string, string> = {
  create_package: 'יצירת חבילת צילום',
  update_package: 'עדכון חבילת צילום',
  delete_package: 'מחיקת חבילת צילום',
  create_blog_post: 'פוסט בלוג חדש',
  add_faq_item: 'פריט שאלות ותשובות חדש',
  update_theme: 'שינוי ערכת עיצוב',
}

function field(key: string, before: string, after: string): AssistantPreviewField {
  return { key, label: ASSISTANT_FIELD_LABELS[key] ?? key, before, after }
}

export function buildStructurePreview(
  toolName: string,
  rawInput: unknown,
  context: AssistantStudioContext
): { preview: AssistantPreview; payload: Record<string, unknown> } {
  if (toolName === 'create_package') {
    const parsed = createPackageSchema.parse(rawInput)
    const fields: AssistantPreviewField[] = [
      field('name', '', parsed.name),
      field('price_amount', '', `₪${parsed.price_amount}`),
    ]
    if (parsed.duration_text) fields.push(field('duration_text', '', parsed.duration_text))
    fields.push(field('includes', '', parsed.includes.join(', ')))
    return {
      payload: parsed,
      preview: { actionType: 'create_package', title: ACTION_TITLES.create_package, fields },
    }
  }

  if (toolName === 'update_package') {
    const parsed = updatePackageSchema.parse(rawInput)
    const existing = context.packages.find((pkg) => pkg.id === parsed.package_id)
    if (!existing) throw new Error('לא נמצאה חבילה עם המזהה הזה')
    const fields: AssistantPreviewField[] = []
    if (parsed.name !== undefined) fields.push(field('name', existing.name, parsed.name))
    if (parsed.price_amount !== undefined) {
      fields.push(field('price_amount', `₪${existing.price_amount}`, `₪${parsed.price_amount}`))
    }
    if (parsed.duration_text !== undefined) {
      fields.push(field('duration_text', existing.duration_text ?? '', parsed.duration_text))
    }
    if (parsed.includes !== undefined) {
      fields.push(field('includes', (existing.includes ?? []).join(', '), parsed.includes.join(', ')))
    }
    return {
      payload: parsed,
      preview: { actionType: 'update_package', title: ACTION_TITLES.update_package, fields },
    }
  }

  if (toolName === 'delete_package') {
    const parsed = deletePackageSchema.parse(rawInput)
    const existing = context.packages.find((pkg) => pkg.id === parsed.package_id)
    if (!existing) throw new Error('לא נמצאה חבילה עם המזהה הזה')
    return {
      payload: parsed,
      preview: {
        actionType: 'delete_package',
        title: ACTION_TITLES.delete_package,
        fields: [field('_delete_package', `${existing.name} — ₪${existing.price_amount}`, '(תימחק)')],
      },
    }
  }

  if (toolName === 'create_blog_post') {
    const parsed = createBlogPostSchema.parse(rawInput)
    const fields: AssistantPreviewField[] = [field('title', '', parsed.title)]
    if (parsed.subtitle) fields.push(field('subtitle', '', parsed.subtitle))
    fields.push(field('content', '', parsed.content))
    return {
      payload: parsed,
      preview: { actionType: 'create_blog_post', title: ACTION_TITLES.create_blog_post, fields },
    }
  }

  if (toolName === 'add_faq_item') {
    const parsed = addFaqItemSchema.parse(rawInput)
    return {
      payload: parsed,
      preview: {
        actionType: 'add_faq_item',
        title: ACTION_TITLES.add_faq_item,
        fields: [field('question', '', parsed.question), field('answer', '', parsed.answer)],
      },
    }
  }

  if (toolName === 'update_theme') {
    const parsed = updateThemeSchema.parse(rawInput)
    const currentTheme = THEME_OPTIONS.find((t) => t.id === context.profile.selected_theme)
    const nextTheme = THEME_OPTIONS.find((t) => t.id === parsed.selected_theme)
    return {
      payload: parsed,
      preview: {
        actionType: 'update_theme',
        title: ACTION_TITLES.update_theme,
        fields: [
          field(
            'selected_theme',
            currentTheme?.name ?? context.profile.selected_theme ?? '',
            nextTheme?.name ?? parsed.selected_theme
          ),
        ],
      },
    }
  }

  throw new Error(`כלי לא מוכר: ${toolName}`)
}
