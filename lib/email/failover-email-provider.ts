import { EmailSendError, type EmailProvider } from './provider'
import type { EmailMessage, EmailSendResult } from './types'

const DEFAULT_COOLDOWN_MS = 60 * 60 * 1000 // 1h

/**
 * Process-global, NOT per-instance: `createEmailProvider()` builds a fresh
 * `FailoverEmailProvider` on every send, so "provider X is out of quota" has
 * to outlive the instance. A cold start clears it — re-probing costs one
 * wasted send.  key = provider name, value = epoch-ms to skip until.
 */
const cooldownUntil = new Map<string, number>()

/** Exposed for tests. */
export function _resetFailoverCooldowns() {
  cooldownUntil.clear()
}

/**
 * Tries an ordered list of providers, moving to the next when one throws an
 * `EmailSendError` tagged `failover` (quota, rate limit, 5xx, network). A
 * `quotaExceeded` failure also parks that provider for `cooldownMs` so we
 * stop hammering it — long enough not to spam a capped provider, short
 * enough to drift back once Resend's rolling 24h window frees capacity.
 *
 * Errors that another provider can't fix (bad recipient, unverified `from`)
 * are re-thrown immediately.
 */
export class FailoverEmailProvider implements EmailProvider {
  readonly name = 'failover'
  private readonly providers: EmailProvider[]
  private readonly cooldownMs: number

  constructor(providers: EmailProvider[], opts?: { cooldownMs?: number }) {
    if (providers.length === 0) {
      throw new Error('FailoverEmailProvider needs at least one provider')
    }
    this.providers = providers
    this.cooldownMs = opts?.cooldownMs ?? DEFAULT_COOLDOWN_MS
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const now = Date.now()
    // Cooled-down providers go last, but stay in the list as a last resort.
    const ready = this.providers.filter((p) => (cooldownUntil.get(p.name) ?? 0) <= now)
    const cooling = this.providers.filter((p) => (cooldownUntil.get(p.name) ?? 0) > now)
    const ordered = [...ready, ...cooling]

    // Every failed attempt, in order. When a cooled-down provider runs last
    // (e.g. Resend parked on quota), its error is the least informative one —
    // the real cause is usually an earlier provider's — so an exhausted chain
    // throws all of them, not just the last.
    const failures: Array<{ provider: string; error: unknown }> = []
    for (let i = 0; i < ordered.length; i++) {
      const provider = ordered[i]
      const isLast = i === ordered.length - 1
      try {
        const result = await provider.send(message)
        cooldownUntil.delete(provider.name) // recovered
        return result
      } catch (error) {
        failures.push({ provider: provider.name, error })
        if (error instanceof EmailSendError && error.quotaExceeded) {
          cooldownUntil.set(provider.name, Date.now() + this.cooldownMs)
        }
        const canFailover = error instanceof EmailSendError && error.failover
        const reason = error instanceof Error ? error.message : 'unknown'
        if (!canFailover) {
          console.error(`[email] ${provider.name} failed (not retryable elsewhere): ${reason}`)
          throw error
        }
        if (isLast) break
        console.warn(`[email] ${provider.name} failed over → next provider: ${reason}`)
      }
    }

    if (failures.length === 1) throw failures[0].error
    const summary = failures
      .map(({ provider, error }) => `${provider}: ${error instanceof Error ? error.message : 'unknown'}`)
      .join(' | ')
    console.error(`[email] every provider failed — ${summary}`)
    throw new EmailSendError(`all email providers failed — ${summary}`, {
      cause: failures.map((f) => f.error),
    })
  }
}
