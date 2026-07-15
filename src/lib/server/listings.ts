import { createClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth-helpers'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getListingById(id: string) {
  const supabase = getSupabaseClient()
  
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles (
        id,
        full_name,
        avatar_url,
        bio
      )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single()
  
  if (error) {
    console.error('Error fetching listing:', error)
    return null
  }
  
  return listing
}

export async function getListings(filters?: {
  category?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('listings')
    .select(`
      *,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'active')
  
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  
  if (filters?.search) {
    query = query.or(`ilike.title.%${filters.search}%,ilike.description.%${filters.search}%`)
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching listings:', error)
    return []
  }
  
  return data || []
}

export async function getUserListings(userId: string) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user listings:', error)
    return []
  }
  
  return data || []
}

export async function createListing(data: {
  title: string
  description: string
  category: string
  tags: string[]
  price?: number
  location?: string
  max_students?: number
  duration?: number
  requirements?: string
}) {
  const supabase = getSupabaseClient()
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      ...data,
      user_id: user.id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating listing:', error)
    throw error
  }
  
  return listing
}

export async function updateListing(id: string, data: Partial<typeof createListing>) {
  const supabase = getSupabaseClient()
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  const { data: listing, error } = await supabase
    .from('listings')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating listing:', error)
    throw error
  }
  
  return listing
}

export async function deleteListing(id: string) {
  const supabase = getSupabaseClient()
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error deleting listing:', error)
    throw error
  }
  
  return true
}