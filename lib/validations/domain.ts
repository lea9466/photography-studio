import { z } from 'zod'

// At least two labels, no leading/trailing hyphen per label. Both an apex
// domain (johnphoto.com, connected via an A record to Vercel's IP) and a
// subdomain (www.johnphoto.com, via CNAME) are valid — see isApexHostname
// and lib/vercel/config.ts's VERCEL_APEX_A_RECORD/VERCEL_CNAME_TARGET, which
// the dashboard UI picks between based on which shape was connected.
const HOSTNAME_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/

/**
 * True for a bare apex/root domain (johnphoto.com) as opposed to a subdomain
 * (www.johnphoto.com, gallery.johnphoto.com, ...). Doesn't attempt to handle
 * compound TLDs (example.co.il is technically also an apex despite having
 * three labels) — a known, minor limitation, not a security issue: at worst
 * it shows CNAME instead of A-record instructions for that rare case.
 */
export function isApexHostname(hostname: string): boolean {
  return hostname.split('.').length === 2
}

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
