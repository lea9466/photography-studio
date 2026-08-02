export const HERO_VIDEO_MAX_BYTES = 15 * 1024 * 1024
export const HERO_VIDEO_MAX_DURATION_SECONDS = 12
export const HERO_VIDEO_MAX_WIDTH = 1920
export const HERO_VIDEO_MAX_HEIGHT = 1080
export const HERO_VIDEO_MIME_TYPE = 'video/mp4'

export const HERO_VIDEO_ERRORS = {
  format: 'אפשר להעלות סרטון MP4 בלבד.',
  size: 'הסרטון גדול מדי. המשקל המקסימלי הוא 15MB.',
  duration: 'הסרטון ארוך מדי. האורך המקסימלי הוא 12 שניות.',
  resolution: 'הרזולוציה גבוהה מדי. ניתן להעלות עד 1920×1080.',
  codec: 'הסרטון אינו בפורמט נתמך. מומלץ לייצא כ־MP4 בקידוד H.264.',
  upload: 'לא הצלחנו להעלות את הסרטון. נסי שוב.',
} as const

export type HeroVideoMetadata = {
  duration: number
  width: number
  height: number
  codec: string
  hasAudio: boolean
  audioCodec: string | null
}

type ParsedVideoTrack = {
  duration: number
  timescale: number
  codec: string
  track_width: number
  track_height: number
  video?: { width: number; height: number }
}

type ParsedAudioTrack = {
  codec: string
}

export function buildHeroVideoMetadata(input: {
  videoTracks: ParsedVideoTrack[]
  audioTracks: ParsedAudioTrack[]
}): HeroVideoMetadata {
  const videoTrack = input.videoTracks[0]
  if (!videoTrack) {
    throw new Error(HERO_VIDEO_ERRORS.codec)
  }

  const audioTrack = input.audioTracks[0]
  const metadata: HeroVideoMetadata = {
    duration: videoTrack.duration / videoTrack.timescale,
    width: videoTrack.video?.width ?? videoTrack.track_width,
    height: videoTrack.video?.height ?? videoTrack.track_height,
    codec: videoTrack.codec,
    hasAudio: Boolean(audioTrack),
    audioCodec: audioTrack?.codec ?? null,
  }

  validateHeroVideoMetadata(metadata)
  return metadata
}

export function hasSafeMp4FileName(name: string) {
  const trimmed = name.trim()
  if (!/^[^./\\]+\.mp4$/i.test(trimmed)) return false
  return !trimmed.includes('..') && !trimmed.includes('/') && !trimmed.includes('\\')
}

export function isOwnedHeroVideoPath(userId: string, path: string | null | undefined) {
  if (!path || !userId) return false
  return (
    path.startsWith(`${userId}/hero-video/`) &&
    path.endsWith('.mp4') &&
    !path.includes('..') &&
    !path.includes('\\') &&
    !/^https?:\/\//i.test(path)
  )
}

export function hasMp4FileSignature(bytes: Uint8Array) {
  if (bytes.byteLength < 12) return false
  const boxSize =
    bytes[0] * 2 ** 24 + bytes[1] * 2 ** 16 + bytes[2] * 2 ** 8 + bytes[3]
  const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7])
  return boxType === 'ftyp' && boxSize >= 12
}

export function validateHeroVideoBasics(file: {
  name: string
  type: string
  size: number
}) {
  if (file.type !== HERO_VIDEO_MIME_TYPE || !hasSafeMp4FileName(file.name)) {
    throw new Error(HERO_VIDEO_ERRORS.format)
  }
  if (file.size > HERO_VIDEO_MAX_BYTES) {
    throw new Error(HERO_VIDEO_ERRORS.size)
  }
}

export function validateHeroVideoMetadata(metadata: HeroVideoMetadata) {
  if (
    !Number.isFinite(metadata.duration) ||
    metadata.duration <= 0 ||
    metadata.duration > HERO_VIDEO_MAX_DURATION_SECONDS
  ) {
    throw new Error(HERO_VIDEO_ERRORS.duration)
  }
  if (
    !Number.isFinite(metadata.width) ||
    !Number.isFinite(metadata.height) ||
    metadata.width <= 0 ||
    metadata.height <= 0 ||
    metadata.width > HERO_VIDEO_MAX_WIDTH ||
    metadata.height > HERO_VIDEO_MAX_HEIGHT
  ) {
    throw new Error(HERO_VIDEO_ERRORS.resolution)
  }
  if (!/^avc[13](?:\.|$)/i.test(metadata.codec)) {
    throw new Error(HERO_VIDEO_ERRORS.codec)
  }
}
