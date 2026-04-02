// ─────────────────────────────────────────────
// GoogleMappingTab.tsx
// src/pages/admin/GoogleMappingTab.tsx
// ─────────────────────────────────────────────
import { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../../lib/supabase'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

let _mapsPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (_mapsPromise) return _mapsPromise
  _mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) { resolve(); return }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) { const check = setInterval(() => { if ((window as any).google?.maps?.places) { clearInterval(check); resolve() } }, 100); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&v=weekly`
    s.onload = () => setTimeout(() => resolve(), 300)
    s.onerror = () => reject(new Error('Google Maps 로드 실패'))
    document.head.appendChild(s)
  })
  return _mapsPromise
}

function GooglePlacesCollectSection() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<{ name: string; status: string }[]>([])
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [postcode, setPostcode] = useState('')
  const [postcodeInfo, setPostcodeInfo] = useState<{ lat: number; lng: number; city: string } | null>(null)
  const [postcodeLoading, setPostcodeLoading] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['cafe', 'restaurant'])

  const TYPES = [
    { id: 'cafe', label: '카페·베이커리', category: 'cafe', googleType: 'cafe' },
    { id: 'restaurant', label: '식당', category: 'restaurant', googleType: 'restaurant' },
    { id: 'tourist_attraction', label: '명소·관광지', category: 'travel', googleType: 'tourist_attraction' },
  ]

  const toggleType = (id: string) => setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const geocodePostcode = async (code: string) => {
    setPostcodeLoading(true); setPostcodeInfo(null)
    try {
      await loadGoogleMaps()
      const geocoder = new (window as any).google.maps.Geocoder()
      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ address: `${code}, NSW, Australia` }, (results: any[], status: string) => {
          if (status === 'OK' && results.length > 0) resolve(results[0])
          else reject(new Error('주소를 찾을 수 없어요'))
        })
      })
      const lat = result.geometry.location.lat(); const lng = result.geometry.location.lng()
      const components = result.address_components
      const city = components.find((c: any) => c.types.includes('locality'))?.long_name || components.find((c: any) => c.types.includes('sublocality'))?.long_name || code
      setPostcodeInfo({ lat, lng, city })
    } catch (e: any) { alert(`우편번호 오류: ${e.message}`) }
    setPostcodeLoading(false)
  }

  const searchNearby = (service: any, location: any, type: string): Promise<any[]> => {
    return new Promise(resolve => {
      service.nearbySearch({ location, radius: 2000, type, language: 'ko' }, (results: any[], status: string) => {
        resolve(status !== 'OK' && status !== 'ZERO_RESULTS' ? [] : results ?? [])
      })
    })
  }

  const handleRun = async () => {
    if (!postcodeInfo) { alert('우편번호를 먼저 조회해주세요'); return }
    if (selectedTypes.length === 0) { alert('카테고리를 선택해주세요'); return }
    if (!confirm(`${postcodeInfo.city}(${postcode}) × ${selectedTypes.length}개 카테고리 수집을 시작할까요?`)) return
    setRunning(true); setResults([]); setError(null); setDone(0); setTotal(0)
    try {
      await loadGoogleMaps()
      const googleMaps = (window as any).google?.maps
      if (!googleMaps) throw new Error('Google Maps가 로드되지 않았습니다')
      const map = new googleMaps.Map(mapRef.current!, { center: { lat: postcodeInfo.lat, lng: postcodeInfo.lng }, zoom: 13 })
      const service = new googleMaps.places.PlacesService(map)
      const types = TYPES.filter(t => selectedTypes.includes(t.id))
      const location = new googleMaps.LatLng(postcodeInfo.lat, postcodeInfo.lng)
      for (const type of types) {
        const places = await searchNearby(service, location, type.googleType)
        setTotal(prev => prev + places.length)
        for (const place of places) {
          try {
            const lat = place.geometry?.location?.lat() ?? null; const lng = place.geometry?.location?.lng() ?? null
            if (lat === null || lng === null) { setResults(prev => [...prev, { name: place.name, status: '⏭ 좌표 없음 스킵' }]); setDone(prev => prev + 1); continue }
            const { data: existing } = await supabase.from('businesses').select('id').eq('google_place_id', place.place_id).maybeSingle()
            if (existing) { setResults(prev => [...prev, { name: place.name, status: '⏭ 중복 스킵' }]); setDone(prev => prev + 1); continue }
            await supabase.from('businesses').insert({ name: place.name, category: type.category, description: '', address: place.vicinity ?? '', city: postcodeInfo.city, rating: 0, reviews_count: 0, is_featured: false, is_active: true, is_korean: false, source: 'google', tags: [], google_place_id: place.place_id, google_rating: place.rating ?? null, google_review_count: place.user_ratings_total ?? null, latitude: lat, longitude: lng })
            setResults(prev => [...prev, { name: place.name, status: '✅ 추가' }])
          } catch { setResults(prev => [...prev, { name: place.name, status: '❌ 실패' }]) }
          setDone(prev => prev + 1)
        }
        await new Promise(r => setTimeout(r, 500))
      }
    } catch (e: any) { setError(String(e?.message ?? e)) }
    setRunning(false)
  }

  const succeeded = results.filter(r => r.status.startsWith('✅')).length
  const skipped   = results.filter(r => r.status.startsWith('⏭')).length
  const failed    = results.filter(r => r.status.startsWith('❌')).length

  return (
    <div style={{ marginBottom: 24 }}>
      <div ref={mapRef} style={{ width: 1, height: 1, position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
      <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13, lineHeight: 1.7 }}>
        <div style={{ fontWeight: 800, color: '#16A34A', marginBottom: 4 }}>🗺 Google Places 업체 수집</div>
        Maps JavaScript API로 브라우저에서 직접 수집합니다.
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>우편번호 입력</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={postcode} onChange={e => { setPostcode(e.target.value); setPostcodeInfo(null) }} onKeyDown={e => e.key === 'Enter' && postcode.trim() && geocodePostcode(postcode.trim())} placeholder="예: 2000" maxLength={4} style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: 14, outline: 'none' }} />
          <button onClick={() => postcode.trim() && geocodePostcode(postcode.trim())} disabled={postcodeLoading || !postcode.trim()} style={{ height: 40, padding: '0 14px', borderRadius: 10, border: 'none', background: postcodeLoading ? '#94A3B8' : '#1B6EF3', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{postcodeLoading ? '조회 중...' : '조회'}</button>
        </div>
        {postcodeInfo && <div style={{ marginTop: 8, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, fontSize: 12, color: '#15803D', fontWeight: 600 }}>✅ {postcodeInfo.city} — {postcodeInfo.lat.toFixed(5)}, {postcodeInfo.lng.toFixed(5)}</div>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>카테고리 선택</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TYPES.map(t => <button key={t.id} onClick={() => toggleType(t.id)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: selectedTypes.includes(t.id) ? '#1B6EF3' : '#F1F5F9', color: selectedTypes.includes(t.id) ? '#fff' : '#64748B', border: 'none' }}>{t.label}</button>)}
        </div>
      </div>
      <button onClick={handleRun} disabled={running} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: running ? '#94A3B8' : '#16A34A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: running ? 'default' : 'pointer', marginBottom: 16 }}>
        {running ? `🗺 수집 중... ${done}/${total}개` : '🗺 수집 시작'}
      </button>
      {error && <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>❌ {error}</div>}
      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[{ n: succeeded, label: '추가', bg: '#DCFCE7', color: '#16A34A' }, { n: skipped, label: '중복스킵', bg: '#FEF9C3', color: '#CA8A04' }, { n: failed, label: '실패', bg: '#FEE2E2', color: '#DC2626' }].map(s => (
              <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.n}</div><div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div></div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
            {results.slice(-50).map((r, i) => <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '8px 12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, fontWeight: 700 }}>{r.status}</div></div>)}
          </div>
        </>
      )}
    </div>
  )
}

function GeocodingSection() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<{ name: string; status: string }[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    if (!confirm('latitude가 없는 업체를 Google Geocoding API로 좌표 입력할까요?')) return
    setRunning(true); setResults([]); setError(null); setDone(0)
    try {
      const { data: bizList, error: fetchErr } = await supabase.from('businesses').select('id, name, address, city').is('latitude', null).not('address', 'is', null).neq('address', '')
      if (fetchErr) throw new Error(fetchErr.message)
      setTotal(bizList.length)
      const BATCH = 20
      for (let i = 0; i < bizList.length; i += BATCH) {
        const batch = bizList.slice(i, i + BATCH)
        await Promise.all(batch.map(async (biz: any) => {
          try {
            const query = encodeURIComponent(`${biz.address}, Australia`)
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_KEY}`)
            const json = await res.json()
            if (json.results?.[0]?.geometry?.location) {
              const { lat, lng } = json.results[0].geometry.location
              await supabase.from('businesses').update({ latitude: lat, longitude: lng }).eq('id', biz.id)
              setResults(prev => [...prev, { name: biz.name, status: '✅ 완료' }])
            } else setResults(prev => [...prev, { name: biz.name, status: '⚠️ 주소 못찾음' }])
          } catch { setResults(prev => [...prev, { name: biz.name, status: '❌ 오류' }]) }
          setDone(prev => prev + 1)
        }))
        if (i + BATCH < bizList.length) await new Promise(r => setTimeout(r, 500))
      }
    } catch (e: any) { setError(String(e?.message ?? e)) }
    setRunning(false)
  }

  const succeeded = results.filter(r => r.status.startsWith('✅')).length
  const failed    = results.filter(r => !r.status.startsWith('✅')).length

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13, lineHeight: 1.7 }}>
        <div style={{ fontWeight: 800, color: '#059669', marginBottom: 4 }}>📍 좌표 자동 입력</div>
        latitude/longitude가 없는 업체를 Google Geocoding API로 자동 입력합니다.
      </div>
      <button onClick={handleRun} disabled={running} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: running ? '#94A3B8' : '#059669', color: '#fff', fontSize: 15, fontWeight: 700, cursor: running ? 'default' : 'pointer', marginBottom: 16 }}>
        {running ? `📍 처리 중... ${done}${total !== null ? `/${total}` : ''}개` : '📍 좌표 자동 입력 시작'}
      </button>
      {error && <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>❌ 오류: {error}</div>}
      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[{ n: succeeded, label: '완료', bg: '#DCFCE7', color: '#16A34A' }, { n: failed, label: '실패/건너뜀', bg: '#FEE2E2', color: '#DC2626' }, { n: results.length, label: '처리됨', bg: '#F1F5F9', color: '#475569' }].map(s => (
              <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.n}</div><div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div></div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
            {results.map((r, i) => <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: `1px solid ${r.status.startsWith('✅') ? '#DCFCE7' : '#FEE2E2'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</div><div style={{ fontSize: 12, fontWeight: 700 }}>{r.status}</div></div>)}
          </div>
        </>
      )}
    </div>
  )
}

function RatingUpdateSection() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<{ name: string; rating: number | null; status: string }[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setRunning(true); setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-google-ratings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error(`응답 파싱 실패: ${text}`) }
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setRemaining(data.remaining ?? 0)
      setResults(prev => [...prev, ...(Array.isArray(data.results) ? data.results : [])])
    } catch (e: any) { setError(String(e?.message ?? e)) }
    setRunning(false)
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13, lineHeight: 1.7 }}>
        <div style={{ fontWeight: 800, color: '#D97706', marginBottom: 4 }}>⭐ 구글 별점 업데이트</div>
        google_place_id가 있는 업체의 별점을 100개씩 업데이트합니다.
      </div>
      <button onClick={handleRun} disabled={running} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: running ? '#94A3B8' : '#FFB800', color: '#fff', fontSize: 15, fontWeight: 700, cursor: running ? 'default' : 'pointer', marginBottom: 16 }}>
        {running ? '업데이트 중...' : remaining !== null && remaining > 0 ? `⭐ 다음 100개 업데이트 (${remaining}개 남음)` : '⭐ 별점 업데이트 시작'}
      </button>
      {error && <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>❌ 오류: {error}</div>}
    </div>
  )
}

export default function GoogleMappingTab() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<{ id: string; name: string; place_id: string | null; status: string }[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setRunning(true); setResults([]); setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-google-places`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error(`응답 파싱 실패: ${text}`) }
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setTotal(data.total ?? 0); setRemaining(data.remaining ?? 0)
      setResults(prev => [...prev, ...(Array.isArray(data.results) ? data.results : [])])
    } catch (e: any) { setError(String(e?.message ?? e)) }
    setRunning(false)
  }

  const matched   = results.filter(r => r.place_id).length
  const unmatched = results.filter(r => !r.place_id).length

  return (
    <div>
      <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13, lineHeight: 1.7 }}>
        <div style={{ fontWeight: 800, color: '#1B6EF3', marginBottom: 4 }}>🔍 구글 Place ID 자동 매핑</div>
        google_place_id가 없는 업체를 Google Places API로 자동 매핑합니다.
      </div>
      <button onClick={handleRun} disabled={running} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: running ? '#94A3B8' : '#1B6EF3', color: '#fff', fontSize: 15, fontWeight: 700, cursor: running ? 'default' : 'pointer', marginBottom: 16 }}>
        {running ? '매핑 중...' : remaining !== null && remaining > 0 ? `🚀 다음 20개 매핑 (${remaining}개 남음)` : '🚀 자동 매핑 시작'}
      </button>
      {error && <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>❌ 오류: {error}</div>}
      {total !== null && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ n: matched, label: '매핑 완료', bg: '#DCFCE7', color: '#16A34A' }, { n: unmatched, label: '찾지 못함', bg: '#FEE2E2', color: '#DC2626' }, { n: total, label: '전체', bg: '#F1F5F9', color: '#475569' }].map(s => (
            <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: '12px', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.n}</div><div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</div></div>
          ))}
        </div>
      )}
      <GooglePlacesCollectSection />
      <GeocodingSection />
      <RatingUpdateSection />
    </div>
  )
}
