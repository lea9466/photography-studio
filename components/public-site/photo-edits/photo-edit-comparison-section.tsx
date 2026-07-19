import { PhotoRevealLensComparison } from '@/components/public-site/photo-edits/photo-reveal-lens-comparison'

type PhotoEditComparisonSectionProps = {
  originalImageUrl: string
  editedImageUrl: string
  title?: string | null
  description?: string | null
  displayStyle?: string
  priority?: boolean
  index?: number
  language?: 'he' | 'en'
}

export function PhotoEditComparisonSection({
  originalImageUrl,
  editedImageUrl,
  title,
  description,
  priority,
  index = 0,
  language = 'he',
}: PhotoEditComparisonSectionProps) {
  return (
    <section className="py-10 md:py-16">
      <PhotoRevealLensComparison
        originalImageUrl={originalImageUrl}
        editedImageUrl={editedImageUrl}
        title={title}
        description={description}
        priority={priority}
        index={index}
        language={language}
      />
    </section>
  )
}
