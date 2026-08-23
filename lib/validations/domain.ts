import { z } from 'zod'

// At least two labels, no leading/trailing hyphen per label. v1 requires a
// subdomain (e.g. www.johnphoto.com) rather than a bare apex domain, since
// apex-level CNAMEs aren't supported by most registrars without CNAME
// flattening — see lib/validations/domain.ts's reservedSuffixes check below
// for the "own app domain" guard.
const HOSTNAME_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/

function reservedHostnameSuffixes(): string[] {
  const appHost = process.env.NEXT_PUBLIC_APP_URL
    ? safeHost(process.env.NEXT_PUBLIC_APP_URL)
    : null
  return ['.vercel.app', appHost].filter((value): value is string => Boolean(value))
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

function stripPastedUrlParts(value: string): string {
  return value
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
}

export const connectCustomDomainSchema = z.object({
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .transform(stripPastedUrlParts)
    .pipe(
      z
        .string()
        .min(4, 'כתובת הדומיין קצרה מדי')
        .max(253, 'כתובת הדומיין ארוכה מדי')
        .regex(HOSTNAME_REGEX, 'כתובת הדומיין אינה תקינה — יש להזין דומיין בלבד, בלי https:// ובלי נתיב')
        .refine((hostname) => hostname.split('.').length >= 3, {
          message: 'יש לחבר תת-דומיין (למשל www.הדומיין-שלך.com), לא דומיין ראשי',
        })
        .refine(
          (hostname) =>
            !reservedHostnameSuffixes().some(
              (suffix) => hostname === suffix.replace(/^\./, '') || hostname.endsWith(suffix)
            ),
          { message: 'לא ניתן לחבר את הדומיין הראשי של המערכת' }
        )
    ),
})

export type ConnectCustomDomainInput = z.infer<typeof connectCustomDomainSchema>
