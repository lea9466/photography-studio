import type { LucideIcon } from 'lucide-react'
import { Bell, Gift, Info, Star } from 'lucide-react'

export const ANNOUNCEMENT_ICON_KEYS = ['gift', 'star', 'bell', 'info'] as const

export type AnnouncementIconKey = (typeof ANNOUNCEMENT_ICON_KEYS)[number]

export type AnnouncementIconOption = {
  key: AnnouncementIconKey
  label: string
  emoji: string
}

export const ANNOUNCEMENT_ICON_OPTIONS: AnnouncementIconOption[] = [
  { key: 'gift', label: 'פיצ׳ר חדש', emoji: '🎁' },
  { key: 'star', label: 'עדכון חשוב', emoji: '⭐' },
  { key: 'bell', label: 'התראה', emoji: '🔔' },
  { key: 'info', label: 'מידע', emoji: 'ℹ️' },
]

const ICON_MAP: Record<AnnouncementIconKey, LucideIcon> = {
  gift: Gift,
  star: Star,
  bell: Bell,
  info: Info,
}

const ICON_STYLE_MAP: Record<
  AnnouncementIconKey,
  { iconBg: string; iconText: string; border: string; surface: string }
> = {
  gift: {
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-700',
    border: 'border-rose-200/80',
    surface: 'from-rose-50/90 via-white to-white',
  },
  star: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    border: 'border-amber-200/80',
    surface: 'from-amber-50/90 via-white to-white',
  },
  bell: {
    iconBg: 'bg-sky-100',
    iconText: 'text-sky-700',
    border: 'border-sky-200/80',
    surface: 'from-sky-50/90 via-white to-white',
  },
  info: {
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-700',
    border: 'border-violet-200/80',
    surface: 'from-violet-50/90 via-white to-white',
  },
}

export function isAnnouncementIconKey(value: string): value is AnnouncementIconKey {
  return ANNOUNCEMENT_ICON_KEYS.includes(value as AnnouncementIconKey)
}

export function normalizeAnnouncementIcon(value: string | null | undefined): AnnouncementIconKey {
  if (value && isAnnouncementIconKey(value)) return value
  return 'info'
}

export function getAnnouncementIconComponent(key: AnnouncementIconKey): LucideIcon {
  return ICON_MAP[key]
}

export function getAnnouncementIconStyles(key: AnnouncementIconKey) {
  return ICON_STYLE_MAP[key]
}

export function getAnnouncementIconOption(key: AnnouncementIconKey) {
  return ANNOUNCEMENT_ICON_OPTIONS.find((option) => option.key === key) ?? ANNOUNCEMENT_ICON_OPTIONS[3]
}
