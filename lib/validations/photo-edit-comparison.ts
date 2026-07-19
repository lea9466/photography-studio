import { z } from 'zod'

export const photoEditDisplayStyleSchema = z.enum(['development', 'reveal'])

export const photoEditComparisonFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .max(80, 'הכותרת יכולה להכיל עד 80 תווים')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .max(180, 'התיאור יכול להכיל עד 180 תווים')
    .optional()
    .or(z.literal('')),
  displayStyle: photoEditDisplayStyleSchema.default('development'),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  autoApplyWatermark: z.coerce.boolean().default(true),
  watermarkText: z
    .string()
    .trim()
    .max(80, 'טקסט סימן המים יכול להכיל עד 80 תווים')
    .optional()
    .or(z.literal('')),
})

export const createPhotoEditComparisonSchema = photoEditComparisonFieldsSchema.extend({
  id: z.string().uuid('מזהה זוג לא תקין').optional(),
  originalImageUrl: z.string().min(1, 'יש להעלות תמונה מקורית'),
  originalWatermarkedUrl: z.string().min(1, 'חסרה גרסת סימן מים לתמונה המקורית'),
  editedImageUrl: z.string().min(1, 'יש להעלות תמונה מעובדת'),
  editedWatermarkedUrl: z.string().min(1, 'חסרה גרסת סימן מים לתמונה המעובדת'),
})

export const updatePhotoEditComparisonSchema = photoEditComparisonFieldsSchema
  .partial()
  .extend({
    originalImageUrl: z.string().min(1).optional(),
    originalWatermarkedUrl: z.string().min(1).optional(),
    editedImageUrl: z.string().min(1).optional(),
    editedWatermarkedUrl: z.string().min(1).optional(),
  })

export type CreatePhotoEditComparisonInput = z.infer<typeof createPhotoEditComparisonSchema>
export type UpdatePhotoEditComparisonInput = z.infer<typeof updatePhotoEditComparisonSchema>

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : '_form'
    if (!fieldErrors[key]) fieldErrors[key] = []
    fieldErrors[key].push(issue.message)
  }
  return fieldErrors
}
