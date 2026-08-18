// Provider-agnostic wire format for the dashboard assistant. Everything
// upstream of this file (route.ts, the tool modules, the chat widget) only
// ever speaks these shapes — never an SDK type from a specific AI vendor.
// Swapping providers means adding a new file under lib/assistant/provider/
// that implements AssistantModelProvider and registering it in
// lib/assistant/provider/index.ts; nothing else in the assistant changes.

export type AssistantTextBlock = { type: 'text'; text: string }

export type AssistantImageBlock = {
  type: 'image'
  source: { type: 'base64'; media_type: string; data: string }
}

export type AssistantToolUseBlock = { type: 'tool_use'; id: string; name: string; input: unknown }

export type AssistantToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string }

export type AssistantContentBlock =
  | AssistantTextBlock
  | AssistantImageBlock
  | AssistantToolUseBlock
  | AssistantToolResultBlock

export type AssistantMessage = {
  role: 'user' | 'assistant'
  content: string | AssistantContentBlock[]
}

export type AssistantToolDefinition = {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

// Collapsed to a small provider-agnostic set — each adapter maps its own
// vendor-specific stop/finish reason onto these.
export type AssistantStopReason = 'end_turn' | 'tool_use' | 'refusal' | 'max_tokens' | 'other'

export type AssistantStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'message_end'; stopReason: AssistantStopReason; content: AssistantContentBlock[] }

export type AssistantChatRequest = {
  system: string
  tools: AssistantToolDefinition[]
  messages: AssistantMessage[]
}

export interface AssistantModelProvider {
  readonly id: string
  /** Whether this provider's required credentials/config are present. */
  isConfigured(): boolean
  /** Streams one assistant turn. Yields text deltas, then exactly one message_end. */
  streamChat(request: AssistantChatRequest): AsyncGenerator<AssistantStreamEvent>
}

// Thrown by a provider when it fails in a way the chat route should translate
// into a friendly, Hebrew, non-technical message for the widget — instead of
// forwarding the vendor SDK's raw error text (which can be a wall of JSON).
export class AssistantProviderError extends Error {
  readonly kind: 'quota' | 'other'

  constructor(message: string, kind: 'quota' | 'other' = 'other', options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AssistantProviderError'
    this.kind = kind
  }
}
