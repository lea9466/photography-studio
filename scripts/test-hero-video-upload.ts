import assert from 'node:assert/strict'
import test from 'node:test'
import { parseHeroVideoUploadRequest } from '../lib/hero-video-upload'

test('accepts a prepare payload for hero video upload', () => {
  const payload = parseHeroVideoUploadRequest({
    action: 'prepare',
    fileName: 'clip.mp4',
    contentType: 'video/mp4',
    fileSize: 4_500_000,
  })

  assert.equal(payload.action, 'prepare')
  assert.equal(payload.fileName, 'clip.mp4')
  assert.equal(payload.fileSize, 4_500_000)
})

test('rejects finalize payload without a storage path', () => {
  assert.throws(
    () =>
      parseHeroVideoUploadRequest({
        action: 'finalize',
        metadata: {
          duration: 5,
          width: 1280,
          height: 720,
          codec: 'avc1.4d401e',
          hasAudio: false,
          audioCodec: null,
        },
      }),
    /path/
  )
})
