import { S3Client } from '@aws-sdk/client-s3'
import { getR2Config } from '@/lib/r2/config'

let client: S3Client | null = null

export function getR2Client() {
  if (client) return client

  const config = getR2Config()
  client = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    // path-style: .../albums/key — not albums.<account>.r2... (NetFree may block subdomains)
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // SDK 3.729+ sends checksums R2 may reject — causes UnknownError / HTTP 418
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })

  return client
}
