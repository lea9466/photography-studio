import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchClients } from '@/lib/actions/client.actions'
import { ClientsManager } from '@/components/dashboard/ClientsManager'

export default async function ClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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
