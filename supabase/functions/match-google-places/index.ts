import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_KEY') ?? ''
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface Business {
  id: string
  name: string
  address?: string
  city: string
  google_place_id?: string
}

async function findPlaceId(name: string, address: string, city: string): Promise<string | null> {
  const query = `${name} ${address} ${city} Australia`
  const url = `https://places.googleapis.com/v1/places:searchText`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'ko' }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const places = data.places ?? []
  if (places.length === 0) return null
  // places.id는 "places/ChIJ..." 형태이므로 앞부분 제거
  const raw = places[0].id as string
  return raw.startsWith('places/') ? raw.replace('places/', '') : raw
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // 전체 업체 가져오기 (google_place_id 없는 것만, 20개씩)
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, address, city, google_place_id')
      .eq('is_active', true)
      .is('google_place_id', null)
      .limit(20)

    if (error) throw error

    const results: { id: string; name: string; place_id: string | null; status: string }[] = []

    for (const biz of (businesses as Business[])) {
      // 요청 간 딜레이 (rate limit 방지)
      await new Promise(r => setTimeout(r, 200))

      const placeId = await findPlaceId(
        biz.name,
        biz.address ?? '',
        biz.city ?? '',
      )

      if (placeId) {
        await supabase
          .from('businesses')
          .update({ google_place_id: placeId })
          .eq('id', biz.id)
        results.push({ id: biz.id, name: biz.name, place_id: placeId, status: '✅ 매핑 완료' })
      } else {
        results.push({ id: biz.id, name: biz.name, place_id: null, status: '❌ 찾지 못함' })
      }
    }

    // 남은 업체 수 확인
    const { count: remaining } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('google_place_id', null)

    return new Response(JSON.stringify({ total: businesses.length, remaining: (remaining ?? 0) - businesses.length < 0 ? 0 : (remaining ?? 0) - businesses.length, results }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
