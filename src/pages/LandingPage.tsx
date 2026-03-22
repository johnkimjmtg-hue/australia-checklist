import { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { AppState } from '../store/state'
import { CATEGORIES as BCATS, BUSINESSES } from '../data/businesses'

type Props = { state: AppState; onStart: () => void; onServices: () => void }

const ff   = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
const BLUE = '#1B6EF3'   // 밝은 파란 (브랜드 컬러)
const GOLD = '#FFB800'   // 노란 (액센트)
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

// 카테고리 id → Phosphor 아이콘 (단색)
const CAT_ICON_MAP: Record<string, string> = {
  'hospital':          'ph:heart-pulse',
  'food':              'ph:fork-knife',
  'shopping':          'ph:shopping-bag',
  'admin':             'ph:file-text',
  'people':            'ph:users',
  'parenting':         'ph:baby',
  'places':            'ph:map-pin',
  'cat_1772930790490': 'ph:microphone-stage',
  'custom':            'ph:pencil-simple',
}

// ── Google Maps 로딩
let _mapsPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (_mapsPromise) return _mapsPromise
  _mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps) { resolve(); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&v=weekly&loading=async`
    s.onload = () => setTimeout(() => resolve(), 100)
    s.onerror = () => reject(new Error('Google Maps load failed'))
    document.head.appendChild(s)
  })
  return _mapsPromise
}

// ── 주소 자동완성
function AddressAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading]         = useState(false)
  const [manualMode, setManualMode]   = useState(false)
  const debounceRef = useRef<any>(null)

  async function handleInput(val: string) {
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        await loadGoogleMaps()
        const places = (window as any).google.maps.places
        const AutocompleteSuggestion = places.AutocompleteSuggestion || places.autocomplete?.AutocompleteSuggestion
        if (!AutocompleteSuggestion) throw new Error('not available')
        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: val, includedRegionCodes: ['au'],
        })
        setSuggestions(results || [])
      } catch { setSuggestions([]) }
      finally { setLoading(false) }
    }, 400)
  }

  async function handleSelect(suggestion: any) {
    setSuggestions([])
    try {
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents'] })
      const c = place.addressComponents || []
      const parts = ['street_number','route','locality','administrative_area_level_1','postal_code']
        .map(t => c.find((x: any) => x.types.includes(t)))
        .filter(Boolean)
        .map((x: any) => x.shortText || x.longText)
      onChange(parts.join(', '))
    } catch {}
  }

  const iStyle: React.CSSProperties = {
    width:'100%', height:44, border:'1px solid #E2E8F0', borderRadius:12,
    padding:'0 12px', fontSize:14, color:'#1E293B', background:'#fff',
    boxSizing:'border-box', fontFamily:ff, outline:'none',
  }

  // 직접 입력 모드
  if (manualMode) {
    return (
      <div>
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="주소를 직접 입력하세요" style={iStyle} autoFocus />
        <button onClick={() => { setManualMode(false); onChange('') }}
          style={{ background:'none', border:'none', fontSize:11, color:'#94A3B8', cursor:'pointer', marginTop:4, padding:0 }}>
          ← 자동완성으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div style={{ position:'relative' }}>
      <input value={value} onChange={e => handleInput(e.target.value)}
        placeholder="123 George St, Sydney NSW 2000" style={iStyle} />
      {loading && <div style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>검색 중...</div>}
      {suggestions.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:200,
          background:'#fff', borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          border:'1px solid #E2E8F0', overflow:'hidden', marginTop:4,
        }}>
          {suggestions.map((s: any, i: number) => (
            <div key={i} onClick={() => handleSelect(s)} style={{
              padding:'10px 14px', fontSize:13, cursor:'pointer',
              borderBottom:'1px solid #F1F5F9', color:'#1E293B',
              display:'flex', alignItems:'center', gap:8,
            }}
              onMouseEnter={e => (e.currentTarget.style.background='#F0F4FF')}
              onMouseLeave={e => (e.currentTarget.style.background='#fff')}
            >
              <Icon icon="ph:map-pin-simple" width={14} height={14} color={BLUE} />
              {s.placePrediction?.text?.text || ''}
            </div>
          ))}
          {/* 직접 입력 옵션 */}
          <div onClick={() => { setSuggestions([]); setManualMode(true); onChange('') }} style={{
            padding:'10px 14px', fontSize:13, cursor:'pointer',
            color:'#1B6EF3', fontWeight:700,
            display:'flex', alignItems:'center', gap:8,
            borderTop:'1px solid #E2E8F0', background:'#F8FAFF',
          }}
            onMouseEnter={e => (e.currentTarget.style.background='#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background='#F8FAFF')}
          >
            <Icon icon="ph:pencil-simple" width={14} height={14} color="#1B6EF3" />
            찾는 주소가 없어요 — 직접 입력하기
          </div>
        </div>
      )}
      {/* 검색 결과 없을 때 직접 입력 안내 */}
      {!loading && !suggestions.length && value.length >= 3 && (
        <button onClick={() => setManualMode(true)} style={{
          background:'none', border:'none', fontSize:11, color:'#1B6EF3',
          cursor:'pointer', marginTop:4, padding:0, fontWeight:700,
        }}>
          주소를 찾을 수 없나요? 직접 입력하기 →
        </button>
      )}
    </div>
  )
}

// ── 시드니 주요 명소 고정 지도
const SYDNEY_SPOTS = [
  // 명소
  { name: 'Sydney Opera House',    icon: 'ph:music-notes',  cat: '명소', lat: -33.8568, lng: 151.2153, desc: '세계적 공연 예술 센터' },
  { name: 'Bondi Beach',           icon: 'ph:waves',        cat: '명소', lat: -33.8908, lng: 151.2743, desc: '시드니 대표 해변' },
  { name: 'Harbour Bridge',        icon: 'ph:bridge',       cat: '명소', lat: -33.8523, lng: 151.2108, desc: '브릿지클라임 명소' },
  { name: 'Darling Harbour',       icon: 'ph:anchor',       cat: '명소', lat: -33.8731, lng: 151.1985, desc: '쇼핑·식사·관광' },
  { name: 'Taronga Zoo',           icon: 'ph:paw-print',    cat: '명소', lat: -33.8433, lng: 151.2411, desc: '캥거루·코알라 만나기' },
  { name: 'Royal Botanic Garden',  icon: 'ph:tree',         cat: '명소', lat: -33.8642, lng: 151.2166, desc: '시드니 중심 공원' },
  { name: 'Manly Beach',           icon: 'ph:sun-horizon',  cat: '명소', lat: -33.7969, lng: 151.2868, desc: '페리타고 가는 해변' },
  // 브런치·카페
  { name: 'bills Darlinghurst',    icon: 'ph:coffee',       cat: '카페', lat: -33.8783, lng: 151.2167, desc: '리코타 핫케이크 원조' },
  { name: 'bills Bondi Beach',     icon: 'ph:coffee',       cat: '카페', lat: -33.8927, lng: 151.2693, desc: '본다이 브런치 명소' },
  { name: 'bills Surry Hills',     icon: 'ph:coffee',       cat: '카페', lat: -33.8856, lng: 151.2118, desc: '서리힐즈 빌즈 지점' },
  { name: 'The Grounds of Alexandria', icon: 'ph:flower',   cat: '카페', lat: -33.9098, lng: 151.1930, desc: 'SNS 인생샷 카페' },
  { name: 'The Potting Shed',      icon: 'ph:flower',       cat: '카페', lat: -33.9100, lng: 151.1935, desc: 'Grounds 내 브런치' },
  { name: 'Single O Surry Hills',  icon: 'ph:coffee',       cat: '카페', lat: -33.8841, lng: 151.2094, desc: '시드니 스페셜티 커피 대표' },
  { name: 'Artificer Coffee',      icon: 'ph:coffee',       cat: '카페', lat: -33.8857, lng: 151.2100, desc: '커피 마니아 성지' },
  { name: 'Room Ten',              icon: 'ph:coffee',       cat: '카페', lat: -33.8718, lng: 151.2228, desc: '포츠포인트 로컬 카페' },
  { name: 'AP Bakery',             icon: 'ph:bread',        cat: '카페', lat: -33.8790, lng: 151.2158, desc: '루프탑 감성 베이커리' },
  { name: 'Toby\'s Estate',        icon: 'ph:coffee',       cat: '카페', lat: -33.8867, lng: 151.1952, desc: '로스터리 카페' },
  { name: 'Paramount Coffee Project', icon: 'ph:coffee',    cat: '카페', lat: -33.8840, lng: 151.2105, desc: '서리힐즈 브런치·커피' },
  { name: 'Reuben Hills',          icon: 'ph:coffee',       cat: '카페', lat: -33.8845, lng: 151.2108, desc: '서리힐즈 인기 카페' },
  { name: 'Edition Roasters',      icon: 'ph:coffee',       cat: '카페', lat: -33.8769, lng: 151.2010, desc: '수플레 팬케이크·말차 카페' },
  { name: 'Campos Coffee',         icon: 'ph:coffee',       cat: '카페', lat: -33.8997, lng: 151.1782, desc: '호주 대표 커피 브랜드' },
  { name: 'Mecca Alexandria',      icon: 'ph:coffee',       cat: '카페', lat: -33.9109, lng: 151.1943, desc: '세련된 로스터리' },
  { name: 'Celsius Coffee Co.',    icon: 'ph:coffee',       cat: '카페', lat: -33.8386, lng: 151.2103, desc: '부두 위 하버뷰 카페' },
  { name: 'Devon Cafe',            icon: 'ph:coffee',       cat: '카페', lat: -33.8840, lng: 151.2110, desc: '퓨전 브런치 카페' },
  { name: 'Speedos Cafe',          icon: 'ph:coffee',       cat: '카페', lat: -33.8955, lng: 151.2769, desc: '본다이 해변 컬러풀 브런치' },
  // 베이커리·디저트
  { name: 'Black Star Pastry',     icon: 'ph:cake',         cat: '디저트', lat: -33.8991, lng: 151.1731, desc: '수박 케이크로 유명한 베이커리' },
  { name: 'Lune Croissanterie',    icon: 'ph:bread',        cat: '디저트', lat: -33.9125, lng: 151.1990, desc: '크루아상 성지' },
  { name: 'Bourke St Bakery',      icon: 'ph:bread',        cat: '디저트', lat: -33.8882, lng: 151.2112, desc: '사워도우·소시지롤 명소' },
  { name: 'Flour and Stone',       icon: 'ph:cake',         cat: '디저트', lat: -33.8703, lng: 151.2196, desc: '레몬 드리즐 케이크' },
  { name: 'KOI Dessert Bar',       icon: 'ph:cake',         cat: '디저트', lat: -33.8920, lng: 151.1958, desc: 'SNS 인기 디저트 바' },
  { name: 'Gelato Messina',        icon: 'ph:ice-cream',    cat: '디저트', lat: -33.8781, lng: 151.2159, desc: '호주 대표 젤라토' },
  { name: 'Butter Surry Hills',    icon: 'ph:cookie',       cat: '디저트', lat: -33.8855, lng: 151.2095, desc: '도넛·치킨 스트리트 감성' },
  // 레스토랑
  { name: 'Cafe Sydney',           icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8614, lng: 151.2099, desc: '시드니 하버뷰 다이닝' },
  { name: 'Opera Bar',             icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8573, lng: 151.2152, desc: '오페라하우스·하버브리지 뷰' },
  { name: 'Quay',                  icon: 'ph:star',         cat: '레스토랑', lat: -33.8598, lng: 151.2067, desc: '시드니 최고급 파인다이닝' },
  { name: 'Bennelong',             icon: 'ph:star',         cat: '레스토랑', lat: -33.8571, lng: 151.2151, desc: '오페라하우스 내 레스토랑' },
  { name: 'Mr. Wong',              icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8653, lng: 151.2082, desc: '시드니 대표 딤섬·중식' },
  { name: 'Restaurant Hubert',     icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8648, lng: 151.2090, desc: '지하 프렌치 브라세리' },
  { name: 'Chin Chin Sydney',      icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8838, lng: 151.2103, desc: '아시안 퓨전 핫플' },
  { name: 'Totti\'s Bondi',        icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8939, lng: 151.2714, desc: '본다이 이탈리안' },
  { name: 'Fratelli Paradiso',     icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8719, lng: 151.2228, desc: '포츠포인트 이탈리안' },
  { name: 'Sean\'s Panorama',      icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8950, lng: 151.2769, desc: '본다이 씨뷰 레스토랑' },
  { name: 'Harry\'s Cafe de Wheels', icon: 'ph:fork-knife', cat: '레스토랑', lat: -33.8699, lng: 151.2192, desc: '타이거 파이 시드니 명물' },
  { name: 'Sydney Fish Market',    icon: 'ph:fish',         cat: '레스토랑', lat: -33.8742, lng: 151.1969, desc: '굴·해산물 명소' },
  { name: 'Doyle\'s on the Beach', icon: 'ph:fish',         cat: '레스토랑', lat: -33.8469, lng: 151.2823, desc: '왓슨스베이 해산물' },
  { name: 'Watsons Bay Hotel',     icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8468, lng: 151.2818, desc: '선셋 바·레스토랑' },
  { name: 'The Boathouse Palm Beach', icon: 'ph:fork-knife',cat: '레스토랑', lat: -33.5999, lng: 151.3237, desc: '팜비치 오션뷰 카페' },
  { name: 'The Boathouse Balmoral', icon: 'ph:fork-knife',  cat: '레스토랑', lat: -33.8265, lng: 151.2523, desc: '발모럴 비치 카페' },
  { name: 'Mary\'s Newtown',       icon: 'ph:hamburger',    cat: '레스토랑', lat: -33.8990, lng: 151.1784, desc: '시드니 버거 성지' },
  { name: 'Mamak Haymarket',       icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8789, lng: 151.2041, desc: '로티카나이 말레이시안' },
  { name: 'Chaco Ramen',           icon: 'ph:fork-knife',   cat: '레스토랑', lat: -33.8785, lng: 151.2161, desc: '줄 서는 라멘집' },
]

const SPOT_CATS = ['전체', '명소', '카페', '디저트', '레스토랑']

function SydneyMap() {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef     = useRef<any[]>([])
  const [loaded, setLoaded]       = useState(false)
  const [selected, setSelected]   = useState<number | null>(null)
  const [catFilter, setCatFilter] = useState('전체')

  const filteredSpots = catFilter === '전체'
    ? SYDNEY_SPOTS
    : SYDNEY_SPOTS.filter(s => s.cat === catFilter)

  // 필터 변경 시 마커 show/hide
  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const spot = SYDNEY_SPOTS[i]
      const visible = catFilter === '전체' || spot.cat === catFilter
      marker.setVisible(visible)
    })
    setSelected(null)
  }, [catFilter])

  // 태그 클릭 → 지도 panTo + InfoWindow
  const handleSpotClick = (filteredIdx: number) => {
    setSelected(filteredIdx)
    const spot = filteredSpots[filteredIdx]
    if (!spot) return
    const map = mapInstanceRef.current
    if (!map) return
    map.panTo({ lat: spot.lat, lng: spot.lng })
    if (map.getZoom() < 14) map.setZoom(14)
    // 해당 마커 찾아서 InfoWindow 표시
    const globalIdx = SYDNEY_SPOTS.findIndex(s => s.name === spot.name)
    const marker = markersRef.current[globalIdx]
    const showInfo = (mapRef.current as any)?.__showInfo
    if (marker && showInfo) showInfo(marker, spot)
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        await loadGoogleMaps()
        if (cancelled || !mapRef.current) return
        const google = (window as any).google
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: -33.8688, lng: 151.2093 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit',      stylers: [{ visibility: 'off' }] },
          ],
        })
        mapInstanceRef.current = map

        const pinColor = (cat: string) => {
          if (cat === '명소')    return '#1B6EF3'
          if (cat === '카페')    return '#10B981'
          if (cat === '디저트')  return '#F97316'
          if (cat === '레스토랑') return '#EF4444'
          return '#FFB800'
        }

        const pinSvg = (cat: string) =>
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
              <ellipse cx="14" cy="34" rx="5" ry="2" fill="rgba(0,0,0,0.18)"/>
              <path d="M14 0C8.477 0 4 4.477 4 10c0 7.7 10 24 10 24S24 17.7 24 10C24 4.477 19.523 0 14 0z" fill="${pinColor(cat)}"/>
              <circle cx="14" cy="10" r="5" fill="#fff"/>
              <circle cx="14" cy="10" r="2.5" fill="${pinColor(cat)}"/>
            </svg>
          `)

        // 이름 풍선 InfoWindow (하나만 재사용)
        const infoWindow = new google.maps.InfoWindow({
          disableAutoPan: true,
          pixelOffset: new google.maps.Size(0, -8),
        })

        // Google InfoWindow 기본 스타일 제거용 CSS
        const style = document.createElement('style')
        style.textContent = `
          .gm-style .gm-style-iw-c {
            padding: 0 !important;
            border-radius: 10px !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.12) !important;
            background: #F1F5F9 !important;
          }
          .gm-style .gm-style-iw-d {
            overflow: hidden !important;
            padding: 0 !important;
          }
          .gm-style .gm-style-iw-t::after {
            background: #F1F5F9 !important;
            box-shadow: none !important;
          }
          .gm-style .gm-style-iw-tc::after {
            background: #F1F5F9 !important;
          }
          .gm-style-iw-chr {
            display: none !important;
          }
        `
        document.head.appendChild(style)

        const showInfo = (marker: any, spot: any) => {
          if (!spot) return
          infoWindow.setContent(`
            <div style="font-family:'Pretendard',sans-serif;font-size:12px;font-weight:700;
                        color:#1E293B;padding:7px 12px;white-space:nowrap;">
              ${spot.name}
            </div>
          `)
          infoWindow.open(map, marker)
        }

        SYDNEY_SPOTS.forEach((spot, i) => {
          const marker = new google.maps.Marker({
            position: { lat: spot.lat, lng: spot.lng },
            map,
            icon: {
              url: pinSvg(spot.cat),
              scaledSize: new google.maps.Size(28, 36),
              anchor: new google.maps.Point(14, 36),
            },
            title: spot.name,
          })
          marker.addListener('click', () => {
            setSelected(i)
            map.panTo({ lat: spot.lat, lng: spot.lng })
            if (map.getZoom() < 14) map.setZoom(14)
            showInfo(marker, spot)
          })
          markersRef.current.push(marker)
        })

        // 태그 클릭 시 InfoWindow 표시를 위해 map ref에 저장
        ;(mapRef.current as any).__infoWindow = infoWindow
        ;(mapRef.current as any).__showInfo   = showInfo
        if (!cancelled) setLoaded(true)
      } catch {}
    }
    init()
    return () => { cancelled = true }
  }, [])

  return (
    <div style={{ background:'#fff', padding:'20px 20px 24px' }}>

      {/* 제목 + 범례 한 줄 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Icon icon="ph:map-pin" width={18} height={18} color={BLUE} />
          <span style={{ fontSize:16, fontWeight:900, color:'#0F172A' }}>시드니 버킷리스트 지도</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[['명소','#1B6EF3'],['카페','#10B981'],['디저트','#F97316'],['레스토랑','#EF4444']].map(([label, color]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:color }}/>
              <span style={{ fontSize:10, color:'#64748B', fontWeight:600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, marginBottom:10, scrollbarWidth:'none' }}>
        {SPOT_CATS.map(cat => (
          <button key={cat} onClick={() => { setCatFilter(cat); setSelected(null) }} style={{
            flexShrink:0, height:28, padding:'0 12px',
            background: catFilter === cat ? '#1E293B' : '#fff',
            color: catFilter === cat ? '#fff' : '#64748B',
            border: 'none',
            borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer',
            boxShadow: catFilter === cat ? '0 2px 8px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.10)',
            transition:'all 0.15s',
          }}>{cat}</button>
        ))}
      </div>

      {/* 명소 태그 — 아이콘+텍스트 가로 스크롤 */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:10, marginBottom:10, scrollbarWidth:'none' }}>
        {filteredSpots.map((s, i) => (
          <div key={i} onClick={() => handleSpotClick(i)} style={{
            flexShrink:0, display:'flex', alignItems:'center', gap:4,
            padding:'4px 10px', borderRadius:20, cursor:'pointer', transition:'all 0.15s',
            background: selected === i ? '#1E293B' : 'transparent',
            color: selected === i ? '#fff' : '#94A3B8',
            fontSize:11, fontWeight:600,
          }}>
            <Icon icon={s.icon} width={12} height={12} color={selected === i ? '#fff' : '#94A3B8'} />
            <span style={{ whiteSpace:'nowrap' }}>{s.name}</span>
          </div>
        ))}
      </div>

      {/* 지도 */}
      <div style={{ position:'relative', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,53,148,0.12)' }}>
        <div ref={mapRef} style={{ width:'100%', height:300 }}/>
        {!loaded && (
          <div style={{
            position:'absolute', inset:0,
            background:'#F1F5F9', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:10,
          }}>
            <div style={{ animation:'spin 1.5s linear infinite', display:'flex' }}><Icon icon="ph:map-pin" width={28} height={28} color={BLUE} /></div>
            <div style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>지도 불러오는 중...</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 업체 등록 폼
function RequestForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ business_name:'', category:'', address:'', description:'', hashtags:'', phone:'', kakao:'', website:'' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.business_name.trim()) { setError('업체명을 입력해주세요'); return }
    if (!form.category)             { setError('카테고리를 선택해주세요'); return }
    if (!form.address.trim())       { setError('주소를 입력해주세요'); return }
    if (!form.description.trim())   { setError('업체 설명을 입력해주세요'); return }
    const tags = form.hashtags.split(/[,#\s]+/).map(t => t.trim()).filter(Boolean)
    if (tags.length < 3) { setError('해시태그를 3개 이상 입력해주세요'); return }
    setError(''); setSubmitting(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error: err } = await supabase.from('business_requests').insert({
        business_name: form.business_name.trim(), category: form.category,
        address: form.address.trim(), description: form.description.trim(),
        hashtags: tags, phone: form.phone.trim()||null, kakao: form.kakao.trim()||null, website: form.website.trim()||null,
      })
      if (err) throw err
      setDone(true)
    } catch { setError('제출 중 오류가 발생했습니다.') }
    setSubmitting(false)
  }

  const iStyle: React.CSSProperties = { width:'100%', height:44, border:'1px solid #C8C8C8', borderRadius:12, padding:'0 12px', fontSize:14, color:'#1E293B', background:'#fff', boxSizing:'border-box', fontFamily:ff, outline:'none' }
  const taStyle: React.CSSProperties = { ...iStyle, height:80, padding:'10px 12px', resize:'none' as any }
  const lbl = (t: string, s?: string) => <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>{t} {s && <span style={{ fontWeight:500, color:'#94A3B8' }}>{s}</span>}</div>
  const businessCats = BCATS.filter(c => c.id !== 'all')

  if (done) return (
    <div style={{ textAlign:'center', padding:'32px 0' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
      <div style={{ fontSize:18, fontWeight:800, color:'#1E293B', marginBottom:8 }}>신청이 완료됐어요!</div>
      <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6, marginBottom:24 }}>검토 후 등록해드릴게요.<br/>감사합니다 🙏</div>
      <button onClick={onClose} style={{ width:'100%', height:48, background:'#e8e8e8', color:'#1B6EF3', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff' }}>확인</button>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>{lbl('업체명 *')}<input value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="업체명을 입력하세요" style={iStyle} /></div>
        <div>
          {lbl('카테고리 *')}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {businessCats.map(cat => (
              <button key={cat.id} onClick={() => set('category', cat.id)} style={{ height:36, borderRadius:12, border: form.category===cat.id ? '1.5px solid #1B6EF3' : '1.5px solid #C8C8C8', cursor:'pointer', background: form.category===cat.id ? '#EFF6FF' : '#fff', color: form.category===cat.id ? '#1B6EF3' : '#64748B', fontSize:12, fontWeight: form.category===cat.id ? 700 : 500 }}>{cat.label}</button>
            ))}
          </div>
        </div>
        <div>{lbl('주소 *')}<AddressAutocomplete value={form.address} onChange={v => set('address', v)} /></div>
        <div>{lbl('업체 설명 *')}<textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="업체 소개를 간단히 작성해주세요" style={taStyle as any} /></div>
        <div>{lbl('해시태그 *', '(3개 이상)')}<input value={form.hashtags} onChange={e => set('hashtags', e.target.value)} placeholder="한식당, 시드니, 가족식사" style={iStyle} /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>{lbl('전화번호')}<input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+61 2 1234 5678" style={iStyle} /></div>
          <div>{lbl('카카오')}<input value={form.kakao} onChange={e => set('kakao', e.target.value)} placeholder="오픈채팅 링크" style={iStyle} /></div>
        </div>
        <div>{lbl('웹사이트')}<input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." style={iStyle} /></div>
      </div>
      {error && <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(239,68,68,0.08)', borderRadius:8, fontSize:12, color:'#DC2626', fontWeight:600 }}>{error}</div>}
      <button onClick={handleSubmit} disabled={submitting} style={{ width:'100%', marginTop:16, height:50, background:'#e8e8e8', color:'#1B6EF3', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor: submitting?'default':'pointer', opacity: submitting?0.7:1, boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff' }}>{submitting ? '제출 중...' : '등록 신청하기'}</button>
    </div>
  )
}

// ── 버킷리스트 추천 폼
function SuggestionForm({ onClose }: { onClose: () => void }) {
  const [suggestion, setSuggestion] = useState('')
  const [email, setEmail]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')
  const iStyle: React.CSSProperties = { width:'100%', height:44, border:'1px solid #C8C8C8', borderRadius:12, padding:'0 12px', fontSize:14, color:'#1E293B', background:'#fff', boxSizing:'border-box', fontFamily:ff, outline:'none' }
  const taStyle: React.CSSProperties = { ...iStyle, height:110, padding:'12px', resize:'none' as any, lineHeight:1.6 }
  const handleSubmit = async () => {
    if (!suggestion.trim()) { setError('추천 내용을 입력해주세요'); return }
    setError(''); setSubmitting(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error: err } = await supabase.from('item_suggestions').insert({ suggestion: suggestion.trim(), email: email.trim()||null })
      if (err) throw err
      setDone(true)
    } catch { setError('제출 중 오류가 발생했어요.') }
    setSubmitting(false)
  }
  if (done) return (
    <div style={{ textAlign:'center', padding:'32px 0' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🙏</div>
      <div style={{ fontSize:18, fontWeight:800, color:'#1E293B', marginBottom:8 }}>감사합니다!</div>
      <div style={{ fontSize:13, color:'#64748B', lineHeight:1.7, marginBottom:24 }}>소중한 경험을 나눠주셨어요.<br/>채택되면 이메일로 알려드릴게요 😊</div>
      <button onClick={onClose} style={{ width:'100%', height:48, background:'#e8e8e8', color:'#1B6EF3', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff' }}>확인</button>
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'rgba(232,232,232,0.8)', borderRadius:12, padding:'12px 14px', border:'1px solid #C8C8C8' }}>
        <div style={{ fontSize:13, color:'#1B6EF3', fontWeight:700, marginBottom:4 }}>💡 이런 것들을 추천해주세요</div>
        <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6 }}>호주에서 꼭 해봐야 할 것, 먹어봐야 할 것, 가봐야 할 곳!</div>
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>추천 내용 *</div>
        <textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} placeholder="예) 본다이 비치에서 서핑 레슨 받기..." style={taStyle as any} />
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>이메일 <span style={{ fontWeight:500, color:'#94A3B8' }}>(선택 · 채택 시 알림)</span></div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" type="email" style={iStyle} />
      </div>
      {error && <div style={{ padding:'8px 12px', background:'rgba(239,68,68,0.08)', borderRadius:8, fontSize:12, color:'#DC2626', fontWeight:600 }}>{error}</div>}
      <button onClick={handleSubmit} disabled={submitting} style={{ width:'100%', height:50, background:'#e8e8e8', color:'#1B6EF3', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor: submitting?'default':'pointer', opacity: submitting?0.7:1, boxShadow:'3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:4 }}>
        <Icon icon="ph:paper-plane-tilt" width={16} height={16} color="#1B6EF3" />
        {submitting ? '제출 중...' : '추천 제출하기'}
      </button>
    </div>
  )
}

// ── 말풍선
function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const navigate = useNavigate()
  const tapTimer = useRef<any>(null)

  const handleTitleTap = () => {
    const next = tapCount + 1
    setTapCount(next)
    if (tapTimer.current) clearTimeout(tapTimer.current)
    if (next >= 5) { navigate('/bingo'); setTapCount(0); return }
    tapTimer.current = setTimeout(() => setTapCount(0), 1500)
  }

  return (
    <div style={{ position:'fixed', bottom:'10%', right:20, zIndex:300, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
      {open && (
        <div style={{ background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 4px 20px rgba(27,110,243,0.15)', maxWidth:240, position:'relative', animation:'fadeInUp 0.25s ease', border:'1px solid rgba(27,110,243,0.08)' }}>
          <button onClick={() => setOpen(false)} style={{ position:'absolute', top:8, right:8, background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:14, lineHeight:1, padding:2 }}>✕</button>
          <div onClick={handleTitleTap} style={{ fontSize:12, fontWeight:800, color:BLUE, marginBottom:6, cursor:'pointer', userSelect:'none' }}>호주가자 운영자입니다.</div>
          <div style={{ fontSize:12, color:'#475569', lineHeight:1.6 }}>
            본 서비스는 무료로 제공됩니다. 문의는{' '}
            <a href="https://www.threads.net/@palaslouise" target="_blank" rel="noreferrer" style={{ color:BLUE, fontWeight:700, textDecoration:'none' }}>@palaslouise</a>로 연락주세요.
          </div>
          <div style={{ position:'absolute', bottom:-8, right:18, width:0, height:0, borderLeft:'8px solid transparent', borderRight:'8px solid transparent', borderTop:'8px solid #fff', filter:'drop-shadow(0 2px 2px rgba(27,110,243,0.08))' }}/>
        </div>
      )}
      <button onClick={() => setOpen(v => !v)} style={{ width:44, height:44, borderRadius:'50%', background:BLUE, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(27,110,243,0.35)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════
// ── 메인 컴포넌트
// ══════════════════════════════════════════════════
// ── LCD 통계 컴포넌트
function LcdStats() {
  const { bucketDone, bucketTotal } = (() => {
    try {
      const state = JSON.parse(localStorage.getItem('korea-receipt') ?? '{}')
      const achieved = JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}')
      const selected: Record<string,boolean> = state.selected ?? {}
      const schedules: Record<string,number[]> = state.schedules ?? {}
      // row 기준 total (같은 아이템이 8일이면 8개)
      let total = 0
      let done = 0
      Object.keys(selected).forEach(id => {
        const days = schedules[id] ?? []
        if (days.length === 0) {
          total++
          if (achieved[id]) done++
        } else {
          days.forEach(d => {
            total++
            if (achieved[`${id}_${d}`]) done++
          })
        }
      })
      return { bucketDone: done, bucketTotal: total }
    } catch { return { bucketDone: 0, bucketTotal: 0 } }
  })()
  const shopList    = (() => { try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]').length } catch { return 0 } })()
  const shopDone    = (() => { try { return Object.keys(JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}')).filter(k => JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}')[k]).length } catch { return 0 } })()
  const melDone     = (() => { try { return JSON.parse(localStorage.getItem('bingo-melbourne') ?? '[]').length } catch { return 0 } })()
  const sydDone     = (() => { try { return JSON.parse(localStorage.getItem('bingo-sydney') ?? '[]').length } catch { return 0 } })()
  const BINGO_TOTAL = 25

  const rows = [
    { icon:'ph:check-circle', label:'버킷리스트', done: bucketDone, total: bucketTotal || 0, pct: bucketTotal ? Math.round(bucketDone/bucketTotal*100) : 0 },
    { icon:'ph:shopping-bag', label:'쇼핑리스트',  done: shopDone,   total: shopList,         pct: shopList   ? Math.round(shopDone/shopList*100)     : 0 },
    { icon:'ph:coffee',       label:'시드니 카페 빙고', done: sydDone, total: BINGO_TOTAL,    pct: Math.round(sydDone/BINGO_TOTAL*100) },
    { icon:'ph:coffee',       label:'멜번 카페 빙고',  done: melDone, total: BINGO_TOTAL,    pct: Math.round(melDone/BINGO_TOTAL*100) },
  ]

  return (
    <div style={{ padding:'0 12px 0' }}>
      {/* 큰 사각형 하나에 4구획 */}
      <div style={{
        border:'1px solid #a8b498',
        borderRadius:8,
        overflow:'hidden',
        display:'grid',
        gridTemplateColumns:'1fr 1fr',
      }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            background:'#c8d4b8',
            padding:'8px 10px',
            display:'flex', alignItems:'center', gap:8,
            borderRight:  i % 2 === 0 ? '1px solid #a8b498' : 'none',
            borderBottom: i < 2       ? '1px solid #a8b498' : 'none',
          }}>
            <Icon icon={r.icon} width={22} height={22} color="#4a7a1e" style={{ flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:9, color:'#4a5e32', letterSpacing:0.5, fontFamily:'monospace', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.label}</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#2d3e1f', fontFamily:'monospace', letterSpacing:1 }}>
                {r.done}<span style={{ fontSize:9, color:'#4a5e32' }}>/{r.total}</span>
              </div>
              <div style={{ height:3, background:'#a8b498', borderRadius:2, marginTop:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${r.pct}%`, background:'#4a7a1e', borderRadius:2 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage({ state, onStart, onServices }: Props) {
  const navigate = useNavigate()
  const [showForm, setShowForm]             = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [logoTap, setLogoTap]               = useState(0)
  const logoTimer    = useRef<any>(null)

  const handleLogoTap = () => {
    const next = logoTap + 1
    setLogoTap(next)
    if (logoTimer.current) clearTimeout(logoTimer.current)
    if (next >= 5) { window.location.href = '/admin'; setLogoTap(0); return }
    logoTimer.current = setTimeout(() => setLogoTap(0), 2000)
  }

  return (
    <div style={{ background:'#e8e8e8', fontFamily:ff, overflowX:'hidden' }}>

      {/* ── 계산기 섹션 ── */}
      <div style={{
        background:'#e8e8e8',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 0',
        boxSizing: 'border-box' as any,
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;700&display=swap');
          .calc-btn {
            background-color: #e8e8e8;
            border: none;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 700;
            color: #333;
            cursor: pointer;
            box-shadow: 3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            line-height: 1.3;
            padding: 4px;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }
          .calc-btn:active {
            box-shadow: inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff;
            transform: scale(0.97);
          }
          .calc-btn-accent {
            background-color: #1B6EF3;
            color: #fff;
            box-shadow: 3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff;
          }
          .calc-btn-accent:active {
            box-shadow: inset 3px 3px 6px #1558c0, inset -3px -3px 6px #2080ff;
          }
        `}</style>

        {/* 계산기 본체 */}
        <div style={{
          background:'#e8e8e8',
          borderRadius: 24,
          padding: '20px 20px 24px',
          boxShadow: '8px 8px 16px #c5c5c5, -8px -8px 16px #ffffff',
          maxWidth: 380,
          width: 'calc(100% - 32px)',
          margin: '0 auto',
          boxSizing: 'border-box' as any,
        }}>
          {/* 타이틀 */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              fontSize: 22, fontWeight: 700, color: '#333',
              letterSpacing: 4,
              fontFamily: '"Josefin Sans", "Raleway", sans-serif',
            }}>HOJUGAJA.COM</div>
          </div>

          {/* 디스플레이 */}
          <div style={{
            background:'#c8d4b8',
            borderRadius: 12,
            marginBottom: 20,
            boxShadow: 'inset 3px 3px 8px #a8b498, inset -2px -2px 6px #e8f4d8',
            overflow: 'hidden',
          }}>
            <style>{`
              @keyframes scrollUpLoop {
                0%   { transform: translateY(0); }
                100% { transform: translateY(-50%); }
              }
              .notice-loop {
                animation: scrollUpLoop 22s linear infinite;
                display: flex;
                flex-direction: column;
              }
              @keyframes lcdblink { 0%,100%{opacity:1} 50%{opacity:0.2} }
              .lcd-blink { animation: lcdblink 1.2s step-end infinite; }
            `}</style>

            {/* 헤더 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 12px 8px' }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#2d3e1f', letterSpacing:2, fontFamily:'monospace' }}>나의 호주가자</div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:9, color:'#4a5e32', letterSpacing:1, fontFamily:'monospace' }}>LIVE</span>
                <div className="lcd-blink" style={{ width:6, height:6, borderRadius:'50%', background:'#4a7a1e' }} />
              </div>
            </div>
            {/* 헤더 아래 여백 있는 구분선 */}
            <div style={{ height:1, background:'#a8b498', margin:'0 12px 10px' }} />

            {/* 통계 4칸 그리드 — 고정 */}
            <LcdStats />

            {/* 구분선 */}
            <div style={{ height:1, background:'#a8b498', margin:'8px 12px' }} />

            {/* 공지 스크롤 */}
            <div style={{ height:72, overflow:'hidden', padding:'6px 12px 0' }}>
              <div className="notice-loop">
                {[0,1].map(k => (
                  <div key={k}>
                    {[
                      { hi:true,  text:'> 호주가자에 오신 것을 환영합니다!' },
                      { hi:false, text:'  호주 여행·이민 무료 정보 제공 사이트' },
                      { hi:true,  text:'> 업체 등록은 무료 · 우선 노출 보장' },
                      { hi:false, text:'  아래 #업체등록신청 버튼 이용하세요' },
                      { hi:true,  text:'> 버킷리스트 추천이 있으신가요?' },
                      { hi:false, text:'  *버킷리스트추천 버튼을 눌러주세요' },
                      { hi:true,  text:'> 더 많은 서비스 준비 중입니다 :)' },
                    ].map((line, i) => (
                      <div key={i} style={{
                        fontSize:10, lineHeight:1.9, fontFamily:'monospace',
                        letterSpacing:0.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                        color: line.hi ? '#2d3e1f' : '#4a5e32',
                        fontWeight: line.hi ? 800 : 400,
                      }}>{line.text}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* 스크롤 아래 여백 */}
            <div style={{ height:12 }} />
          </div>

          {/* 버튼 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {/* 1행 */}
            <button className="calc-btn" onClick={onStart} style={{ height: 72 }}>1<br/>버킷리스트</button>
            <button className="calc-btn" onClick={onServices} style={{ height: 72 }}>2<br/>업체리스트</button>
            <button className="calc-btn" onClick={() => navigate('/app?tab=nearby')} style={{ height: 72 }}>3<br/>내주변</button>
            {/* 2행 */}
            <button className="calc-btn" onClick={() => {
              try {
                const list = JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]')
                navigate(list.length > 0 ? '/app?tab=myshoppinglist' : '/app?tab=shopping')
              } catch {
                navigate('/app?tab=shopping')
              }
            }} style={{ height: 72 }}>4<br/>쇼핑리스트</button>
            <button className="calc-btn" onClick={() => navigate('/app?tab=bingo')} style={{ height: 72 }}>5<br/>카페빙고게임</button>
            <button className="calc-btn" onClick={() => navigate('/app?tab=community')} style={{ height: 72 }}>6<br/>나도한마디</button>
            {/* 3행 */}
            <button className="calc-btn" style={{ height: 72, color: '#94A3B8' }}>7<br/>준비중</button>
            <button className="calc-btn" style={{ height: 72, color: '#94A3B8' }}>8<br/>준비중</button>
            <button className="calc-btn" style={{ height: 72, color: '#94A3B8' }}>9<br/>준비중</button>
            {/* 4행 */}
            <button className="calc-btn calc-btn-accent" onClick={() => setShowSuggestion(true)}
              style={{ height: 72, fontSize: 12 }}>*<br/>버킷리스트추천</button>
            <button className="calc-btn" style={{ height: 72, color: '#94A3B8' }}>0<br/>준비중</button>
            <button className="calc-btn calc-btn-accent" onClick={() => setShowForm(true)}
              style={{ height: 72, fontSize: 12 }}>#<br/>업체등록신청</button>
          </div>
        </div>
      </div>

      {/* ── 모달: 버킷리스트 추천 ── */}
      {showSuggestion && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={() => setShowSuggestion(false)} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>
          <div style={{ position:'relative', width:'100%', maxWidth:390, background:'#e8e8e8', borderRadius:'20px 20px 0 0', padding:'20px 20px 40px', maxHeight:'90vh', overflowY:'auto', zIndex:1 }}>
            <div style={{ width:36, height:4, background:'#C8C8C8', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#1E293B' }}>버킷리스트추천</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>채택되면 이메일로 알려드려요 😊</div>
              </div>
              <button onClick={() => setShowSuggestion(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <Icon icon="ph:x" width={20} height={20} color="#94A3B8" />
              </button>
            </div>
            <SuggestionForm onClose={() => setShowSuggestion(false)} />
          </div>
        </div>
      )}

      {/* ── 모달: 업체 등록 ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={() => setShowForm(false)} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>
          <div style={{ position:'relative', width:'100%', maxWidth:390, background:'#e8e8e8', borderRadius:'20px 20px 0 0', padding:'20px 20px 40px', maxHeight:'90vh', overflowY:'auto', zIndex:1 }}>
            <div style={{ width:36, height:4, background:'#C8C8C8', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#1E293B' }}>업체 등록 신청</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>검토 후 등록해드려요</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <Icon icon="ph:x" width={20} height={20} color="#94A3B8" />
              </button>
            </div>
            <RequestForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

      <ChatBubble />
    </div>
  )
}
