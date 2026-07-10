'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireDashboardContext } from '@/lib/auth/dashboard-context'
import type { Database } from '@/lib/types/database.types'
import type { PhotographyPackage } from '@/lib/types/database.types'

type PackageInsert = Database['public']['Tables']['photography_packages']['Insert']
type PackageUpdate = Database['public']['Tables']['photography_packages']['Update']

function parseIncludes(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function validatePackageInput(input: {
  name: string
  priceAmount: number
  durationText?: string
  includes: string[]
}) {
  const name = input.name.trim()
  if (!name) {
    throw new Error('שם החבילה הוא שדה חובה')
  }

  if (!Number.isFinite(input.priceAmount) || input.priceAmount <= 0) {
    throw new Error('יש להזין מחיר תקין')
  }

  if (input.includes.length === 0) {
    throw new Error('יש להוסיף לפחות פריט אחד ל"מה כלול"')
  }

  return {
    name,
    price_amount: input.priceAmount,
    duration_text: input.durationText?.trim() || null,
    includes: input.includes,
  }
}

export async function fetchPackages(): Promise<PhotographyPackage[]> {
  const { userId, supabase } = await requireDashboardContext()

  const { data, error } = await supabase
    .from('photography_packages')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PhotographyPackage[]
}

export async function createPackage(input: {
  name: string
  priceAmount: number
  durationText?: string
  includesText: string
}): Promise<PhotographyPackage> {
  const { userId, supabase } = await requireDashboardContext()

  const includes = parseIncludes(input.includesText)
  const validated = validatePackageInput({
    name: input.name,
    priceAmount: input.priceAmount,
    durationText: input.durationText,
    includes,
  })

  const { count } = await supabase
    .from('photography_packages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const payload: PackageInsert = {
    user_id: userId,
    ...validated,
    sort_order: count ?? 0,
  }

  const { data, error } = await supabase
    .from('photography_packages')
    .insert(payload as never)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/packages')
  revalidatePath('/portfolio')
  return data as PhotographyPackage
}

export async function updatePackage(
  packageId: string,
  input: {
    name?: string
    priceAmount?: number
    durationText?: string
    includesText?: string
    isActive?: boolean
    isFeatured?: boolean
  }
): Promise<PhotographyPackage> {
  const { userId, supabase } = await requireDashboardContext()

  const payload: PackageUpdate = {}

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) {
      throw new Error('שם החבילה הוא שדה חובה')
    }
    payload.name = name
  }

  if (input.priceAmount !== undefined) {
    if (!Number.isFinite(input.priceAmount) || input.priceAmount <= 0) {
      throw new Error('יש להזין מחיר תקין')
    }
    payload.price_amount = input.priceAmount
  }

  if (input.durationText !== undefined) {
    payload.duration_text = input.durationText.trim() || null
  }

  if (input.includesText !== undefined) {
    const includes = parseIncludes(input.includesText)
    if (includes.length === 0) {
      throw new Error('יש להוסיף לפחות פריט אחד ל"מה כלול"')
    }
    payload.includes = includes
  }

  if (input.isActive !== undefined) {
    payload.is_active = input.isActive
  }

  if (input.isFeatured !== undefined) {
    payload.is_featured = input.isFeatured
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('אין שינויים לשמירה')
  }

  const { data, error } = await supabase
    .from('photography_packages')
    .update(payload as never)
    .eq('id', packageId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/packages')
  revalidatePath('/portfolio')
  return data as PhotographyPackage
}

export async function deletePackage(packageId: string): Promise<void> {
  const { userId, supabase } = await requireDashboardContext()

  const { error } = await supabase
    .from('photography_packages')
    .delete()
    .eq('id', packageId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/packages')
  revalidatePath('/portfolio')
}

export async function updatePackagesSectionHeadings(input: {
  title?: string
  subtitle?: string
}): Promise<{ packages_title: string | null; packages_subtitle: string | null }> {
  const { userId, supabase } = await requireDashboardContext()

  const payload: Database['public']['Tables']['users']['Update'] = {}

  if (input.title !== undefined) {
    payload.packages_title = input.title.trim() || null
  }

  if (input.subtitle !== undefined) {
    payload.packages_subtitle = input.subtitle.trim() || null
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('אין שינויים לשמירה')
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload as never)
    .eq('id', userId)
    .select('packages_title, packages_subtitle')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/packages')
  revalidatePath('/portfolio')
  revalidatePath('/[slug]', 'page')

  return data as { packages_title: string | null; packages_subtitle: string | null }
}

export async function fetchPublicPackages(
  userId: string
): Promise<PhotographyPackage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('photography_packages')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PhotographyPackage[]
}
