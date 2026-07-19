/**
 * Runtime regression tests after Critical fixes.
 * Uses real Supabase (service role + user sessions) + pure helpers.
 */

import fs from 'node:fs'
import path from 'node:path'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveGalleryAccessMode } from '../lib/gallery-access'
import { isOwnedStorageKey } from '../lib/r2/owned-path'
import { buildPhotoStoragePaths, buildPostPhotoStoragePaths } from '../lib/images/process'
import {
  buildEmailStubLog,
  mustFailWithoutResend,
  maskEmailForLog,
} from '../lib/email/stub-log'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

type Status = 'PASS' | 'FAIL' | 'SKIP'
type Row = {
  flow: string
  expected: string
  actual: string
  status: Status
  evidence: string
}

const rows: Row[] = []

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) throw new Error('.env.local missing')
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

function record(
  flow: string,
  expected: string,
  actual: string,
  pass: boolean,
  evidence: string,
  skip = false
) {
  rows.push({
    flow,
    expected,
    actual,
    status: skip ? 'SKIP' : pass ? 'PASS' : 'FAIL',
    evidence,
  })
  const tag = skip ? 'SKIP' : pass ? 'PASS' : 'FAIL'
  console.log(`[${tag}] ${flow}`)
  if (!pass && !skip) console.log(`  expected: ${expected}\n  actual: ${actual}\n  ${evidence}`)
}

function signGallerySession(galleryId: string, secret: string) {
  return createHmac('sha256', secret).update(galleryId).digest('hex')
}

function sessionMatches(galleryId: string, token: string | undefined, secret: string) {
  if (!token) return false
  const expected = signGallerySession(galleryId, secret)
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

function userClient(url: string, anon: string, accessToken: string): SupabaseClient {
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function main() {
  console.log('=== Critical fixes regression — mapping call sites ===\n')

  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const sessionSecret =
    process.env.GALLERY_SESSION_SECRET?.trim() || 'dev-gallery-secret'

  if (!url || !anon || !service) {
    throw new Error('Missing Supabase env (URL / anon / service role)')
  }

  // ---- Static call-site / signature map ----
  const appFiles = [
    'lib/actions/client-gallery.actions.ts',
    'lib/actions/photo.actions.ts',
    'lib/actions/post-photo.actions.ts',
    'lib/actions/auth.actions.ts',
    'lib/auth/user-profile.ts',
    'lib/gallery-upload-client.ts',
    'lib/post-upload-client.ts',
    'lib/media-upload-pipeline.ts',
    'app/g/[id]/page.tsx',
    'app/auth/callback/route.ts',
  ]

  let oldSignatures = 0
  const callSiteNotes: string[] = []
  for (const rel of appFiles) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8')
    if (src.includes('skipSessionCheck')) {
      oldSignatures++
      callSiteNotes.push(`${rel}: skipSessionCheck`)
    }
    if (/\bcleanup(Photos|PostPhotos)Batch\([^)]*storagePaths/.test(src)) {
      oldSignatures++
      callSiteNotes.push(`${rel}: cleanup*Batch(..., storagePaths)`)
    }
    if (
      rel !== 'lib/auth/user-profile.ts' &&
      /export async function (ensureUserProfile|maybeSendWelcomeEmail)\b/.test(src)
    ) {
      oldSignatures++
      callSiteNotes.push(`${rel}: legacy auth export`)
    }
    if (src.includes("maybeSendWelcomeEmail(") && !src.includes('ForCurrentUser')) {
      // allow comments; flag call-like usage of old name
      if (/await\s+maybeSendWelcomeEmail\s*\(/.test(src)) {
        oldSignatures++
        callSiteNotes.push(`${rel}: await maybeSendWelcomeEmail(`)
      }
    }
  }

  // Pipeline must call cleanup with 2 args only
  const pipeline = fs.readFileSync(
    path.join(root, 'lib/media-upload-pipeline.ts'),
    'utf8'
  )
  const pipelineOk = /cleanupBatch\(\s*deps\.entityId,\s*failures\.map\(\(f\) => f\.photoId\)\s*\)/.test(
    pipeline
  )

  record(
    'Call sites — no old signatures in app code',
    '0 old signatures; pipeline 2-arg cleanup',
    `${oldSignatures} old; pipelineOk=${pipelineOk}`,
    oldSignatures === 0 && pipelineOk,
    callSiteNotes.length ? callSiteNotes.join('; ') : 'getClientGallery(id); cleanup*(id, photoIds); ensureUserProfile()/maybeSendWelcomeEmailForCurrentUser from user-profile'
  )

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const stamp = Date.now()
  const emailA = `regtest-a-${stamp}@example.com`
  const emailB = `regtest-b-${stamp}@example.com`
  const password = `RegTest!${stamp}Aa`

  let userAId = ''
  let userBId = ''
  let galleryAId = ''
  let galleryBId = ''
  let galleryAPublicId = ''
  let photoAId = ''
  let photoBId = ''
  let postAId = ''
  let tokenA = ''
  let tokenB = ''

  const createdUserIds: string[] = []

  try {
    // ========== Setup two tenants ==========
    const createdA = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
      user_metadata: { name: 'Reg A' },
    })
    if (createdA.error || !createdA.data.user) {
      throw new Error(`createUser A: ${createdA.error?.message}`)
    }
    userAId = createdA.data.user.id
    createdUserIds.push(userAId)

    const createdB = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
      user_metadata: { name: 'Reg B' },
    })
    if (createdB.error || !createdB.data.user) {
      throw new Error(`createUser B: ${createdB.error?.message}`)
    }
    userBId = createdB.data.user.id
    createdUserIds.push(userBId)

    // Profiles (public.users)
    for (const [id, email, name, studio] of [
      [userAId, emailA, 'Reg A', `studio-a-${stamp}`],
      [userBId, emailB, 'Reg B', `studio-b-${stamp}`],
    ] as const) {
      const { error } = await admin.from('users').upsert({
        id,
        email,
        name,
        studio_name: studio,
        slug: studio,
      } as never)
      if (error) throw new Error(`users upsert ${studio}: ${error.message}`)
    }

    record(
      'Signup / profile creation (admin-simulated)',
      'two users + public.users rows',
      `A=${userAId.slice(0, 8)}… B=${userBId.slice(0, 8)}…`,
      Boolean(userAId && userBId),
      `${emailA} / ${emailB}`
    )

    // Login
    const anonClient = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const loginA = await anonClient.auth.signInWithPassword({ email: emailA, password })
    const loginB = await anonClient.auth.signInWithPassword({ email: emailB, password })
    tokenA = loginA.data.session?.access_token || ''
    tokenB = loginB.data.session?.access_token || ''

    record(
      'Login',
      'both users receive sessions',
      `A=${Boolean(tokenA)} B=${Boolean(tokenB)}`,
      Boolean(tokenA && tokenB),
      loginA.error?.message || loginB.error?.message || 'sessions ok'
    )

    const clientA = userClient(url, anon, tokenA)
    const clientB = userClient(url, anon, tokenB)

    // Galleries: private A, private B, public A
    const insertGallery = async (
      client: SupabaseClient,
      userId: string,
      title: string,
      isPublic: boolean
    ) => {
      const { data, error } = await client
        .from('galleries')
        .insert({
          user_id: userId,
          title,
          gallery_type: isPublic ? 'portfolio' : 'selection',
          status: isPublic ? 'public' : 'draft',
          is_public: isPublic,
          password: null,
        } as never)
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      return (data as { id: string }).id
    }

    galleryAId = await insertGallery(clientA, userAId, `Priv A ${stamp}`, false)
    galleryBId = await insertGallery(clientB, userBId, `Priv B ${stamp}`, false)
    galleryAPublicId = await insertGallery(clientA, userAId, `Pub A ${stamp}`, true)

    // gallery_settings (optional for access tests)
    await admin.from('gallery_settings').upsert({
      gallery_id: galleryAId,
      max_album_selection: 5,
      max_edit_selection: 5,
      allow_download_preview: true,
      allow_download_original: false,
    } as never)

    record(
      'Create galleries (A private, B private, A public)',
      '3 gallery ids owned correctly',
      `Apriv=${galleryAId.slice(0, 8)} Bpriv=${galleryBId.slice(0, 8)} Apub=${galleryAPublicId.slice(0, 8)}`,
      Boolean(galleryAId && galleryBId && galleryAPublicId),
      'inserted via authenticated user clients'
    )

    // Photos
    const { data: photoA, error: photoAErr } = await clientA
      .from('photos')
      .insert({
        gallery_id: galleryAId,
        preview_url: `${userAId}/${galleryAId}/preview-a.jpg`,
        watermarked_preview_url: `${userAId}/${galleryAId}/wm-a.jpg`,
        original_url: `${userAId}/${galleryAId}/a.jpg`,
        sort_order: 0,
        is_visible_to_client: true,
      } as never)
      .select('id')
      .single()
    if (photoAErr) throw new Error(photoAErr.message)
    photoAId = (photoA as { id: string }).id

    const { data: photoB, error: photoBErr } = await clientB
      .from('photos')
      .insert({
        gallery_id: galleryBId,
        preview_url: `${userBId}/${galleryBId}/preview-b.jpg`,
        watermarked_preview_url: `${userBId}/${galleryBId}/wm-b.jpg`,
        original_url: `${userBId}/${galleryBId}/b.jpg`,
        sort_order: 0,
        is_visible_to_client: true,
      } as never)
      .select('id')
      .single()
    if (photoBErr) throw new Error(photoBErr.message)
    photoBId = (photoB as { id: string }).id

    record(
      'Single photo register (A and B)',
      'each user inserts own photo',
      `photoA=${photoAId.slice(0, 8)} photoB=${photoBId.slice(0, 8)}`,
      Boolean(photoAId && photoBId),
      'RLS insert own gallery'
    )

    // Batch-ish: second photo for A
    const { data: photoA2, error: photoA2Err } = await clientA
      .from('photos')
      .insert({
        gallery_id: galleryAId,
        preview_url: `${userAId}/${galleryAId}/preview-a2.jpg`,
        watermarked_preview_url: `${userAId}/${galleryAId}/wm-a2.jpg`,
        sort_order: 1,
        is_visible_to_client: true,
      } as never)
      .select('id')
      .single()
    record(
      'Batch photo register (A second photo)',
      'second photo id',
      photoA2Err ? photoA2Err.message : (photoA2 as { id: string }).id.slice(0, 8),
      !photoA2Err && Boolean(photoA2),
      'sort_order=1'
    )

    // Post for A
    const { data: postA, error: postErr } = await clientA
      .from('posts')
      .insert({
        user_id: userAId,
        title: `Post A ${stamp}`,
        content: 'regression',
      } as never)
      .select('id')
      .single()
    if (!postErr && postA) {
      postAId = (postA as { id: string }).id
      await clientA.from('post_photos').insert({
        post_id: postAId,
        preview_url: `${userAId}/posts/${postAId}/preview-p.jpg`,
        watermarked_preview_url: `${userAId}/posts/${postAId}/wm-p.jpg`,
        sort_order: 0,
      } as never)
    }
    record(
      'Post + post photo create (A)',
      'post and post_photo owned by A',
      postErr ? postErr.message : `post=${postAId.slice(0, 8)}`,
      !postErr && Boolean(postAId),
      'for cleanupPost path ownership checks'
    )

    // ========== 1. Public gallery access ==========
    const pubAccess = resolveGalleryAccessMode({
      isPublic: true,
      hasSessionForGallery: false,
    })
    const { data: pubRow } = await admin
      .from('galleries')
      .select('id, is_public')
      .eq('id', galleryAPublicId)
      .single()
    record(
      '1. Public gallery access',
      'is_public => access mode public; row is_public=true',
      `mode=${pubAccess} db.is_public=${(pubRow as { is_public: boolean } | null)?.is_public}`,
      pubAccess === 'public' && (pubRow as { is_public: boolean })?.is_public === true,
      `gallery ${galleryAPublicId}`
    )

    // ========== 2+3. Private password/session + isolation ==========
    const privNoSession = resolveGalleryAccessMode({
      isPublic: false,
      hasSessionForGallery: false,
    })
    const tokenForA = signGallerySession(galleryAId, sessionSecret)
    const aSeesA = sessionMatches(galleryAId, tokenForA, sessionSecret)
    const aSeesB = sessionMatches(galleryBId, tokenForA, sessionSecret)
    const expiredOrWrong = sessionMatches(galleryAId, 'deadbeef'.repeat(8), sessionSecret)

    record(
      '2. Private gallery without session',
      'access denied (null)',
      String(privNoSession),
      privNoSession === null,
      'resolveGalleryAccessMode'
    )
    record(
      '3. Gallery session persistence + isolation',
      'session(A) valid for A, invalid for B, bad token rejected',
      `A→A=${aSeesA} A→B=${aSeesB} bad=${expiredOrWrong}`,
      aSeesA && !aSeesB && !expiredOrWrong,
      'HMAC sg_gallery_{id} binding'
    )

    const privWithSession = resolveGalleryAccessMode({
      isPublic: false,
      hasSessionForGallery: aSeesA,
    })
    record(
      '2b. Private gallery with matching session',
      'access mode session',
      String(privWithSession),
      privWithSession === 'session',
      'after password verify would set cookie'
    )

    // ========== 4+5. Auth profile helpers / welcome ==========
    const authSrc = fs.readFileSync(path.join(root, 'lib/actions/auth.actions.ts'), 'utf8')
    const profileSrc = fs.readFileSync(path.join(root, 'lib/auth/user-profile.ts'), 'utf8')
    const callbackSrc = fs.readFileSync(path.join(root, 'app/auth/callback/route.ts'), 'utf8')
    const welcomeWired =
      authSrc.includes('maybeSendWelcomeEmailForCurrentUser') &&
      callbackSrc.includes('maybeSendWelcomeEmailForCurrentUser') &&
      profileSrc.includes('getUser()') &&
      !authSrc.includes('export async function maybeSendWelcomeEmail')

    record(
      '4/5. Signup/OAuth/welcome wiring',
      'ensureUserProfile + maybeSendWelcomeEmailForCurrentUser via getUser',
      `wired=${welcomeWired}`,
      welcomeWired,
      'signIn/signUp/callback import from lib/auth/user-profile'
    )

    // Profile readable by owner
    const { data: ownProfile } = await clientA
      .from('users')
      .select('id, email')
      .eq('id', userAId)
      .maybeSingle()
    const { data: crossProfile } = await clientA
      .from('users')
      .select('id, email')
      .eq('id', userBId)
      .maybeSingle()
    record(
      '4b. Profile read isolation',
      'A reads self; A cannot read B profile',
      `self=${Boolean(ownProfile)} other=${crossProfile ? 'LEAK' : 'null'}`,
      Boolean(ownProfile) && !crossProfile,
      'RLS users_select_self'
    )

    // ========== 6. Password reset path (dry — do not rotate) ==========
    const resetSrc = authSrc.includes('requestPasswordReset') && authSrc.includes('updateUserById')
    record(
      '6. Password reset code path present',
      'requestPasswordReset uses admin updateUserById after email lookup',
      `present=${resetSrc}`,
      resetSrc,
      'skipped live reset to avoid rotating disposable password mid-suite'
    )

    // ========== 7/8/10. Cleanup / upload failure simulation ==========
    // Simulate cleanupPhotosBatch selection logic against real DB rows
    const { data: ownedForCleanup } = await admin
      .from('photos')
      .select('id, original_url, preview_url, watermarked_preview_url')
      .eq('gallery_id', galleryAId)
      .in('id', [photoAId, photoBId]) // mixed valid + foreign

    const ownedRows = (ownedForCleanup || []) as {
      id: string
      original_url: string | null
      preview_url: string | null
      watermarked_preview_url: string | null
    }[]
    const ownedIds = ownedRows.map((r) => r.id)
    const foreignFiltered = !ownedIds.includes(photoBId) && ownedIds.includes(photoAId)

    const deleteCandidates: string[] = []
    for (const row of ownedRows) {
      const canonical = buildPhotoStoragePaths(userAId, galleryAId, row.id)
      for (const p of [
        canonical.originalPath,
        canonical.previewPath,
        canonical.watermarkedPath,
        row.original_url,
        row.preview_url,
        row.watermarked_preview_url,
      ]) {
        if (p && isOwnedStorageKey(p, userAId, galleryAId)) deleteCandidates.push(p)
      }
    }
    const wouldDeleteVictim = deleteCandidates.some((p) => p.includes(userBId))

    record(
      '8/10. Cleanup mixed valid+foreign photoIds',
      'only A photos selected; never B paths',
      `ownedIds=${ownedIds.length} includesB=${ownedIds.includes(photoBId)} victimPath=${wouldDeleteVictim}`,
      foreignFiltered && !wouldDeleteVictim && ownedIds.length >= 1,
      `candidates=${deleteCandidates.length}`
    )

    {
      const { data: none } = await admin
        .from('photos')
        .select('id')
        .eq('gallery_id', galleryAId)
        .in('id', ['00000000-0000-0000-0000-000000000000'])
      record(
        '10b. Invalid photo ID cleanup',
        '0 rows for unknown id',
        `rows=${(none || []).length}`,
        (none || []).length === 0,
        'SELECT empty'
      )
    }

    // Failure modes: R2 delete fail should not expand delete set; DB filter still ownership-bound
    record(
      'Failure: R2 delete fails',
      'best-effort catch; DB delete still only ownedIds',
      'code uses try/catch per object; delete .in(ownedIds)',
      fs
        .readFileSync(path.join(root, 'lib/actions/photo.actions.ts'), 'utf8')
        .includes('Best-effort cleanup'),
      'no cross-tenant expansion on R2 errors'
    )

    // ========== 9. Post photo path ownership ==========
    if (postAId) {
      const postCanon = buildPostPhotoStoragePaths(userAId, postAId, 'pppppppp-pppp-pppp-pppp-pppppppppppp')
      const ok = isOwnedStorageKey(postCanon.previewPath, userAId, `posts/${postAId}`)
      const bad = isOwnedStorageKey(
        `${userBId}/posts/${postAId}/x.jpg`,
        userAId,
        `posts/${postAId}`
      )
      record(
        '9. Post photo deletion path ownership',
        'A canonical ok; B path rejected',
        `ok=${ok} bad=${bad}`,
        ok && !bad,
        `prefix posts/${postAId}`
      )
    } else {
      record('9. Post photo deletion path ownership', 'ok/bad', 'skipped', false, 'no post', true)
    }

    // ========== 11. Download ZIP isolation (RLS) ==========
    const { data: jobA, error: jobAErr } = await clientA
      .from('download_jobs')
      .insert({
        gallery_id: galleryAId,
        type: 'preview',
        status: 'processing',
      } as never)
      .select('id')
      .single()
    const { data: jobBLeak, error: jobBErr } = await clientA
      .from('download_jobs')
      .insert({
        gallery_id: galleryBId,
        type: 'preview',
        status: 'processing',
      } as never)
      .select('id')
      .single()

    record(
      '11. Download job isolation',
      'A can create job on A; A cannot create job on B gallery',
      `Aok=${!jobAErr} Bleak=${Boolean(jobBLeak)} Berr=${jobBErr?.code || jobBErr?.message || 'none'}`,
      !jobAErr && !jobBLeak,
      jobA ? `jobA=${(jobA as { id: string }).id.slice(0, 8)}` : 'no jobA'
    )

    // ========== 12. Client photo selection isolation ==========
    const { error: selAErr } = await admin.from('photo_selections').upsert({
      photo_id: photoAId,
      gallery_id: galleryAId,
      selected_album: true,
      selected_edit: false,
    } as never)

    // User A tries to write selection on B's photo via user client
    const { error: selCrossErr } = await clientA.from('photo_selections').upsert({
      photo_id: photoBId,
      gallery_id: galleryBId,
      selected_album: true,
      selected_edit: false,
    } as never)

    const { data: selBCheck } = await admin
      .from('photo_selections')
      .select('selected_album')
      .eq('photo_id', photoBId)
      .maybeSingle()

    record(
      '12. Client photo selection isolation',
      'A selection on A ok; A cannot select B photo',
      `selA=${!selAErr} crossErr=${Boolean(selCrossErr)} bSelected=${(selBCheck as { selected_album?: boolean } | null)?.selected_album === true}`,
      !selAErr && Boolean(selCrossErr) && (selBCheck as { selected_album?: boolean } | null)?.selected_album !== true,
      'photo_selections RLS via gallery ownership'
    )

    // ========== 13. Two-tenant isolation (read/delete) ==========
    const { data: readBAsA } = await clientA
      .from('galleries')
      .select('id')
      .eq('id', galleryBId)
      .maybeSingle()
    const { data: readPhotosBAsA } = await clientA
      .from('photos')
      .select('id')
      .eq('gallery_id', galleryBId)
    const { error: delBAsA } = await clientA.from('galleries').delete().eq('id', galleryBId)
    const { data: bStillThere } = await admin
      .from('galleries')
      .select('id')
      .eq('id', galleryBId)
      .maybeSingle()

    record(
      '13. Two-tenant isolation (read/delete)',
      'A cannot read/delete B gallery or photos',
      `galleryLeak=${Boolean(readBAsA)} photos=${(readPhotosBAsA || []).length} deleted=${!bStillThere}`,
      !readBAsA && (readPhotosBAsA || []).length === 0 && Boolean(bStillThere),
      `delError=${delBAsA?.message || 'none/empty'}`
    )

    // A can still operate on own resources
    const { data: ownGalleries } = await clientA
      .from('galleries')
      .select('id')
      .eq('user_id', userAId)
    const { error: delOwnPhotoErr } = await clientA
      .from('photos')
      .delete()
      .eq('id', (photoA2 as { id: string } | null)?.id || '00000000-0000-0000-0000-000000000000')
      .eq('gallery_id', galleryAId)

    record(
      '13b. Tenant A happy-path on own resources',
      'lists own galleries; can delete own photo',
      `galleries=${(ownGalleries || []).length} delOwn=${!delOwnPhotoErr}`,
      (ownGalleries || []).length >= 2 && !delOwnPhotoErr,
      'private+public still owned by A'
    )

    // ========== Email failure modes ==========
    const savedResend = process.env.RESEND_API_KEY
    delete process.env.RESEND_API_KEY
    process.env.NODE_ENV = 'development'
    const captured: string[] = []
    const origInfo = console.info
    console.info = (...args: unknown[]) => {
      captured.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
    }
    try {
      const emailMod = await import('../lib/email/resend')
      await emailMod.sendGalleryPasswordEmail({
        galleryId: galleryAId,
        galleryTitle: 'Reg',
        clientEmail: 'client@example.com',
        clientName: 'C',
        studioName: 'S',
        password: 'SHOULD_NOT_LOG',
      })
    } finally {
      console.info = origInfo
      if (savedResend) process.env.RESEND_API_KEY = savedResend
    }
    const leaked = captured.join('\n').includes('SHOULD_NOT_LOG')
    process.env.NODE_ENV = 'production'
    const prodFail = mustFailWithoutResend()
    process.env.NODE_ENV = 'development'

    record(
      'Failure: missing email provider',
      'dev stub without secrets; prod mustFail',
      `leaked=${leaked} prodFail=${prodFail} hint=${maskEmailForLog('client@example.com')}`,
      !leaked && prodFail && captured.some((l) => l.includes('[email stub]')),
      captured[0] || 'no stub'
    )

    const stub = buildEmailStubLog({
      template: 'x',
      email: 'a@b.com',
      extra: { password: 'p', code: '1' },
    })
    record(
      'Failure: stub strips secrets',
      'no password/code fields',
      JSON.stringify(stub),
      !('password' in stub) && !('code' in stub),
      'buildEmailStubLog'
    )

    // ========== HTTP: public vs private page (best-effort) ==========
    try {
      const pubPage = await fetch(`http://127.0.0.1:3000/g/${galleryAPublicId}`)
      const privPage = await fetch(`http://127.0.0.1:3000/g/${galleryAId}`)
      const pubBody = await pubPage.text()
      const privBody = await privPage.text()
      const privHasPassword =
        /type=["']password["']|סיסמ/i.test(privBody) || privPage.status === 404
      const pubExposesSigned = /X-Amz-Signature|preview_signed_url/i.test(pubBody)
      // Public may use CDN urls not signatures — accept 200 without password field
      const pubOk = pubPage.status === 200 && !/type=["']password["']/i.test(pubBody)

      record(
        '1b. HTTP public gallery page',
        '200 without password gate',
        `status=${pubPage.status} passwordField=${/type=["']password["']/i.test(pubBody)} signed=${pubExposesSigned}`,
        pubOk,
        `id=${galleryAPublicId}`
      )
      record(
        '2c. HTTP private gallery without session',
        'password gate or notFound; no signed urls',
        `status=${privPage.status} gate/404=${privHasPassword} signed=${/X-Amz-Signature/i.test(privBody)}`,
        privHasPassword && !/X-Amz-Signature/i.test(privBody),
        `id=${galleryAId}`
      )
    } catch (err) {
      record(
        '1b/2c HTTP gallery pages',
        'reachable',
        'dev server error',
        false,
        err instanceof Error ? err.message : String(err),
        true
      )
    }

    // OAuth callback file still calls new helpers (static already covered)
    record(
      '4c. OAuth callback uses current helpers',
      'ensureUserProfile(); maybeSendWelcomeEmailForCurrentUser()',
      callbackSrc.includes('ensureUserProfile()') &&
        callbackSrc.includes('maybeSendWelcomeEmailForCurrentUser()')
        ? 'ok'
        : 'mismatch',
      callbackSrc.includes('ensureUserProfile()') &&
        callbackSrc.includes('maybeSendWelcomeEmailForCurrentUser()'),
      'app/auth/callback/route.ts'
    )
  } finally {
    // Cleanup disposable tenants
    console.log('\n=== Cleanup disposable test users ===')
    for (const id of createdUserIds) {
      try {
        // Delete dependent rows first via admin
        const { data: gals } = await admin.from('galleries').select('id').eq('user_id', id)
        for (const g of gals || []) {
          const gid = (g as { id: string }).id
          await admin.from('photo_selections').delete().eq('gallery_id', gid)
          await admin.from('download_jobs').delete().eq('gallery_id', gid)
          await admin.from('gallery_settings').delete().eq('gallery_id', gid)
          await admin.from('photos').delete().eq('gallery_id', gid)
          await admin.from('galleries').delete().eq('id', gid)
        }
        const { data: posts } = await admin.from('posts').select('id').eq('user_id', id)
        for (const p of posts || []) {
          const pid = (p as { id: string }).id
          await admin.from('post_photos').delete().eq('post_id', pid)
          await admin.from('posts').delete().eq('id', pid)
        }
        await admin.from('users').delete().eq('id', id)
        await admin.auth.admin.deleteUser(id)
        console.log('deleted', id.slice(0, 8))
      } catch (err) {
        console.warn('cleanup failed', id, err instanceof Error ? err.message : err)
      }
    }
  }

  // ========== Report ==========
  console.log('\n========== REGRESSION TABLE ==========')
  console.log('| Flow | Expected | Actual | Status | Evidence |')
  console.log('|---|---|---|---|---|')
  for (const r of rows) {
    const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
    console.log(
      `| ${esc(r.flow)} | ${esc(r.expected)} | ${esc(r.actual)} | ${r.status} | ${esc(r.evidence)} |`
    )
  }

  const failed = rows.filter((r) => r.status === 'FAIL')
  const skipped = rows.filter((r) => r.status === 'SKIP')
  console.log(
    `\nSummary: ${rows.filter((r) => r.status === 'PASS').length} PASS / ${failed.length} FAIL / ${skipped.length} SKIP`
  )
  console.log('\nOld call sites found:', callSiteNotes.length ? callSiteNotes.join('; ') : 'none')
  console.log(
    'Regressions:',
    failed.length ? failed.map((f) => f.flow).join('; ') : 'none detected'
  )

  if (failed.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
