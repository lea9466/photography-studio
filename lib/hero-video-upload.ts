import { randomUUID } from 'node:crypto'
import { z } from 'zod'

const heroVideoUploadSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('prepare'),
    fileName: z.string().min(1),
    contentType: z.string().min(1),
    fileSize: z.number().int().positive(),
  }),
  z.object({
    action: z.literal('finalize'),
    path: z.string().min(1),
    metadata: z.object({
      duration: z.number(),
      width: z.number(),
      height: z.number(),
      codec: z.string(),
      hasAudio: z.boolean(),
      audioCodec: z.string().nullable(),
    }),
  }),
])

export function parseHeroVideoUploadRequest(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw new Error('בקשת העלאת הסרטון לא תקינה')
  }

  const candidate = input as { action?: unknown; path?: unknown }
  if (candidate.action === 'finalize') {
    if (typeof candidate.path !== 'string' || candidate.path.trim().length === 0) {
      throw new Error('path is required')
    }
  }

  const parsed = heroVideoUploadSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'בקשת העלאת הסרטון לא תקינה')
  }
  return parsed.data
}

export function buildHeroVideoStoragePath(userId: string) {
  return `${userId}/hero-video/${randomUUID()}.mp4`
}
