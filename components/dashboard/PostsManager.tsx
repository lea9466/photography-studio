'use client'

import { useEffect, useState, useTransition } from 'react'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Card } from '@/components/ui/card'
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
    startTransition(async () => {
      try {
        if (editingId) {
          await updatePost(editingId, {
            title: form.title,
            subtitle: form.subtitle || null,
            content: form.content,
            watermarkText: form.watermarkText || null,
            autoApplyWatermark: form.autoApplyWatermark,
          })
          setPosts((current) =>
            current.map((post) =>
              post.id === editingId
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
          setSavedPostId(editingId)
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
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-[--border] bg-[--dashboard-surface] p-4">
        <div>
          <h2 className="text-base font-semibold text-[--foreground]">כותרת עמוד הבלוג</h2>
          <p className="mt-1 text-sm text-[--muted]">
            הכותרת מוצגת בראש עמוד הבלוג הציבורי. אם השדה ריק, תוצג ברירת המחדל של ערכת העיצוב.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="posts-page-title">כותרת</Label>
          <Input
            id="posts-page-title"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            placeholder={pageTitlePlaceholder}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handlePageTitleSave}
            disabled={isTitlePending}
          >
            {isTitlePending ? 'שומר...' : 'שמור כותרת'}
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 ml-1" />
          פוסט חדש
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-[--muted]" />
          <p className="text-sm text-[--muted]">עדיין אין פוסטים. צרי את הפוסט הראשון שלך.</p>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 ml-1" />
            פוסט חדש
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[--foreground]">{post.title}</h3>
                  {post.subtitle && (
                    <p className="mt-0.5 text-sm text-[--muted]">{post.subtitle}</p>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm text-[--foreground]/80">
                    {post.content}
                  </p>
                  <p className="mt-2 text-xs text-[--muted]">
                    {formatDate(post.created_at)} · {post.post_photos.length} תמונות
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(post)}
                  >
                    <Pencil className="h-4 w-4 ml-1" />
                    עריכה
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(post.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    מחק
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת פוסט' : 'פוסט חדש'}</DialogTitle>
            <DialogDescription>
              {activePostId
                ? 'ערכי את הטקסט והוסיפי עד 10 תמונות לפוסט.'
                : 'מלאי את פרטי הפוסט ושמרי כדי להוסיף תמונות.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="post-title">כותרת *</Label>
              <Input
                id="post-title"
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="כותרת הפוסט"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-subtitle">כותרת משנה</Label>
              <Input
                id="post-subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((current) => ({ ...current, subtitle: e.target.value }))}
                placeholder="אופציונלי"
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
              />
            </div>

            <div className="space-y-3 rounded-xl border border-[--border] bg-[--background] p-4">
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
              {form.autoApplyWatermark && (
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
                  />
                  <p className="text-xs text-[--muted]">
                    אם השדה ריק, יוצג שם הסטודיו שלך
                  </p>
                </div>
              )}
            </div>

            {activePostId && activePost && (
              <PostPhotosSection
                postId={activePostId}
                userId={userId}
                watermarkText={resolveWatermarkText(form.watermarkText, studioName)}
                applyAutoWatermark={form.autoApplyWatermark}
                photos={activePost.post_photos}
                coverPhotoId={activePost.cover_photo_id}
                signedUrls={signedUrls}
              />
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeDialog}>
              {activePostId ? 'סגור' : 'ביטול'}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'שומר...' : activePostId ? 'שמור שינויים' : 'שמור והמשך'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
