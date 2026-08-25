'use client'

import type { CSSProperties } from 'react'
import { resolveContactSectionCopy } from '@/lib/contact-section-copy'
import type { SiteLanguage } from '@/lib/site-language'
import { useRevealOnScroll } from '../shared/useRevealOnScroll'
import { SectionTitle } from '../shared/SectionTitle'
import { ClassicSectionScript } from './ClassicSectionScript'
import { ClassicContactForm, type ClassicContactFormValues } from './ClassicContactForm'
import styles from './ClassicContactSection.module.css'

export type ClassicContactSectionProps = {
  title: string | null
  subtitle: string | null
  accentColor: string
  language: SiteLanguage
  phone: string | null
  email: string | null
  address: string | null
  contactDesktopUrl: string | null
  contactMobileUrl: string | null
  onSubmit?: (values: ClassicContactFormValues) => void
}

const FALLBACK_EMAIL = 'hello@studiogallery.co.il'

export function ClassicContactSection(props: ClassicContactSectionProps) {
  const {
    title,
    subtitle,
    accentColor,
    language,
    phone,
    email,
    address,
    contactDesktopUrl,
    contactMobileUrl,
    onSubmit,
  } = props

  const { ref, revealed } = useRevealOnScroll<HTMLElement>()
  const copy = resolveContactSectionCopy('classic', title, subtitle, language)

  const studioPhone = phone?.trim() || null
  const studioPhoneHref = studioPhone ? studioPhone.replace(/[^\d+]/g, '') : ''
  const studioAddress = address?.trim() || null
  const contactEmail = email?.trim() || FALLBACK_EMAIL

  const hasContactBg = Boolean(contactDesktopUrl || contactMobileUrl)
  const desktopBg = contactDesktopUrl || contactMobileUrl
  const mobileBg = contactMobileUrl || contactDesktopUrl
  const mobileFade = '#fdf8f7'
  const desktopFade = '#f7f3f2'

  const rootStyle = { '--contact-accent': accentColor } as CSSProperties

  return (
    <section
      ref={ref}
      id="contact"
      className={`reveal ${revealed ? 'active' : ''} ${hasContactBg ? styles.hasBg : 'bg-[#faf3eb]'} border-t border-[#d1c6b4]/10 pt-20 pb-12`}
      style={rootStyle}
    >
      {hasContactBg ? (
        <>
          <div className={`${styles.bg} ${styles.bgDesktop}`} style={{ backgroundImage: `url('${desktopBg}')` }} />
          <div className={`${styles.bg} ${styles.bgMobile}`} style={{ backgroundImage: `url('${mobileBg}')` }} />
          <div
            className={styles.bgOverlay}
            style={{ '--contact-fade': mobileFade, '--contact-fade-desktop': desktopFade } as CSSProperties}
          />
        </>
      ) : null}

      <div className={`${styles.content} mx-auto max-w-7xl px-6`}>
        <div className="grid grid-cols-1 items-start gap-12 md:gap-20 lg:grid-cols-12">
          <div className="text-start rtl:text-right lg:col-span-5 space-y-6">
            <ClassicSectionScript color={accentColor}>Contact</ClassicSectionScript>
            <SectionTitle color="#2d2825">{copy.title}</SectionTitle>
            <p className={`${styles.subtitle} max-w-md`}>{copy.subtitle}</p>

            <div className="space-y-4 pt-6">
              {studioPhone ? (
                <a
                  className={`${styles.detailLink} flex w-full min-w-0 items-center justify-start gap-3`}
                  href={`tel:${studioPhoneHref}`}
                >
                  <span className={`material-symbols-outlined ${styles.detailIcon}`}>call</span>
                  <span className={`${styles.detailValue} shrink-0`} dir="ltr">
                    {studioPhone}
                  </span>
                </a>
              ) : null}

              <a
                className={`${styles.detailLink} flex w-full min-w-0 items-center justify-start gap-3`}
                href={`mailto:${contactEmail}`}
              >
                <span className={`material-symbols-outlined ${styles.detailIcon}`}>mail</span>
                <span className={`${styles.detailValue} min-w-0 break-all`}>{contactEmail}</span>
              </a>

              {studioAddress ? (
                <div className="flex w-full min-w-0 items-center justify-start gap-3">
                  <span className={`material-symbols-outlined ${styles.detailIcon} shrink-0`}>location_on</span>
                  <span className={styles.detailValue}>{studioAddress}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <ClassicContactForm accentColor={accentColor} hasContactBg={hasContactBg} language={language} onSubmit={onSubmit} />
          </div>
        </div>
      </div>
    </section>
  )
}
