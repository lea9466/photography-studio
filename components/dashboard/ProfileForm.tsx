'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/feedback.actions'
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

type ProfileFormProps = {
  profile: {
    name: string | null
    studio_name: string | null
    theme_primary: string
  } | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(profile?.name ?? '')
  const [studioName, setStudioName] = useState(profile?.studio_name ?? '')
  const [themePrimary, setThemePrimary] = useState(
    profile?.theme_primary ?? '#171717'
  )

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProfile({
          name,
          studio_name: studioName,
          theme_primary: themePrimary,
        })
        toast.success('הפרופיל עודכן')
        document.documentElement.style.setProperty('--accent', themePrimary)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>פרופיל צלמת</CardTitle>
        <CardDescription>מוצג ללקוחות בגלריה</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studio">שם הסטודיו</Label>
          <Input
            id="studio"
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accent">צבע מותג (--accent)</Label>
          <Input
            id="accent"
            type="color"
            value={themePrimary}
            onChange={(e) => setThemePrimary(e.target.value)}
            className="h-10 w-full"
          />
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'שומר...' : 'שמור'}
        </Button>
      </CardContent>
    </Card>
  )
}
