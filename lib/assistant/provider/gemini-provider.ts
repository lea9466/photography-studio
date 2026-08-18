import { randomUUID } from 'node:crypto'
import { GoogleGenAI, FinishReason } from '@google/genai'
import type { Content, Part, Tool } from '@google/genai'
import type {
  AssistantModelProvider,
  AssistantChatRequest,
  AssistantStreamEvent,
  AssistantContentBlock,
  AssistantMessage,
  AssistantStopReason,
} from './types'

const MODEL_ID = process.env.ASSISTANT_GEMINI_MODEL_ID?.trim() || 'gemini-2.5-flash'
const MAX_OUTPUT_TOKENS = 8000

// Gemini's FunctionCall.id is optional and often absent (see smoke test) —
// unlike Anthropic, which always assigns one. We generate our own so every
// tool_use block in our generic wire format still has a stable id the chat
// widget can key previews off of.
function toGeminiContents(messages: AssistantMessage[]): Content[] {
  // A tool_result block only carries tool_use_id (matching Anthropic's own
  // shape, which the client speaks regardless of provider) — Gemini's
  // FunctionResponse needs the function *name* too, so we recover it by
  // scanning the preceding assistant turns for the matching tool_use block.
  const nameByToolUseId = new Map<string, string>()
  for (const message of messages) {
    if (typeof message.content === 'string') continue
    for (const block of message.content) {
      if (block.type === 'tool_use') nameByToolUseId.set(block.id, block.name)
    }
  }

  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: toGeminiParts(message.content, nameByToolUseId),
  }))
}

function toGeminiParts(
  content: string | AssistantContentBlock[],
  nameByToolUseId: Map<string, string>
): Part[] {
  if (typeof content === 'string') return [{ text: content }]

  return content.map((block): Part => {
    switch (block.type) {
      case 'text':
        return { text: block.text }
      case 'image':
        return { inlineData: { mimeType: block.source.media_type, data: block.source.data } }
      case 'tool_use':
        return { functionCall: { id: block.id, name: block.name, args: block.input as Record<string, unknown> } }
      case 'tool_result':
        return {
          functionResponse: {
            id: block.tool_use_id,
            name: nameByToolUseId.get(block.tool_use_id) ?? block.tool_use_id,
            response: { output: block.content },
          },
        }
    }
  })
}

function toGeminiTools(tools: AssistantChatRequest['tools']): Tool[] {
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        // parametersJsonSchema accepts plain JSON Schema as-is — no need to
        // translate our {type:'object', properties, required} shape into
        // Gemini's uppercase Type enum Schema format.
        parametersJsonSchema: tool.input_schema,
      })),
    },
  ]
}

function mapFinishReason(reason: FinishReason | undefined, hasFunctionCalls: boolean): AssistantStopReason {
  if (hasFunctionCalls) return 'tool_use'
  switch (reason) {
    case FinishReason.MAX_TOKENS:
      return 'max_tokens'
    case FinishReason.SAFETY:
    case FinishReason.BLOCKLIST:
    case FinishReason.PROHIBITED_CONTENT:
    case FinishReason.SPII:
      return 'refusal'
    case FinishReason.STOP:
      return 'end_turn'
    default:
      return 'other'
  }
}

export const geminiProvider: AssistantModelProvider = {
  id: 'gemini',

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY?.trim())
  },

  async *streamChat(request: AssistantChatRequest): AsyncGenerator<AssistantStreamEvent> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const stream = await ai.models.generateContentStream({
      model: MODEL_ID,
      contents: toGeminiContents(request.messages),
      config: {
        systemInstruction: request.system,
        tools: request.tools.length > 0 ? toGeminiTools(request.tools) : undefined,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    })

    const textParts: string[] = []
    const toolUseBlocks: Extract<AssistantContentBlock, { type: 'tool_use' }>[] = []
    let finishReason: FinishReason | undefined

    for await (const chunk of stream) {
      if (chunk.text) {
        textParts.push(chunk.text)
        yield { type: 'text_delta', text: chunk.text }
      }

      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        if (part.functionCall) {
          toolUseBlocks.push({
            type: 'tool_use',
            id: part.functionCall.id || randomUUID(),
            name: part.functionCall.name ?? '',
            input: part.functionCall.args ?? {},
          })
        }
      }

      finishReason = chunk.candidates?.[0]?.finishReason ?? finishReason
    }

    const content: AssistantContentBlock[] = []
    const fullText = textParts.join('')
    if (fullText) content.push({ type: 'text', text: fullText })
    content.push(...toolUseBlocks)

    yield {
      type: 'message_end',
      stopReason: mapFinishReason(finishReason, toolUseBlocks.length > 0),
      content,
    }
  },
}
