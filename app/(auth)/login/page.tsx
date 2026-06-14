import { AuthForm } from '@/components/auth/AuthForm'
import { ResendConfirmation } from '@/components/auth/ResendConfirmation'
import { signIn } from '@/lib/actions/auth.actions'

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>
}

const CALLBACK_ERRORS: Record<string, string> = {
  auth: 'האימות נכשל — נסי להתחבר שוב',
  expired: 'קישור האימות פג תוקף — שלחי מייל אימות חדש למטה',
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams
  const callbackError = error ? CALLBACK_ERRORS[error] : undefined

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {callbackError ? (
        <p className="rounded-md border border-[--border] px-4 py-3 text-sm text-[--foreground]">
          {callbackError}
        </p>
      ) : null}
      <AuthForm mode="login" action={signIn} next={next} />
      <ResendConfirmation />
    </div>
  )
}
