import { supabase } from './supabase'

export type Business = {
  id: string
  name: string
  category: string
  description: string
  phone?: string
  website?: string
  kakao?: string
  address?: string
  city: string
  rating: number
  reviews_count: number
  is_featured: boolean
  is_active: boolean
  is_korean?: boolean
  source?: string
  tags: string[]
  google_place_id?: string
  google_rating?: number
  google_review_count?: number
  latitude?: number
  longitude?: number
  created_at?: string
  updated_at?: string
}

export async function getBusinesses(category?: string, page = 0, pageSize = 30): Promise<Business[]> {
  let query = supabase.from('businesses').select('*').eq('is_active', true)
    .order('is_featured', { ascending: false }).order('rating', { ascending: false })
  if (category && category !== 'all') query = query.eq('category', category)
  query = query.range(page * pageSize, (page + 1) * pageSize - 1)
  const { data, error } = await query
  if (error) { console.error('getBusinesses error:', error); return [] }
  return data as Business[]
}

export async function getBusinessesCount(category?: string): Promise<number> {
  let query = supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true)
  if (category && category !== 'all') query = query.eq('category', category)
  const { count, error } = await query
  if (error) { console.error('getBusinessesCount error:', error); return 0 }
  return count ?? 0
}

export async function getFeaturedBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase.from('businesses').select('*')
    .eq('is_featured', true).eq('is_active', true).order('rating', { ascending: false })
  if (error) { console.error('getFeaturedBusinesses error:', error); return [] }
  return data as Business[]
}

export async function getBusiness(id: string): Promise<Business | null> {
  const { data, error } = await supabase.from('businesses').select('*').eq('id', id).single()
  if (error) { console.error('getBusiness error:', error); return null }
  return data as Business
}

export async function searchBusinesses(query: string, page = 0, pageSize = 30): Promise<Business[]> {
  const { data, error } = await supabase.from('businesses').select('*').eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)
    .order('is_featured', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) { console.error('searchBusinesses error:', error); return [] }
  return data as Business[]
}

export async function searchBusinessesCount(query: string): Promise<number> {
  const { count, error } = await supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)
  if (error) { console.error('searchBusinessesCount error:', error); return 0 }
  return count ?? 0
}

export async function createBusiness(business: Omit<Business, 'rating' | 'reviews_count' | 'created_at' | 'updated_at'>): Promise<Business | null> {
  const { data, error } = await supabase.from('businesses').insert({ ...business, rating: 0, reviews_count: 0 }).select().single()
  if (error) { console.error('createBusiness error:', error); return null }
  return data as Business
}

export async function updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
  const { data, error } = await supabase.from('businesses').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) { console.error('updateBusiness error:', error); return null }
  return data as Business
}

export async function toggleFeatured(id: string, isFeatured: boolean): Promise<boolean> {
  const { error } = await supabase.from('businesses').update({ is_featured: isFeatured, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) { console.error('toggleFeatured error:', error); return false }
  return true
}


