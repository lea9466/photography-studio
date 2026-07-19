import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/resend'

/**
 * Server-only profile helpers. This module is NOT a 'use server' file —
 * these functions are not client-callable Server Actions.
 */

function readOAuthDisplayName(user: User, metaName?: string) {
  if (metaName?.trim()) return metaName.trim()

  const metadata = user.user_metadata ?? {}
  if (typeof metadata.name === 'string' && metadata.name.trim()) {
    return metadata.name.trim()
  }
  if (typeof metadata.full_name === 'string' && metadata.full_name.trim()) {
    return metadata.full_name.trim()
  }

  return user.email?.split('@')[0] ?? 'User'
}

function readOAuthAvatarUrl(user: User) {
  const metadata = user.user_metadata ?? {}
  if (typeof metadata.avatar_url === 'string' && metadata.avatar_url.trim()) {
    return metadata.avatar_url.trim()
  }
  if (typeof metadata.picture === 'string' && metadata.picture.trim()) {
    return metadata.picture.trim()
  }
  return null
}

async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('יש להתחבר מחדש')
  }

  return { supabase, user }
}

/**
 * Ensures a public.users row for the currently authenticated session user.
 * Optional meta may refine name/studio at signup time; identity always comes
 * from getUser(), never from a client-supplied userId.
 */
export async function ensureUserProfile(meta?: {
  name?: string
  studio_name?: string | null
  logo_url?: string | null
}) {
  const { supabase, user } = await requireAuthenticatedUser()

  const { data: existingProfile } = await supabase
    .from('users')
    .select('id, email, name, logo_url')
    .eq('id', user.id)
    .maybeSingle()

  const existing = existingProfile as {
    id: string
    email: string | null
    name: string | null
    logo_url: string | null
  } | null

  const name = readOAuthDisplayName(user, meta?.name)
  const studioName =
    meta?.studio_name ??
    (typeof user.user_metadata?.studio_name === 'string'
      ? user.user_metadata.studio_name
      : null)
  const logoUrl = meta?.logo_url ?? readOAuthAvatarUrl(user)

  if (existing) {
    const updates: {
      email?: string | null
      name?: string
      logo_url?: string | null
    } = {}

    if (user.email && !existing.email) updates.email = user.email
    if (name && !existing.name) updates.name = name
    if (logoUrl && !existing.logo_url) updates.logo_url = logoUrl

    if (Object.keys(updates).length === 0) return

    const { error } = await supabase
      .from('users')
      .update(updates as never)
      .eq('id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    name,
    studio_name: studioName,
    logo_url: logoUrl,
    show_welcome_popup: true,
  } as never)

  if (error) {
    if (error.message.includes('does not exist')) {
      throw new Error(
        'טבלאות המערכת לא קיימות — הריצי את קבצי ה-migration ב-Supabase SQL Editor'
      )
    }
    throw new Error(error.message)
  }
}

/**
 * Sends welcome email for the current authenticated user only.
 * Auth metadata updates always target getUser().id.
 */
export async function maybeSendWelcomeEmailForCurrentUser(displayName?: string) {
  const { user } = await requireAuthenticatedUser()

  const metadata = user.user_metadata ?? {}
  if (metadata.welcome_email_sent === true) return

  const email = user.email?.trim()
  if (!email) return

  const name = displayName?.trim() || readOAuthDisplayName(user)

  try {
    await sendWelcomeEmail({ name, email })
  } catch (emailError) {
    console.error('[maybeSendWelcomeEmailForCurrentUser] send failed', {
      userId: user.id,
      message: emailError instanceof Error ? emailError.message : 'unknown',
    })
    return
  }

  try {
    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...metadata, welcome_email_sent: true },
    })
  } catch (metadataError) {
    console.error('[maybeSendWelcomeEmailForCurrentUser] metadata update failed', {
      userId: user.id,
      message: metadataError instanceof Error ? metadataError.message : 'unknown',
    })
  }
}
