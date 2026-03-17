import { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { AppState } from '../store/state'
import { CATEGORIES } from '../data/checklist'
import { supabase } from '../lib/supabase'
import { CATEGORIES as BCATS, BUSINESSES } from '../data/businesses'

// ── 이미지 import (src/assets/landing/ 폴더에 넣어주세요)
import imgHero     from '../assets/landing/hero.png'
import imgCoins    from '../assets/landing/coins.png'
import imgCafe     from '../assets/landing/cafe-brunch.png'
import imgFood     from '../assets/landing/food-korean-bbq.png'
import imgShopping from '../assets/landing/shopping.png'
import imgNature   from '../assets/landing/nature-kangaroo.png'
import imgCity     from '../assets/landing/city-culture.png'
import imgBeach    from '../assets/landing/beach.png'
import imgBackpack from '../assets/landing/backpacker.png'
import imgUnique   from '../assets/landing/unique-bridgeclimb.png'
import imgStars    from '../assets/landing/bluemountains-stars.png'
import imgSuggest  from '../assets/landing/suggest-cafe.png'
import imgBusiness from '../assets/landing/business-storefront.png'

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

// ── 추천 버킷리스트 데이터 (itemId: 클릭 시 이동할 checklist 항목 id, catId: 카테고리)
const BUCKET_RECS = [
  {
    id: 'blackstar',
    title: 'Black Star Pastry',
    desc: '시드니에서 수박 케이크 먹기',
    img: imgCafe,
    pos: 'center',
    itemId: 'f14',
    catId: 'food',
  },
  {
    id: 'bondi',
    title: 'Bondi Beach',
    desc: '시드니 대표 해변 즐기기',
    img: imgBeach,
    pos: 'center 30%',
    itemId: 'b02',
    catId: 'beach',
  },
  {
    id: 'bridgeclimb',
    title: '하버 브리지 클라이밍',
    desc: '시드니 전경을 발밑에 두기',
    img: imgUnique,
    pos: 'center',
    itemId: 'u03',
    catId: 'city',
  },
  {
    id: 'bbq',
    title: '공원 BBQ 파티',
    desc: '호주식 바베큐 파티 즐기기',
    img: imgFood,
    pos: 'center',
    itemId: 'f12',
    catId: 'food',
  },
  {
    id: 'kangaroo',
    title: '캥거루 먹이주기',
    desc: '야생동물 공원 체험',
    img: imgNature,
    pos: 'center',
    itemId: 'i_1773020002843',
    catId: 'nature',
  },
  {
    id: 'bluemountains',
    title: '블루마운틴 별보기',
    desc: '은하수 아래 쓰리시스터즈 감상',
    img: imgStars,
    pos: 'center 40%',
    itemId: 'n01',
    catId: 'nature',
  },
]

// ── checklist 카테고리 → 배경 이미지 매핑
const CAT_PHOTO_MAP: Record<string, string> = {
  'hospital':          imgCafe,
  'food':              imgFood,
  'shopping':          imgShopping,
  'admin':             imgBackpack,
  'people':            imgSuggest,
  'parenting':         imgNature,
  'places':            imgBeach,
  'cat_1772930790490': imgCity,
  'custom':            imgUnique,
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

  const iStyle: React.CSSProperties = { width:'100%', height:44, border:'1px solid #E2E8F0', borderRadius:12, padding:'0 12px', fontSize:14, color:'#1E293B', background:'#fff', boxSizing:'border-box', fontFamily:ff, outline:'none' }
  const taStyle: React.CSSProperties = { ...iStyle, height:80, padding:'10px 12px', resize:'none' as any }
  const lbl = (t: string, s?: string) => <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:5 }}>{t} {s && <span style={{ fontWeight:500, color:'#94A3B8' }}>{s}</span>}</div>
  const businessCats = BCATS.filter(c => c.id !== 'all')

  if (done) return (
    <div style={{ textAlign:'center', padding:'32px 0' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
      <div style={{ fontSize:18, fontWeight:800, color:'#1E293B', marginBottom:8 }}>신청이 완료됐어요!</div>
      <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6, marginBottom:24 }}>검토 후 등록해드릴게요.<br/>감사합니다 🙏</div>
      <button onClick={onClose} style={{ width:'100%', height:48, background:BLUE, color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>확인</button>
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
              <button key={cat.id} onClick={() => set('category', cat.id)} style={{ height:36, borderRadius:12, border:'none', cursor:'pointer', background: form.category===cat.id ? BLUE : '#fff', color: form.category===cat.id ? '#fff' : '#1E293B', fontSize:12, fontWeight:700, boxShadow: form.category===cat.id ? '0 2px 8px rgba(0,53,148,0.25)' : '0 1px 4px rgba(0,0,0,0.08)' }}>{cat.label}</button>
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
      <button onClick={handleSubmit} disabled={submitting} style={{ width:'100%', marginTop:16, height:50, background:BLUE, color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor: submitting?'default':'pointer', opacity: submitting?0.7:1, boxShadow:'0 4px 14px rgba(0,53,148,0.25)' }}>{submitting ? '제출 중...' : '등록 신청하기'}</button>
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
  const iStyle: React.CSSProperties = { width:'100%', height:44, border:'1px solid #E2E8F0', borderRadius:12, padding:'0 12px', fontSize:14, color:'#1E293B', background:'#fff', boxSizing:'border-box', fontFamily:ff, outline:'none' }
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
      <button onClick={onClose} style={{ width:'100%', height:48, background:BLUE, color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>확인</button>
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'rgba(0,53,148,0.05)', borderRadius:12, padding:'12px 14px' }}>
        <div style={{ fontSize:13, color:BLUE, fontWeight:700, marginBottom:4 }}>💡 이런 것들을 추천해주세요</div>
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
      <button onClick={handleSubmit} disabled={submitting} style={{ width:'100%', height:50, background:BLUE, color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor: submitting?'default':'pointer', opacity: submitting?0.7:1, boxShadow:'0 4px 14px rgba(0,53,148,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:4 }}>
        <Icon icon="ph:paper-plane-tilt" width={16} height={16} color="'${GOLD}'" />
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
export default function LandingPage({ state, onStart, onServices }: Props) {
  const navigate = useNavigate()
  const [dbItems, setDbItems] = useState<any[]>([])
  useEffect(() => {
    supabase.from('checklist_items').select('id,label,category_id').eq('is_active', true)
      .then(({ data }) => { if (data) setDbItems(data) })
  }, [])

  // BucketCheckView와 완전히 동일한 방식 (1아이템 N일 배정 → N개로 카운트)
  const totalItems   = dbItems.length || 0
  // 발행된 버킷리스트가 있을 때만 진행률 계산 (수정중/작성중이면 0/0)
  const isIssued     = !!state.meta?.lastIssuedAt
  const ITEMS        = dbItems.map(i => ({ id: i.id, categoryId: i.category_id, label: i.label, emoji: '📌' }))
  const allItems     = [...ITEMS, ...(state.customItems ?? []).map((c: any) => ({ ...c, emoji:'📝' }))]
  const checkedItems = isIssued ? allItems.filter((i: any) => state.selected?.[i.id]) : []
  const allRows      = (() => {
    const rows: { id: string; day?: number }[] = []
    checkedItems.forEach((item: any) => {
      const days = state.schedules?.[item.id] ?? []
      if (days.length === 0) rows.push({ id: item.id })
      else days.forEach((d: number) => rows.push({ id: item.id, day: d }))
    })
    return rows
  })()
  const getKey       = (id: string, day?: number) => day !== undefined ? `${id}_${day}` : id
  const total        = allRows.length
  const achieved     = (() => { try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} } })()
  const checked      = allRows.filter(r => !!achieved[getKey(r.id, r.day)]).length
  const progress     = total > 0 ? Math.round((checked / total) * 100) : 0
  const [bizCount, setBizCount] = useState(BUSINESSES.length)

  useEffect(() => {
    async function fetchBizCount() {
      try {
        const { supabase } = await import('../lib/supabase')
        const { count } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
        if (count !== null) setBizCount(count)
      } catch {}
    }
    fetchBizCount()
  }, [])

  const [showForm, setShowForm]             = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [logoTap, setLogoTap]               = useState(0)
  const [sliderIdx, setSliderIdx]           = useState(0)
  const [sliderAnimate, setSliderAnimate]   = useState(true)
  const sliderRef    = useRef<HTMLDivElement>(null)
  const logoTimer    = useRef<any>(null)
  const touchStartX  = useRef<number>(0)
  const touchStartY  = useRef<number>(0)
  const isDragging   = useRef(false)

  // 카드 앞뒤로 복제해서 무한루프
  const CLONED = [...BUCKET_RECS, ...BUCKET_RECS, ...BUCKET_RECS]
  const OFFSET  = BUCKET_RECS.length // 가운데 세트 시작 인덱스
  const [realIdx, setRealIdx] = useState(OFFSET)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current = false
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return // 탭 허용
    if (Math.abs(dx) < Math.abs(dy) * 0.8) return // 세로 스크롤 무시
    if (dx < -40) {
      setSliderAnimate(true)
      setRealIdx(i => i + 1)
    } else if (dx > 40) {
      setSliderAnimate(true)
      setRealIdx(i => i - 1)
    }
  }

  const handleLogoTap = () => {
    const next = logoTap + 1
    setLogoTap(next)
    if (logoTimer.current) clearTimeout(logoTimer.current)
    if (next >= 5) { window.location.href = '/admin'; setLogoTap(0); return }
    logoTimer.current = setTimeout(() => setLogoTap(0), 2000)
  }

  // 자동 재생
  useEffect(() => {
    const t = setInterval(() => {
      setSliderAnimate(true)
      setRealIdx(i => i + 1)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // 끝에 닿으면 애니 없이 순간이동
  useEffect(() => {
    if (realIdx >= BUCKET_RECS.length * 2) {
      const timer = setTimeout(() => {
        setSliderAnimate(false)
        setRealIdx(OFFSET)
      }, 350)
      return () => clearTimeout(timer)
    }
    if (realIdx < OFFSET) {
      const timer = setTimeout(() => {
        setSliderAnimate(false)
        setRealIdx(BUCKET_RECS.length * 2 - 1)
      }, 350)
      return () => clearTimeout(timer)
    }
    // dot 인덱스 동기화
    setSliderIdx((realIdx - OFFSET) % BUCKET_RECS.length)
  }, [realIdx])

  const displayCats = CATEGORIES.filter(c => c.id !== 'custom')

  return (
    <div style={{ minHeight:'100vh', background:'#F0F4FF', fontFamily:ff, overflowX:'hidden' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes progressFill { from{width:0%} to{width:var(--w)} }
        .cat-card:hover { transform:translateY(-3px) scale(1.01); box-shadow:0 12px 28px rgba(0,53,148,0.20) !important; }
        .cat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .slider-wrap::-webkit-scrollbar { display:none; }
        .slider-wrap { scrollbar-width:none; }
      `}</style>

      {/* ── 히어로 ── */}
      <div style={{ position:'relative', overflow:'hidden' }}>

        {/* 배경 이미지 */}
        <img
          src={imgHero}
          alt="시드니"
          style={{ width:'100%', display:'block', objectFit:'cover' }}
        />

        {/* 상단 헤더 — 호주가자 + 개수 뱃지 */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, zIndex:10,
          padding:'14px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div onClick={handleLogoTap} style={{ cursor:'pointer', userSelect:'none' as any }}>
            <span style={{ fontSize:19, fontWeight:900, color:'#fff', letterSpacing:-0.5, textShadow:'0 1px 8px rgba(0,0,0,0.40)' }}>호주가자</span>
          </div>
          <div style={{
            display:'flex', gap:8,
            background:'rgba(0,0,0,0.28)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(255,255,255,0.22)',
            borderRadius:12, padding:'6px 12px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Icon icon="ph:list-checks" width={12} height={12} color={GOLD} />
              <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{totalItems}개 버킷리스트</span>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.30)' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Icon icon="ph:storefront" width={12} height={12} color={GOLD} />
              <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{bizCount}개 업체</span>
            </div>
          </div>
        </div>

        {/* 파란 배너 위 텍스트 — "호주 이민·여행자를 위한" */}
        <div style={{
          position:'absolute', top:'24%', left:0, right:0,
          textAlign:'center', zIndex:10,
        }}>
          <p style={{
            margin:0, fontSize:15, fontWeight:700,
            letterSpacing:0.3,
            textShadow:'0 1px 4px rgba(0,0,0,0.20)',
          }}>
            <span style={{ color: GOLD }}>호주 이민·여행자</span>
            <span style={{ color:'#fff' }}>를 위한</span>
          </p>
        </div>

        {/* 메인 타이틀 */}
        <div style={{
          position:'absolute', top:'36%', left:0, right:0,
          textAlign:'center', zIndex:10,
          padding:'0 16px',
          color:'#fff',
          textShadow:'0 2px 14px rgba(0,0,30,0.35)',
          lineHeight:1.2,
        }}>
          {/* 호주에서 꼭 해야 할 */}
          <div style={{ fontSize:36, fontWeight:900 }}>
            <span style={{ fontSize:44 }}>호주</span>
            <span style={{ fontSize:28, fontWeight:700 }}>에서 </span>
            <span style={{ fontSize:44 }}>꼭</span>
            <span style={{ fontSize:28, fontWeight:700 }}> 해야 할</span>
          </div>
          {/* 모든 것! — 호주/꼭 과 같은 크기 */}
          <div style={{ fontSize:44, fontWeight:900, marginTop:4 }}>
            모든 것!
          </div>
        </div>

        {/* 서브 문구 */}
        <div style={{
          position:'absolute', top:'60%', left:0, right:0,
          textAlign:'center', zIndex:10,
        }}>
          <p style={{
            fontSize:14, color:'rgba(255,255,255,0.95)',
            margin:0, lineHeight:1.6, fontWeight:500,
            textShadow:'0 1px 4px rgba(0,0,0,0.30)',
          }}>
            가고 싶은 곳, 먹고 싶은 것, 지금 체크하세요
          </p>
        </div>

        {/* 하단 버튼 2개 */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          padding:'0 24px 24px',
          display:'flex', gap:10,
          zIndex:10,
        }}>
          <button onClick={onStart} style={{
            flex:2, height:50, background:GOLD, color:'#002870',
            border:'none', borderRadius:12, fontSize:14, fontWeight:900,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            boxShadow:`0 4px 20px rgba(255,184,0,0.55)`,
          }}>
            <Icon icon="ph:list-checks" width={16} height={16} color="#002870" />
            나의 버킷리스트
          </button>
          <button onClick={onServices} style={{
            flex:1, height:50,
            background:'rgba(255,255,255,0.18)', color:'#fff',
            border:'1.5px solid rgba(255,255,255,0.40)', borderRadius:12,
            fontSize:13, fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            backdropFilter:'blur(8px)', whiteSpace:'nowrap' as any,
          }}>
            <Icon icon="ph:buildings" width={14} height={14} color="#fff" />
            업체/서비스
          </button>
        </div>
      </div>

      {/* ── 나의 버킷리스트 진행 카드 ── */}
      <div style={{ background:'#fff', padding:'20px', borderBottom:'1px solid #F1F5F9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>

          {/* 도넛 그래프 */}
          <div style={{ flexShrink:0, position:'relative', width:128, height:128 }}>
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="51" fill="none" stroke="#EEF3FF" strokeWidth="10"/>
              <circle cx="64" cy="64" r="51" fill="none"
                stroke={progress === 100 ? '#10B981' : BLUE}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 51}`}
                strokeDashoffset={`${2 * Math.PI * 51 * (1 - progress / 100)}`}
                transform="rotate(-90 64 64)"
                style={{ transition:'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div style={{
              position:'absolute', inset:0,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontSize:22, fontWeight:900, color: progress === 100 ? '#10B981' : BLUE, lineHeight:1 }}>{progress}%</span>
            </div>
          </div>

          {/* 텍스트 */}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:900, color:'#0F172A', marginBottom:4 }}>나의 버킷리스트</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:8 }}>
              <span style={{ fontWeight:800, color: progress === 100 ? '#10B981' : BLUE }}>{checked}개</span> 완료 · 총 {total}개
            </div>
            {progress === 0 && <div style={{ fontSize:12, color:'#94A3B8' }}>아직 체크한 항목이 없어요. 시작해볼까요?</div>}
            {progress > 0 && progress < 100 && <div style={{ fontSize:12, color:BLUE, fontWeight:600 }}>{total - checked}개 항목이 남았어요!</div>}
            {progress === 100 && <div style={{ fontSize:12, color:'#10B981', fontWeight:700 }}>모든 항목을 완료했어요! 🎉</div>}
            <button onClick={onStart} style={{
              marginTop:10, height:34, padding:'0 16px',
              background:BLUE, color:'#fff', border:'none', borderRadius:12,
              fontSize:12, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:5,
              boxShadow:`0 2px 8px rgba(27,110,243,0.25)`,
            }}>
              <Icon icon="ph:list-checks" width={13} height={13} color={GOLD} />
              나의 리스트 보러가기
            </button>
          </div>
        </div>
      </div>

      {/* ── 추천 버킷리스트 슬라이더 ── */}
      <div style={{ background:'#fff', padding:'24px 0 28px' }}>
        <div style={{ padding:'0 20px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'#0F172A' }}>추천 버킷리스트</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>호주에서 꼭 경험해야 할 것들</div>
          </div>
          <div style={{ display:'flex', gap:5 }}>
            {BUCKET_RECS.map((_, i) => (
              <div key={i} style={{
                width: i === sliderIdx ? 18 : 6, height:6, borderRadius:3,
                background: i === sliderIdx ? BLUE : '#CBD5E1',
                cursor:'pointer', transition:'all 0.3s ease',
              }} onClick={() => { setSliderAnimate(true); setRealIdx(OFFSET + i) }}/>
            ))}
          </div>
        </div>

        {/* 무한루프 슬라이더 */}
        <div
          style={{ overflow:'hidden', paddingLeft:20 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={sliderRef}
            style={{
              display:'flex', gap:12,
              transition: sliderAnimate ? 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
              transform: `translateX(calc(-${realIdx} * (68vw + 12px) + 0px))`,
            }}
          >
            {CLONED.map((item, i) => {
              const dotIdx = (i - OFFSET + BUCKET_RECS.length * 10) % BUCKET_RECS.length
              const isActive = dotIdx === sliderIdx
              return (
                <div key={i} style={{
                  flexShrink:0, width:'68vw', maxWidth:300, borderRadius:12, overflow:'hidden',
                  background:'#fff', cursor:'pointer',
                  boxShadow: isActive ? `0 8px 28px rgba(27,110,243,0.18)` : '0 2px 12px rgba(0,0,0,0.08)',
                  border: isActive ? `1.5px solid rgba(27,110,243,0.15)` : '1.5px solid #F1F5F9',
                  transform: isActive ? 'scale(1)' : 'scale(0.97)',
                  transition:'all 0.3s ease',
                }}
                  onClick={() => navigate(`/app?cat=${item.catId}&item=${item.itemId}`)}
                >
                  <div style={{
                    width:'100%', height:140,
                    backgroundImage:`url(${item.img})`,
                    backgroundSize:'cover',
                    backgroundPosition: item.pos,
                  }}/>
                  <div style={{ padding:'12px 14px 14px' }}>
                    <div style={{ fontSize:14, fontWeight:900, color:'#0F172A', marginBottom:3 }}>{item.title}</div>
                    <div style={{ fontSize:12, color:'#64748B', marginBottom:12, lineHeight:1.5 }}>{item.desc}</div>
                    <div style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      background:GOLD, borderRadius:12, padding:'6px 14px',
                    }}>
                      <Icon icon="ph:heart" width={12} height={12} color="#002870" />
                      <span style={{ fontSize:11, fontWeight:800, color:'#002870' }}>버킷리스트에 추가 ›</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 지도 섹션 ── */}
      <SydneyMap />

      {/* ── 버킷리스트 추천 배너 ── */}
      <div style={{ padding:'16px 20px 12px', background:'#fff' }}>
        <div style={{ borderRadius:18, overflow:'hidden', position:'relative', height:140, boxShadow:`0 4px 20px rgba(27,110,243,0.12)` }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:`url(${imgSuggest})`, backgroundSize:'cover', backgroundPosition:'center top' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,30,100,0.85) 0%, rgba(0,30,100,0.50) 55%, rgba(0,30,100,0.15) 100%)' }}/>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', padding:'0 20px', gap:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <Icon icon="ph:paper-plane-tilt" width={15} height={15} color={GOLD} />
                <div style={{ fontSize:15, fontWeight:900, color:'#fff' }}>버킷리스트 추천하기</div>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.82)', lineHeight:1.6 }}>경험을 쉐어해 주세요</div>
            </div>
            <button onClick={() => setShowSuggestion(true)} style={{ flexShrink:0, height:40, padding:'0 16px', background:GOLD, color:'#002870', border:'none', borderRadius:12, fontSize:13, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap', boxShadow:`0 4px 14px rgba(255,184,0,0.4)` }}>추천하기</button>
          </div>
        </div>
      </div>

      {/* ── 업체 등록 배너 ── */}
      <div style={{ padding:'12px 20px 32px', background:'#fff' }}>
        <div style={{ borderRadius:18, overflow:'hidden', position:'relative', height:140, boxShadow:`0 4px 20px rgba(27,110,243,0.12)` }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:`url(${imgBusiness})`, backgroundSize:'cover', backgroundPosition:'center' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,20,80,0.90) 0%, rgba(0,20,80,0.58) 55%, rgba(0,20,80,0.15) 100%)' }}/>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', padding:'0 20px', gap:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <Icon icon="ph:storefront" width={15} height={15} color={GOLD} />
                <div style={{ fontSize:15, fontWeight:900, color:'#fff' }}>업체 등록 신청</div>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.82)', lineHeight:1.6 }}>한인 커뮤니티에 홍보하세요</div>
              <div style={{ display:'flex', gap:5, marginTop:6 }}>
                {['무료','한인타겟','직접관리'].map(t => (
                  <span key={t} style={{ background:`rgba(255,184,0,0.22)`, color:GOLD, fontSize:10, fontWeight:700, borderRadius:20, padding:'2px 8px', border:`1px solid rgba(255,184,0,0.30)` }}>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowForm(true)} style={{ flexShrink:0, height:40, padding:'0 16px', background:GOLD, color:'#002870', border:'none', borderRadius:12, fontSize:13, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap', boxShadow:`0 4px 14px rgba(255,184,0,0.4)` }}>신청하기</button>
          </div>
        </div>
      </div>

      {/* ── 계산기 섹션 ── */}
      <div style={{
        background:'#e8e8e8',
        padding:'0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <style>{`
          .calc-btn {
            background-color: #e8e8e8;
            border: none;
            border-radius: 10px;
            font-size: 11px;
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
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box' as any,
        }}>
          {/* 타이틀 */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#333', letterSpacing: 1 }}>호주가자</div>
          </div>

          {/* 디스플레이 */}
          <div style={{
            background:'#c8d4b8',
            borderRadius: 12,
            padding: '20px 16px',
            marginBottom: 20,
            boxShadow: 'inset 3px 3px 8px #a8b498, inset -2px -2px 6px #e8f4d8',
            textAlign: 'center',
            minHeight: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🦘</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#2d3e1f', letterSpacing: 0.5 }}>
              호주여행/이민 필수 앱
            </div>
            <div style={{ fontSize: 12, color: '#4a5e32', marginTop: 6, lineHeight: 1.6 }}>
              호주 정보, 한 번에 연결됩니다
            </div>
          </div>

          {/* 버튼 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {/* 1행 */}
            <button className="calc-btn" onClick={onStart} style={{ height: 48 }}>버킷리스트</button>
            <button className="calc-btn" onClick={() => navigate('/app?tab=shopping')} style={{ height: 48 }}>쇼핑 리스트</button>
            <button className="calc-btn" onClick={() => navigate('/app?tab=bingo')} style={{ height: 48 }}>카페 빙고</button>
            {/* 2행 */}
            <button className="calc-btn" onClick={() => navigate('/app?tab=community')} style={{ height: 48 }}>채팅방</button>
            <button className="calc-btn" onClick={onServices} style={{ height: 48 }}>업체 리스트</button>
            <button className="calc-btn" style={{ height: 48, color: '#94A3B8' }}>준비중</button>
            {/* 3행 */}
            <button className="calc-btn" style={{ height: 48, color: '#94A3B8' }}>준비중</button>
            <button className="calc-btn" style={{ height: 48, color: '#94A3B8' }}>준비중</button>
            <button className="calc-btn" style={{ height: 48, color: '#94A3B8' }}>준비중</button>
            {/* 4행 */}
            <button className="calc-btn calc-btn-accent" onClick={() => setShowSuggestion(true)}
              style={{ height: 48, fontSize: 10 }}>★ 버킷리스트 추천</button>
            <button className="calc-btn" style={{ height: 48, color: '#94A3B8' }}></button>
            <button className="calc-btn calc-btn-accent" onClick={() => setShowForm(true)}
              style={{ height: 48, fontSize: 10 }}># 업체 등록 신청</button>
          </div>
        </div>
      </div>

      {/* ── 푸터 ── */}
      <div style={{ background:'#fff', borderTop:'1px solid #F1F5F9', padding:'20px 20px 40px', textAlign:'center' }}>
        <div style={{ fontSize:14, fontWeight:900, color:BLUE, marginBottom:4 }}>호주가자</div>
        <div style={{ fontSize:11, color:'#94A3B8' }}>www.hojugaja.com · 무료 호주 버킷리스트</div>
      </div>

      {/* ── 모달: 버킷리스트 추천 ── */}
      {showSuggestion && (
        <div style={{ position:'fixed', inset:0, zIndex:500 }}>
          <div onClick={() => setShowSuggestion(false)} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>
          <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:'#F1F5F9', borderRadius:'20px 20px 0 0', padding:'20px 20px 40px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ width:36, height:4, background:'#CBD5E1', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#1E293B' }}>버킷리스트 추천</div>
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
        <div style={{ position:'fixed', inset:0, zIndex:500 }}>
          <div onClick={() => setShowForm(false)} style={{ position:'absolute', inset:0, background:'rgba(10,20,40,0.6)' }}/>
          <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:'#F1F5F9', borderRadius:'20px 20px 0 0', padding:'20px 20px 40px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ width:36, height:4, background:'#CBD5E1', borderRadius:2, margin:'0 auto 20px' }}/>
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
