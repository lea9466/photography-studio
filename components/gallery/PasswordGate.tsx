'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { verifyGalleryPassword } from '@/lib/actions/client-gallery.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type PasswordGateProps = {
  galleryId: string
  galleryTitle: string
  studioName?: string | null
}

export function PasswordGate({
  galleryId,
  galleryTitle,
  studioName,
}: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await verifyGalleryPassword(galleryId, password)
        window.location.reload()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'סיסמה שגויה')
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle>{studioName ?? 'Studio Gallery'}</CardTitle>
          <CardDescription>{galleryTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמת גלריה</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזינו סיסמה"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'נכנסים...' : 'כניסה לגלריה'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
