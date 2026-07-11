'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Megaphone, Send } from 'lucide-react'
import {
  fetchLatestAnnouncementForAdmin,
  publishAnnouncement,
} from '@/lib/actions/admin.actions'
import {
  ANNOUNCEMENT_ICON_OPTIONS,
  getAnnouncementIconOption,
  type AnnouncementIconKey,
} from '@/lib/announcements/icons'
import type { Announcement } from '@/lib/announcements/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AnnouncementManagerForm() {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState<AnnouncementIconKey>('info')
  const [isActive, setIsActive] = useState(true)

  const selectedIcon = getAnnouncementIconOption(icon)

  useEffect(() => {
    fetchLatestAnnouncementForAdmin()
      .then((announcement) => {
        setLatestAnnouncement(announcement)
        if (announcement) {
          setTitle(announcement.title)
          setContent(announcement.content)
          setIcon(announcement.icon as AnnouncementIconKey)
          setIsActive(announcement.is_active)
        }
      })
      .catch(() => {
        toast.error('טעינת ההודעה האחרונה נכשלה')
      })
      .finally(() => setLoading(false))
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error('נא למלא כותרת ותוכן')
      return
    }

    startTransition(async () => {
      try {
        const announcement = await publishAnnouncement({
          title: title.trim(),
          content: content.trim(),
          icon,
          isActive,
        })

        setLatestAnnouncement(announcement)
        toast.success(
          isActive
            ? 'ההודעה פורסמה ומוצגת בדשבורד'
            : 'ההודעה נשמרה כלא פעילה'
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'פרסום ההודעה נכשל')
      }
    })
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-md">
      <CardHeader className="border-b border-slate-200/80 bg-gradient-to-l from-violet-50 via-white to-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Megaphone className="h-4 w-4" />
              </span>
              הודעת דשבורד לצלמים
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-slate-600">
              פרסום באנר עשיר בדשבורד של כל הצלמים. כל פרסום יוצר הודעה חדשה — צלמים שסגרו
              הודעה קודמת יראו אותה שוב רק אם פורסמה הודעה חדשה.
            </CardDescription>
          </div>
          {latestAnnouncement ? (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                latestAnnouncement.is_active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              {latestAnnouncement.is_active ? 'פעילה כעת' : 'לא פעילה'}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="bg-slate-50/60 p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-slate-500">טוען את ההודעה האחרונה...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-violet-400 bg-white p-4 shadow-sm">
              <Label htmlFor="announcement-title" className="text-slate-700">
                כותרת
              </Label>
              <Input
                id="announcement-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="לדוגמה: פיצ׳ר חדש זמין!"
                required
                disabled={isPending}
                className="mt-2 border-slate-200 bg-slate-50 focus-visible:ring-violet-300"
              />
            </div>

            <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-sky-400 bg-white p-4 shadow-sm">
              <Label htmlFor="announcement-content" className="text-slate-700">
                תוכן
              </Label>
              <Textarea
                id="announcement-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="תיאור מפורט של העדכון או ההודעה..."
                required
                disabled={isPending}
                className="mt-2 min-h-[120px] resize-y border-slate-200 bg-slate-50 focus-visible:ring-sky-300"
              />
            </div>

            <div className="rounded-2xl border border-slate-200/80 border-r-4 border-r-amber-400 bg-white p-4 shadow-sm">
              <Label className="text-slate-700">אייקון</Label>
              <p className="mt-1 text-xs text-slate-500">בחרי סגנון שמתאים לסוג ההודעה</p>
              <Select
                value={icon}
                onValueChange={(value) => setIcon(value as AnnouncementIconKey)}
                disabled={isPending}
              >
                <SelectTrigger className="mt-3 border-slate-200 bg-slate-50 focus:ring-amber-300">
                  <SelectValue>
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden>{selectedIcon.emoji}</span>
                      {selectedIcon.label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden>{option.emoji}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 border-r-4 border-r-emerald-400 bg-white p-4 shadow-sm">
              <div>
                <Label htmlFor="announcement-active" className="text-slate-700">
                  סטטוס
                </Label>
                <p className="mt-1 text-xs text-slate-500">
                  {isActive
                    ? 'ההודעה תוצג בדשבורד של הצלמים'
                    : 'ההודעה תישמר אך לא תוצג'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">
                  {isActive ? 'פעיל' : 'לא פעיל'}
                </span>
                <Switch
                  id="announcement-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-xl border border-violet-300 bg-violet-500 px-6 text-white shadow-md shadow-violet-500/20 hover:bg-violet-600"
            >
              <Send className="h-4 w-4" />
              {isPending ? 'מפרסם...' : 'פרסום הודעה'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
