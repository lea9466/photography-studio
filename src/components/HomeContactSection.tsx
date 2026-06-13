import ContactForm from '@/components/ContactForm'
import type { PackagesRow } from '@/lib/database.types'
import type { SiteSettings } from '@/lib/site-settings'

type ContactSource = 'general' | 'package' | 'gallery'

function resolveSource(value: string | undefined): ContactSource {
  if (value === 'gallery') return 'gallery'
  return 'general'
}

function ContactItem({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <div className="group flex items-center justify-between border-b border-border/70 pb-4 transition-colors duration-500 hover:border-foreground/60">
      <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        {label}
      </span>
      <span className="font-display text-lg text-foreground transition-transform duration-500 group-hover:-translate-x-1">
        {value}
      </span>
    </div>
  )
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  )
}

export default function HomeContactSection({
  settings,
  selectedPackage,
  sourceParam,
  businessName = 'סטודיו צילום',
}: {
  settings: SiteSettings | null
  selectedPackage: PackagesRow | null
  sourceParam?: string
  businessName?: string
}) {
  const source: ContactSource = selectedPackage
    ? 'package'
    : resolveSource(sourceParam)

  const packageTitle = selectedPackage?.title?.trim() ?? ''
  const isFeatured = Boolean(selectedPackage?.is_featured)

  const phone = settings?.phone?.trim() ?? ''
  const email = settings?.email?.trim() ?? ''
  const whatsapp = settings?.whatsapp?.trim() ?? ''
  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}`
    : null

  const heading = selectedPackage
    ? isFeatured
      ? `תיאום חבילת פרימיום`
      : `תיאום חבילה`
    : null

  return (
    <section
      id="contact"
      className="relative scroll-mt-24 overflow-hidden px-6 py-32 md:scroll-mt-28 md:py-44"
      dir="rtl"
      aria-labelledby="contact-heading"
    >
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'var(--gradient-soft)', opacity: 0.5 }}
        aria-hidden
      />
      <div
        className="animate-blob absolute -right-32 top-1/4 -z-10 h-[500px] w-[500px] rounded-full opacity-50 blur-[140px]"
        style={{
          background: 'color-mix(in oklab, var(--color-rose) 55%, transparent)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="self-start lg:sticky lg:top-32 lg:col-span-5">
          <p className="theme-label mb-6 text-[11px] uppercase tracking-[0.5em]">
            Let&apos;s talk · יצירת קשר
          </p>
          <h2
            id="contact-heading"
            className="font-display text-5xl leading-[1] md:text-7xl"
          >
            בואו <span className="font-light italic">נכיר</span>.
          </h2>
          {heading ? (
            <p className="mt-4 font-display text-xl italic text-foreground/70">
              {heading}: {packageTitle}
            </p>
          ) : null}
          <p className="mt-8 max-w-md text-lg leading-loose text-foreground/75">
            כל סשן מתחיל בשיחה רכה, בלי התחייבות. ספרו לי על הרגע שאתם
            רוצים לתעד — ואני אדאג להפוך אותו לאמנות.
          </p>

          <div className="mt-12 space-y-5 text-sm">
            {phone ? (
              <ContactItem
                label="טלפון"
                value={phone}
                href={`tel:${phone.replace(/\s/g, '')}`}
              />
            ) : null}
            {email ? (
              <ContactItem label="אימייל" value={email} href={`mailto:${email}`} />
            ) : null}
            {whatsappHref ? (
              <ContactItem
                label="וואטסאפ"
                value="שליחת הודעה"
                href={whatsappHref}
              />
            ) : null}
            <ContactItem label="סטודיו" value={`${businessName} · בתיאום מראש`} />
          </div>

          <p className="mt-12 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            זמן תגובה ממוצע · עד 24 שעות
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="theme-shaped relative border border-border/60 bg-background/80 p-8 shadow-[0_40px_100px_-50px_oklch(0.35_0.05_40/0.35)] backdrop-blur-md md:p-12">
            <div
              className="absolute -top-3 right-12 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.3em]"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              קביעת סשן
            </div>
            <ContactForm
              source={source}
              packageId={selectedPackage?.id ?? ''}
              packageTitle={packageTitle}
              isFeatured={isFeatured}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
