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
