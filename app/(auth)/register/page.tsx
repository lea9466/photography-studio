import { AuthForm } from '@/components/auth/AuthForm'
import { signUp } from '@/lib/actions/auth.actions'

export default function RegisterPage() {
  return <AuthForm mode="register" action={signUp} />
}
