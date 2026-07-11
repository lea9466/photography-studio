'use client'

import { useState } from 'react'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { finalizeBrandingUpload, prepareBrandingUpload, removeBrandingImage } from '@/lib/actions/branding.actions'
import { compressBrandingFile } from '@/lib/branding-upload-client'
import { putToPresignedUrl } from '@/lib/r2/upload-client'
import { BrandingPreviewImage } from '@/components/dashboard/BrandingPreviewImage'
import { LabelWithHelp } from '@/components/ui/label-with-help'
import { SITE_SETTINGS_HELP } from '@/lib/dashboard/site-settings-help'
import { cn } from '@/lib/utils'

const UPLOAD_ZONE_CLASS =
  'relative cursor-pointer overflow-hidden rounded-xl border border-[--border]/80 bg-[#7D3A52]/[0.03] transition-all hover:border-[#7D3A52]/35 hover:shadow-sm hover:shadow-[#7D3A52]/5'

type PackagesBgType = 'packages_desktop' | 'packages_mobile'

function uploadTargetKey(type: PackagesBgType) {
  return type
}

function UploadSpinnerOverlay({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 pointer-events-none">
      <Loader2 className="h-10 w-10 animate-spin text-white" />
    </div>
  )
}

type PackagesSectionBackgroundProps = {
  initialDesktopUrl: string | null
  initialMobileUrl: string | null
}

export function PackagesSectionBackground({
  initialDesktopUrl,
  initialMobileUrl,
}: PackagesSectionBackgroundProps) {
  const [packagesDesktopUrl, setPackagesDesktopUrl] = useState(initialDesktopUrl ?? '')
  const [packagesMobileUrl, setPackagesMobileUrl] = useState(initialMobileUrl ?? '')
  const [uploadingTargets, setUploadingTargets] = useState<ReadonlySet<string>>(() => new Set())
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({})
  const [previewVersions, setPreviewVersions] = useState<Record<string, number>>({})

  function setTargetUploading(targetKey: string, uploading: boolean) {
    setUploadingTargets((prev) => {
      const next = new Set(prev)
      if (uploading) next.add(targetKey)
      else next.delete(targetKey)
      return next
    })
  }

  function brandingPreviewSrc(targetKey: string, storedPath: string) {
    return localPreviews[targetKey] ?? storedPath
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: PackagesBgType
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    const targetKey = uploadTargetKey(type)
    const blobUrl = URL.createObjectURL(file)
    setLocalPreviews((prev) => ({ ...prev, [targetKey]: blobUrl }))
    setTargetUploading(targetKey, true)
    try {
      const uploadFile = await compressBrandingFile(file)
      const { uploadUrl, path } = await prepareBrandingUpload({
        type,
        fileName: uploadFile.name,
        contentType: uploadFile.type,
        fileSize: uploadFile.size,
      })

      await putToPresignedUrl(uploadUrl, uploadFile)

      const result = await finalizeBrandingUpload(type, path)
      if (result.success && result.path) {
        const storedPath = result.path
        if (type === 'packages_desktop') setPackagesDesktopUrl(storedPath)
        if (type === 'packages_mobile') setPackagesMobileUrl(storedPath)
        setPreviewVersions((prev) => ({ ...prev, [targetKey]: Date.now() }))
        toast.success('התמונה הועלתה בהצלחה')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה')
    } finally {
      URL.revokeObjectURL(blobUrl)
      setLocalPreviews((prev) => {
        const next = { ...prev }
        delete next[targetKey]
        return next
      })
      setTargetUploading(targetKey, false)
      e.target.value = ''
    }
  }

  async function handleRemoveBrandingImage(type: PackagesBgType) {
    const targetKey = uploadTargetKey(type)
    setTargetUploading(targetKey, true)
    try {
      await removeBrandingImage(type)
      if (type === 'packages_desktop') setPackagesDesktopUrl('')
      if (type === 'packages_mobile') setPackagesMobileUrl('')
      toast.success('התמונה הוסרה')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בהסרת התמונה')
    } finally {
      setTargetUploading(targetKey, false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <LabelWithHelp
            htmlFor="packages-desktop"
            help={SITE_SETTINGS_HELP.fields.packagesBgDesktop.content}
            where={SITE_SETTINGS_HELP.fields.packagesBgDesktop.where}
          >
            רקע חבילות (דסקטופ)
          </LabelWithHelp>
          <div className={cn(UPLOAD_ZONE_CLASS, 'group aspect-video')}>
            {brandingPreviewSrc('packages_desktop', packagesDesktopUrl) ? (
              <BrandingPreviewImage
                src={brandingPreviewSrc('packages_desktop', packagesDesktopUrl)}
                cacheKey={previewVersions.packages_desktop}
                alt="Packages desktop background preview"
                className="object-cover pointer-events-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[--muted]">
                <Upload className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-white text-sm font-medium">החלף תמונה</span>
            </div>
            <UploadSpinnerOverlay show={uploadingTargets.has(uploadTargetKey('packages_desktop'))} />
            {packagesDesktopUrl ? (
              <button
                type="button"
                onClick={() => handleRemoveBrandingImage('packages_desktop')}
                disabled={uploadingTargets.has(uploadTargetKey('packages_desktop'))}
                className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                aria-label="הסר תמונה"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <input
              id="packages-desktop"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileUpload(e, 'packages_desktop')}
              disabled={uploadingTargets.has(uploadTargetKey('packages_desktop'))}
              className="absolute inset-0 z-10 opacity-0 cursor-pointer"
            />
          </div>
        </div>
        <div className="space-y-3">
          <LabelWithHelp
            htmlFor="packages-mobile"
            help={SITE_SETTINGS_HELP.fields.packagesBgMobile.content}
            where={SITE_SETTINGS_HELP.fields.packagesBgMobile.where}
          >
            רקע חבילות (מובייל)
          </LabelWithHelp>
          <div className={cn(UPLOAD_ZONE_CLASS, 'group mx-auto aspect-[9/16] max-w-[200px]')}>
            {brandingPreviewSrc('packages_mobile', packagesMobileUrl) ? (
              <BrandingPreviewImage
                src={brandingPreviewSrc('packages_mobile', packagesMobileUrl)}
                cacheKey={previewVersions.packages_mobile}
                alt="Packages mobile background preview"
                className="object-cover pointer-events-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[--muted]">
                <Upload className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-white text-sm font-medium">החלף תמונה</span>
            </div>
            <UploadSpinnerOverlay show={uploadingTargets.has(uploadTargetKey('packages_mobile'))} />
            {packagesMobileUrl ? (
              <button
                type="button"
                onClick={() => handleRemoveBrandingImage('packages_mobile')}
                disabled={uploadingTargets.has(uploadTargetKey('packages_mobile'))}
                className="absolute top-2 left-2 z-20 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                aria-label="הסר תמונה"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <input
              id="packages-mobile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileUpload(e, 'packages_mobile')}
              disabled={uploadingTargets.has(uploadTargetKey('packages_mobile'))}
              className="absolute inset-0 z-10 opacity-0 cursor-pointer"
            />
          </div>
        </div>
    </div>
  )
}
