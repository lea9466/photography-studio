import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { PublicStudio } from '@/lib/actions/public-studios.actions'

interface PhotographerCardProps {
  studio: PublicStudio
  isDemo?: boolean
}

export function PhotographerCard({ studio, isDemo = false }: PhotographerCardProps) {
  const displayName = studio.studio_name || studio.name || 'סטודיו'
  const firstLetter = displayName.charAt(0)
  const hasSlug = studio.slug && studio.slug.trim() !== ''
  const hasLogo = studio.logo_url && studio.logo_url.trim() !== ''
  
  const brandColor = studio.theme_primary || studio.accent_color || '#7c3aed'

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors bg-white">
      {/* Badge/Logo */}
      <div className="flex-shrink-0">
        {hasLogo ? (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <img
              src={studio.logo_url || undefined}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg"
            style={{ backgroundColor: brandColor }}
          >
            {firstLetter}
          </div>
        )}
      </div>

      {/* Studio Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{displayName}</h3>
          {isDemo && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
              אתר לדוגמא
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      {hasSlug && isDemo && (
        <Link
          href={`/${studio.slug}`}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="hidden sm:inline">צפייה באתר</span>
          <span className="sm:hidden">צפייה</span>
          <ExternalLink className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
        </Link>
      )}
    </div>
  )
}
