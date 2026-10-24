import { getHomepageCopy } from '@/lib/homepage-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { cn } from '@/lib/utils'
import styles from './HeroBase.module.css'

/** Studio name as the page's h1, with the last word in the accent color. */
export function HeroTitle({ text, accentLastWord = true, className }: { text: string; accentLastWord?: boolean; className?: string }) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const last = words.pop()

  return (
    <h1 className={cn(styles.title, className)}>
      {accentLastWord && last ? (
        <>
          {words.length ? `${words.join(' ')} ` : null}
          <span className={styles.accent}>{last}</span>
        </>
      ) : (
        text
      )}
    </h1>
  )
}

export function HeroEyebrow({ text, show, className }: { text: string; show: boolean; className?: string }) {
  if (!show || !text.trim()) return null
  return <span className={cn(styles.eyebrow, className)}>{text}</span>
}

export function HeroLead({ text, className }: { text: string | null; className?: string }) {
  const body = text?.trim()
  if (!body) return null
  return <p className={cn(styles.lead, className)}>{body}</p>
}

export function HeroCtas({
  language,
  contactHref,
  galleryHref,
  showSecondary,
  className,
}: {
  language: SiteLanguage
  contactHref: string
  galleryHref: string
  showSecondary: boolean
  className?: string
}) {
  const copy = getHomepageCopy(language)
  return (
    <div className={cn(styles.ctas, className)}>
      <a href={contactHref} className={cn(styles.btn, styles.btnPrimary)}>
        {copy.hero.scheduleSession}
      </a>
      {showSecondary ? (
        <a href={galleryHref} className={cn(styles.btn, styles.btnSecondary)}>
          {copy.hero.viewGalleries}
        </a>
      ) : null}
    </div>
  )
}
