import Image from 'next/image'
import Link from 'next/link'

type Props = {
  src: string | null | undefined
  alt: string
  href?: string
  /** header = בהדר, hero = מעל כותרת ראשית, inline = ליד כותרת יצירת קשר */
  variant?: 'header' | 'hero' | 'inline'
  className?: string
  showTextFallback?: boolean
  brandName?: string
}

const variantStyles: Record<NonNullable<Props['variant']>, string> = {
  header: 'h-9 w-auto max-w-[10rem] md:h-11 md:max-w-[12rem]',
  hero: 'h-16 w-auto max-w-[14rem] md:h-24 md:max-w-[18rem]',
  inline: 'h-12 w-auto max-w-[11rem]',
}

export default function SiteLogo({
  src,
  alt,
  href = '/#home',
  variant = 'header',
  className = '',
  showTextFallback = true,
  brandName,
}: Props) {
  const trimmed = src?.trim()
  const sizeClass = variantStyles[variant]

  const image = trimmed ? (
    <Image
      src={trimmed}
      alt={alt}
      width={variant === 'hero' ? 280 : 160}
      height={variant === 'hero' ? 96 : 44}
      className={`object-contain object-right ${sizeClass} ${className}`}
      priority={variant === 'header' || variant === 'hero'}
      unoptimized={trimmed.startsWith('http')}
    />
  ) : showTextFallback && brandName ? (
    <span
      className={`font-display tracking-wide text-foreground transition-colors duration-300 group-hover:text-foreground/70 ${
        variant === 'hero'
          ? 'text-3xl md:text-4xl'
          : variant === 'inline'
            ? 'text-2xl'
            : 'text-xl md:text-2xl'
      } ${className}`}
    >
      {brandName}
    </span>
  ) : null

  if (!image) return null

  return (
    <Link href={href} className="group inline-flex shrink-0 items-center">
      {image}
    </Link>
  )
}
