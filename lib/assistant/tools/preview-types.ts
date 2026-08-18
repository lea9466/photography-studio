import type { AssistantActionType } from '@/lib/validations/dashboard-assistant'

export type AssistantPreviewField = {
  key: string
  label: string
  before: string
  after: string
  /** Optional display URL for image-valued fields (e.g. set_hero_image). */
  imageUrl?: string
}

export type AssistantPreview = {
  actionType: AssistantActionType
  title: string
  fields: AssistantPreviewField[]
}
