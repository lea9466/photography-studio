import type { NextRequest } from 'next/server'

export function shouldRecordDashboardVisit(request: NextRequest, pathname: string) {
  if (request.method !== 'GET') return false
  if (!pathname.startsWith('/dashboard')) return false
  if (request.headers.get('next-router-prefetch')) return false
  if (request.headers.get('purpose') === 'prefetch') return false
  return true
}
