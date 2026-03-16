import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_KEY') ?? ''
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function getRating(placeId: string): Promise<{ rating: number; reviewCount: number } | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'rating,userRatingCount',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.rating) return null
  return { rating: data.rating, reviewCount: data.userRatingCount ?? 0 }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // google_place_id 있는 업체 20개씩 처리
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, google_place_id')
      .eq('is_active', true)
      .not('google_place_id', 'is', null)
      .limit(20)

    if (error) throw error

    const results: { name: string; rating: number | null; status: string }[] = []

    for (const biz of businesses) {
      await new Promise(r => setTimeout(r, 100))
      const result = await getRating(biz.google_place_id)
      if (result) {
        await supabase.from('businesses').update({
          google_rating: result.rating,
          google_review_count: result.reviewCount,
        }).eq('id', biz.id)
        results.push({ name: biz.name, rating: result.rating, status: '✅ 업데이트' })
      } else {
        results.push({ name: biz.name, rating: null, status: '❌ 실패' })
      }
    }

    return new Response(JSON.stringify({ total: businesses.length, results }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
