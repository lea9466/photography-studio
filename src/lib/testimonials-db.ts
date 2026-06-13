import { getAdminClient } from '@/lib/supabase-admin'
import type { TestimonialsRow } from '@/lib/database.types'

export type TestimonialWithClient = TestimonialsRow & {
  client_name: string
}

const MAX_CONTENT = 2000
const MIN_CONTENT = 10

function client() {
  return getAdminClient()
}

function normalizeContent(raw: string): string | null {
  const content = raw.trim()
  if (content.length < MIN_CONTENT) return null
  if (content.length > MAX_CONTENT) return null
  return content
}

export async function fetchClientTestimonial(
  clientId: string
): Promise<TestimonialsRow | null> {
  const sb = client()
  if (!sb) return null

  const { data, error } = await sb
    .from('testimonials')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('fetchClientTestimonial:', error.message)
    return null
  }
  return data
}

export async function submitClientTestimonial(
  clientId: string,
  rawContent: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'המערכת אינה מוגדרת' }

  const content = normalizeContent(rawContent)
  if (!content) {
    return {
      error: `ההמלצה חייבת להכיל לפחות ${MIN_CONTENT} תווים (עד ${MAX_CONTENT})`,
    }
  }

  const existing = await fetchClientTestimonial(clientId)
  if (existing?.status === 'pending') {
    return { error: 'כבר שלחתם המלצה — היא ממתינה לאישור הסטודיו' }
  }
  if (existing?.status === 'approved') {
    return { error: 'ההמלצה שלכם כבר פורסמה באתר' }
  }

  const { error } = await sb.from('testimonials').insert({
    client_id: clientId,
    content,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'כבר קיימת המלצה ממתינה לחשבון זה' }
    }
    console.error('submitClientTestimonial:', error.message)
    return { error: 'שגיאה בשליחת ההמלצה' }
  }

  return { error: null }
}

export async function fetchApprovedTestimonials(
  limit = 12,
  photographerId?: string
): Promise<TestimonialWithClient[]> {
  const sb = client()
  if (!sb) return []

  let scopedClientIds: string[] | null = null
  if (photographerId) {
    const { data: clients } = await sb
      .from('clients')
      .select('id')
      .eq('photographer_id', photographerId)
    scopedClientIds = (clients ?? []).map((c) => c.id)
    if (scopedClientIds.length === 0) return []
  }

  let query = sb
    .from('testimonials')
    .select('*')
    .eq('status', 'approved')

  if (scopedClientIds) {
    query = query.in('client_id', scopedClientIds)
  }

  const { data: rows, error } = await query
    .order('reviewed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('fetchApprovedTestimonials:', error.message)
    return []
  }
  if (!rows?.length) return []

  const clientIds = [...new Set(rows.map((r) => r.client_id))]
  const { data: clients } = await sb
    .from('clients')
    .select('id, full_name')
    .in('id', clientIds)

  const nameMap = new Map(
    (clients ?? []).map((c) => [c.id, c.full_name?.trim() || 'לקוח/ה'])
  )

  return rows.map((r) => ({
    ...r,
    client_name: nameMap.get(r.client_id) ?? 'לקוח/ה',
  }))
}

export async function adminFetchTestimonials(
  photographerId?: string | null
): Promise<TestimonialWithClient[]> {
  const sb = client()
  if (!sb) return []

  let scopedClientIds: string[] | null = null
  if (photographerId) {
    const { data: clients } = await sb
      .from('clients')
      .select('id')
      .eq('photographer_id', photographerId)
    scopedClientIds = (clients ?? []).map((c) => c.id)
    if (scopedClientIds.length === 0) return []
  }

  let query = sb.from('testimonials').select('*')
  if (scopedClientIds) {
    query = query.in('client_id', scopedClientIds)
  }

  const { data: rows, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) {
    console.error('adminFetchTestimonials:', error.message)
    return []
  }
  if (!rows?.length) return []

  const clientIds = [...new Set(rows.map((r) => r.client_id))]
  const { data: clients } = await sb
    .from('clients')
    .select('id, full_name')
    .in('id', clientIds)

  const nameMap = new Map(
    (clients ?? []).map((c) => [c.id, c.full_name?.trim() || 'לקוח/ה'])
  )

  return rows.map((r) => ({
    ...r,
    client_name: nameMap.get(r.client_id) ?? 'לקוח/ה',
  }))
}

export async function adminApproveTestimonial(
  id: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'המערכת אינה מוגדרת' }

  const { data: row, error: fetchErr } = await sb
    .from('testimonials')
    .select('client_id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !row) return { error: 'ההמלצה לא נמצאה' }
  if (row.status !== 'pending') return { error: 'ניתן לאשר רק המלצה ממתינה' }

  const { data: otherApproved } = await sb
    .from('testimonials')
    .select('id')
    .eq('client_id', row.client_id)
    .eq('status', 'approved')
    .neq('id', id)
    .maybeSingle()

  if (otherApproved) {
    return { error: 'ללקוח כבר יש המלצה מאושרת — בטלו אישור קודם או מחקו אותה' }
  }

  const now = new Date().toISOString()
  const { error } = await sb
    .from('testimonials')
    .update({ status: 'approved', reviewed_at: now })
    .eq('id', id)

  if (error) {
    console.error('adminApproveTestimonial:', error.message)
    return { error: 'שגיאה באישור ההמלצה' }
  }
  return { error: null }
}

export async function adminRejectTestimonial(
  id: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'המערכת אינה מוגדרת' }

  const { error } = await sb
    .from('testimonials')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) {
    console.error('adminRejectTestimonial:', error.message)
    return { error: 'שגיאה בדחיית ההמלצה' }
  }
  return { error: null }
}

export async function adminUnpublishTestimonial(
  id: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'המערכת אינה מוגדרת' }

  const { error } = await sb
    .from('testimonials')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'approved')

  if (error) {
    console.error('adminUnpublishTestimonial:', error.message)
    return { error: 'שגיאה בהסרת ההמלצה מהאתר' }
  }
  return { error: null }
}

export async function adminDeleteTestimonial(
  id: string
): Promise<{ error: string | null }> {
  const sb = client()
  if (!sb) return { error: 'המערכת אינה מוגדרת' }

  const { error } = await sb.from('testimonials').delete().eq('id', id)
  if (error) {
    console.error('adminDeleteTestimonial:', error.message)
    return { error: 'שגיאה במחיקה' }
  }
  return { error: null }
}
