#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  HERO_VIDEO_ERRORS,
  HERO_VIDEO_MAX_BYTES,
  buildHeroVideoMetadata,
  hasMp4FileSignature,
  hasSafeMp4FileName,
  isOwnedHeroVideoPath,
  validateHeroVideoBasics,
  validateHeroVideoMetadata,
} from '../lib/hero-video-constraints.ts'
import {
  HERO_VIDEO_INIT_SCRIPT,
  wrapHeroWithVideo,
} from '../lib/hero-slideshow.ts'
import {
  classifyHeroVideoHttpProbe,
  resolveHeroVideoAvailability,
} from '../lib/hero-video-availability.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const routeSource = await readFile(path.join(root, 'app/api/hero-video/route.ts'), 'utf8')
const deleteStudioSource = await readFile(path.join(root, 'lib/admin/delete-studio.ts'), 'utf8')
const availabilityUiSource = await readFile(
  path.join(root, 'components/dashboard/HeroVideoSettings.tsx'),
  'utf8'
)

function expectMessage(fn, message) {
  assert.throws(fn, (error) => error instanceof Error && error.message === message)
}

const ftyp = Uint8Array.from([
  0, 0, 0, 24,
  0x66, 0x74, 0x79, 0x70,
  0x69, 0x73, 0x6f, 0x6d,
])

assert.equal(hasMp4FileSignature(ftyp), true)
assert.equal(hasMp4FileSignature(new TextEncoder().encode('<html>not mp4</html>')), false)
assert.equal(hasMp4FileSignature(new TextEncoder().encode('<svg></svg>')), false)
assert.equal(hasMp4FileSignature(Uint8Array.from([0x4d, 0x5a, 0x90, 0, 0, 0, 0, 0])), false)

assert.equal(hasSafeMp4FileName('hero.mp4'), true)
assert.equal(hasSafeMp4FileName('hero.exe.mp4'), false)
assert.equal(hasSafeMp4FileName('../hero.mp4'), false)
assert.equal(hasSafeMp4FileName('https://example.com/hero.mp4'), false)

expectMessage(
  () => validateHeroVideoBasics({ name: 'hero.mp4', type: 'text/html', size: 10 }),
  HERO_VIDEO_ERRORS.format
)
expectMessage(
  () =>
    validateHeroVideoBasics({
      name: 'hero.mp4',
      type: 'video/mp4',
      size: HERO_VIDEO_MAX_BYTES + 1,
    }),
  HERO_VIDEO_ERRORS.size
)
expectMessage(
  () => validateHeroVideoMetadata({ duration: 12.01, width: 1920, height: 1080, codec: 'avc1' }),
  HERO_VIDEO_ERRORS.duration
)
expectMessage(
  () => validateHeroVideoMetadata({ duration: 8, width: 1921, height: 1080, codec: 'avc1' }),
  HERO_VIDEO_ERRORS.resolution
)
expectMessage(
  () => validateHeroVideoMetadata({ duration: 8, width: 1920, height: 1080, codec: 'hev1' }),
  HERO_VIDEO_ERRORS.codec
)

assert.equal(
  classifyHeroVideoHttpProbe({ status: 206, contentType: 'video/mp4' }),
  'available'
)
assert.equal(
  classifyHeroVideoHttpProbe({ status: 200, contentType: 'video/mp4; charset=binary' }),
  'available'
)
assert.equal(classifyHeroVideoHttpProbe({ status: 418, contentType: 'text/html' }), 'blocked')
assert.equal(classifyHeroVideoHttpProbe({ status: 403, contentType: null }), 'blocked')
assert.equal(classifyHeroVideoHttpProbe({ status: 451, contentType: null }), 'blocked')
assert.equal(classifyHeroVideoHttpProbe({ status: 200, contentType: 'text/html' }), 'blocked')
assert.equal(classifyHeroVideoHttpProbe({ status: 0, contentType: null }), 'unknown')

let httpProbeCalls = 0
assert.equal(
  await resolveHeroVideoAvailability({
    probeMetadata: async () => true,
    probeHttp: async () => {
      httpProbeCalls += 1
      return { status: 418, contentType: 'text/html' }
    },
  }),
  'available'
)
assert.equal(httpProbeCalls, 0, 'metadata success should not issue an HTTP probe')
assert.equal(
  await resolveHeroVideoAvailability({
    probeMetadata: async () => false,
    probeHttp: async () => ({ status: 418, contentType: 'text/html' }),
  }),
  'blocked'
)
assert.equal(
  await resolveHeroVideoAvailability({
    probeMetadata: async () => false,
    probeHttp: async () => {
      throw new TypeError('CORS')
    },
  }),
  'unknown'
)
assert.equal(
  await resolveHeroVideoAvailability({
    probeMetadata: async () => false,
    probeHttp: async () => {
      throw new Error('network')
    },
  }),
  'unknown'
)

const h264WithAudio = buildHeroVideoMetadata({
  videoTracks: [
    {
      duration: 8000,
      timescale: 1000,
      codec: 'avc1.640028',
      track_width: 1920,
      track_height: 1080,
      video: { width: 1920, height: 1080 },
    },
  ],
  audioTracks: [{ codec: 'mp4a.40.2' }],
})
assert.equal(h264WithAudio.codec, 'avc1.640028')
assert.equal(h264WithAudio.hasAudio, true)
assert.equal(h264WithAudio.audioCodec, 'mp4a.40.2')
expectMessage(
  () => buildHeroVideoMetadata({ videoTracks: [], audioTracks: [{ codec: 'mp4a.40.2' }] }),
  HERO_VIDEO_ERRORS.codec
)

assert.equal(isOwnedHeroVideoPath('user-a', 'user-a/hero-video/id.mp4'), true)
assert.equal(isOwnedHeroVideoPath('user-a', 'user-b/hero-video/id.mp4'), false)
assert.equal(isOwnedHeroVideoPath('user-a', 'user-a/hero-video/../id.mp4'), false)
assert.equal(isOwnedHeroVideoPath('user-a', 'https://cdn.test/user-a/hero-video/id.mp4'), false)

assert.equal(routeSource.includes("formData.get('userId')"), false)
// Verify each flow's security invariant separately
// Flow 1: finalize (presigned URL) - lines 77-109
//   No uploadMediaObject here (client uploads directly to R2)
//   DB update at line 92 happens after client already uploaded
const finalizeFlow = routeSource.substring(
  routeSource.indexOf("if (parsed?.action === 'finalize')"),
  routeSource.indexOf("const formData = await request.formData()")
)
assert.ok(finalizeFlow.includes(".update({ hero_video_url: newPath })"), 'finalize flow has DB update')
assert.ok(!finalizeFlow.includes("uploadMediaObject"), 'finalize flow does NOT upload directly (client uses presigned URL)')

// Flow 2: direct upload - lines 111-153
//   uploadMediaObject at line 130, then DB update at line 134
const directFlow = routeSource.substring(
  routeSource.indexOf("const formData = await request.formData()"),
  routeSource.indexOf("export async function DELETE()")
)
const directUploadIndex = directFlow.indexOf("uploadMediaObject('branding', newPath")
const directDbUpdateIndex = directFlow.indexOf(".update({ hero_video_url: newPath })")
const directRollbackIndex = directFlow.indexOf("deleteMediaObject('branding', newPath)")
const directOldDeleteIndex = directFlow.indexOf("deleteMediaObject('branding', oldPath!)")

assert.ok(directUploadIndex >= 0 && directDbUpdateIndex > directUploadIndex, 'direct flow: DB update only after upload')
assert.ok(directRollbackIndex > directDbUpdateIndex, 'direct flow: new upload deleted on DB failure')
assert.ok(directOldDeleteIndex > directRollbackIndex, 'direct flow: old video deleted last')

const unchangedFallback = '<div data-hero-slideshow>images</div>'
assert.equal(
  wrapHeroWithVideo({ fallbackHtml: unchangedFallback, videoUrl: null }),
  unchangedFallback,
  'image mode HTML must remain unchanged'
)
const videoHtml = wrapHeroWithVideo({
  fallbackHtml: unchangedFallback,
  videoUrl: 'https://cdn.test/video.mp4',
})
assert.match(videoHtml, /autoplay muted loop playsinline preload="metadata"/)
assert.match(videoHtml, /aria-hidden="true" tabindex="-1"/)
assert.doesNotMatch(videoHtml, /\scontrols(?:\s|>)/)
assert.ok(
  HERO_VIDEO_INIT_SCRIPT.indexOf('await video.play()') <
    HERO_VIDEO_INIT_SCRIPT.indexOf("classList.add('is-video-ready')"),
  'poster must remain visible until play succeeds'
)
assert.match(HERO_VIDEO_INIT_SCRIPT, /hero-video-fallback/)
assert.match(deleteStudioSource, /profile\.hero_video_url/, 'studio deletion must clean Hero video')
assert.match(availabilityUiSource, /Range: 'bytes=0-1023'/)
assert.match(availabilityUiSource, /resolveHeroVideoAvailability/)
assert.match(availabilityUiSource, /נוסח הפנייה הועתק/)
assert.match(availabilityUiSource, /הבדיקה מתייחסת לרשת ולחברת הסינון/)
assert.doesNotMatch(availabilityUiSource, /fetch\(['"]\/api\/.*url=/)

console.log('Hero video security checks passed')
