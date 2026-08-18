import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, Tool } from '@anthropic-ai/sdk/resources/messages'
import type {
  AssistantModelProvider,
  AssistantChatRequest,
  AssistantStreamEvent,
  AssistantContentBlock,
  AssistantStopReason,
} from './types'

const MODEL_ID = process.env.ASSISTANT_MODEL_ID?.trim() || 'claude-opus-5'
const MAX_TOKENS = 8000

function toAnthropicMessages(messages: AssistantChatRequest['messages']): MessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content as never,
  }))
}

function toAnthropicTools(tools: AssistantChatRequest['tools']): Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema as never,
  }))
}

function mapStopReason(reason: string | null): AssistantStopReason {
  switch (reason) {
    case 'tool_use':
      return 'tool_use'
    case 'refusal':
      return 'refusal'
    case 'max_tokens':
      return 'max_tokens'
    case 'end_turn':
      return 'end_turn'
    default:
      return 'other'
  }
}

export const anthropicProvider: AssistantModelProvider = {
  id: 'anthropic',

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
  },

  async *streamChat(request: AssistantChatRequest): AsyncGenerator<AssistantStreamEvent> {
    const client = new Anthropic()

    const anthropicStream = client.messages.stream({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      system: request.system,
      tools: request.tools.length > 0 ? toAnthropicTools(request.tools) : undefined,
      output_config: { effort: 'medium' },
      messages: toAnthropicMessages(request.messages),
    })

    for await (const event of anthropicStream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text_delta', text: event.delta.text }
      }
    }

    const finalMessage = await anthropicStream.finalMessage()

    yield {
      type: 'message_end',
      stopReason: mapStopReason(finalMessage.stop_reason),
      content: finalMessage.content as unknown as AssistantContentBlock[],
    }
  },
}
