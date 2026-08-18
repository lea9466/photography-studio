import { getAssistantProvider } from './provider'

export function isAssistantConfigured(): boolean {
  try {
    return getAssistantProvider().isConfigured()
  } catch {
    return false
  }
}
