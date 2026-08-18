import { z } from 'zod'
import { THEME_IDS } from '@/lib/dashboard/site-settings-help'

export const ASSISTANT_ABOUT_FIELDS = [
  'about_title',
  'about_subtitle',
  'about_description',
  'about_text',
] as const

export const ASSISTANT_CONTACT_FIELDS = [
  'phone',
  'email',
  'contact_title',
  'contact_subtitle',
] as const

const optionalTrimmedText = (max: number, message: string) => z.string().trim().max(max, message).optional()

export const updateAboutSectionSchema = z
  .object({
    about_title: optionalTrimmedText(120, 'כותרת האודות יכולה להכיל עד 120 תווים'),
    about_subtitle: optionalTrimmedText(160, 'כותרת המשנה יכולה להכיל עד 160 תווים'),
    about_description: optionalTrimmedText(2000, 'תיאור האודות יכול להכיל עד 2000 תווים'),
    about_text: optionalTrimmedText(400, 'הטקסט באזור ההירו יכול להכיל עד 400 תווים'),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'יש למלא לפחות שדה אחד',
  })

export type UpdateAboutSectionInput = z.infer<typeof updateAboutSectionSchema>

export const updateContactFormSchema = z
  .object({
    phone: optionalTrimmedText(40, 'מספר הטלפון ארוך מדי'),
    email: z.union([z.literal(''), z.string().trim().max(200).email('כתובת אימייל לא תקינה')]).optional(),
    contact_title: optionalTrimmedText(120, 'כותרת יצירת הקשר יכולה להכיל עד 120 תווים'),
    contact_subtitle: optionalTrimmedText(300, 'תת-הכותרת יכולה להכיל עד 300 תווים'),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'יש למלא לפחות שדה אחד',
  })

export type UpdateContactFormInput = z.infer<typeof updateContactFormSchema>

const packageIncludesSchema = z
  .array(z.string().trim().max(200, 'פריט ארוך מדי'))
  .min(1, 'יש להוסיף לפחות פריט אחד ל"מה כלול"')
  .max(20, 'יותר מדי פריטים')

export const createPackageSchema = z.object({
  name: z.string().trim().min(1, 'שם החבילה הוא שדה חובה').max(80, 'שם החבילה ארוך מדי'),
  price_amount: z.coerce.number().positive('יש להזין מחיר תקין'),
  duration_text: optionalTrimmedText(60, 'משך הזמן ארוך מדי'),
  includes: packageIncludesSchema,
})

export type CreatePackageInput = z.infer<typeof createPackageSchema>

export const updatePackageSchema = z
  .object({
    package_id: z.string().uuid('מזהה חבילה לא תקין'),
    name: z.string().trim().min(1).max(80, 'שם החבילה ארוך מדי').optional(),
    price_amount: z.coerce.number().positive('יש להזין מחיר תקין').optional(),
    duration_text: optionalTrimmedText(60, 'משך הזמן ארוך מדי'),
    includes: packageIncludesSchema.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.price_amount !== undefined ||
      data.duration_text !== undefined ||
      data.includes !== undefined,
    { message: 'יש למלא לפחות שדה אחד לעדכון' }
  )

export type UpdatePackageInput = z.infer<typeof updatePackageSchema>

export const deletePackageSchema = z.object({
  package_id: z.string().uuid('מזהה חבילה לא תקין'),
})

export type DeletePackageInput = z.infer<typeof deletePackageSchema>

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(1, 'כותרת נדרשת').max(150, 'הכותרת ארוכה מדי'),
  subtitle: optionalTrimmedText(200, 'כותרת המשנה ארוכה מדי'),
  content: z.string().trim().min(20, 'תוכן הפוסט קצר מדי').max(20000, 'תוכן הפוסט ארוך מדי'),
})

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>

export const addFaqItemSchema = z.object({
  question: z.string().trim().min(1, 'השאלה נדרשת').max(200, 'השאלה ארוכה מדי'),
  answer: z.string().trim().min(1, 'התשובה נדרשת').max(2000, 'התשובה ארוכה מדי'),
})

export type AddFaqItemInput = z.infer<typeof addFaqItemSchema>

export const updateThemeSchema = z.object({
  selected_theme: z.enum(THEME_IDS as unknown as [string, ...string[]], {
    message: 'ערכת עיצוב לא תקינה',
  }),
})

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>

export const createTestimonialSchema = z.object({
  title: z.string().trim().min(1, 'כותרת נדרשת').max(120, 'הכותרת ארוכה מדי'),
  content: z.string().trim().min(1, 'תוכן ההמלצה נדרש').max(2000, 'תוכן ההמלצה ארוך מדי'),
  shoot_type: optionalTrimmedText(80, 'סוג הצילום ארוך מדי'),
})

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>

export const deleteBlogPostSchema = z.object({
  post_id: z.string().uuid('מזהה פוסט לא תקין'),
})

export type DeleteBlogPostInput = z.infer<typeof deleteBlogPostSchema>

export const deleteFaqItemSchema = z.object({
  question: z.string().trim().min(1, 'יש לציין את השאלה למחיקה'),
})

export type DeleteFaqItemInput = z.infer<typeof deleteFaqItemSchema>

export const deleteTestimonialSchema = z.object({
  testimonial_id: z.string().uuid('מזהה המלצה לא תקין'),
})

export type DeleteTestimonialInput = z.infer<typeof deleteTestimonialSchema>

export const updateBlogPostSchema = z
  .object({
    post_id: z.string().uuid('מזהה פוסט לא תקין'),
    title: z.string().trim().min(1, 'כותרת נדרשת').max(150, 'הכותרת ארוכה מדי').optional(),
    subtitle: optionalTrimmedText(200, 'כותרת המשנה ארוכה מדי'),
    content: z.string().trim().min(20, 'תוכן הפוסט קצר מדי').max(20000, 'תוכן הפוסט ארוך מדי').optional(),
  })
  .refine((data) => data.title !== undefined || data.subtitle !== undefined || data.content !== undefined, {
    message: 'יש למלא לפחות שדה אחד לעדכון',
  })

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>

export const updateFaqItemSchema = z
  .object({
    question: z.string().trim().min(1, 'יש לציין את השאלה המקורית לעדכון'),
    new_question: optionalTrimmedText(200, 'השאלה ארוכה מדי'),
    new_answer: optionalTrimmedText(2000, 'התשובה ארוכה מדי'),
  })
  .refine((data) => data.new_question !== undefined || data.new_answer !== undefined, {
    message: 'יש למלא לפחות שדה אחד לעדכון',
  })

export type UpdateFaqItemInput = z.infer<typeof updateFaqItemSchema>

export const updateTestimonialSchema = z
  .object({
    testimonial_id: z.string().uuid('מזהה המלצה לא תקין'),
    title: z.string().trim().min(1, 'כותרת נדרשת').max(120, 'הכותרת ארוכה מדי').optional(),
    content: z.string().trim().min(1, 'תוכן ההמלצה נדרש').max(2000, 'תוכן ההמלצה ארוך מדי').optional(),
    shoot_type: optionalTrimmedText(80, 'סוג הצילום ארוך מדי'),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined || data.shoot_type !== undefined, {
    message: 'יש למלא לפחות שדה אחד לעדכון',
  })

export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>

export const setHeroImageSchema = z.object({
  path: z.string().trim().min(1, 'נתיב הקובץ חסר'),
  // 1-based in the wire format (matches how slots are shown to the model
  // and the photographer: "סלוט 1/2/3") — converted to a 0-based array
  // index only at the point it's used against hero_desktop_urls.
  slot: z.coerce.number().int().min(1, 'סלוט לא תקין').max(3, 'סלוט לא תקין'),
})

export type SetHeroImageInput = z.infer<typeof setHeroImageSchema>

export const setSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'כתובת האתר היא שדה חובה')
    .max(60, 'כתובת האתר ארוכה מדי')
    .regex(/^[a-zA-Z0-9-]+$/, 'כתובת האתר יכולה להכיל אותיות, מספרים ומקפים בלבד'),
})

export type SetSlugInput = z.infer<typeof setSlugSchema>

export type AssistantActionType =
  | 'update_about_section'
  | 'update_contact_form'
  | 'create_package'
  | 'update_package'
  | 'delete_package'
  | 'create_blog_post'
  | 'add_faq_item'
  | 'update_theme'
  | 'create_testimonial'
  | 'delete_blog_post'
  | 'delete_faq_item'
  | 'delete_testimonial'
  | 'update_blog_post'
  | 'update_faq_item'
  | 'update_testimonial'
  | 'set_hero_image'
  | 'set_slug'

export const ASSISTANT_ACTION_TYPES: AssistantActionType[] = [
  'update_about_section',
  'update_contact_form',
  'create_package',
  'update_package',
  'delete_package',
  'create_blog_post',
  'add_faq_item',
  'update_theme',
  'create_testimonial',
  'delete_blog_post',
  'delete_faq_item',
  'delete_testimonial',
  'update_blog_post',
  'update_faq_item',
  'update_testimonial',
  'set_hero_image',
  'set_slug',
]
