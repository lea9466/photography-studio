import { Camera, ImageIcon } from 'lucide-react'
import { Assistant, Rubik } from 'next/font/google'
import type { PublicSiteGateMode } from '@/lib/site-access/public-gate'
import type { SiteLanguage } from '@/lib/site-language'
import './site-gate.css'

const brandFont = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
})

const bodyFont = Assistant({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

type SiteGateScreenProps = {
  mode: PublicSiteGateMode
  studioName: string | null
  siteLanguage: SiteLanguage
}

const COPY = {
  he: {
    under_construction: {
      title: 'האתר בבניה',
      subtitle: 'בקרוב…',
    },
    unavailable: {
      title: 'הדף אינו זמין כרגע',
      subtitle: 'נשוב בקרוב',
    },
  },
  en: {
    under_construction: {
      title: 'Site under construction',
      subtitle: 'Coming soon…',
    },
    unavailable: {
      title: 'This page is currently unavailable',
      subtitle: 'We will be back soon',
    },
  },
} as const

function TripodIcon({
  size = 24,
  strokeWidth = 1.25,
}: {
  size?: number
  strokeWidth?: number | string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="5.5" r="2.25" />
      <path d="M12 7.75v4.5" />
      <path d="M12 12.25 5.5 20.5" />
      <path d="M12 12.25 18.5 20.5" />
      <path d="M12 12.25v8.25" />
    </svg>
  )
}

const FLOATERS: {
  Icon: typeof Camera | typeof ImageIcon | typeof TripodIcon
  className: string
  size: number
}[] = [
  { Icon: Camera, className: 'site-gate__floater--1', size: 34 },
  { Icon: TripodIcon, className: 'site-gate__floater--2', size: 30 },
  { Icon: ImageIcon, className: 'site-gate__floater--3', size: 32 },
  { Icon: Camera, className: 'site-gate__floater--4', size: 26 },
  { Icon: ImageIcon, className: 'site-gate__floater--5', size: 28 },
  { Icon: TripodIcon, className: 'site-gate__floater--6', size: 36 },
  { Icon: Camera, className: 'site-gate__floater--7', size: 22 },
  { Icon: ImageIcon, className: 'site-gate__floater--8', size: 40 },
  { Icon: TripodIcon, className: 'site-gate__floater--9', size: 24 },
  { Icon: Camera, className: 'site-gate__floater--10', size: 30 },
  { Icon: ImageIcon, className: 'site-gate__floater--11', size: 22 },
  { Icon: TripodIcon, className: 'site-gate__floater--12', size: 28 },
  { Icon: Camera, className: 'site-gate__floater--13', size: 36 },
  { Icon: ImageIcon, className: 'site-gate__floater--14', size: 26 },
  { Icon: TripodIcon, className: 'site-gate__floater--15', size: 32 },
  { Icon: Camera, className: 'site-gate__floater--16', size: 24 },
  { Icon: ImageIcon, className: 'site-gate__floater--17', size: 34 },
  { Icon: TripodIcon, className: 'site-gate__floater--18', size: 20 },
]

export function SiteGateScreen({ mode, studioName, siteLanguage }: SiteGateScreenProps) {
  const copy = COPY[siteLanguage][mode]
  const brand = studioName?.trim() || (siteLanguage === 'he' ? 'הסטודיו' : 'Studio')

  return (
    <main
      className={`site-gate ${bodyFont.className}`}
      dir={siteLanguage === 'he' ? 'rtl' : 'ltr'}
      lang={siteLanguage}
    >
      <div className="site-gate__atmosphere" aria-hidden />
      <div className="site-gate__grain" aria-hidden />

      <div className="site-gate__floaters" aria-hidden>
        {FLOATERS.map(({ Icon, className, size }, index) => (
          <span key={`${className}-${index}`} className={`site-gate__floater ${className}`}>
            <Icon size={size} strokeWidth={1.15} />
          </span>
        ))}
      </div>

      <div className="site-gate__content">
        <p className={`site-gate__brand ${brandFont.className}`}>{brand}</p>
        <h1 className="site-gate__title">{copy.title}</h1>
        <p className="site-gate__subtitle">{copy.subtitle}</p>
        <div className="site-gate__rule" aria-hidden />
      </div>
    </main>
  )
}
