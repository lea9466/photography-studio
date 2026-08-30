import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ACCENT_BUTTON_CLASS =
  'bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44] focus-visible:ring-[#7D3A52]/40'

type FloatingNewGalleryButtonProps = {
  href: string
  label?: string
  disabled?: boolean
  disabledTitle?: string
}

/**
 * The fixed, floating "new gallery" call-to-action shared by the public and
 * private gallery list pages. Purely presentational — the caller decides the
 * destination and whether the quota is reached.
 */
export function FloatingNewGalleryButton({
  href,
  label = 'גלריה חדשה',
  disabled = false,
  disabledTitle,
}: FloatingNewGalleryButtonProps) {
  return (
    <div className="fixed left-4 top-[70px] z-50 md:left-8 md:top-[22px]">
      <div className="rounded-2xl border border-[#7D3A52]/15 bg-white/95 p-1.5 shadow-xl shadow-[#7D3A52]/10 backdrop-blur-md">
        {disabled ? (
          <Button
            disabled
            title={disabledTitle}
            className={cn(
              ACCENT_BUTTON_CLASS,
              'cursor-not-allowed px-6 py-3 text-base font-semibold opacity-50'
            )}
          >
            <Plus className="h-5 w-5 ml-2" />
            {label}
          </Button>
        ) : (
          <Button
            asChild
            className={cn(ACCENT_BUTTON_CLASS, 'px-6 py-3 text-base font-semibold shadow-lg')}
          >
            <Link href={href}>
              <Plus className="h-5 w-5 ml-2" />
              {label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
