'use server'

import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveBrandingPath } from '@/lib/branding-urls'
import { normalizeHexColor } from '@/lib/branding/client-page-colors'
import {
  isClientPageHeroStyle,
  resolveClientPageHeroStyle,
  type ClientPageHeroStyle,
} from '@/lib/branding/client-page-hero-style'
import {
  isClientPageBackground,
  resolveClientPageBackground,
  type ClientPageBackground,
} from '@/lib/branding/client-page-background'
import {
  finalizeBrandingUpload,
  prepareBrandingUpload,
  removeBrandingImage,
} from '@/lib/actions/branding.actions'
import { isAllowedFont } from '@/constants/fonts'

/**
 * Result of a design-tab action. Errors are *returned*, not thrown: Next.js
 * swaps a thrown Server Action message for a generic string in production, so a
 * thrown Hebrew message would never reach the photographer.
 */
export type ClientPageDesignResult<T = Record<never, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string }

/**
 * The studio's client-page look: what the public site provides (`site`) and
 * what she set just for client pages (`override`). A null override inherits the
 * site value. Logo values are already resolved to URLs.
 */
export type ClientPageDesign = {
  studioName: string | null
  site: { accent: string | null; logoUrl: string | null }
  override: { accent: string | null; logoUrl: string | null }
  /** Hero layout and background have no site equivalent — client-page-only, always resolved to a real value. */
  heroStyle: ClientPageHeroStyle
  background: ClientPageBackground
  /** Same heading font as her public site (no client-page override for this one) — whitelisted name, or null. */
  headingFont: string | null
}

const GENERIC_ERROR = 'הפעולה נכשלה. נסי שוב.'

function messageOf(error: unknown) {
  return error instanceof Error && error.message ? error.message : GENERIC_ERROR
}

export async function getClientPageDesign(): Promise<ClientPageDesignResult<{ design: ClientPageDesign }>> {
  try {
    const { userId, supabase } = await requireDashboardContext()
    const { data, error } = await supabase
      .from('users')
      .select(
        'studio_name, logo_url, accent_color, client_page_logo_url, client_page_accent_color, client_page_hero_style, client_page_background, heading_font'
      )
      .eq('id', userId)
      .single()
    if (error || !data) return { ok: false, error: 'לא הצלחנו לטעון את הגדרות העיצוב' }

    const row = data as {
      studio_name: string | null
      logo_url: string | null
      accent_color: string | null
      client_page_logo_url: string | null
      client_page_accent_color: string | null
      client_page_hero_style: string | null
      client_page_background: string | null
      heading_font: string | null
    }

    return {
      ok: true,
      design: {
        studioName: row.studio_name,
        site: {
          accent: normalizeHexColor(row.accent_color),
          logoUrl: await resolveBrandingPath(row.logo_url),
        },
        override: {
          accent: normalizeHexColor(row.client_page_accent_color),
          logoUrl: await resolveBrandingPath(row.client_page_logo_url),
        },
        heroStyle: resolveClientPageHeroStyle(row.client_page_hero_style),
        background: resolveClientPageBackground(row.client_page_background),
        headingFont: isAllowedFont(row.heading_font) ? row.heading_font : null,
      },
    }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/** Saves the client-page accent; `null` clears the override so the page inherits the site colour. */
export async function saveClientPageAccent(
  accent: string | null
): Promise<ClientPageDesignResult<{ accent: string | null }>> {
  const normalized = accent === null ? null : normalizeHexColor(accent)
  if (accent !== null && !normalized) return { ok: false, error: 'הצבע שנבחר אינו תקין' }

  try {
    const { userId } = await requireDashboardContext()
    const { error } = await createAdminClient()
      .from('users')
      .update({ client_page_accent_color: normalized } as never)
      .eq('id', userId)
    if (error) {
      console.error('[client-page-design] save accent failed', { code: error.code })
      return { ok: false, error: 'שמירת הצבע נכשלה' }
    }
    return { ok: true, accent: normalized }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/** Saves which hero layout the client-facing gallery page uses. */
export async function saveClientPageHeroStyle(
  heroStyle: string
): Promise<ClientPageDesignResult<{ heroStyle: ClientPageHeroStyle }>> {
  if (!isClientPageHeroStyle(heroStyle)) return { ok: false, error: 'עיצוב לא תקין' }

  try {
    const { userId } = await requireDashboardContext()
    const { error } = await createAdminClient()
      .from('users')
      .update({ client_page_hero_style: heroStyle } as never)
      .eq('id', userId)
    if (error) {
      console.error('[client-page-design] save hero style failed', { code: error.code })
      return { ok: false, error: 'שמירת העיצוב נכשלה' }
    }
    return { ok: true, heroStyle }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/** Saves the client-facing gallery page's light/dark background. */
export async function saveClientPageBackground(
  background: string
): Promise<ClientPageDesignResult<{ background: ClientPageBackground }>> {
  if (!isClientPageBackground(background)) return { ok: false, error: 'רקע לא תקין' }

  try {
    const { userId } = await requireDashboardContext()
    const { error } = await createAdminClient()
      .from('users')
      .update({ client_page_background: background } as never)
      .eq('id', userId)
    if (error) {
      console.error('[client-page-design] save background failed', { code: error.code })
      return { ok: false, error: 'שמירת הרקע נכשלה' }
    }
    return { ok: true, background }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/** Step 1 of a client-page logo upload — a presigned PUT into the studio's branding folder. */
export async function prepareClientPageLogoUpload(input: {
  fileName: string
  contentType: string
  fileSize: number
}): Promise<ClientPageDesignResult<{ uploadUrl: string; path: string }>> {
  try {
    const { uploadUrl, path } = await prepareBrandingUpload({ type: 'client_page_logo', ...input })
    return { ok: true, uploadUrl, path }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/** Step 2: attaches the uploaded file as the client-page logo (SVGs are sanitised there). */
export async function finalizeClientPageLogoUpload(
  path: string
): Promise<ClientPageDesignResult<{ logoUrl: string | null }>> {
  try {
    await finalizeBrandingUpload('client_page_logo', path)
    return { ok: true, logoUrl: await resolveBrandingPath(path) }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/** Removes the client-page logo so client pages fall back to the site logo. */
export async function removeClientPageLogo(): Promise<ClientPageDesignResult> {
  try {
    await removeBrandingImage('client_page_logo')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}
