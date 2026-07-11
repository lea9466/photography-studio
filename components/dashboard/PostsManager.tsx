'use client'

import { useEffect, useState, useTransition } from 'react'
import { FileText, Heading, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPost,
  deletePost,
  updatePost,
  updatePostsPageTitle,
  type PostWithPhotos,
} from '@/lib/actions/post.actions'
import { resolvePostsPageTitle } from '@/lib/posts-section-copy'
import { PostPhotosSection } from '@/components/dashboard/PostPhotosSection'
import { resolveWatermarkText } from '@/lib/images/process'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const INPUT_CLASS =
  'border-[#7D3A52]/10 bg-[#7D3A52]/[0.04] shadow-sm transition-[border-color,box-shadow,background-color] focus-visible:border-[#7D3A52]/25 focus-visible:bg-[#7D3A52]/[0.07] focus-visible:ring-2 focus-visible:ring-[#7D3A52]/10'
const ACCENT_BUTTON_CLASS =
  'bg-[#7D3A52] text-white shadow-md shadow-[#7D3A52]/25 hover:bg-[#6a2f44] focus-visible:ring-[#7D3A52]/40'

function PostsSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative space-y-7 overflow-hidden rounded-2xl border border-[--border]/80 bg-[--dashboard-surface] p-6 shadow-[0_2px_10px_rgba(125,58,82,0.04)] md:p-8',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-5 right-0 w-0.5 rounded-full bg-gradient-to-b from-[#7D3A52]/30 via-[#7D3A52]/10 to-transparent"
        aria-hidden
      />
      {children}
    </section>
  )
}

function PostsSubPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'space-y-5 rounded-xl border border-[--border]/60 bg-white/80 p-5 shadow-sm shadow-[#7D3A52]/[0.03] md:p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

function PostsSectionHeader({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: typeof FileText
  title: string
  description?: string
  index?: number
}) {
  return (
    <div className="space-y-3 border-b border-[#7D3A52]/10 pb-5">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52] ring-1 ring-[#7D3A52]/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {index !== undefined ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7D3A52]/10 px-1.5 text-[10px] font-semibold text-[#7D3A52]">
                {index}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold text-[--foreground]">{title}</h2>
          </div>
          {description ? (
            <p className="text-xs leading-relaxed text-[--muted]">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type PostsManagerProps = {
  initialPosts: PostWithPhotos[]
  userId: string
  studioName?: string | null
  selectedTheme?: string
  initialPageTitle?: string | null
  signedUrls: Record<string, string>
}

type PostFormState = {
  title: string
  subtitle: string
  content: string
  watermarkText: string
  autoApplyWatermark: boolean
}

const EMPTY_FORM: PostFormState = {
  title: '',
  subtitle: '',
  content: '',
  watermarkText: '',
  autoApplyWatermark: true,
}

function postToForm(post: PostWithPhotos): PostFormState {
  return {
    title: post.title,
    subtitle: post.subtitle ?? '',
    content: post.content,
    watermarkText: post.watermark_text ?? '',
    autoApplyWatermark: post.auto_apply_watermark ?? true,
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PostsManager({
  initialPosts,
  userId,
  studioName,
  selectedTheme = 'elegant',
  initialPageTitle,
  signedUrls,
}: PostsManagerProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM)
  const [savedPostId, setSavedPostId] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState(initialPageTitle ?? '')
  const [isTitlePending, startTitleTransition] = useTransition()

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const pageTitlePlaceholder = resolvePostsPageTitle(selectedTheme, null)

  function handlePageTitleSave() {
    startTitleTransition(async () => {
      try {
        const updated = await updatePostsPageTitle({ title: pageTitle })
        setPageTitle(updated.posts_page_title ?? '')
        toast.success('כותרת עמוד הבלוג נשמרה')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  const activePostId = savedPostId ?? editingId
  const activePost = activePostId
    ? posts.find((post) => post.id === activePostId) ?? null
    : null

  function openCreateDialog() {
    setEditingId(null)
    setSavedPostId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEditDialog(post: PostWithPhotos) {
    setEditingId(post.id)
    setSavedPostId(null)
    setForm(postToForm(post))
    setDialogOpen(true)
  }

  function handleSubmit() {
    const postIdToUpdate = editingId ?? savedPostId

    if (postIdToUpdate && activePost) {
      const original = postToForm(activePost)
      const unchanged =
        form.title.trim() === original.title.trim() &&
        form.subtitle.trim() === original.subtitle.trim() &&
        form.content.trim() === original.content.trim() &&
        form.watermarkText.trim() === original.watermarkText.trim() &&
        form.autoApplyWatermark === original.autoApplyWatermark

      if (unchanged) {
        toast.message('אין שינויים לשמירה')
        return
      }
    }

    startTransition(async () => {
      try {
        if (postIdToUpdate) {
          await updatePost(postIdToUpdate, {
            title: form.title,
            subtitle: form.subtitle || null,
            content: form.content,
            watermarkText: form.watermarkText || null,
            autoApplyWatermark: form.autoApplyWatermark,
          })
          setPosts((current) =>
            current.map((post) =>
              post.id === postIdToUpdate
                ? {
                    ...post,
                    title: form.title.trim(),
                    subtitle: form.subtitle.trim() || null,
                    content: form.content.trim(),
                    watermark_text: form.watermarkText.trim() || null,
                    auto_apply_watermark: form.autoApplyWatermark,
                  }
                : post
            )
          )
          setSavedPostId(postIdToUpdate)
          setEditingId(null)
          toast.success('הפוסט עודכן')
        } else {
          const { id } = await createPost({
            title: form.title,
            subtitle: form.subtitle || null,
            content: form.content,
            watermarkText: form.watermarkText || null,
            autoApplyWatermark: form.autoApplyWatermark,
          })
          const newPost: PostWithPhotos = {
            id,
            user_id: userId,
            title: form.title.trim(),
            subtitle: form.subtitle.trim() || null,
            content: form.content.trim(),
            watermark_text: form.watermarkText.trim() || null,
            auto_apply_watermark: form.autoApplyWatermark,
            cover_photo_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            post_photos: [],
          }
          setPosts((current) => [newPost, ...current])
          setSavedPostId(id)
          toast.success('הפוסט נוצר — אפשר להוסיף תמונות')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function handleDelete(postId: string) {
    if (!window.confirm('למחוק את הפוסט וכל התמונות שלו?')) return

    startTransition(async () => {
      try {
        await deletePost(postId)
        setPosts((current) => current.filter((post) => post.id !== postId))
        if (editingId === postId || savedPostId === postId) {
          setDialogOpen(false)
        }
        toast.success('הפוסט נמחק')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'שגיאה')
      }
    })
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingId(null)
    setSavedPostId(null)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PostsSection>
        <PostsSectionHeader
          index={1}
          icon={Heading}
          title="כותרת עמוד הבלוג"
          description="הכותרת מוצגת בראש עמוד הבלוג הציבורי. אם השדה ריק, תוצג ברירת המחדל של ערכת העיצוב."
        />
        <div className="space-y-2">
          <Label htmlFor="posts-page-title">כותרת</Label>
          <Input
            id="posts-page-title"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            placeholder={pageTitlePlaceholder}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handlePageTitleSave}
            disabled={isTitlePending}
            className="border-[#7D3A52]/20 text-[#7D3A52] hover:bg-[#7D3A52]/5"
          >
            {isTitlePending ? 'שומר...' : 'שמור כותרת'}
          </Button>
        </div>
      </PostsSection>

      <PostsSection>
        <PostsSectionHeader
          index={2}
          icon={FileText}
          title="הפוסטים שלי"
          description="צרי, ערכי ונהלי את הפוסטים שמוצגים בבלוג ובדף הבית."
        />

        <div className="flex justify-end">
          <Button type="button" onClick={openCreateDialog} className={ACCENT_BUTTON_CLASS}>
            <Plus className="h-4 w-4 ml-1" />
            פוסט חדש
          </Button>
        </div>

        {posts.length === 0 ? (
          <PostsSubPanel className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7D3A52]/[0.08] text-[#7D3A52]">
              <FileText className="h-7 w-7" />
            </div>
            <p className="text-sm text-[--muted]">עדיין אין פוסטים. צרי את הפוסט הראשון שלך.</p>
            <Button type="button" onClick={openCreateDialog} className={ACCENT_BUTTON_CLASS}>
              <Plus className="h-4 w-4 ml-1" />
              פוסט חדש
            </Button>
          </PostsSubPanel>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostsSubPanel key={post.id} className="transition-colors hover:border-[#7D3A52]/20">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="font-semibold text-[--foreground]">{post.title}</h3>
                    {post.subtitle ? (
                      <p className="text-sm text-[--muted]">{post.subtitle}</p>
                    ) : null}
                    <p className="line-clamp-2 text-sm leading-relaxed text-[--foreground]/80">
                      {post.content}
                    </p>
                    <p className="text-xs text-[--muted]">
                      {formatDate(post.created_at)} · {post.post_photos.length} תמונות
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(post)}
                      className="border-[#7D3A52]/15 hover:bg-[#7D3A52]/5"
                    >
                      <Pencil className="h-4 w-4 ml-1" />
                      עריכה
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(post.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      מחק
                    </Button>
                  </div>
                </div>
              </PostsSubPanel>
            ))}
          </div>
        )}
      </PostsSection>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[--border]/80">
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת פוסט' : 'פוסט חדש'}</DialogTitle>
            <DialogDescription>
              {activePostId
                ? 'ערכי את הטקסט והוסיפי עד 10 תמונות לפוסט.'
                : 'מלאי את פרטי הפוסט ושמרי כדי להוסיף תמונות.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="post-title">כותרת *</Label>
              <Input
                id="post-title"
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="כותרת הפוסט"
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-subtitle">כותרת משנה</Label>
              <Input
                id="post-subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((current) => ({ ...current, subtitle: e.target.value }))}
                placeholder="אופציונלי"
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-content">תוכן *</Label>
              <Textarea
                id="post-content"
                value={form.content}
                onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))}
                placeholder="טקסט הפוסט"
                rows={6}
                className={cn(INPUT_CLASS, 'resize-y')}
              />
            </div>

            <PostsSubPanel className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Label>הטבע סימן מים על תמונות</Label>
                  <p className="mt-1 text-xs text-[--muted]">
                    בעת העלאת תמונות לפוסט, הטקסט יוחל על גרסת התצוגה
                  </p>
                </div>
                <Switch
                  checked={form.autoApplyWatermark}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, autoApplyWatermark: checked }))
                  }
                />
              </div>
              {form.autoApplyWatermark ? (
                <div className="space-y-2">
                  <Label htmlFor="post-watermark">טקסט סימן המים</Label>
                  <Input
                    id="post-watermark"
                    value={form.watermarkText}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, watermarkText: e.target.value }))
                    }
                    placeholder={
                      studioName
                        ? `ברירת מחדל: ${studioName}`
                        : 'למשל: © שם הסטודיו'
                    }
                    className={INPUT_CLASS}
                  />
                  <p className="text-xs text-[--muted]">
                    אם השדה ריק, יוצג שם הסטודיו שלך
                  </p>
                </div>
              ) : null}
            </PostsSubPanel>

            {activePostId && activePost ? (
              <PostPhotosSection
                postId={activePostId}
                userId={userId}
                watermarkText={resolveWatermarkText(form.watermarkText, studioName)}
                applyAutoWatermark={form.autoApplyWatermark}
                photos={activePost.post_photos}
                coverPhotoId={activePost.cover_photo_id}
                signedUrls={signedUrls}
              />
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeDialog}>
              {activePostId ? 'סגור' : 'ביטול'}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className={ACCENT_BUTTON_CLASS}
            >
              {isPending ? 'שומר...' : activePostId ? 'שמור שינויים' : 'שמור והמשך'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
