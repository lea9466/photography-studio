import { redirect } from 'next/navigation'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { fetchClients } from '@/lib/actions/client.actions'
import { ClientsManager } from '@/components/dashboard/ClientsManager'

// The clients CRM is part of the private client-gallery workspace, open to
// every account. If it needs re-gating, isMvpBlockedDashboardRoute
// (CLIENT_GALLERIES_ENABLED) is the one seam — the middleware enforces it.
export default async function ClientsPage() {
  try {
    await requireDashboardContext()
  } catch {
    redirect('/login')
  }

  const clients = await fetchClients()

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">לקוחות</h1>
        <p className="mt-1 text-sm text-[--muted]">
          נהל את רשימת הלקוחות שלך
        </p>
      </div>
      <ClientsManager initialClients={clients} />
    </div>
  )
}
