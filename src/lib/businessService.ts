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
  tags: string[]
  created_at?: string
  updated_at?: string
}

export type Review = {
  id?: string
  business_id: string
  author_name: string
  rating: number
  content?: string
  created_at?: string
}

// ── 업체 전체 조회
export async function getBusinesses(category?: string): Promise<Business[]> {
  let query = supabase
    .from('businesses')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) { console.error('getBusinesses error:', error); return [] }
  return data as Business[]
}

// ── 추천 업체 조회
export async function getFeaturedBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('rating', { ascending: false })

  if (error) { console.error('getFeaturedBusinesses error:', error); return [] }
  return data as Business[]
}

// ── 업체 단건 조회
export async function getBusiness(id: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { console.error('getBusiness error:', error); return null }
  return data as Business
}

// ── 업체 검색
export async function searchBusinesses(query: string): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)
    .order('is_featured', { ascending: false })

  if (error) { console.error('searchBusinesses error:', error); return [] }
  return data as Business[]
}

// ── 업체 등록
export async function createBusiness(business: Omit<Business, 'rating' | 'reviews_count' | 'created_at' | 'updated_at'>): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .insert({ ...business, rating: 0, reviews_count: 0 })
    .select()
    .single()

  if (error) { console.error('createBusiness error:', error); return null }
  return data as Business
}

// ── 업체 수정
export async function updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) { console.error('updateBusiness error:', error); return null }
  return data as Business
}

// ── 추천 업체 토글
export async function toggleFeatured(id: string, isFeatured: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('businesses')
    .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) { console.error('toggleFeatured error:', error); return false }
  return true
}

// ── 리뷰 조회
export async function getReviews(businessId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) { console.error('getReviews error:', error); return [] }
  return data as Review[]
}

// ── 리뷰 등록
export async function addReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single()

  if (error) { console.error('addReview error:', error); return null }
  return data as Review
}
