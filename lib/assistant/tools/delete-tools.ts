import {
  deleteBlogPostSchema,
  deleteFaqItemSchema,
  deleteTestimonialSchema,
} from '@/lib/validations/dashboard-assistant'
import { ASSISTANT_FIELD_LABELS } from '@/lib/assistant/field-labels'
import type { AssistantStudioContext } from '@/lib/assistant/studio-context'
import type { AssistantPreview, AssistantPreviewField } from './preview-types'

// Deletion is only offered for content types the assistant itself can also
// create (assistant spec §2.6) — blog posts, FAQ items, and testimonials
// here; packages are handled in structure-tools.ts. Galleries with photos,
// source media, and payments are permanently out of scope — there is no
// tool for them, by design, not by a runtime check.
export const ASSISTANT_DELETE_TOOLS = [
  {
    name: 'delete_blog_post',
    description: 'הצעת מחיקת פוסט בלוג קיים לפי post_id מדויק מרשימת הפוסטים הקיימים.',
    input_schema: {
      type: 'object' as const,
      properties: {
        post_id: { type: 'string', description: 'המזהה המדויק של הפוסט למחיקה' },
      },
      required: ['post_id'],
    },
  },
  {
    name: 'delete_faq_item',
    description: 'הצעת מחיקת פריט שאלות ותשובות קיים. יש להעביר את השאלה בדיוק כפי שמופיעה ברשימה הקיימת.',
    input_schema: {
      type: 'object' as const,
      properties: {
        question: { type: 'string', description: 'השאלה המדויקת של הפריט למחיקה' },
      },
      required: ['question'],
    },
  },
  {
    name: 'delete_testimonial',
    description: 'הצעת מחיקת המלצת לקוח קיימת לפי testimonial_id מדויק מרשימת ההמלצות הקיימות.',
    input_schema: {
      type: 'object' as const,
      properties: {
        testimonial_id: { type: 'string', description: 'המזהה המדויק של ההמלצה למחיקה' },
      },
      required: ['testimonial_id'],
    },
  },
]

function field(key: string, before: string, after: string): AssistantPreviewField {
  return { key, label: ASSISTANT_FIELD_LABELS[key] ?? key, before, after }
}

export function buildDeletePreview(
  toolName: string,
  rawInput: unknown,
  context: AssistantStudioContext
): { preview: AssistantPreview; payload: Record<string, unknown> } {
  if (toolName === 'delete_blog_post') {
    const parsed = deleteBlogPostSchema.parse(rawInput)
    const existing = context.posts.find((post) => post.id === parsed.post_id)
    if (!existing) throw new Error('לא נמצא פוסט עם המזהה הזה')
    return {
      payload: parsed,
      preview: {
        actionType: 'delete_blog_post',
        title: 'מחיקת פוסט בלוג',
        fields: [field('_delete_post', existing.title, '(יימחק)')],
      },
    }
  }

  if (toolName === 'delete_faq_item') {
    const parsed = deleteFaqItemSchema.parse(rawInput)
    const existing = context.faqItems.find((item) => item.question === parsed.question)
    if (!existing) throw new Error('לא נמצא פריט שאלות ותשובות עם השאלה הזו')
    return {
      payload: parsed,
      preview: {
        actionType: 'delete_faq_item',
        title: 'מחיקת שאלה ותשובה',
        fields: [field('_delete_faq_item', existing.question, '(יימחק)')],
      },
    }
  }

  if (toolName === 'delete_testimonial') {
    const parsed = deleteTestimonialSchema.parse(rawInput)
    const existing = context.testimonials.find((t) => t.id === parsed.testimonial_id)
    if (!existing) throw new Error('לא נמצאה המלצה עם המזהה הזה')
    return {
      payload: parsed,
      preview: {
        actionType: 'delete_testimonial',
        title: 'מחיקת המלצה',
        fields: [field('_delete_testimonial', existing.title, '(תימחק)')],
      },
    }
  }

  throw new Error(`כלי לא מוכר: ${toolName}`)
}
