import { NextResponse } from 'next/server'

import {
  canUseImpersonation,
  IMPERSONATION_COOKIE,
  impersonationCookieOptions,
  isValidImpersonationUserId,
} from '@/lib/auth/impersonation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type ImpersonateBody = {
  userId?: string | null
}

export async function POST(request: Request) {
  const allowed = await canUseImpersonation()
  if (!allowed) {
    return NextResponse.json({ error: 'אין הרשאת ניהול' }, { status: 403 })
  }

  let body: ImpersonateBody = {}
  try {
    body = (await request.json()) as ImpersonateBody
  } catch {
    body = {}
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''

  if (!userId) {
    const response = NextResponse.json({ success: true, impersonating: false })
    response.cookies.set(IMPERSONATION_COOKIE, '', {
      ...impersonationCookieOptions(0),
      maxAge: 0,
    })
    return response
  }

  if (!isValidImpersonationUserId(userId)) {
    return NextResponse.json({ error: 'מזהה משתמש לא תקין' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data: targetUser, error } = await adminClient
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'שגיאה בבדיקת המשתמש' }, { status: 500 })
  }

  if (!targetUser) {
    return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id === userId) {
    const response = NextResponse.json({
      success: true,
      impersonating: false,
      message: 'כבר מחוברים כמשתמש זה',
    })
    response.cookies.set(IMPERSONATION_COOKIE, '', {
      ...impersonationCookieOptions(0),
      maxAge: 0,
    })
    return response
  }

  const response = NextResponse.json({
    success: true,
    impersonating: true,
    userId,
  })
  response.cookies.set(
    IMPERSONATION_COOKIE,
    userId,
    impersonationCookieOptions()
  )
  return response
}
