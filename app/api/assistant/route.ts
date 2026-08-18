import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { getStudioEntitlements } from '@/lib/subscriptions/loader'
import { getAssistantStudioContext } from '@/lib/assistant/studio-context'
import { buildAssistantSystemPrompt } from '@/lib/assistant/system-prompt'
import { getAllowedAssistantTools } from '@/lib/assistant/entitled-tools'
import { ALL_ASSISTANT_TOOLS, buildPreviewForTool } from '@/lib/assistant/tools'
import { checkAssistantChatRateLimit } from '@/lib/assistant/rate-limiter'
import { isAssistantConfigured } from '@/lib/assistant/config'
import { getAssistantProvider } from '@/lib/assistant/provider'
import { AssistantProviderError } from '@/lib/assistant/provider/types'
import type { AssistantContentBlock, AssistantMessage } from '@/lib/assistant/provider/types'

export const runtime = 'nodejs'

type IncomingMessage = {
  role: 'user' | 'assistant'
  content: string | AssistantContentBlock[]
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function encodeEvent(event: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`)
}

export async function POST(request: Request) {
  if (!isAssistantConfigured()) {
    return jsonError('נועה אינה זמינה כרגע', 503)
  }

  const { userId, supabase } = await requireDashboardContext()

  const rateLimit = await checkAssistantChatRateLimit(userId)
  if (!rateLimit.allowed) {
    return jsonError('הגעת למגבלת ההודעות של העוזר לשעה זו — נסי שוב מאוחר יותר', 429)
  }

  let body: { messages?: IncomingMessage[] }
  try {
    body = await request.json()
  } catch {
    return jsonError('בקשה לא תקינה', 400)
  }

  const incomingMessages = body.messages
  if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
    return jsonError('חסרות הודעות', 400)
  }

  const entitlements = await getStudioEntitlements(userId)
  const allowedTools = new Set(getAllowedAssistantTools(entitlements))
  const tools = ALL_ASSISTANT_TOOLS.filter((tool) => allowedTools.has(tool.name as never))

  const context = await getAssistantStudioContext(userId, supabase)
  const systemPrompt = buildAssistantSystemPrompt(context)

  const messages: AssistantMessage[] = incomingMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  const provider = getAssistantProvider()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let finalContent: AssistantContentBlock[] = []
        let stopReason: string = 'other'

        for await (const event of provider.streamChat({ system: systemPrompt, tools, messages })) {
          if (event.type === 'text_delta') {
            controller.enqueue(encodeEvent({ type: 'text_delta', text: event.text }))
          } else if (event.type === 'message_end') {
            finalContent = event.content
            stopReason = event.stopReason
          }
        }

        if (stopReason === 'refusal') {
          controller.enqueue(
            encodeEvent({
              type: 'error',
              message: 'לא ניתן היה להשלים את הבקשה הזו. נסי לנסח אחרת.',
            })
          )
          controller.enqueue(encodeEvent({ type: 'message_end', stopReason, content: finalContent }))
          controller.close()
          return
        }

        for (const block of finalContent) {
          if (block.type !== 'tool_use') continue
          try {
            const { preview, payload } = buildPreviewForTool(block.name, block.input, context)
            controller.enqueue(
              encodeEvent({
                type: 'tool_preview',
                toolUseId: block.id,
                preview,
                // The already-validated, correctly-typed payload (numbers as
                // numbers, arrays as arrays) — the client submits this as-is
                // on approval. It must NOT rebuild a payload from the
                // preview's display strings (e.g. "₪500", a comma-joined
                // "includes" string): those are for showing the diff, not
                // for resubmission, and lose type information.
                payload,
              })
            )
          } catch (error) {
            controller.enqueue(
              encodeEvent({
                type: 'tool_error',
                toolUseId: block.id,
                message: error instanceof Error ? error.message : 'שגיאה בהכנת התצוגה המקדימה',
              })
            )
          }
        }

        controller.enqueue(encodeEvent({ type: 'message_end', stopReason, content: finalContent }))
        controller.close()
      } catch (error) {
        // Never forward a vendor SDK's raw error text to the widget (it can
        // be a wall of nested JSON) — log it for us, show something human.
        console.error('[assistant] streamChat failed', error)
        const message =
          error instanceof AssistantProviderError && error.kind === 'quota'
            ? 'נועה עמוסה כרגע (חריגה זמנית ממכסת השימוש) — נסי שוב בעוד כמה דקות.'
            : 'אירעה שגיאה אצל נועה. נסי שוב, ואם זה חוזר שוב אפשר לפנות לתמיכה.'
        controller.enqueue(encodeEvent({ type: 'error', message }))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
