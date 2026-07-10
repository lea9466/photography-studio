import { verifyAdminSessionTokenEdge } from '@/lib/admin/verify-session-token-edge'
import {
  IMPERSONATION_COOKIE,
  isValidImpersonationUserId,
} from '@/lib/auth/impersonation-constants'

type RequestWithCookies = {
  cookies: { get: (name: string) => { value?: string } | undefined }
}

export function getImpersonatedUserIdFromRequest(request: RequestWithCookies) {
  const value = request.cookies.get(IMPERSONATION_COOKIE)?.value?.trim()
  if (!isValidImpersonationUserId(value)) return null
  return value!
}

export async function canUseImpersonationFromRequest(
  request: RequestWithCookies
) {
  const adminSession = request.cookies.get('sg_admin_session')?.value
  if (!adminSession) return false

  return verifyAdminSessionTokenEdge(adminSession)
}
