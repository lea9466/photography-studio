'use client'

import Link from 'next/link'
import { useState } from 'react'
import { platformLogoutAction } from '@/app/platform/actions'
import type { PlatformOverview } from '@/lib/platform-db'
import { tenantPath } from '@/lib/tenant-paths'

const STATUS_LABELS: Record<string, string> = {
  active: 'פעיל',
  trial: 'ניסיון',
  past_due: 'חוב',
  cancelled: 'מבוטל',
}

export default function PlatformDashboard({
  overview,
}: {
  overview: PlatformOverview
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid flex-1 gap-4 sm:grid-cols-3">
          <StatCard label="צלמים מחוברים" value={overview.photographerCount} />
          <StatCard label="סה״כ גלריות" value={overview.totalAlbums} />
          <StatCard label="סה״כ תמונות" value={overview.totalImages} />
        </div>
        <form action={platformLogoutAction}>
          <button
            type="submit"
            className="rounded-full border border-[var(--color-blue-sky)] px-5 py-2 text-sm text-[var(--color-paris-deep)] transition-colors hover:border-[var(--color-paris-blue)]"
          >
            יציאה
          </button>
        </form>
      </div>

      {overview.photographers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-blue-sky)] px-6 py-10 text-center text-sm text-[var(--color-paris-deep)]/60">
          אין צלמים רשומים במערכת.
        </p>
      ) : (
        <div className="space-y-4">
          {overview.photographers.map((p) => {
            const isOpen = expanded === p.id
            return (
              <section
                key={p.id}
                className="soft-card overflow-hidden rounded-2xl border border-[var(--color-blue-sky)]/80"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-5 text-right transition-colors hover:bg-[var(--color-cream)]/40"
                >
                  <div>
                    <h2 className="font-heading text-xl text-[var(--color-paris-deep)]">
                      {p.display_name?.trim() || 'ללא שם'}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-paris-deep)]/60" dir="ltr">
                      /{p.slug} · {p.email ?? '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Badge>
                      {STATUS_LABELS[p.subscription_status] ??
                        p.subscription_status}
                    </Badge>
                    <Badge>{p.albumCount} גלריות</Badge>
                    <Badge>{p.imageCount} תמונות</Badge>
                    <Badge>{p.clientCount} לקוחות</Badge>
                    <span className="text-[var(--color-paris-deep)]/40">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-t border-[var(--color-blue-sky)]/60 px-6 py-4">
                    <div className="mb-4 flex flex-wrap gap-3">
                      <Link
                        href={tenantPath(p.slug)}
                        className="text-sm font-medium text-[var(--color-paris-blue)] hover:underline"
                        target="_blank"
                      >
                        צפייה באתר הציבורי
                      </Link>
                    </div>

                    {p.albums.length === 0 ? (
                      <p className="text-sm text-[var(--color-paris-deep)]/50">
                        אין גלריות לצלם זה.
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[var(--color-paris-deep)]/50">
                            <th className="pb-2 text-right font-medium">
                              גלריה
                            </th>
                            <th className="pb-2 text-right font-medium">
                              תמונות
                            </th>
                            <th className="pb-2 text-right font-medium">
                              סטטוס
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.albums.map((album) => (
                            <tr
                              key={album.id}
                              className="border-t border-[var(--color-blue-sky)]/40"
                            >
                              <td className="py-2.5">
                                {album.title?.trim() || 'ללא כותרת'}
                              </td>
                              <td className="py-2.5">{album.imageCount}</td>
                              <td className="py-2.5 text-[var(--color-paris-deep)]/70">
                                {album.status ?? '—'}
                                {album.isPublic ? ' · ציבורי' : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="soft-card rounded-2xl border border-[var(--color-blue-sky)]/80 px-5 py-4">
      <p className="text-xs tracking-wide text-[var(--color-paris-deep)]/50">
        {label}
      </p>
      <p className="mt-1 font-heading text-3xl text-[var(--color-paris-deep)]">
        {value}
      </p>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--color-cream)] px-3 py-1 text-[var(--color-paris-deep)]/80">
      {children}
    </span>
  )
}
