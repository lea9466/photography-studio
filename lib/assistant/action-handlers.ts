import type { requireDashboardContext } from '@/lib/auth/dashboard-context'
import type { ProFeature } from '@/lib/subscriptions/types'
import type { AssistantActionType } from '@/lib/validations/dashboard-assistant'
import { updateProfile } from '@/lib/actions/feedback.actions'
import { createPackage, updatePackage, deletePackage } from '@/lib/actions/package.actions'
import { createPost, deletePost } from '@/lib/actions/post.actions'
import { updateFaqItems } from '@/lib/actions/faq.actions'
import { updateBrandingSettings, finalizeBrandingUpload, removeHeroImageSlot } from '@/lib/actions/branding.actions'
import { deleteTestimonial } from '@/lib/actions/testimonials.actions'
import { parseFaqItems, type FaqItem } from '@/lib/faq'
import { ASSISTANT_ABOUT_FIELDS, ASSISTANT_CONTACT_FIELDS } from '@/lib/validations/dashboard-assistant'

type DashboardSupabaseClient = Awaited<ReturnType<typeof requireDashboardContext>>['supabase']

export type AssistantActionContext = {
  userId: string
  supabase: DashboardSupabaseClient
}

export type AssistantActionHandler = {
  proFeature: ProFeature | null
  execute: (
    ctx: AssistantActionContext,
    payload: Record<string, unknown>
  ) => Promise<{ previousState: Record<string, unknown> }>
  undo: (ctx: AssistantActionContext, previousState: Record<string, unknown>) => Promise<void>
}

async function fetchUsersFields(ctx: AssistantActionContext, fields: readonly string[]) {
  const { data } = await ctx.supabase.from('users').select(fields.join(',')).eq('id', ctx.userId).maybeSingle()
  return (data ?? {}) as Record<string, unknown>
}

export const ASSISTANT_ACTION_HANDLERS: Record<AssistantActionType, AssistantActionHandler> = {
  update_about_section: {
    proFeature: null,
    async execute(ctx, payload) {
      const previousState = await fetchUsersFields(ctx, ASSISTANT_ABOUT_FIELDS)
      await updateProfile(payload as never)
      return { previousState }
    },
    async undo(_ctx, previousState) {
      await updateProfile(previousState as never)
    },
  },

  update_contact_form: {
    proFeature: null,
    async execute(ctx, payload) {
      const previousState = await fetchUsersFields(ctx, ASSISTANT_CONTACT_FIELDS)
      await updateProfile(payload as never)
      return { previousState }
    },
    async undo(_ctx, previousState) {
      await updateProfile(previousState as never)
    },
  },

  create_package: {
    proFeature: 'packages',
    async execute(_ctx, payload) {
      const input = payload as { name: string; price_amount: number; duration_text?: string; includes: string[] }
      const created = await createPackage({
        name: input.name,
        priceAmount: input.price_amount,
        durationText: input.duration_text,
        includesText: input.includes.join('\n'),
      })
      return { previousState: { created_package_id: created.id } }
    },
    async undo(_ctx, previousState) {
      await deletePackage(previousState.created_package_id as string)
    },
  },

  update_package: {
    proFeature: 'packages',
    async execute(ctx, payload) {
      const input = payload as {
        package_id: string
        name?: string
        price_amount?: number
        duration_text?: string
        includes?: string[]
      }
      const { data: before } = await ctx.supabase
        .from('photography_packages')
        .select('name, price_amount, duration_text, includes')
        .eq('id', input.package_id)
        .eq('user_id', ctx.userId)
        .maybeSingle()
      if (!before) throw new Error('החבילה לא נמצאה')
      const beforeRow = before as Record<string, unknown>

      await updatePackage(input.package_id, {
        name: input.name,
        priceAmount: input.price_amount,
        durationText: input.duration_text,
        includesText: input.includes ? input.includes.join('\n') : undefined,
      })

      return { previousState: { package_id: input.package_id, ...beforeRow } }
    },
    async undo(_ctx, previousState) {
      const prev = previousState as {
        package_id: string
        name: string
        price_amount: number
        duration_text: string | null
        includes: string[]
      }
      await updatePackage(prev.package_id, {
        name: prev.name,
        priceAmount: prev.price_amount,
        durationText: prev.duration_text ?? undefined,
        includesText: prev.includes.join('\n'),
      })
    },
  },

  delete_package: {
    proFeature: 'packages',
    async execute(ctx, payload) {
      const input = payload as { package_id: string }
      const { data: before } = await ctx.supabase
        .from('photography_packages')
        .select('*')
        .eq('id', input.package_id)
        .eq('user_id', ctx.userId)
        .maybeSingle()
      if (!before) throw new Error('החבילה לא נמצאה')
      await deletePackage(input.package_id)
      return { previousState: { row: before } }
    },
    async undo(ctx, previousState) {
      const row = previousState.row as Record<string, unknown>
      const { error } = await ctx.supabase.from('photography_packages').insert(row as never)
      if (error) throw new Error(error.message)
    },
  },

  create_blog_post: {
    proFeature: 'posts',
    async execute(_ctx, payload) {
      const input = payload as { title: string; subtitle?: string; content: string }
      const created = await createPost({ title: input.title, subtitle: input.subtitle, content: input.content })
      return { previousState: { created_post_id: created.id } }
    },
    async undo(_ctx, previousState) {
      await deletePost(previousState.created_post_id as string)
    },
  },

  add_faq_item: {
    proFeature: 'faq',
    async execute(ctx, payload) {
      const input = payload as { question: string; answer: string }
      const { data: profile } = await ctx.supabase
        .from('users')
        .select('faq_items')
        .eq('id', ctx.userId)
        .maybeSingle()
      const current = parseFaqItems((profile as { faq_items: unknown } | null)?.faq_items)
      const next: FaqItem[] = [...current, { question: input.question, answer: input.answer }]
      await updateFaqItems(next)
      return { previousState: { faq_items: current } }
    },
    async undo(_ctx, previousState) {
      await updateFaqItems(previousState.faq_items as FaqItem[])
    },
  },

  update_theme: {
    proFeature: null,
    async execute(ctx, payload) {
      const input = payload as { selected_theme: string }
      const { data: before } = await ctx.supabase
        .from('users')
        .select('selected_theme')
        .eq('id', ctx.userId)
        .maybeSingle()
      await updateBrandingSettings({ selectedTheme: input.selected_theme })
      return {
        previousState: { selected_theme: (before as { selected_theme: string } | null)?.selected_theme ?? 'classic' },
      }
    },
    async undo(_ctx, previousState) {
      await updateBrandingSettings({ selectedTheme: previousState.selected_theme as string })
    },
  },

  create_testimonial: {
    // The source image (if any) was already discarded by the time this
    // runs — only the extracted text ever reaches here (assistant spec §2.8).
    proFeature: 'testimonials',
    async execute(ctx, payload) {
      const input = payload as { title: string; content: string; shoot_type?: string }
      const { data, error } = await ctx.supabase
        .from('testimonials')
        .insert({
          user_id: ctx.userId,
          title: input.title,
          content: input.content,
          shoot_type: input.shoot_type || null,
          is_featured: false,
          image_url: null,
        } as never)
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      return { previousState: { created_testimonial_id: (data as { id: string }).id } }
    },
    async undo(_ctx, previousState) {
      await deleteTestimonial(previousState.created_testimonial_id as string)
    },
  },

  delete_blog_post: {
    proFeature: 'posts',
    async execute(ctx, payload) {
      const input = payload as { post_id: string }
      const { data: before } = await ctx.supabase
        .from('posts')
        .select('*')
        .eq('id', input.post_id)
        .eq('user_id', ctx.userId)
        .maybeSingle()
      if (!before) throw new Error('הפוסט לא נמצא')
      // Undo only restores the post row, not any photos attached to it —
      // deletePost() removes their R2 objects, which Undo never reverses
      // (assistant spec §3.1). Bot-created posts never have photos, so this
      // is a full, safe restore for anything the assistant itself deleted.
      await deletePost(input.post_id)
      return { previousState: { row: before } }
    },
    async undo(ctx, previousState) {
      const row = previousState.row as Record<string, unknown>
      const { error } = await ctx.supabase.from('posts').insert(row as never)
      if (error) throw new Error(error.message)
    },
  },

  delete_faq_item: {
    proFeature: 'faq',
    async execute(ctx, payload) {
      const input = payload as { question: string }
      const { data: profile } = await ctx.supabase
        .from('users')
        .select('faq_items')
        .eq('id', ctx.userId)
        .maybeSingle()
      const current = parseFaqItems((profile as { faq_items: unknown } | null)?.faq_items)
      const next = current.filter((item) => item.question !== input.question)
      await updateFaqItems(next)
      return { previousState: { faq_items: current } }
    },
    async undo(_ctx, previousState) {
      await updateFaqItems(previousState.faq_items as FaqItem[])
    },
  },

  delete_testimonial: {
    proFeature: 'testimonials',
    async execute(ctx, payload) {
      const input = payload as { testimonial_id: string }
      const { data: before } = await ctx.supabase
        .from('testimonials')
        .select('*')
        .eq('id', input.testimonial_id)
        .eq('user_id', ctx.userId)
        .maybeSingle()
      if (!before) throw new Error('ההמלצה לא נמצאה')
      await deleteTestimonial(input.testimonial_id)
      return { previousState: { row: before } }
    },
    async undo(ctx, previousState) {
      const row = previousState.row as Record<string, unknown>
      const { error } = await ctx.supabase.from('testimonials').insert(row as never)
      if (error) throw new Error(error.message)
    },
  },

  set_hero_image: {
    // Setting a static hero image is a base capability, not a Pro feature —
    // only *video* hero mode is gated (see PRO_FEATURES / assistant spec §2.7).
    proFeature: null,
    async execute(ctx, payload) {
      // slot is 1-based on the wire (matches how it's shown to the model
      // and photographer: "סלוט 1/2/3") — the DB array and
      // finalizeBrandingUpload/removeHeroImageSlot are 0-based.
      const input = payload as { path: string; slot: number }
      const slotIndex = input.slot - 1
      const { data: before } = await ctx.supabase
        .from('users')
        .select('hero_desktop_urls')
        .eq('id', ctx.userId)
        .maybeSingle()
      const beforeRow = (before ?? {}) as { hero_desktop_urls?: string[] | null }
      const previousSlotValue = beforeRow.hero_desktop_urls?.[slotIndex] || null

      await finalizeBrandingUpload('hero_desktop', input.path, slotIndex)

      return { previousState: { slot_index: slotIndex, previous_value: previousSlotValue } }
    },
    async undo(_ctx, previousState) {
      const slotIndex = previousState.slot_index as number
      const previousValue = previousState.previous_value as string | null
      if (previousValue) {
        await finalizeBrandingUpload('hero_desktop', previousValue, slotIndex)
      } else {
        await removeHeroImageSlot({ variant: 'desktop', slot: slotIndex })
      }
    },
  },

  set_slug: {
    proFeature: null,
    async execute(ctx, payload) {
      const input = payload as { slug: string }
      const { data: before } = await ctx.supabase.from('users').select('slug').eq('id', ctx.userId).maybeSingle()
      // updateProfile() only clears the slug when given '' (not null) — see
      // buildProfileUpdateData in feedback.actions.ts — so undo must store
      // "no slug" as '' to correctly restore that state, not as null.
      const previousSlug = (before as { slug: string | null } | null)?.slug ?? ''
      await updateProfile({ slug: input.slug } as never)
      return { previousState: { slug: previousSlug } }
    },
    async undo(_ctx, previousState) {
      await updateProfile({ slug: previousState.slug as string } as never)
    },
  },
}
