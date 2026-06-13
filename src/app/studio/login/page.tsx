import { redirect } from 'next/navigation'
import { StudioLoginForm } from '@/components/studio/StudioAuthForm'
import { getPhotographerSession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function StudioLoginPage({ searchParams }: PageProps) {
  const session = await getPhotographerSession()
  if (session) {
    redirect('/admin')
  }

  const { next } = await searchParams

  return (
    <main className="texture-grain mx-auto max-w-5xl px-6 py-16 pb-24 text-right md:px-10">
      <StudioLoginForm next={next} />
    </main>
  )
}
