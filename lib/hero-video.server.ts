import 'server-only'

import { createFile, type Movie } from 'mp4box'
import {
  HERO_VIDEO_ERRORS,
  buildHeroVideoMetadata,
  hasMp4FileSignature,
  type HeroVideoMetadata,
} from '@/lib/hero-video-constraints'

export async function inspectHeroVideo(bytes: Uint8Array): Promise<HeroVideoMetadata> {
  if (!hasMp4FileSignature(bytes)) {
    throw new Error(HERO_VIDEO_ERRORS.format)
  }

  const info = await new Promise<Movie>((resolve, reject) => {
    const parser = createFile()
    parser.onReady = resolve
    parser.onError = () => reject(new Error(HERO_VIDEO_ERRORS.format))

    const input = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer & { fileStart: number }
    input.fileStart = 0

    try {
      parser.appendBuffer(input)
      parser.flush()
    } catch {
      reject(new Error(HERO_VIDEO_ERRORS.format))
    }
  })

  return buildHeroVideoMetadata({
    videoTracks: info.videoTracks,
    audioTracks: info.audioTracks,
  })
}
