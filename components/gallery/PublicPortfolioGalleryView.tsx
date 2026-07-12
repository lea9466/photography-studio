'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Lightbox } from '@/components/gallery/Lightbox'
import { ClientPhotoMasonry } from '@/components/gallery/ClientPhotoMasonry'

type PublicPortfolioPhoto = {
  id: string
  preview_signed_url: string | null
  lightbox_signed_url: string | null
}

type PublicPortfolioGalleryViewProps = {
  title: string
  studioName: string | null
  createdAt: string
  photos: PublicPortfolioPhoto[]
  accentColor?: string
  selectedTheme?: string
  heroImageUrl?: string | null
  logoImageUrl?: string | null
}

export function PublicPortfolioGalleryView({
  title,
  studioName,
  createdAt,
  photos,
  accentColor = '#7c3aed',
  selectedTheme = 'classic',
  heroImageUrl,
  logoImageUrl,
}: PublicPortfolioGalleryViewProps) {
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxActiveSrc, setLightboxActiveSrc] = useState<string | null>(null)

  const date = new Date(createdAt).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  function openLightbox(index: number, lightboxSrc: string | null) {
    setLightboxIndex(index)
    setLightboxActiveSrc(lightboxSrc)
    setLightboxOpen(true)
  }

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      data-theme={selectedTheme}
      style={{ '--client-accent': accentColor } as React.CSSProperties}
    >
      {/* Hero Section */}
      {heroImageUrl && (
        <div className="relative h-64 w-full overflow-hidden sm:h-96 lg:h-[500px]">
          <Image
            src={heroImageUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center text-white">
              {logoImageUrl && (
                <div className="mb-4 flex justify-center">
                  <Image
                    src={logoImageUrl}
                    alt="Logo"
                    width={120}
                    height={120}
                    className="h-20 w-20 rounded-full object-contain"
                  />
                </div>
              )}
              <p className="text-lg font-medium">
                {studioName ?? 'Studio Gallery'}
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-2 text-sm opacity-80">{date}</p>
            </div>
          </div>
        </div>
      )}

      <header className={`border-b border-[--border] px-4 py-6 text-center ${!heroImageUrl ? '' : 'hidden'}`}>
        <p className="text-sm text-[--muted]">
          {studioName ?? 'Studio Gallery'}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-[--muted]">{date}</p>
      </header>

      <main className="w-full py-6">
        {photos.length === 0 ? (
          <p className="py-12 text-center text-sm text-[--muted]">
            אין תמונות בגלריה זו
          </p>
        ) : (
          <div className="px-1 sm:px-1.5">
            <ClientPhotoMasonry
              photos={photos.map((photo) => ({
                id: photo.id,
                src: photo.preview_signed_url,
                lightboxSrc:
                  photo.lightbox_signed_url ?? photo.preview_signed_url,
                selected_album: false,
                selected_edit: false,
              }))}
              canSelect={false}
              onOpen={openLightbox}
              onToggleAlbum={() => {}}
              onToggleEdit={() => {}}
              getGlobalIndex={(id) => photos.findIndex((p) => p.id === id)}
            />
          </div>
        )}
      </main>

      <Lightbox
        photos={photos.map((p) => ({
          id: p.id,
          preview_url: null,
          watermarked_preview_url: null,
          is_visible_to_client: true,
          selected_album: false,
          selected_edit: false,
          edited_url: null,
          preview_signed_url: p.preview_signed_url,
          lightbox_signed_url: p.lightbox_signed_url ?? p.preview_signed_url,
          edited_signed_url: null,
        }))}
        index={lightboxIndex}
        open={lightboxOpen}
        activeSrc={lightboxActiveSrc}
        onOpenChange={setLightboxOpen}
        onNavigate={(nextIndex) => {
          setLightboxIndex(nextIndex)
          setLightboxActiveSrc(null)
        }}
        canSelect={false}
        isLimitedQuality={false}
        onToggleAlbum={() => {}}
        onToggleEdit={() => {}}
      />
    </div>
  )
}
