import { VercelClient } from './client'
import { VercelError } from './errors'

export type VercelDomainVerificationChallenge = {
  type: string
  domain: string
  value: string
  reason: string
}

export type VercelDomainInfo = {
  name: string
  verified: boolean
  verification?: VercelDomainVerificationChallenge[]
}

export async function attachDomainToProject(
  hostname: string,
  client = new VercelClient()
): Promise<VercelDomainInfo> {
  return client.postJson<VercelDomainInfo>(`/v10/projects/${client.projectId}/domains`, {
    name: hostname,
  })
}

export async function getProjectDomain(
  hostname: string,
  client = new VercelClient()
): Promise<VercelDomainInfo | null> {
  try {
    return await client.get<VercelDomainInfo>(
      `/v9/projects/${client.projectId}/domains/${encodeURIComponent(hostname)}`
    )
  } catch (error) {
    if (error instanceof VercelError && error.code === 'not_found') return null
    throw error
  }
}

/**
 * Confirmed by hand (2026-08-31, a real customer domain mid-setup):
 * `GET /v9/projects/{id}/domains/{domain}`'s `verified` field stays true —
 * "no ownership conflict" — even when this endpoint reports
 * `misconfigured: true` and empty `cnames`/`aValues` for the exact same
 * hostname, i.e. NO DNS record exists for it yet. This is the real "is it
 * actually live" check `verified` can't answer — see statusFromVerification's
 * doc comment in lib/actions/custom-domain.actions.ts, which is exactly the
 * gap that produced a customer-visible false "connected" state before this
 * existed. Domain-scoped, not project-scoped — the path has no projectId.
 */
export type VercelDomainConfig = {
  misconfigured: boolean
}

export async function getDomainConfig(
  hostname: string,
  client = new VercelClient()
): Promise<VercelDomainConfig> {
  return client.get<VercelDomainConfig>(`/v6/domains/${encodeURIComponent(hostname)}/config`)
}

/** Tolerates an already-detached domain (404) — that's the desired end state. */
export async function detachDomainFromProject(
  hostname: string,
  client = new VercelClient()
): Promise<void> {
  try {
    await client.delete(`/v9/projects/${client.projectId}/domains/${encodeURIComponent(hostname)}`)
  } catch (error) {
    if (error instanceof VercelError && error.code === 'not_found') return
    throw error
  }
}
