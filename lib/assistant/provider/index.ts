import type { AssistantModelProvider } from './types'
import { anthropicProvider } from './anthropic-provider'
import { geminiProvider } from './gemini-provider'

// To add another provider: create lib/assistant/provider/<name>-provider.ts
// implementing AssistantModelProvider, then register it below. Nothing in
// route.ts, the tool modules, or the chat widget needs to change — they all
// only ever talk to the AssistantModelProvider interface.
const PROVIDERS: Record<string, AssistantModelProvider> = {
  anthropic: anthropicProvider,
  gemini: geminiProvider,
}

const DEFAULT_PROVIDER_ID = 'anthropic'

export function getAssistantProvider(): AssistantModelProvider {
  const requestedId = process.env.ASSISTANT_AI_PROVIDER?.trim().toLowerCase() || DEFAULT_PROVIDER_ID
  const provider = PROVIDERS[requestedId]
  if (!provider) {
    throw new Error(`ספק AI לא מוכר: "${requestedId}". ספקים זמינים: ${Object.keys(PROVIDERS).join(', ')}`)
  }
  return provider
}

export * from './types'
