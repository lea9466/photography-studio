import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { isR2Configured } from '@/lib/r2/config'
import {
  deleteMediaObject,
  resolveMediaUrl,
  uploadMediaObject,
} from '@/lib/r2/storage'
import {
  HERO_VIDEO_ERRORS,
  HERO_VIDEO_MAX_BYTES,
  isOwnedHeroVideoPath,
  validateHeroVideoBasics,
} from '@/lib/hero-video-constraints'
import { inspectHeroVideo } from '@/lib/hero-video.server'

export const runtime = 'nodejs'

const RATE_LIMIT_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function checkUploadRateLimit(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('admin_rate_limit_check', {
      p_key: `hero-video-upload:user:${userId}`,
      p_max_attempts: RATE_LIMIT_ATTEMPTS,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    })
    .maybeSingle()

  if (error) {
    console.error('[hero-video] rate limit failed closed:', error.message)
    throw new Error('לא הצלחנו להתחיל את ההעלאה. נסי שוב בעוד כמה דקות.')
  }
  return data?.allowed === true
}

export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) return jsonError('אחסון הסרטונים לא מוגדר', 503)

    const { userId } = await requireDashboardContext()
    if (!(await checkUploadRateLimit(userId))) {
      return jsonError('בוצעו יותר מדי ניסיונות העלאה. נסי שוב בעוד כמה דקות.', 429)
    }

    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > HERO_VIDEO_MAX_BYTES + 1024 * 1024) {
      return jsonError(HERO_VIDEO_ERRORS.size, 413)
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return jsonError('לא נבחר סרטון', 400)

    validateHeroVideoBasics(file)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const metadata = await inspectHeroVideo(bytes)

    const admin = createAdminClient()
    const { data: current, error: readError } = await admin
      .from('users')
      .select('hero_video_url')
      .eq('id', userId)
      .single()
    if (readError) throw readError

    const oldPath = (current as { hero_video_url: string | null }).hero_video_url
    const newPath = `${userId}/hero-video/${randomUUID()}.mp4`

    await uploadMediaObject('branding', newPath, bytes, 'video/mp4')

    const { data: updated, error: updateError } = await admin
      .from('users')
      .update({ hero_video_url: newPath })
      .eq('id', userId)
      .select('id')
      .maybeSingle()

    if (updateError || !updated) {
      await deleteMediaObject('branding', newPath).catch((cleanupError) => {
        console.error('[hero-video] failed to roll back new upload:', cleanupError)
      })
      throw updateError ?? new Error('שמירת הסרטון נכשלה')
    }

    if (isOwnedHeroVideoPath(userId, oldPath) && oldPath !== newPath) {
      await deleteMediaObject('branding', oldPath!).catch((deleteError) => {
        console.error('[hero-video] old video cleanup failed:', deleteError)
      })
    }

    const url = await resolveMediaUrl('branding', newPath)
    return NextResponse.json({ path: newPath, url, metadata })
  } catch (error) {
    const message = error instanceof Error ? error.message : HERO_VIDEO_ERRORS.upload
    const knownValidationError = Object.values(HERO_VIDEO_ERRORS).includes(
      message as (typeof HERO_VIDEO_ERRORS)[keyof typeof HERO_VIDEO_ERRORS]
    )
    console.error('[hero-video] upload failed:', error)
    return jsonError(knownValidationError ? message : HERO_VIDEO_ERRORS.upload, 400)
  }
}

export async function DELETE() {
  try {
    const { userId } = await requireDashboardContext()
    const admin = createAdminClient()
    const { data: current, error: readError } = await admin
      .from('users')
      .select('hero_video_url')
      .eq('id', userId)
      .single()
    if (readError) throw readError

    const oldPath = (current as { hero_video_url: string | null }).hero_video_url
    if (oldPath && !isOwnedHeroVideoPath(userId, oldPath)) {
      return jsonError('נתיב הסרטון השמור אינו תקין', 400)
    }

    const { data: updated, error: updateError } = await admin
      .from('users')
      .update({ hero_video_url: null, hero_type: 'images' })
      .eq('id', userId)
      .select('id')
      .maybeSingle()
    if (updateError || !updated) throw updateError ?? new Error('הסרת הסרטון נכשלה')

    if (oldPath) {
      await deleteMediaObject('branding', oldPath)
    }

    return NextResponse.json({ success: true, heroType: 'images' })
  } catch (error) {
    console.error('[hero-video] removal failed:', error)
    return jsonError('לא הצלחנו להסיר את הסרטון. נסי שוב.', 500)
  }
}
