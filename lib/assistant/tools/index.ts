import { ASSISTANT_TOOLS as ASSISTANT_CONTENT_TOOLS, buildAssistantPreview } from './content-tools'
import { ASSISTANT_STRUCTURE_TOOLS, buildStructurePreview } from './structure-tools'
import { ASSISTANT_TESTIMONIAL_TOOLS, buildTestimonialPreview } from './testimonial-tools'
import { ASSISTANT_DELETE_TOOLS, buildDeletePreview } from './delete-tools'
import { ASSISTANT_MEDIA_TOOLS, buildMediaPreview } from './media-tools'
import type { AssistantStudioContext } from '@/lib/assistant/studio-context'
import type { AssistantPreview } from './preview-types'

const CONTENT_TOOL_NAMES = new Set(ASSISTANT_CONTENT_TOOLS.map((tool) => tool.name))
const STRUCTURE_TOOL_NAMES = new Set(ASSISTANT_STRUCTURE_TOOLS.map((tool) => tool.name))
const TESTIMONIAL_TOOL_NAMES = new Set(ASSISTANT_TESTIMONIAL_TOOLS.map((tool) => tool.name))
const MEDIA_TOOL_NAMES = new Set(ASSISTANT_MEDIA_TOOLS.map((tool) => tool.name))

export const ALL_ASSISTANT_TOOLS = [
  ...ASSISTANT_CONTENT_TOOLS,
  ...ASSISTANT_STRUCTURE_TOOLS,
  ...ASSISTANT_TESTIMONIAL_TOOLS,
  ...ASSISTANT_DELETE_TOOLS,
  ...ASSISTANT_MEDIA_TOOLS,
]

export function buildPreviewForTool(
  toolName: string,
  rawInput: unknown,
  context: AssistantStudioContext
): { preview: AssistantPreview; payload: Record<string, unknown> } {
  if (CONTENT_TOOL_NAMES.has(toolName)) {
    return buildAssistantPreview(toolName, rawInput, context.profile)
  }
  if (STRUCTURE_TOOL_NAMES.has(toolName)) {
    return buildStructurePreview(toolName, rawInput, context)
  }
  if (TESTIMONIAL_TOOL_NAMES.has(toolName)) {
    return buildTestimonialPreview(toolName, rawInput)
  }
  if (MEDIA_TOOL_NAMES.has(toolName)) {
    return buildMediaPreview(toolName, rawInput, context)
  }
  return buildDeletePreview(toolName, rawInput, context)
}
