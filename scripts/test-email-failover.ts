import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { EmailSendError, type EmailProvider } from '../lib/email/provider.ts'
import type { EmailMessage, EmailSendResult } from '../lib/email/types.ts'
import {
  FailoverEmailProvider,
  _resetFailoverCooldowns,
} from '../lib/email/failover-email-provider.ts'
import { ResendProvider } from '../lib/email/providers/resend/resend-provider.ts'
import { MailjetProvider } from '../lib/email/providers/mailjet/mailjet-provider.ts'
import { createEmailProvider } from '../lib/email/provider-factory.ts'

const MESSAGE: EmailMessage = {
  from: 'Studio <no-reply@studio-galleries.com>',
  to: 'client@example.com',
  subject: 's',
  html: '<p>x</p>',
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Scriptable fake provider: each send() runs the next queued outcome. */
class FakeProvider implements EmailProvider {
  calls = 0
  private queue: Array<() => EmailSendResult>
  constructor(
    readonly name: string,
    outcomes: Array<'ok' | EmailSendError>
  ) {
    this.queue = outcomes.map((o) => () => {
      if (o === 'ok') return { id: `${name}-ok` }
      throw o
    })
  }
  async send(): Promise<EmailSendResult> {
    this.calls++
    const next = this.queue.shift()
    if (!next) throw new Error(`${this.name}: no more scripted outcomes`)
    return next()
  }
}

const quota = () =>
  new EmailSendError('quota', { failover: true, quotaExceeded: true })
const transient = () => new EmailSendError('5xx', { failover: true })
const fatal = () => new EmailSendError('bad recipient', { failover: false })

describe('FailoverEmailProvider', () => {
  beforeEach(() => _resetFailoverCooldowns())

  it('rolls over to the fallback when the primary reports quota exceeded', async () => {
    const primary = new FakeProvider('resend', [quota()])
    const fallback = new FakeProvider('mailjet', ['ok'])
    const fo = new FailoverEmailProvider([primary, fallback])

    const result = await fo.send(MESSAGE)
    assert.equal(result.id, 'mailjet-ok')
    assert.equal(primary.calls, 1)
    assert.equal(fallback.calls, 1)
  })

  it('a quota failure parks the primary — the next send skips straight to the fallback', async () => {
    const primary = new FakeProvider('resend', [quota()]) // only one outcome: must not be called twice
    const fallback = new FakeProvider('mailjet', ['ok', 'ok'])

    const fo = new FailoverEmailProvider([primary, fallback])
    await fo.send(MESSAGE)
    // Fresh instance, but the cooldown registry is process-global:
    const fo2 = new FailoverEmailProvider([primary, fallback])
    const result = await fo2.send(MESSAGE)

    assert.equal(result.id, 'mailjet-ok')
    assert.equal(primary.calls, 1, 'primary stays parked')
    assert.equal(fallback.calls, 2)
  })

  it('re-probes the primary after the cooldown elapses', async () => {
    const primary = new FakeProvider('resend', [quota(), 'ok'])
    const fallback = new FakeProvider('mailjet', ['ok'])
    const fo = new FailoverEmailProvider([primary, fallback], { cooldownMs: 20 })

    await fo.send(MESSAGE) // primary quota → fallback
    await sleep(30)
    const result = await fo.send(MESSAGE) // cooldown expired → primary again

    assert.equal(result.id, 'resend-ok')
    assert.equal(primary.calls, 2)
    assert.equal(fallback.calls, 1)
  })

  it('a successful send clears an earlier cooldown', async () => {
    const primary = new FakeProvider('resend', [quota(), 'ok', 'ok'])
    const fallback = new FakeProvider('mailjet', ['ok'])
    const fo = new FailoverEmailProvider([primary, fallback], { cooldownMs: 15 })

    await fo.send(MESSAGE) // → fallback, primary parked
    await sleep(20)
    await fo.send(MESSAGE) // primary recovers, cooldown cleared
    const result = await fo.send(MESSAGE) // primary used immediately, no wait

    assert.equal(result.id, 'resend-ok')
    assert.equal(primary.calls, 3)
    assert.equal(fallback.calls, 1)
  })

  it('re-throws a non-failover error without touching the fallback', async () => {
    const primary = new FakeProvider('resend', [fatal()])
    const fallback = new FakeProvider('mailjet', ['ok'])
    const fo = new FailoverEmailProvider([primary, fallback])

    await assert.rejects(() => fo.send(MESSAGE), /bad recipient/)
    assert.equal(fallback.calls, 0)
  })

  it('transient (non-quota) failover does not park the primary', async () => {
    const primary = new FakeProvider('resend', [transient(), 'ok'])
    const fallback = new FakeProvider('mailjet', ['ok'])
    const fo = new FailoverEmailProvider([primary, fallback])

    await fo.send(MESSAGE) // transient → fallback, but no cooldown
    const result = await fo.send(MESSAGE) // primary tried again right away

    assert.equal(result.id, 'resend-ok')
    assert.equal(primary.calls, 2)
    assert.equal(fallback.calls, 1)
  })

  it('throws the last error when every provider fails', async () => {
    const primary = new FakeProvider('resend', [quota()])
    const fallback = new FakeProvider('mailjet', [transient()])
    const fo = new FailoverEmailProvider([primary, fallback])

    await assert.rejects(() => fo.send(MESSAGE), /5xx/)
  })
})

describe('adapter error tagging', () => {
  it('ResendProvider tags daily_quota_exceeded as failover + quotaExceeded', async () => {
    const provider = new ResendProvider('re_x')
    ;(provider as unknown as { client: unknown }).client = {
      emails: {
        send: async () => ({
          data: null,
          error: { name: 'daily_quota_exceeded', message: 'over', statusCode: 429 },
        }),
      },
    }
    await assert.rejects(
      () => provider.send(MESSAGE),
      (err: unknown) => {
        assert.ok(err instanceof EmailSendError)
        assert.equal(err.failover, true)
        assert.equal(err.quotaExceeded, true)
        return true
      }
    )
  })

  it('ResendProvider leaves a validation error non-failover', async () => {
    const provider = new ResendProvider('re_x')
    ;(provider as unknown as { client: unknown }).client = {
      emails: {
        send: async () => ({
          data: null,
          error: { name: 'validation_error', message: 'bad from', statusCode: 422 },
        }),
      },
    }
    await assert.rejects(
      () => provider.send(MESSAGE),
      (err: unknown) => {
        assert.ok(err instanceof EmailSendError)
        assert.equal(err.failover, false)
        return true
      }
    )
  })

  it('MailjetProvider tags HTTP 429 as failover + quotaExceeded', async () => {
    const realFetch = globalThis.fetch
    globalThis.fetch = (async () => ({
      ok: false,
      status: 429,
      json: async () => ({ ErrorMessage: 'rate limited' }),
    })) as unknown as typeof fetch
    try {
      const provider = new MailjetProvider('k', 's')
      await assert.rejects(
        () => provider.send(MESSAGE),
        (err: unknown) => {
          assert.ok(err instanceof EmailSendError)
          assert.equal(err.failover, true)
          assert.equal(err.quotaExceeded, true)
          return true
        }
      )
    } finally {
      globalThis.fetch = realFetch
    }
  })
})

describe('createEmailProvider wiring', () => {
  const saved = { ...process.env }
  afterEach(() => {
    process.env = { ...saved }
  })

  it('no keys → null (stub path unchanged)', () => {
    delete process.env.RESEND_API_KEY
    delete process.env.MAILJET_API_KEY
    delete process.env.MAILJET_SECRET_KEY
    process.env.EMAIL_FALLBACK_PROVIDER = 'mailjet'
    assert.equal(createEmailProvider(), null)
  })

  it('primary key only, fallback unset → the bare provider (no wrapper)', () => {
    process.env.RESEND_API_KEY = 're_x'
    delete process.env.EMAIL_FALLBACK_PROVIDER
    const p = createEmailProvider()
    assert.equal(p?.name, 'resend')
  })

  it('both providers configured + fallback set → FailoverEmailProvider', () => {
    process.env.EMAIL_PROVIDER = 'resend'
    process.env.RESEND_API_KEY = 're_x'
    process.env.EMAIL_FALLBACK_PROVIDER = 'mailjet'
    process.env.MAILJET_API_KEY = 'k'
    process.env.MAILJET_SECRET_KEY = 's'
    const p = createEmailProvider()
    assert.equal(p?.name, 'failover')
  })

  it('fallback set but its keys missing → falls back to the single primary', () => {
    process.env.EMAIL_PROVIDER = 'resend'
    process.env.RESEND_API_KEY = 're_x'
    process.env.EMAIL_FALLBACK_PROVIDER = 'mailjet'
    delete process.env.MAILJET_API_KEY
    delete process.env.MAILJET_SECRET_KEY
    const p = createEmailProvider()
    assert.equal(p?.name, 'resend')
  })
})
