'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import type { Client } from '@/lib/types/database.types'

type ClientInsert = Database['public']['Tables']['clients']['Insert']

export async function fetchClients(): Promise<Client[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('יש להתחבר מחדש')
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Client[]
}

export async function createClientRecord(input: {
  name: string
  email?: string
  phone?: string
}): Promise<Client> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('יש להתחבר מחדש')
  }

  const name = input.name.trim()
  if (!name) {
    throw new Error('שם הלקוח הוא שדה חובה')
  }

  const payload: ClientInsert = {
    user_id: user.id,
    name,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(payload as never)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  return data as Client
}

export async function updateClientRecord(
  clientId: string,
  input: {
    name?: string
    email?: string
    phone?: string
    galleryId?: string
  }
): Promise<Client> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('יש להתחבר מחדש')
  }

  const payload: Database['public']['Tables']['clients']['Update'] = {}

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) {
      throw new Error('שם הלקוח הוא שדה חובה')
    }
    payload.name = name
  }

  if (input.email !== undefined) {
    payload.email = input.email.trim() || null
  }

  if (input.phone !== undefined) {
    payload.phone = input.phone.trim() || null
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('אין שינויים לשמירה')
  }

  const { data, error } = await supabase
    .from('clients')
    .update(payload as never)
    .eq('id', clientId)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  if (input.galleryId) {
    revalidatePath(`/dashboard/galleries/${input.galleryId}`)
  }
  return data as Client
}
