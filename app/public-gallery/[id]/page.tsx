import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveMediaUrl } from '@/lib/r2/storage'
import { signStoragePaths } from '@/lib/storage'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'

type PublicGalleryPageProps = {
  params: Promise<{ id: string }>
}

type GalleryData = {
  id: string
  title: string
  created_at: string
  user_id: string
  is_public: boolean
}

type UserData = {
  studio_name: string | null
  logo_url: string | null
  accent_color: string | null
  selected_theme: string | null
  email: string | null
  contact_card_title: string | null
  contact_card_description: string | null
}

type PhotoData = {
  id: string
  preview_url: string | null
  url: string | null
}

type ThemeType = 'modern' | 'elegant' | 'classic' | 'dark' | 'bold'

export default async function PublicGalleryPage({ params }: PublicGalleryPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch gallery by ID
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, title, created_at, user_id, is_public')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!gallery) notFound()

  const galleryData = gallery as GalleryData

  // Fetch user profile
  const admin = createAdminClient()
  const { data: user } = await admin
    .from('users')
    .select('studio_name, logo_url, accent_color, selected_theme, email, contact_card_title, contact_card_description')
    .eq('id', galleryData.user_id)
    .single()

  const userData = user as UserData | null

  const accentColor = userData?.accent_color ?? '#7c3aed'
  const selectedTheme = (userData?.selected_theme ?? 'modern') as ThemeType
  const studioName = userData?.studio_name ?? 'Studio Gallery'
  const logoUrl = userData?.logo_url ? await resolveMediaUrl('branding', userData.logo_url) : null

  console.log('DEBUG: selectedTheme:', selectedTheme)
  console.log('DEBUG: userData:', userData)
  console.log('DEBUG: accentColor:', accentColor)

  // Smart fallback logic: prefer edited photos for public display
  const { data: editedPhotos } = await admin
    .from('edited_photos')
    .select('photo_id, final_url')
    .eq('gallery_id', galleryData.id)

  let photosToDisplay: { id: string; preview_url: string | null }[] = []
  let bucket: 'previews' | 'edited' = 'previews'

  if (editedPhotos && editedPhotos.length > 0) {
    photosToDisplay = editedPhotos.map((ep) => ({
      id: ep.photo_id,
      preview_url: ep.final_url,
    }))
    bucket = 'edited'
  } else {
    const { data: regularPhotos } = await admin
      .from('photos')
      .select('id, preview_url')
      .eq('gallery_id', galleryData.id)
      .eq('is_visible_to_client', true)
      .order('sort_order')
    
    photosToDisplay = (regularPhotos ?? []) as { id: string; preview_url: string | null }[]
  }

  const previewPaths = photosToDisplay.map((photo) => photo.preview_url)
  const signedUrls = await signStoragePaths(bucket, previewPaths, galleryData.id)

  const photos = photosToDisplay.map(
    (photo) => ({
      ...photo,
      url: photo.preview_url ? signedUrls[photo.preview_url] ?? null : null,
    })
  )

  const photoCount = photos.length
  const galleryDate = new Date(galleryData.created_at).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Render the appropriate theme
  switch (selectedTheme) {
    case 'modern':
      return ModernGalleryView({ galleryData, userData, photos, photoCount, galleryDate, accentColor, studioName, logoUrl, contactCardTitle: userData?.contact_card_title ?? null, contactCardDescription: userData?.contact_card_description ?? null })
    case 'elegant':
      return ElegantGalleryView({ galleryData, userData, photos, photoCount, galleryDate, accentColor, studioName, logoUrl, contactCardTitle: userData?.contact_card_title ?? null, contactCardDescription: userData?.contact_card_description ?? null })
    case 'classic':
      return ClassicGalleryView({ galleryData, userData, photos, photoCount, galleryDate, accentColor, studioName, logoUrl, contactCardTitle: userData?.contact_card_title ?? null, contactCardDescription: userData?.contact_card_description ?? null })
    case 'dark':
    case 'bold':
      return DarkGalleryView({ galleryData, userData, photos, photoCount, galleryDate, accentColor, studioName, logoUrl, contactCardTitle: userData?.contact_card_title ?? null, contactCardDescription: userData?.contact_card_description ?? null })
    default:
      return ModernGalleryView({ galleryData, userData, photos, photoCount, galleryDate, accentColor, studioName, logoUrl, contactCardTitle: userData?.contact_card_title ?? null, contactCardDescription: userData?.contact_card_description ?? null })
  }
}

// MODERN THEME VIEW
function ModernGalleryView({
  galleryData,
  photos,
  photoCount,
  galleryDate,
  accentColor,
  studioName,
  logoUrl,
  contactCardTitle,
  contactCardDescription
}: {
  galleryData: GalleryData
  userData: UserData | null
  photos: PhotoData[]
  photoCount: number
  galleryDate: string
  accentColor: string
  studioName: string
  logoUrl: string | null
  contactCardTitle: string | null
  contactCardDescription: string | null
}) {
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#F8FAFC]" style={{ direction: 'rtl', textAlign: 'right' }}>
      <nav className="fixed top-0 w-full z-50 bg-transparent transition-all duration-500 px-[24px] py-[16px] flex flex-row-reverse justify-between items-center left-0 right-0 max-w-[1440px] mx-auto">
        <div className="text-2xl font-bold text-[#2D2825]" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
          {studioName}
        </div>
        <div className="hidden md:flex flex-row-reverse gap-[32px] items-center">
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">אודות</a>
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">גלריות</a>
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">מחירון</a>
        </div>
        <button className="text-white px-[32px] py-[8px] text-xs uppercase tracking-widest hover:opacity-90 transition-all" style={{ fontFamily: 'Heebo, sans-serif', backgroundColor: accentColor }}>
          צור קשר
        </button>
      </nav>
      <main className="max-w-[1280px] mx-auto px-[24px] pt-[80px]">
        {/* Hero Section */}
        <section className="text-right mb-[32px] py-[24px]">
          <h1 className="text-[48px] md:text-[64px] font-bold text-[#2D2825] leading-tight mb-[8px]" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            {galleryData.title}
          </h1>
          <p className="text-[16px] text-[#5A504A]" style={{ fontFamily: 'Heebo, sans-serif' }}>
            {photoCount} תמונות • {galleryDate}
          </p>
        </section>

        {/* Image Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px] mb-[80px]">
          {photos.map((photo, index) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-[12px] aspect-[4/5] bg-[#eae8e5] transition-all duration-500 shadow-sm hover:shadow-xl cursor-pointer">
              {photo.url ? (
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-[24px]">
                <span className="text-white text-[13px] mb-[4px]" style={{ fontFamily: 'Heebo, sans-serif' }}>תמונה {index + 1}</span>
                <h3 className="text-white text-[26px]" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>{galleryData.title}</h3>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Section */}
        {contactCardTitle || contactCardDescription ? (
          <section className="max-w-[1280px] mx-auto px-[24px] mb-[80px]">
            <div className="relative bg-[#2D2825] text-white rounded-xl p-[32px] overflow-hidden shadow-lg">
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-[24px] md:text-[32px] mb-[12px]" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
                  {contactCardTitle || 'מוכנים ליצור משהו יוצא דופן?'}
                </h2>
                <p className="text-[14px] text-[#e5e2df] mb-[32px] opacity-80" style={{ fontFamily: 'Heebo, sans-serif', whiteSpace: 'pre-line' }}>
                  {contactCardDescription || 'אנחנו משלבים טכנולוגיה מתקדמת עם ראייה אמנותית כדי להפוך את החזון שלכם למציאות ויזואלית מרהיבה.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-[12px]">
                  <button className="text-white px-[32px] py-[10px] rounded-[8px] text-[12px] font-medium shadow-md hover:scale-105 transition-transform" style={{ fontFamily: 'Heebo, sans-serif', backgroundColor: accentColor }}>
                    התחילו פרויקט חדש
                  </button>
                  <button className="border border-white/30 text-white px-[32px] py-[10px] rounded-[8px] text-[12px] font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-[8px]" style={{ fontFamily: 'Heebo, sans-serif' }}>
                    <span>צפו בסיפור שלנו</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}

// ELEGANT THEME VIEW
function ElegantGalleryView({
  galleryData,
  photos,
  photoCount,
  galleryDate,
  accentColor,
  studioName,
  logoUrl,
  contactCardTitle,
  contactCardDescription
}: {
  galleryData: GalleryData
  userData: UserData | null
  photos: PhotoData[]
  photoCount: number
  galleryDate: string
  accentColor: string
  studioName: string
  logoUrl: string | null
  contactCardTitle: string | null
  contactCardDescription: string | null
}) {
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#FAFAF8]" style={{ direction: 'rtl', textAlign: 'right' }}>
      <nav className="fixed top-0 w-full z-50 bg-transparent transition-all duration-500 px-[24px] py-[16px] flex flex-row-reverse justify-between items-center left-0 right-0 max-w-[1440px] mx-auto">
        <div className="text-2xl uppercase tracking-[0.2em] font-medium text-[#2D2825]" style={{ fontFamily: 'Playfair Display, serif' }}>
          {studioName}
        </div>
        <div className="hidden md:flex flex-row-reverse gap-[32px] items-center">
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">אודות</a>
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">גלריות</a>
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">מחירון</a>
        </div>
        <button className="text-white px-[32px] py-[8px] text-xs uppercase tracking-widest hover:opacity-90 transition-all" style={{ fontFamily: 'Heebo, sans-serif', backgroundColor: accentColor }}>
          צור קשר
        </button>
      </nav>
      <main className="max-w-[1280px] mx-auto px-[24px] pt-[160px]">
        {/* Hero Section */}
        <header className="text-center mb-[80px]">
          <span className="text-[13px] uppercase tracking-[0.2em] mb-[16px] block" style={{ fontFamily: 'Heebo, sans-serif', color: accentColor }}>Aesthetic Collection</span>
          <h1 className="text-[68px] md:text-[68px] text-[#2D2825] mb-[16px]" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.01em' }}>{galleryData.title}</h1>
          <div className="w-16 h-px mx-auto mb-[24px]" style={{ backgroundColor: accentColor }}></div>
          <p className="text-[18px] text-[#5A504A] max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Heebo, sans-serif' }}>
            {photoCount} יצירות • {galleryDate}
          </p>
        </header>

        {/* Image Grid - High-End Bento-style/Asymmetric Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-[24px] lg:gap-[24px] mb-[80px]">
          {photos.map((photo, index) => {
            const isLarge = index === 0
            const isVertical = index === 1
            const isMedium = index === 3
            
            return (
              <div 
                key={photo.id} 
                className={`group relative overflow-hidden ${
                  isLarge ? 'md:col-span-8' : isVertical ? 'md:col-span-4' : isMedium ? 'md:col-span-8' : 'md:col-span-4'
                }`}
              >
                <div className={`${isLarge ? 'aspect-[16/9]' : isVertical ? 'aspect-[3/4]' : isMedium ? 'aspect-[21/9]' : 'aspect-square'} w-full bg-[#eae8e5] overflow-hidden`}>
                  {photo.url ? (
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-1000 ease-out"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 66vw"
                    />
                  ) : null}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-[24px]">
                  <div className="text-white">
                    <span className="text-[13px] tracking-widest block mb-[8px]" style={{ fontFamily: 'Heebo, sans-serif' }}>PHOTO {index + 1}</span>
                    <h3 className="text-[26px]" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>{galleryData.title}</h3>
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        {/* CTA Section */}
        {contactCardTitle || contactCardDescription ? (
          <section className="py-[80px] bg-[#f6f3f0] border-y border-[#d6c3bb]/20">
            <div className="max-w-[1280px] mx-auto px-[24px] text-center">
              <h2 className="text-[36px] mb-[24px]" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, lineHeight: '1.3' }}>
                {contactCardTitle || 'מוכנים ליצור משהו יוצא דופן?'}
              </h2>
              <p className="text-[16px] text-[#5A504A] mb-[48px] max-w-xl mx-auto" style={{ fontFamily: 'Heebo, sans-serif', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {contactCardDescription || 'אנחנו מזמינים אתכם לפגישת ייעוץ אישית בסטודיו שלנו, בה נוכל לתכנן יחד את הפרויקט הבא שלכם.'}
              </p>
              <div className="flex flex-col md:flex-row gap-[24px] justify-center items-center">
                <a className="text-white px-[48px] py-[16px] shadow-lg text-[13px] font-medium hover:opacity-90 transition-all" style={{ fontFamily: 'Heebo, sans-serif', backgroundColor: accentColor }} href="#">
                  תיאום פגישה
                </a>
                <a className="border text-[13px] font-medium hover:bg-[--primary] hover:text-white transition-all px-[48px] py-[16px]" style={{ fontFamily: 'Heebo, sans-serif', borderColor: accentColor, color: accentColor }} href="#">
                  צרו קשר בוואטסאפ
                </a>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}

// CLASSIC THEME VIEW
function ClassicGalleryView({
  galleryData,
  photos,
  photoCount,
  galleryDate,
  accentColor,
  studioName,
  logoUrl,
  contactCardTitle,
  contactCardDescription
}: {
  galleryData: GalleryData
  userData: UserData | null
  photos: PhotoData[]
  photoCount: number
  galleryDate: string
  accentColor: string
  studioName: string
  logoUrl: string | null
  contactCardTitle: string | null
  contactCardDescription: string | null
}) {
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#FAFAF8]" style={{ direction: 'rtl', textAlign: 'right' }}>
      <nav className="fixed top-0 w-full z-50 bg-transparent transition-all duration-500 px-[24px] py-[16px] flex flex-row-reverse justify-between items-center left-0 right-0 max-w-[1440px] mx-auto">
        <div className="text-2xl uppercase tracking-[0.2em] font-medium text-[#2D2825]" style={{ fontFamily: 'Playfair Display, serif' }}>
          {studioName}
        </div>
        <div className="hidden md:flex flex-row-reverse gap-[32px] items-center">
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">אודות</a>
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">גלריות</a>
          <a className="text-[#5A504A] hover:text-[--primary] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }} href="#">מחירון</a>
        </div>
        <button className="text-white px-[32px] py-[8px] text-xs uppercase tracking-widest hover:opacity-90 transition-all" style={{ fontFamily: 'Heebo, sans-serif', backgroundColor: accentColor }}>
          צור קשר
        </button>
      </nav>
      <main className="max-w-[1280px] mx-auto px-[24px] pt-[140px]">
        {/* Header */}
        <header className="text-center mb-[48px]">
          <span className="text-[13px] uppercase tracking-[0.2em] mb-[16px] block" style={{ fontFamily: 'Heebo, sans-serif', color: accentColor }}>Editorial Series</span>
          <h1 className="text-[68px] md:text-[68px] text-[#2D2825] mb-[16px]" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.01em' }}>{galleryData.title}</h1>
          <div className="w-12 h-px mx-auto mb-[24px]" style={{ backgroundColor: accentColor }}></div>
          <p className="text-[18px] text-[#5A504A] leading-relaxed italic" style={{ fontFamily: 'Heebo, sans-serif' }}>
            {photoCount} תמונות • {galleryDate}
          </p>
        </header>

        {/* Masonry Grid */}
        <section className="columns-1 md:columns-2 gap-[32px] mb-[80px]">
          {photos.map((photo, index) => (
            <div key={photo.id} className="break-inside-avoid mb-[32px]">
              <div className="bg-[#eae8e5] overflow-hidden">
                {photo.url ? (
                  <Image
                    src={photo.url}
                    alt=""
                    width={600}
                    height={800}
                    className="w-full h-auto transition-transform duration-[1.2s] hover:scale-105"
                  />
                ) : null}
              </div>
            </div>
          ))}
        </section>

        {/* CTA Section */}
        {contactCardTitle || contactCardDescription ? (
          <section className="py-[80px] bg-[#f6f3f0] border-y border-[#d6c3bb]/20">
            <div className="max-w-[1280px] mx-auto px-[24px] text-center">
              <h2 className="text-[36px] mb-[24px]" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, lineHeight: '1.3' }}>
                {contactCardTitle || 'אהבתם את הסגנון?'}
              </h2>
              <p className="text-[16px] text-[#5A504A] mb-[48px] max-w-xl mx-auto" style={{ fontFamily: 'Heebo, sans-serif', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {contactCardDescription || 'אנחנו זמינים לצילום פרויקטים מיוחדים בארץ ובעולם. בואו נתכנן יחד את הסיפור הבא שלכם.'}
              </p>
              <div className="flex flex-col md:flex-row gap-[24px] justify-center items-center">
                <a className="text-white px-[48px] py-[16px] shadow-lg text-[13px] font-medium hover:opacity-90 transition-all" style={{ fontFamily: 'Heebo, sans-serif', backgroundColor: accentColor }} href="#">
                  הזמנת סשן דומה
                </a>
                <a className="border text-[13px] font-medium hover:bg-[--primary] hover:text-white transition-all px-[48px] py-[16px]" style={{ fontFamily: 'Heebo, sans-serif', borderColor: accentColor, color: accentColor }} href="#">
                  צרו קשר בוואטסאפ
                </a>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}

// DARK THEME VIEW
function DarkGalleryView({
  galleryData,
  photos,
  photoCount,
  galleryDate,
  accentColor,
  studioName,
  logoUrl,
  contactCardTitle,
  contactCardDescription
}: {
  galleryData: GalleryData
  userData: UserData | null
  photos: PhotoData[]
  photoCount: number
  galleryDate: string
  accentColor: string
  studioName: string
  logoUrl: string | null
  contactCardTitle: string | null
  contactCardDescription: string | null
}) {
  return (
    <div dir="rtl" lang="he" className="min-h-screen" style={{ backgroundColor: '#0A0A0A', direction: 'rtl', textAlign: 'right' }}>
      <header className="fixed top-0 w-full z-50 backdrop-blur-md shadow-sm" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)' }}>
        <nav className="flex justify-between items-center px-[24px] py-[16px] max-w-[1280px] mx-auto">
          <div className="text-[26px] tracking-tight" style={{ fontFamily: 'Frank Ruhl Libre, serif', fontWeight: 600, color: '#F3F0ED' }}>
            {studioName}
          </div>
          <div className="hidden md:flex gap-[24px] items-center text-[13px] uppercase tracking-widest" style={{ fontFamily: 'Heebo, sans-serif' }}>
            <a className="border-b pb-1 transition-all duration-300" style={{ color: accentColor, borderColor: accentColor }} href="#">גלריה</a>
            <a className="transition-colors duration-300" style={{ color: '#A0A0A0', fontFamily: 'Heebo, sans-serif' }} href="#">שירותים</a>
            <a className="transition-colors duration-300" style={{ color: '#A0A0A0', fontFamily: 'Heebo, sans-serif' }} href="#">אודות</a>
            <a className="transition-colors duration-300" style={{ color: '#A0A0A0', fontFamily: 'Heebo, sans-serif' }} href="#">צור קשר</a>
          </div>
          <button className="px-[24px] py-[8px] text-[13px] uppercase tracking-widest rounded-sm hover:opacity-90 transition-all shadow-md" style={{ fontFamily: 'Heebo, sans-serif', backgroundColor: accentColor, color: '#0A0A0A' }}>
            תאמו פגישה
          </button>
        </nav>
      </header>
      <main className="mt-[80px]">
        {/* Hero Section */}
        <section className="relative min-h-[200px] flex items-center justify-start overflow-hidden py-[24px]">
          <div className="relative z-10 text-right px-[24px] max-w-[1280px] mx-auto">
            <h1 className="mb-[8px]" style={{ fontSize: '48px', fontFamily: 'Frank Ruhl Libre, serif', fontWeight: 700, letterSpacing: '-0.01em', color: '#F3F0ED', lineHeight: '1.1' }}>
              {galleryData.title}
            </h1>
            <p style={{ fontSize: '16px', fontFamily: 'Heebo, sans-serif', color: '#A0A0A0', lineHeight: '1.4' }}>
              {galleryDate}
            </p>
          </div>
        </section>

        {/* Image Grid (Bento Style) */}
        <section className="max-w-[1280px] mx-auto px-[24px] py-[80px]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-[24px] h-auto md:h-[1200px]">
            {photos.map((photo, index) => {
              const isLargeVertical = index === 0
              const isWide = index === 1
              const isSmall = index >= 2 && index <= 3
              
              return (
                <div 
                  key={photo.id} 
                  className={`group relative overflow-hidden rounded-sm ${
                    isLargeVertical ? 'md:col-span-4 md:row-span-2' : isWide ? 'md:col-span-8 md:row-span-1' : isSmall ? 'md:col-span-4 md:row-span-1' : 'md:col-span-4 md:row-span-1'
                  }`}
                >
                  {photo.url ? (
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : null}
                  <div className="overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-[24px]" style={{ backgroundColor: `${accentColor}33` }}>
                    <div style={{ color: '#0A0A0A' }}>
                      <h3 style={{ fontSize: '26px', fontFamily: 'Frank Ruhl Libre, serif', fontWeight: 600, lineHeight: '1.4' }}>{galleryData.title}</h3>
                      <p className="uppercase tracking-widest" style={{ fontSize: '13px', fontFamily: 'Heebo, sans-serif', letterSpacing: '0.06em', fontWeight: 500 }}>תמונה {index + 1}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA Section */}
        {contactCardTitle || contactCardDescription ? (
          <section style={{ backgroundColor: '#1A1A1A', padding: '80px 0' }}>
            <div className="max-w-[1280px] mx-auto px-[24px] text-center">
              <h2 className="mb-[24px]" style={{ fontSize: '36px', fontFamily: 'Frank Ruhl Libre, serif', fontWeight: 600, color: '#F3F0ED' }}>
                {contactCardTitle || 'הסיפור שלכם מתחיל כאן'}
              </h2>
              <p className="mb-[48px] max-w-xl mx-auto" style={{ fontSize: '16px', fontFamily: 'Heebo, sans-serif', color: '#A0A0A0', whiteSpace: 'pre-line' }}>
                {contactCardDescription || 'אנחנו מחפשים את הרגעים שמעבר למילים. בואו ניצור יחד משהו בלתי נשכח שיישאר איתכם לנצח.'}
              </p>
              <div className="flex flex-col md:flex-row gap-[24px] justify-center items-center">
                <button className="px-[48px] py-[8px] text-[13px] uppercase tracking-widest rounded-sm hover:shadow-xl transition-all shadow-lg transform hover:-translate-y-1" style={{ fontFamily: 'Heebo, sans-serif', backgroundColor: accentColor, color: '#0A0A0A' }}>
                  תאמו פגישה
              </button>
              <button className="border text-[13px] uppercase tracking-widest rounded-sm hover:bg-[--primary]/10 transition-all px-[48px] py-[8px]" style={{ fontFamily: 'Heebo, sans-serif', borderColor: accentColor, color: accentColor }}>
                צפו בחבילות
              </button>
            </div>
          </div>
        </section>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}

export async function generateMetadata({ params }: PublicGalleryPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('galleries')
    .select('id, title, is_public, user_id')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  type GalleryMetadata = { id: string; title: string; is_public: boolean; user_id: string }
  const gallery = data as GalleryMetadata | null

  if (!gallery) {
    return {
      title: 'גלריה לא נמצאה',
    }
  }

  const admin = createAdminClient()
  const { data: user } = await admin
    .from('users')
    .select('studio_name')
    .eq('id', gallery.user_id)
    .single()

  type UserMetadata = { studio_name: string | null }
  const userData = user as UserMetadata | null

  return {
    title: `${gallery.title} | ${userData?.studio_name || 'Studio Gallery'}`,
    description: `גלריה ציבורית מאת ${userData?.studio_name || 'Studio Gallery'}`,
  }
}
