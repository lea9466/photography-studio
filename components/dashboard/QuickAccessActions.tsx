'use client'

import Link from 'next/link'
import { CloudUpload, Calendar, ArrowRight } from 'lucide-react'

type QuickActionProps = {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  iconBgColor: string
  iconColor: string
}

function QuickAction({ title, description, icon, href, iconBgColor, iconColor }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="p-6 bg-white dark:bg-zinc-900 border border-[--border] rounded-xl flex items-center justify-between group cursor-pointer hover:bg-[--background] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-[--foreground]">{title}</h4>
          <p className="text-sm text-[--muted]">{description}</p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-[--muted] group-hover:translate-x-[-8px] transition-transform" />
    </Link>
  )
}

type QuickAccessActionsProps = {
  upcomingMeetings?: number
}

export function QuickAccessActions({ upcomingMeetings = 0 }: QuickAccessActionsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <QuickAction
        title="העלאת תמונות מהירה"
        description="גררי קבצים לכאן כדי להתחיל"
        icon={<CloudUpload className="h-7 w-7" />}
        href="/dashboard/galleries/new"
        iconBgColor="bg-[--accent]/10"
        iconColor="text-[--accent]"
      />
      <QuickAction
        title="יומן פגישות"
        description={upcomingMeetings > 0 ? `יש לך ${upcomingMeetings} פגישות מחר` : 'אין פגישות קרובות'}
        icon={<Calendar className="h-7 w-7" />}
        href="/dashboard/calendar"
        iconBgColor="bg-[--foreground]/10"
        iconColor="text-[--foreground]"
      />
    </section>
  )
}
