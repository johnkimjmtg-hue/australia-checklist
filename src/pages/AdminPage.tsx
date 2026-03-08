import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import {
  Business, getBusinesses, createBusiness,
  updateBusiness, toggleFeatured,
} from '../lib/businessService'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'hojugaja2024'

// ── 탭 타입
type MainTab = 'business' | 'categories' | 'items' | 'export' | 'requests' | 'suggestions'

// ── 업체 폼 초기값
const EMPTY_FORM = {
  id:'', name:'', category:'realestate', description:'',
  phone:'', website:'', kakao:'', address:'', city:'',
  is_featured:false, is_active:true, tags:'',
}

// ── 체크리스트 타입
type Cat  = { id:string; label:string; receiptLabel:string; emoji:string }
type Item = { id:string; categoryId:string; label:string; emoji:string }

const DEFAULT_CATS: Cat[] = [
  { id:'hospital',  label:'병원/뷰티', receiptLabel:'병원/뷰티', emoji:'🏥' },
  { id:'food',      label:'먹거리',    receiptLabel:'먹거리',    emoji:'🍽' },
  { id:'shopping',  label:'쇼핑',      receiptLabel:'쇼핑',      emoji:'🛍' },
  { id:'admin',     label:'행정',      receiptLabel:'행정',      emoji:'📋' },
  { id:'people',    label:'사람',      receiptLabel:'사람',      emoji:'👥' },
  { id:'parenting', label:'육아',      receiptLabel:'육아',      emoji:'🧸' },
  { id:'places',    label:'가볼 곳',   receiptLabel:'가볼 곳',   emoji:'🗺' },
  { id:'schedule',  label:'일정',      receiptLabel:'일정',      emoji:'📅' },
  { id:'custom',    label:'직접입력',  receiptLabel:'직접입력',  emoji:'✏️' },
]

const DEFAULT_ITEMS: Item[] = [
  { id:'h01', categoryId:'hospital', label:'치과 (스케일링/충치)', emoji:'🦷' },
  { id:'h02', categoryId:'hospital', label:'치아 미백',            emoji:'🦷' },
  { id:'h03', categoryId:'hospital', label:'피부과 레이저 시술',   emoji:'💆' },
  { id:'h04', categoryId:'hospital', label:'보톡스/필러',          emoji:'💉' },
  { id:'h05', categoryId:'hospital', label:'여드름 치료',          emoji:'🧴' },
  { id:'h06', categoryId:'hospital', label:'안과 검진',            emoji:'👁' },
  { id:'h07', categoryId:'hospital', label:'라식/라섹 상담',       emoji:'👓' },
  { id:'h08', categoryId:'hospital', label:'건강검진',             emoji:'🏥' },
  { id:'h09', categoryId:'hospital', label:'암보험 가입 검토',     emoji:'📋' },
  { id:'h10', categoryId:'hospital', label:'한의원 (침/뜸)',       emoji:'🌿' },
  { id:'h11', categoryId:'hospital', label:'미용실 (커트/펌/염색)',emoji:'💇' },
  { id:'h12', categoryId:'hospital', label:'네일 샵',              emoji:'💅' },
  { id:'h13', categoryId:'hospital', label:'속눈썹 연장',          emoji:'👁' },
  { id:'h14', categoryId:'hospital', label:'눈썹 문신/정리',       emoji:'✏️' },
  { id:'h15', categoryId:'hospital', label:'마사지/스파',          emoji:'💆' },
  { id:'h16', categoryId:'hospital', label:'올리브영',             emoji:'🛍' },
  { id:'h17', categoryId:'hospital', label:'다이소 뷰티',          emoji:'🧴' },
  { id:'h18', categoryId:'hospital', label:'선크림 (한국 브랜드)', emoji:'☀️' },
  { id:'h19', categoryId:'hospital', label:'마스크 팩 대량 구입',  emoji:'🎭' },
  { id:'h20', categoryId:'hospital', label:'토너/에센스',          emoji:'💧' },
  { id:'h21', categoryId:'hospital', label:'헬스장 1일권',         emoji:'💪' },
  { id:'h22', categoryId:'hospital', label:'찜질방/사우나',        emoji:'♨️' },
  { id:'h23', categoryId:'hospital', label:'약국 (상비약)',        emoji:'💊' },
  { id:'h24', categoryId:'hospital', label:'안경/렌즈 맞추기',    emoji:'👓' },
  { id:'h25', categoryId:'hospital', label:'정형외과/물리치료',    emoji:'🩺' },
  { id:'h26', categoryId:'hospital', label:'피부과 처방 크림',     emoji:'🧴' },
  { id:'f01', categoryId:'food', label:'교촌치킨',         emoji:'🍗' },
  { id:'f02', categoryId:'food', label:'네네치킨',         emoji:'🍗' },
  { id:'f03', categoryId:'food', label:'BHC치킨',          emoji:'🍗' },
  { id:'f04', categoryId:'food', label:'짜장면',           emoji:'🍜' },
  { id:'f05', categoryId:'food', label:'짬뽕',             emoji:'🍜' },
  { id:'f06', categoryId:'food', label:'탕수육',           emoji:'🥢' },
  { id:'f07', categoryId:'food', label:'순대국',           emoji:'🍲' },
  { id:'f08', categoryId:'food', label:'갈비탕',           emoji:'🍲' },
  { id:'f09', categoryId:'food', label:'돼지국밥',         emoji:'🍲' },
  { id:'f10', categoryId:'food', label:'게장',             emoji:'🦀' },
  { id:'f11', categoryId:'food', label:'보쌈',             emoji:'🥩' },
  { id:'f12', categoryId:'food', label:'삼겹살',           emoji:'🥩' },
  { id:'f13', categoryId:'food', label:'치맥 (치킨+맥주)', emoji:'🍺' },
  { id:'f14', categoryId:'food', label:'떡볶이',           emoji:'🌶' },
  { id:'f15', categoryId:'food', label:'한우 구이',        emoji:'🥩' },
  { id:'f16', categoryId:'food', label:'비빔밥',           emoji:'🍚' },
  { id:'f17', categoryId:'food', label:'회/초밥',          emoji:'🍣' },
  { id:'f18', categoryId:'food', label:'라면',             emoji:'🍜' },
  { id:'f19', categoryId:'food', label:'호떡',             emoji:'🥞' },
  { id:'f20', categoryId:'food', label:'빙수',             emoji:'🍧' },
  { id:'f21', categoryId:'food', label:'닭갈비',           emoji:'🍗' },
  { id:'f22', categoryId:'food', label:'순두부찌개',       emoji:'🍲' },
  { id:'f23', categoryId:'food', label:'곱창/막창',        emoji:'🥩' },
  { id:'f24', categoryId:'food', label:'냉면',             emoji:'🍜' },
  { id:'f25', categoryId:'food', label:'편의점 먹방',      emoji:'🏪' },
  { id:'f26', categoryId:'food', label:'감성 카페',        emoji:'☕' },
  { id:'f27', categoryId:'food', label:'포장마차/노점',    emoji:'🍢' },
  { id:'f28', categoryId:'food', label:'족발',             emoji:'🥩' },
  { id:'f29', categoryId:'food', label:'해물파전',         emoji:'🥞' },
  { id:'f30', categoryId:'food', label:'만두',             emoji:'🥟' },
  { id:'f31', categoryId:'food', label:'김밥',             emoji:'🍱' },
  { id:'f32', categoryId:'food', label:'부대찌개',         emoji:'🍲' },
  { id:'f33', categoryId:'food', label:'마라탕',           emoji:'🌶' },
  { id:'f34', categoryId:'food', label:'오마카세',         emoji:'🍽' },
  { id:'f35', categoryId:'food', label:'막걸리',           emoji:'🍶' },
  { id:'s01', categoryId:'shopping', label:'올리브영',              emoji:'🛍' },
  { id:'s02', categoryId:'shopping', label:'면세점 쇼핑',           emoji:'✈️' },
  { id:'s03', categoryId:'shopping', label:'김정문알로에 팩',        emoji:'🌿' },
  { id:'s04', categoryId:'shopping', label:'다이소',                emoji:'🏪' },
  { id:'s05', categoryId:'shopping', label:'선글라스',              emoji:'🕶' },
  { id:'s06', categoryId:'shopping', label:'속옷',                  emoji:'👕' },
  { id:'s07', categoryId:'shopping', label:'반지 (택스리펀 가능)',   emoji:'💍' },
  { id:'s08', categoryId:'shopping', label:'안경 맞추기',           emoji:'👓' },
  { id:'s09', categoryId:'shopping', label:'홍대 오프라인 쇼핑',    emoji:'🛒' },
  { id:'s10', categoryId:'shopping', label:'편지지 / 노트 / 펜',    emoji:'✏️' },
  { id:'s11', categoryId:'shopping', label:'후시딘 / 마데카솔',     emoji:'💊' },
  { id:'s12', categoryId:'shopping', label:'소염제 / 항생제',       emoji:'💊' },
  { id:'s13', categoryId:'shopping', label:'메디폼',                emoji:'🩹' },
  { id:'s14', categoryId:'shopping', label:'가슴마스크',            emoji:'🩹' },
  { id:'s15', categoryId:'shopping', label:'온열 안대',             emoji:'😴' },
  { id:'s16', categoryId:'shopping', label:'남대문 비상약',         emoji:'💊' },
  { id:'s17', categoryId:'shopping', label:'무신사 스탠다드',       emoji:'👗' },
  { id:'s18', categoryId:'shopping', label:'명동 쇼핑',             emoji:'🛒' },
  { id:'s19', categoryId:'shopping', label:'한국 과자 박스',        emoji:'🍫' },
  { id:'s20', categoryId:'shopping', label:'라면 박스',             emoji:'📦' },
  { id:'s21', categoryId:'shopping', label:'김/반찬',               emoji:'🌿' },
  { id:'s22', categoryId:'shopping', label:'김치',                  emoji:'🥬' },
  { id:'s23', categoryId:'shopping', label:'홍삼/인삼 제품',        emoji:'🌿' },
  { id:'s24', categoryId:'shopping', label:'기념품',                emoji:'🎁' },
  { id:'s25', categoryId:'shopping', label:'교보문고 서점',         emoji:'📚' },
  { id:'a01', categoryId:'admin', label:'주민등록증 재발급',   emoji:'🪪' },
  { id:'a02', categoryId:'admin', label:'여권 갱신/발급',      emoji:'📘' },
  { id:'a03', categoryId:'admin', label:'은행 계좌 정리',      emoji:'🏦' },
  { id:'a04', categoryId:'admin', label:'카카오뱅크 개설',     emoji:'💛' },
  { id:'a05', categoryId:'admin', label:'핸드폰 변경/유심',    emoji:'📱' },
  { id:'a06', categoryId:'admin', label:'운전면허 갱신',       emoji:'🚗' },
  { id:'a07', categoryId:'admin', label:'세금 신고/환급',      emoji:'💰' },
  { id:'a08', categoryId:'admin', label:'국민연금 확인',       emoji:'📊' },
  { id:'a09', categoryId:'admin', label:'보험 점검',           emoji:'🛡' },
  { id:'a10', categoryId:'admin', label:'가족관계증명서',      emoji:'📄' },
  { id:'a11', categoryId:'admin', label:'건강보험 정리',       emoji:'🏥' },
  { id:'a12', categoryId:'admin', label:'주식 계좌 정리',      emoji:'📈' },
  { id:'a13', categoryId:'admin', label:'재외국민 등록',       emoji:'🌏' },
  { id:'a14', categoryId:'admin', label:'공증/인감증명서',     emoji:'📜' },
  { id:'a15', categoryId:'admin', label:'복지 혜택 확인',      emoji:'✅' },
  { id:'p01', categoryId:'people', label:'부모님 만나기',       emoji:'👪' },
  { id:'p02', categoryId:'people', label:'형제자매 만나기',     emoji:'👬' },
  { id:'p03', categoryId:'people', label:'친구들 만나기',       emoji:'👥' },
  { id:'p04', categoryId:'people', label:'친척 방문',           emoji:'🏠' },
  { id:'p05', categoryId:'people', label:'동창 모임',           emoji:'🎓' },
  { id:'p06', categoryId:'people', label:'고향 방문',           emoji:'🏡' },
  { id:'p07', categoryId:'people', label:'성묘/제사',           emoji:'🙏' },
  { id:'p08', categoryId:'people', label:'가족 외식',           emoji:'🍽' },
  { id:'p09', categoryId:'people', label:'가족사진 스튜디오',   emoji:'📸' },
  { id:'p10', categoryId:'people', label:'부모님 선물',         emoji:'🎁' },
  { id:'k01', categoryId:'parenting', label:'아이 예방접종',     emoji:'💉' },
  { id:'k02', categoryId:'parenting', label:'소아과 검진',       emoji:'🩺' },
  { id:'k03', categoryId:'parenting', label:'아이 치과',         emoji:'🦷' },
  { id:'k04', categoryId:'parenting', label:'장난감/완구 쇼핑',  emoji:'🧸' },
  { id:'k05', categoryId:'parenting', label:'아이 옷 쇼핑',      emoji:'👕' },
  { id:'k06', categoryId:'parenting', label:'전집/어린이 도서',  emoji:'📚' },
  { id:'k07', categoryId:'parenting', label:'기저귀 대량 구입',  emoji:'🧷' },
  { id:'k08', categoryId:'parenting', label:'키즈카페 방문',     emoji:'🎠' },
  { id:'k09', categoryId:'parenting', label:'에버랜드/롯데월드', emoji:'🎡' },
  { id:'k10', categoryId:'parenting', label:'가족 사진',         emoji:'📸' },
  { id:'g01', categoryId:'places', label:'경복궁',              emoji:'🏯' },
  { id:'g02', categoryId:'places', label:'창덕궁/후원',         emoji:'🌿' },
  { id:'g03', categoryId:'places', label:'N서울타워',           emoji:'🗼' },
  { id:'g04', categoryId:'places', label:'한강 피크닉',         emoji:'🌊' },
  { id:'g05', categoryId:'places', label:'북촌 한옥마을',       emoji:'🏘' },
  { id:'g06', categoryId:'places', label:'인사동',              emoji:'🎨' },
  { id:'g07', categoryId:'places', label:'홍대 거리',           emoji:'🎵' },
  { id:'g08', categoryId:'places', label:'DDP',                 emoji:'🏛' },
  { id:'g09', categoryId:'places', label:'COEX 별마당',         emoji:'📚' },
  { id:'g10', categoryId:'places', label:'롯데타워 전망대',     emoji:'🏙' },
  { id:'g11', categoryId:'places', label:'제주도',              emoji:'🌋' },
  { id:'g12', categoryId:'places', label:'부산 해운대',         emoji:'🏖' },
  { id:'g13', categoryId:'places', label:'경주',                emoji:'🏺' },
  { id:'g14', categoryId:'places', label:'전주 한옥마을',       emoji:'🏘' },
  { id:'g15', categoryId:'places', label:'남이섬',              emoji:'🍂' },
  { id:'g16', categoryId:'places', label:'노래방',              emoji:'🎤' },
  { id:'g17', categoryId:'places', label:'PC방',                emoji:'🎮' },
  { id:'g18', categoryId:'places', label:'찜질방',              emoji:'♨️' },
  { id:'g19', categoryId:'places', label:'방탈출 카페',         emoji:'🔐' },
  { id:'g20', categoryId:'places', label:'야구 직관',           emoji:'⚾' },
  { id:'g21', categoryId:'places', label:'한복 체험',           emoji:'👘' },
  { id:'g22', categoryId:'places', label:'DMZ 투어',            emoji:'🪖' },
]

const EMOJI_MAP: [string[], string][] = [
  [['치과','치아','스케일링','충치','미백'], '🦷'],
  [['피부','레이저','보톡스','필러','여드름'], '💆'],
  [['안과','눈','라식','라섹'], '👁'],
  [['안경','렌즈'], '👓'],
  [['병원','검진','건강','의원'], '🏥'],
  [['약','처방','항생','소염'], '💊'],
  [['미용실','헤어','커트','펌','염색'], '💇'],
  [['네일'], '💅'],
  [['마사지','스파'], '💆'],
  [['찜질','사우나'], '♨️'],
  [['크림','로션','에센스','토너','팩'], '🧴'],
  [['선크림'], '☀️'],
  [['올리브영'], '🛍'],
  [['다이소','마트'], '🏪'],
  [['헬스','운동'], '💪'],
  [['치킨','닭'], '🍗'],
  [['짜장','짬뽕','라면','냉면','국수'], '🍜'],
  [['국밥','국','탕','찌개','순대'], '🍲'],
  [['고기','삼겹','갈비','한우','보쌈','족발','곱창'], '🥩'],
  [['회','초밥'], '🍣'],
  [['떡볶이','마라'], '🌶'],
  [['비빔밥'], '🍚'],
  [['카페'], '☕'],
  [['빙수'], '🍧'],
  [['맥주','치맥','막걸리'], '🍺'],
  [['만두'], '🥟'],
  [['김밥'], '🍱'],
  [['포장마차','노점'], '🍢'],
  [['면세'], '✈️'],
  [['선글라스'], '🕶'],
  [['반지','목걸이','귀걸이'], '💍'],
  [['책','도서'], '📚'],
  [['과자','초콜릿'], '🍫'],
  [['김치'], '🥬'],
  [['홍삼','인삼'], '🌿'],
  [['기념품','선물'], '🎁'],
  [['여권'], '📘'],
  [['은행','계좌'], '🏦'],
  [['핸드폰','유심'], '📱'],
  [['자동차','운전'], '🚗'],
  [['세금','환급'], '💰'],
  [['보험'], '🛡'],
  [['부모','가족'], '👪'],
  [['친구'], '👥'],
  [['학교','동창','모임'], '🎓'],
  [['고향'], '🏡'],
  [['사진','스튜디오'], '📸'],
  [['예방접종','주사'], '💉'],
  [['장난감'], '🧸'],
  [['기저귀'], '🧷'],
  [['키즈'], '🎠'],
  [['경복궁','창덕궁','궁'], '🏯'],
  [['타워'], '🗼'],
  [['한강'], '🌊'],
  [['한옥'], '🏘'],
  [['노래방'], '🎤'],
  [['pc방','게임'], '🎮'],
  [['야구'], '⚾'],
  [['한복'], '👘'],
  [['제주'], '🌋'],
  [['부산','해운대'], '🏖'],
  [['방탈출'], '🔐'],
]

function autoEmoji(label: string): string {
  const lower = label.toLowerCase()
  for (const [keywords, emoji] of EMOJI_MAP) {
    if (keywords.some(k => lower.includes(k))) return emoji
  }
  return '📌'
}

// ════════════════════════════════════════════
// 주소 자동완성 컴포넌트
// ════════════════════════════════════════════
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

let _mapsPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (_mapsPromise) return _mapsPromise
  _mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) { resolve(); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&v=weekly`
    s.onload = () => {
      // 약간 딜레이 줘서 places 객체 완전히 초기화되도록
      setTimeout(() => resolve(), 100)
    }
    s.onerror = () => reject(new Error('Google Maps load failed'))
    document.head.appendChild(s)
  })
  return _mapsPromise
}

function AddressAutocomplete({ address, city, onSelect }: {
  address: string
  city: string
  onSelect: (address: string, city: string) => void
}) {
  const [query, setQuery]             = useState(address || '')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading]         = useState(false)
  const [manual, setManual]           = useState(false)
  const [manualCity, setManualCity]   = useState(city || '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        await loadGoogleMaps()
        const places = (window as any).google.maps.places
        const AutocompleteSuggestion = places.AutocompleteSuggestion || places.autocomplete?.AutocompleteSuggestion
        if (!AutocompleteSuggestion) throw new Error('AutocompleteSuggestion not available')
        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: val,
          includedRegionCodes: ['au'],
        })
        setSuggestions(results || [])
      } catch (e) {
        console.error('Places error:', e)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  async function handleSelect(suggestion: any) {
    setSuggestions([])
    try {
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] })
      const components = place.addressComponents || []
      const suburb = components.find((c: any) => c.types.includes('locality') || c.types.includes('sublocality_level_1'))?.longText || ''
      const state  = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.shortText || ''
      const post   = components.find((c: any) => c.types.includes('postal_code'))?.longText || ''
      const streetNum = components.find((c: any) => c.types.includes('street_number'))?.longText || ''
      const route     = components.find((c: any) => c.types.includes('route'))?.longText || ''
      const streetAddress = [streetNum, route, suburb, state, post].filter(Boolean).join(', ')
      setQuery(streetAddress)
      setManualCity(suburb)
      onSelect(streetAddress, suburb)
    } catch (e) { console.error('Place detail error:', e) }
  }

  if (manual) return (
    <div>
      <input value={query} onChange={e => { setQuery(e.target.value); onSelect(e.target.value, manualCity) }}
        style={inputStyle} placeholder="예: 123 George Street, Chatswood NSW 2067" />
      <input value={manualCity} onChange={e => { setManualCity(e.target.value); onSelect(query, e.target.value) }}
        style={{ ...inputStyle, marginTop:6 }} placeholder="Suburb 예: Chatswood" />
      <button onClick={() => setManual(false)} style={{ fontSize:11, color:'#1E4D83', background:'none', border:'none', cursor:'pointer', marginTop:4, fontWeight:700 }}>🔍 자동검색으로 전환</button>
    </div>
  )

  return (
    <div style={{ position:'relative' }}>
      <input value={query} onChange={e => handleInput(e.target.value)} style={inputStyle}
        placeholder="주소 입력 (예: 123 George St Chatswood)" />
      {loading && <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>🔍 검색 중...</div>}
      {suggestions.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100,
          background:'#fff', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          border:'1px solid #e0e0e0', overflow:'hidden', marginTop:4 }}>
          {suggestions.map((s: any, i: number) => (
            <div key={i} onClick={() => handleSelect(s)}
              style={{ padding:'10px 14px', fontSize:13, cursor:'pointer', borderBottom:'1px solid #f3f3f3', color:'#333' }}
              onMouseEnter={e => (e.currentTarget.style.background='#f0f4ff')}
              onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
              📍 {s.placePrediction?.text?.text || ''}
            </div>
          ))}
        </div>
      )}
      {city && <div style={{ marginTop:6, fontSize:12, color:'#1E4D83', fontWeight:700 }}>📌 Suburb: {city}</div>}
      <button onClick={() => setManual(true)} style={{ fontSize:11, color:'#aaa', background:'none', border:'none', cursor:'pointer', marginTop:4, fontWeight:700 }}>✏️ 직접 입력</button>
    </div>
  )
}

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════
export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw]         = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab]       = useState<MainTab>('business')

  // ── 공유 checklist state (카테고리·아이템·아이콘 탭 간 공유)
  const [sharedCats,    setSharedCats]    = useState<Cat[]>(() => JSON.parse(JSON.stringify(DEFAULT_CATS)))
  const [sharedItems,   setSharedItems]   = useState<Item[]>(() => JSON.parse(JSON.stringify(DEFAULT_ITEMS)))
  const [sharedIconMap, setSharedIconMap] = useState<Record<string,string>>(() => ({
    h01:'ph:tooth',h02:'ph:tooth',h03:'ph:sparkle',h04:'ph:syringe',h05:'ph:drop',
    h06:'ph:eye',h07:'ph:eyeglasses',h08:'ph:heartbeat',h09:'ph:shield-check',h10:'ph:leaf',
    h11:'ph:scissors',h12:'ph:hand',h13:'ph:eye',h14:'ph:pencil-simple',h15:'ph:person-simple',
    h16:'ph:shopping-bag',h17:'ph:flask',h18:'ph:sun',h19:'ph:mask-happy',h20:'ph:drop-half',
    h21:'ph:barbell',h22:'ph:thermometer-hot',h23:'ph:pill',h24:'ph:eyeglasses',h25:'ph:bone',h26:'ph:flask',
    f01:'ph:chicken',f02:'ph:chicken',f03:'ph:chicken',f04:'ph:bowl-food',f05:'ph:bowl-food',
    f06:'ph:fork-knife',f07:'ph:bowl-food',f08:'ph:bowl-food',f09:'ph:bowl-food',f10:'ph:fish',
    f11:'ph:fork-knife',f12:'ph:flame',f13:'ph:beer-stein',f14:'ph:pepper',f15:'ph:flame',
    f16:'ph:bowl-food',f17:'ph:fish',f18:'ph:bowl-food',f19:'ph:cake',f20:'ph:ice-cream',
    f21:'ph:flame',f22:'ph:bowl-food',f23:'ph:fork-knife',f24:'ph:bowl-food',f25:'ph:storefront',
    f26:'ph:coffee',f27:'ph:fork-knife',f28:'ph:fork-knife',f29:'ph:fork-knife',f30:'ph:fork-knife',
    f31:'ph:sushi',f32:'ph:bowl-food',f33:'ph:pepper',f34:'ph:fork-knife',f35:'ph:wine',
    s01:'ph:shopping-bag',s02:'ph:airplane',s03:'ph:leaf',s04:'ph:storefront',s05:'ph:sunglasses',
    s06:'ph:t-shirt',s07:'ph:diamond',s08:'ph:eyeglasses',s09:'ph:shopping-cart',s10:'ph:pencil',
    s11:'ph:pill',s12:'ph:pill',s13:'ph:bandaids',s14:'ph:bandaids',s15:'ph:moon',
    s16:'ph:first-aid-kit',s17:'ph:t-shirt',s18:'ph:shopping-cart',s19:'ph:cookie',s20:'ph:package',
    s21:'ph:leaf',s22:'ph:leaf',s23:'ph:plant',s24:'ph:gift',s25:'ph:books',
    a01:'ph:identification-card',a02:'ph:book-open',a03:'ph:bank',a04:'ph:bank',a05:'ph:device-mobile',
    a06:'ph:car',a07:'ph:currency-krw',a08:'ph:chart-bar',a09:'ph:shield',a10:'ph:files',
    a11:'ph:heartbeat',a12:'ph:chart-line-up',a13:'ph:globe',a14:'ph:seal',a15:'ph:check-circle',
    p01:'ph:house-line',p02:'ph:users-three',p03:'ph:users',p04:'ph:house',p05:'ph:graduation-cap',
    p06:'ph:map-pin',p07:'ph:hands-praying',p08:'ph:fork-knife',p09:'ph:camera',p10:'ph:gift',
    k01:'ph:syringe',k02:'ph:stethoscope',k03:'ph:tooth',k04:'ph:lego',k05:'ph:t-shirt',
    k06:'ph:books',k07:'ph:baby',k08:'ph:smiley',k09:'ph:ticket',k10:'ph:camera',
    g01:'ph:buildings',g02:'ph:tree',g03:'ph:broadcast-tower',g04:'ph:waves',g05:'ph:house',
    g06:'ph:palette',g07:'ph:music-note',g08:'ph:building',g09:'ph:books',g10:'ph:binoculars',
    g11:'ph:mountain',g12:'ph:umbrella-simple',g13:'ph:crown',g14:'ph:house',g15:'ph:tree-evergreen',
    g16:'ph:microphone',g17:'ph:monitor',g18:'ph:thermometer-hot',g19:'ph:lock-key',g20:'ph:baseball',
    g21:'ph:dress',g22:'ph:flag',
  }))

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else { setPwError(true) }
  }

  if (!authed) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(170deg,#eef2fa,#f5f7fb)',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      <div style={{
        background:'#fff', borderRadius:20, padding:'32px 24px',
        boxShadow:'0 8px 32px rgba(30,77,131,0.12)', width:'calc(100% - 48px)', maxWidth:360,
      }}>
        <div style={{ fontSize:32, textAlign:'center', marginBottom:8 }}>🔒</div>
        <div style={{ fontSize:18, fontWeight:900, color:'#0F1B2D', textAlign:'center', marginBottom:4 }}>Admin</div>
        <div style={{ fontSize:12, color:'#8AAAC8', textAlign:'center', marginBottom:24 }}>호주가자 관리자 페이지</div>
        <input
          type="password" placeholder="비밀번호"
          value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />
        {pwError && <div style={{ color:'#e8420a', fontSize:12, marginTop:6, fontWeight:700 }}>비밀번호가 틀렸어요</div>}
        <button onClick={handleLogin} style={{ ...btnPrimary, marginTop:12 }}>로그인</button>
        <button onClick={onBack} style={{ ...btnGhost, marginTop:8 }}>← 돌아가기</button>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight:'100vh', background:'#f0f2f5',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
    }}>
      {/* 헤더 */}
      <div style={{
        background:'#1E4D83', color:'#fff', padding:'16px 20px',
        display:'flex', alignItems:'center', gap:12,
        position:'sticky', top:0, zIndex:50,
      }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer', padding:0 }}>←</button>
        <div>
          <div style={{ fontSize:17, fontWeight:900 }}>🛠 호주가자 Admin</div>
          <div style={{ fontSize:11, opacity:0.7 }}>관리자 페이지</div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', display:'flex', overflowX:'auto' }}>
        {([
          ['business',    '🏢 업체 관리'],
          ['requests',    '📬 등록 신청'],
          ['suggestions', '💡 버킷 추천'],
          ['categories',  '📂 카테고리'],
          ['items',       '📝 체크리스트'],
          ['export',      '💾 코드 내보내기'],
        ] as [MainTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'12px 18px', border:'none', background:'none', cursor:'pointer',
            fontSize:13, fontWeight:700, whiteSpace:'nowrap',
            color: tab===id ? '#1E4D83' : '#888',
            borderBottom: tab===id ? '2.5px solid #1E4D83' : '2.5px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px 80px' }}>
        {tab==='business'    && <BusinessTab />}
        {tab==='requests'    && <RequestsTab />}
        {tab==='suggestions' && <SuggestionsTab />}
        {tab==='categories'  && <CategoriesTab cats={sharedCats} setCats={setSharedCats} items={sharedItems} setItems={setSharedItems} />}
        {tab==='items'       && <ItemsTab cats={sharedCats} items={sharedItems} setItems={setSharedItems} iconMap={sharedIconMap} setIconMap={setSharedIconMap} />}
        {tab==='export'      && <ExportTab cats={sharedCats} items={sharedItems} iconMap={sharedIconMap} />}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// TAB 1: 업체 관리
// ════════════════════════════════════════════
function BusinessTab() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [editTarget, setEditTarget] = useState<Business | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleteId, setDeleteId]     = useState<string|null>(null)
  const [toast, setToast]           = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setBusinesses(await getBusinesses())
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  function openNew() {
    setForm(EMPTY_FORM); setEditTarget(null); setShowForm(true)
  }

  function openEdit(b: Business) {
    setForm({
      id:b.id, name:b.name, category:b.category,
      description:b.description||'', phone:b.phone||'',
      website:b.website||'', kakao:b.kakao||'',
      address:b.address||'', city:b.city,
      is_featured:b.is_featured, is_active:b.is_active,
      tags:b.tags?.join(', ')||'',
    })
    setEditTarget(b); setShowForm(true)
  }

  async function save() {
    if (!form.name || !form.city) { showToast('업체명, 도시는 필수예요'); return }
    setSaving(true)
    const payload = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean), rating:0, reviews_count:0 }
    if (editTarget) {
      const result = await updateBusiness(editTarget.id, payload)
      if (result) showToast('✅ 수정 완료')
      else { showToast('❌ 수정 실패 - 콘솔 확인'); setSaving(false); return }
    } else {
      const id = 'biz-' + Date.now()
      const result = await createBusiness({ ...payload, id })
      if (result) showToast('✅ 등록 완료')
      else { showToast('❌ 등록 실패 - 콘솔 확인'); setSaving(false); return }
    }
    await load(); setSaving(false); setShowForm(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('businesses').delete().eq('id', id)
    showToast('🗑 삭제 완료'); setDeleteId(null); await load()
  }

  async function handleToggle(id: string, cur: boolean) {
    await toggleFeatured(id, !cur)
    showToast(cur ? '추천 해제' : '⭐ 추천 설정'); await load()
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      {deleteId && <Confirm msg="정말 삭제할까요?" onOk={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} danger />}

      {showForm ? (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <button onClick={() => setShowForm(false)} style={btnGhost}>← 목록</button>
            <h2 style={{ fontSize:16, fontWeight:900, color:'#0F1B2D', margin:0 }}>{editTarget ? '업체 수정' : '업체 등록'}</h2>
          </div>
          <Card>
            <Grid2>
              <Field label="업체명 *"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle} placeholder="예: Palas Property" /></Field>
              <Field label="카테고리">
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={inputStyle}>
                  {CATEGORIES.filter(c=>c.id!=='all').map(c=>(
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </Field>
            </Grid2>
            <Field label="주소 검색">
              <AddressAutocomplete
                address={form.address}
                city={form.city}
                onSelect={(address, city) => setForm(f=>({...f, address, city}))}
              />
            </Field>
            <Field label="업체 소개"><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{...inputStyle,resize:'none'}} rows={3} /></Field>
            <Field label="태그 (쉼표 구분)"><input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} style={inputStyle} placeholder="예: 부동산 구매, 투자 상담" /></Field>
            <Grid2>
              <Field label="전화번호"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={inputStyle} placeholder="+61 2 1234 5678" /></Field>
              <Field label="카카오 ID"><input value={form.kakao} onChange={e=>setForm(f=>({...f,kakao:e.target.value}))} style={inputStyle} /></Field>
            </Grid2>
            <Field label="웹사이트"><input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} style={inputStyle} placeholder="https://..." /></Field>
            <div style={{ display:'flex', gap:20, marginTop:8 }}>
              <label style={checkLabel}><input type="checkbox" checked={form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} /> ⭐ 추천 업체</label>
              <label style={checkLabel}><input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} /> ✅ 활성화</label>
            </div>
            <button onClick={save} disabled={saving} style={{ ...btnPrimary, marginTop:16 }}>{saving ? '저장 중...' : editTarget ? '수정 완료' : '등록하기'}</button>
          </Card>

          {/* 리뷰 관리 - 수정 모드일 때만 */}
          {editTarget && <ReviewManager businessId={editTarget.id} onRefresh={load} showToast={showToast} />}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:13, color:'#888', fontWeight:700 }}>총 {businesses.length}개 업체</span>
            <button onClick={openNew} style={btnPrimary}>+ 업체 등록</button>
          </div>
          {loading ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>불러오는 중...</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {businesses.map(b => (
                <Card key={b.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <span style={{ fontSize:15, fontWeight:900, color:'#0F1B2D' }}>{b.name}</span>
                      {b.is_featured && <span style={{ marginLeft:6, fontSize:10, background:'#1E4D83', color:'#fff', borderRadius:10, padding:'2px 8px', fontWeight:800 }}>추천</span>}
                      {!b.is_active  && <span style={{ marginLeft:6, fontSize:10, background:'#e8420a', color:'#fff', borderRadius:10, padding:'2px 8px', fontWeight:800 }}>비활성</span>}
                    </div>
                    <span style={{ fontSize:11, color:'#8AAAC8' }}>{CATEGORIES.find(c=>c.id===b.category)?.emoji} {CATEGORIES.find(c=>c.id===b.category)?.label}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#7a8fb5', marginBottom:12 }}>📍 {b.city} · ⭐ {b.rating} ({b.reviews_count})</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => openEdit(b)} style={{ ...btnGhost, flex:1, padding:'7px' }}>✏️ 수정</button>
                    <button onClick={() => handleToggle(b.id, b.is_featured)} style={{
                      flex:1, padding:'7px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:800, fontSize:12,
                      background: b.is_featured ? 'rgba(255,220,50,0.2)' : 'rgba(200,218,248,0.3)',
                      color: b.is_featured ? '#b8860b' : '#1E4D83',
                    }}>{b.is_featured ? '⭐ 추천해제' : '☆ 추천설정'}</button>
                    <button onClick={() => setDeleteId(b.id)} style={{ padding:'7px 12px', background:'rgba(232,66,10,0.08)', border:'none', borderRadius:8, color:'#e8420a', fontWeight:800, fontSize:12, cursor:'pointer' }}>🗑</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

// ════════════════════════════════════════════
// 리뷰 관리 컴포넌트
// ════════════════════════════════════════════
function ReviewManager({ businessId, onRefresh, showToast }: { businessId: string; onRefresh: () => void; showToast: (msg: string) => void }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  useEffect(() => { loadReviews() }, [businessId])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase.from('reviews').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (!error) {
      showToast('🗑 리뷰 삭제 완료')
      setReviews(prev => prev.filter(r => r.id !== id))
      await onRefresh()
    } else {
      showToast('❌ 삭제 실패')
    }
    setDeleteId(null)
  }

  return (
    <>
      {deleteId && <Confirm msg="이 리뷰를 삭제할까요?" onOk={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} danger />}
      <Card>
        <SectionTitle>⭐ 리뷰 관리 ({reviews.length})</SectionTitle>
        {loading ? (
          <div style={{ color:'#aaa', fontSize:13, textAlign:'center', padding:'12px 0' }}>불러오는 중...</div>
        ) : reviews.length === 0 ? (
          <div style={{ color:'#ccc', fontSize:13, textAlign:'center', padding:'12px 0' }}>리뷰가 없어요</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:'#f8fafd', borderRadius:10, border:'1px solid #eee' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'#0F1B2D' }}>{r.author_name}</span>
                    <span style={{ fontSize:12, color:'#f5a623' }}>{'⭐'.repeat(r.rating)}</span>
                    <span style={{ fontSize:11, color:'#bbb' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#555', margin:0, lineHeight:1.6 }}>{r.content}</p>
                </div>
                <button onClick={() => setDeleteId(r.id)} style={{ ...btnSmDanger, flexShrink:0 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 2: 카테고리 관리
// ════════════════════════════════════════════
function CategoriesTab({ cats, setCats, items, setItems }: {
  cats: Cat[]; setCats: (f: (p: Cat[]) => Cat[]) => void
  items: Item[]; setItems: (f: (p: Item[]) => Item[]) => void
}) {
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [toast, setToast]       = useState('')
  const [selectedId, setSelectedId] = useState(cats[0]?.id ?? '')
  const [dragIdx, setDragIdx]   = useState<number|null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number|null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  function addCat() {
    if (!newLabel.trim()) return
    const emoji = newEmoji.trim() || autoEmoji(newLabel)
    const id = 'cat_' + Date.now()
    setCats(prev => [...prev, { id, label:newLabel.trim(), receiptLabel:newLabel.trim(), emoji }])
    setNewEmoji(''); setNewLabel('')
    showToast('카테고리 추가됨: ' + newLabel)
  }

  function deleteCat(id: string) {
    if (!confirm('이 카테고리와 하위 항목을 모두 삭제할까요?')) return
    setCats(prev => prev.filter(c => c.id !== id))
    setItems(prev => prev.filter(i => i.categoryId !== id))
    showToast('삭제됨')
  }

  function updateCat(id: string, field: 'label'|'emoji', val: string) {
    if (!val) return
    setCats(prev => prev.map(c => c.id===id ? {...c, [field]:val, ...(field==='label'?{receiptLabel:val}:{})} : c))
  }

  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx) }
  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return }
    setCats(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
    setDragIdx(null); setDragOverIdx(null)
    showToast('순서 변경됨')
  }
  function handleDragEnd() { setDragIdx(null); setDragOverIdx(null) }

  return (
    <>
      {toast && <Toast msg={toast} />}
      <Card>
        <SectionTitle>새 카테고리 추가</SectionTitle>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)} placeholder="😀" maxLength={2}
            style={{ ...inputStyle, width:52, textAlign:'center', fontSize:20, flexShrink:0 }} />
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCat()}
            placeholder="카테고리 이름" style={{ ...inputStyle, flex:1, minWidth:0 }} />
          <button onClick={addCat} style={{ ...btnPrimary, flexShrink:0, whiteSpace:'nowrap' }}>추가</button>
        </div>
        <p style={{ fontSize:12, color:'#aaa', marginTop:6 }}>이모티콘 비워두면 자동 선택됩니다</p>
      </Card>

      <Card>
        <SectionTitle>카테고리 목록 ({cats.length}) — 드래그로 순서 변경</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {cats.map((cat, idx) => {
            const isLocked = cat.id === 'custom'
            const isDragging = dragIdx === idx
            const isOver = dragOverIdx === idx
            return (
              <div
                key={cat.id}
                draggable={!isLocked}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedId(cat.id)}
                style={{
                  border: isOver ? '2px dashed #1E4D83' : `1.5px solid ${selectedId===cat.id ? '#1E4D83' : '#e8e8e8'}`,
                  borderRadius:12, padding:'12px 14px',
                  background: isDragging ? '#e8f0fe' : selectedId===cat.id ? '#eef2fb' : '#fafafa',
                  display:'flex', alignItems:'center', gap:10, cursor: isLocked ? 'default' : 'grab',
                  opacity: isDragging ? 0.5 : 1,
                  transition:'background 0.1s, opacity 0.1s',
                }}>
                {isLocked
                  ? <span style={{ color:'#ccc', fontSize:16 }}>🔒</span>
                  : <span style={{ color:'#aaa', fontSize:16, cursor:'grab', userSelect:'none' }}>⠿</span>
                }
                <input
                  value={cat.emoji} maxLength={2}
                  onChange={e => updateCat(cat.id, 'emoji', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  disabled={isLocked}
                  style={{ width:36, textAlign:'center', fontSize:20, border:'none', background:'transparent', cursor:isLocked?'default':'text' }}
                />
                <input
                  value={cat.label}
                  onChange={e => updateCat(cat.id, 'label', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  disabled={isLocked}
                  style={{ flex:1, fontSize:13, fontWeight:700, border:'none', background:'transparent', color:isLocked?'#aaa':'#222', cursor:isLocked?'default':'text' }}
                />
                {!isLocked && (
                  <button onClick={e => { e.stopPropagation(); deleteCat(cat.id) }} style={{ background:'none', border:'none', color:'#e05252', cursor:'pointer', fontSize:14 }}>✕</button>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 3: 체크리스트 항목
// ════════════════════════════════════════════
// 자주 쓰는 Phosphor 아이콘 목록 (카테고리별 그룹)
const PH_ICONS = [
  'ph:heart','ph:star','ph:check-circle','ph:map-pin','ph:calendar',
  'ph:camera','ph:gift','ph:flag','ph:crown','ph:trophy',
  // 의료
  'ph:first-aid-kit','ph:stethoscope','ph:syringe','ph:pill','ph:tooth',
  'ph:heartbeat','ph:bandaids','ph:thermometer','ph:eye','ph:eyeglasses',
  'ph:drop','ph:flask','ph:mask-happy','ph:shield-check','ph:leaf',
  'ph:scissors','ph:barbell','ph:sun','ph:bone','ph:sparkle',
  // 음식
  'ph:fork-knife','ph:bowl-food','ph:coffee','ph:beer-stein','ph:wine',
  'ph:chicken','ph:fish','ph:cake','ph:ice-cream','ph:pepper',
  'ph:flame','ph:storefront','ph:cookie','ph:bread',
  // 쇼핑/생활
  'ph:shopping-bag','ph:shopping-cart','ph:package','ph:t-shirt',
  'ph:diamond','ph:sunglasses','ph:books','ph:plant','ph:moon',
  // 행정/금융
  'ph:identification-card','ph:book-open','ph:bank','ph:device-mobile',
  'ph:car','ph:currency-krw','ph:chart-bar','ph:shield','ph:files',
  'ph:globe','ph:seal','ph:chart-line-up',
  // 사람/커뮤니티
  'ph:users','ph:users-three','ph:house','ph:house-line','ph:graduation-cap',
  'ph:hands-praying','ph:hand','ph:person-simple',
  // 육아
  'ph:baby','ph:lego','ph:smiley','ph:ticket',
  // 장소/관광
  'ph:buildings','ph:tree','ph:waves','ph:palette','ph:music-note',
  'ph:building','ph:binoculars','ph:mountain','ph:tree-evergreen',
  'ph:microphone','ph:monitor','ph:baseball','ph:dress',
  // 일정
  'ph:airplane','ph:airplane-takeoff','ph:train','ph:bus',
  'ph:clock','ph:alarm','ph:pencil-simple','ph:note',
]

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = search ? PH_ICONS.filter(i => i.includes(search)) : PH_ICONS
  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width:44, height:38, border:'1.5px solid #e0e0e0', borderRadius:9,
        background:'#fafafa', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon icon={value || 'ph:star'} width={20} height={20} color="#1E4D83" />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:700 }}/>
          <div style={{
            position:'absolute', top:44, left:0, zIndex:701,
            background:'#fff', borderRadius:12, padding:12,
            boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
            width:260, maxHeight:300, overflowY:'auto',
          }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="아이콘 검색 (예: heart, food...)"
              style={{ ...inputStyle, marginBottom:10, fontSize:12, padding:'6px 10px' }}
              autoFocus
            />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {filtered.map(ic => (
                <button key={ic} type="button" onClick={() => { onChange(ic); setOpen(false); setSearch('') }}
                  title={ic.replace('ph:','')}
                  style={{
                    width:32, height:32, border: value===ic ? '2px solid #1E4D83' : '1px solid #eee',
                    borderRadius:6, background: value===ic ? '#eef2fb' : '#fafafa',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                  }}>
                  <Icon icon={ic} width={16} height={16} color={value===ic ? '#1E4D83' : '#555'} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ItemsTab({ cats, items, setItems, iconMap, setIconMap }: {
  cats: Cat[]
  items: Item[]; setItems: (f: (p: Item[]) => Item[]) => void
  iconMap: Record<string,string>; setIconMap: (f: (p: Record<string,string>) => Record<string,string>) => void
}) {
  const [selCat, setSelCat] = useState(cats[0]?.id ?? '')
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon]   = useState('ph:star')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const catItems = items.filter(i => i.categoryId === selCat)
  const isLocked = selCat === 'custom'
  const cat = cats.find(c => c.id === selCat)

  // CAT_ICON_MAP 기본 아이콘
  const CAT_DEFAULT: Record<string,string> = {
    hospital:'ph:first-aid-kit', food:'ph:fork-knife', shopping:'ph:shopping-bag',
    admin:'ph:files', people:'ph:users', parenting:'ph:baby', places:'ph:map-pin',
    schedule:'ph:calendar', custom:'ph:star',
  }

  function addItem() {
    if (!newLabel.trim()) return
    const id = 'i_' + Date.now()
    const icon = newIcon || CAT_DEFAULT[selCat] || 'ph:star'
    setItems(prev => [...prev, { id, categoryId:selCat, label:newLabel.trim(), emoji:'⭐' }])
    setIconMap(prev => ({ ...prev, [id]: icon }))
    setNewLabel(''); setNewIcon(CAT_DEFAULT[selCat] || 'ph:star')
    showToast('항목 추가됨: ' + newLabel)
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setIconMap(prev => { const n = {...prev}; delete n[id]; return n })
    showToast('항목 삭제됨')
  }

  function updateItem(id: string, field: 'label'|'emoji', val: string) {
    if (!val) return
    setItems(prev => prev.map(i => i.id===id ? {...i,[field]:val} : i))
  }

  function updateIcon(id: string, icon: string) {
    setIconMap(prev => ({ ...prev, [id]: icon }))
  }

  function moveItem(id: string, dir: number) {
    const catIs = items.filter(i => i.categoryId === selCat)
    const localIdx = catIs.findIndex(i => i.id === id)
    const newIdx = localIdx + dir
    if (newIdx < 0 || newIdx >= catIs.length) return
    const allItems = [...items]
    const a = allItems.findIndex(i => i.id === catIs[localIdx].id)
    const b = allItems.findIndex(i => i.id === catIs[newIdx].id)
    ;[allItems[a], allItems[b]] = [allItems[b], allItems[a]]
    setItems(allItems)
  }

  // ExportTab과 state 공유 (props로 처리)

  return (
    <>
      {toast && <Toast msg={toast} />}
      <Card>
        <SectionTitle>카테고리 선택</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => { setSelCat(c.id); setNewIcon(CAT_DEFAULT[c.id] || 'ph:star') }} style={{
              padding:'6px 14px', borderRadius:8, border:'1.5px solid',
              borderColor: selCat===c.id ? '#1E4D83' : '#ddd',
              background: selCat===c.id ? '#1E4D83' : '#fff',
              color: selCat===c.id ? '#fff' : '#666',
              fontSize:13, fontWeight:700, cursor:'pointer',
            }}>{c.emoji} {c.label}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <SectionTitle style={{ margin:0 }}>{cat?.emoji} {cat?.label} 항목 ({catItems.length})</SectionTitle>
        </div>

        {!isLocked && (
          <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
            <IconPicker value={newIcon} onChange={setNewIcon} />
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="새 항목 이름" style={{ ...inputStyle, flex:1, minWidth:0 }} />
            <button onClick={addItem} style={btnPrimary}>추가</button>
          </div>
        )}

        {isLocked ? (
          <p style={{ color:'#aaa', fontSize:13 }}>🔒 직접입력 카테고리는 앱에서 사용자가 직접 추가합니다.</p>
        ) : catItems.length === 0 ? (
          <p style={{ color:'#ccc', fontSize:13, textAlign:'center', padding:'20px 0' }}>항목이 없어요. 위에서 추가해보세요!</p>
        ) : (
          <div>
            {catItems.map((item, localIdx) => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid #f3f3f3' }}>
                <IconPicker value={iconMap[item.id] || CAT_DEFAULT[selCat] || 'ph:star'} onChange={v => updateIcon(item.id, v)} />
                <input value={item.label} onChange={e=>updateItem(item.id,'label',e.target.value)} style={{ flex:1, fontSize:13, border:'none', background:'transparent', color:'#444' }} />
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => moveItem(item.id,-1)} disabled={localIdx===0} style={{ ...btnSmGhost, opacity:localIdx===0?0.3:1 }}>↑</button>
                  <button onClick={() => moveItem(item.id, 1)} disabled={localIdx===catItems.length-1} style={{ ...btnSmGhost, opacity:localIdx===catItems.length-1?0.3:1 }}>↓</button>
                  <button onClick={() => deleteItem(item.id)} style={{ ...btnSmDanger }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 4: 코드 내보내기
// ════════════════════════════════════════════
function ExportTab({ cats, items, iconMap }: {
  cats: Cat[]; items: Item[]; iconMap: Record<string,string>
}) {
  const [code, setCode]   = useState('')
  const [copied, setCopied] = useState(false)

  function generate() {
    const esc = (s: string) => s.replace(/\\/g,'\\\\').replace(/'/g,"\\'")
    let out = `export type Category = { id: string; label: string; receiptLabel: string; emoji: string }\n`
    out += `export type CheckItem = { id: string; categoryId: string; label: string; emoji: string }\n\n`
    out += `export const CATEGORIES: Category[] = [\n`
    cats.forEach((c: Cat) => { out += `  { id:'${esc(c.id)}', label:'${esc(c.label)}', receiptLabel:'${esc(c.receiptLabel)}', emoji:'${c.emoji}' },\n` })
    out += `]\n\nexport const ITEMS: CheckItem[] = [`
    let lastCat = ''
    items.forEach((item: Item) => {
      const cat = cats.find((c: Cat) => c.id === item.categoryId)
      if (cat && cat.id !== lastCat) { out += `\n\n  // ${cat.label}\n`; lastCat = cat.id }
      out += `  { id:'${esc(item.id)}', categoryId:'${esc(item.categoryId)}', label:'${esc(item.label)}', emoji:'${item.emoji}' },\n`
    })
    out += `]\n\n`
    // ITEM_ICONS 내보내기
    out += `// 아이템별 Phosphor 아이콘 맵 — ChecklistPage.tsx 와 BucketCheckView.tsx 의 ITEM_ICONS 를 이 내용으로 교체하세요\n`
    out += `export const ITEM_ICONS: Record<string, string> = {\n`
    Object.entries(iconMap).forEach(([k, v]) => { out += `  ${k}:'${v}',\n` })
    out += `}\n`
    setCode(out)
  }

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <SectionTitle>사용 방법</SectionTitle>
      {[
        '"코드 생성" 버튼을 클릭하세요',
        '"전체 복사" 버튼으로 코드를 클립보드에 복사하세요',
        'src/data/checklist.ts 파일 전체 내용을 붙여넣으세요',
        'npm run build 후 배포하면 모든 사용자에게 반영됩니다',
      ].map((step, i) => (
        <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'#1E4D83', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
          <span style={{ fontSize:13, color:'#555', lineHeight:1.7 }}>{step}</span>
        </div>
      ))}

      <div style={{ display:'flex', gap:10, margin:'16px 0' }}>
        <button onClick={generate} style={btnPrimary}>⚡ 코드 생성</button>
        <button onClick={copy} disabled={!code} style={{ ...btnGhost, opacity:code?1:0.4 }}>{copied ? '✅ 복사됨!' : '📋 전체 복사'}</button>
      </div>
      <textarea
        value={code} readOnly
        placeholder="'코드 생성' 버튼을 눌러주세요..."
        style={{ width:'100%', minHeight:320, padding:14, border:'1.5px solid #e0e0e0', borderRadius:10, fontFamily:'monospace', fontSize:12, color:'#333', background:'#fafafa', resize:'vertical', outline:'none', lineHeight:1.6, boxSizing:'border-box' }}
      />
    </Card>
  )
}

// ════════════════════════════════════════════
// SHARED UI COMPONENTS
// ════════════════════════════════════════════
function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background:'#fff', borderRadius:14, padding:20, marginBottom:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>{children}</div>
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize:13, fontWeight:800, color:'#444', marginBottom:14, letterSpacing:0.5, ...style }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom:10 }}><div style={{ fontSize:12, fontWeight:800, color:'#1E4D83', marginBottom:4 }}>{label}</div>{children}</div>
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>{children}</div>
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)', background:'#222', color:'#fff', padding:'10px 22px', borderRadius:99, fontSize:13, fontWeight:600, zIndex:999 }}>{msg}</div>
}

function Confirm({ msg, onOk, onCancel, danger }: { msg: string; onOk: ()=>void; onCancel: ()=>void; danger?: boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:600 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:16, padding:'24px 20px', zIndex:601, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
        <p style={{ fontSize:14, fontWeight:800, marginBottom:20 }}>{msg}</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{ ...btnGhost, flex:1 }}>취소</button>
          <button onClick={onOk} style={{ flex:2, padding:'11px', border:'none', borderRadius:10, background: danger?'#e8420a':'#1E4D83', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>삭제</button>
        </div>
      </div>
    </>
  )
}

// ── 공통 스타일
const inputStyle: React.CSSProperties = {
  width:'100%', minWidth:0, padding:'9px 12px', border:'1.5px solid #e0e0e0', borderRadius:9,
  fontSize:14, color:'#333', outline:'none', boxSizing:'border-box',
  fontFamily:'inherit', display:'block',
}

const btnPrimary: React.CSSProperties = {
  padding:'9px 18px', borderRadius:9, border:'none', background:'#1E4D83', color:'#fff',
  fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
}

const btnGhost: React.CSSProperties = {
  padding:'9px 16px', borderRadius:9, border:'1.5px solid #e0e0e0', background:'#fff', color:'#666',
  fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
}

const btnSmGhost: React.CSSProperties = {
  padding:'4px 8px', borderRadius:6, border:'1.5px solid #e0e0e0', background:'#f4f5f8', color:'#666',
  fontSize:12, fontWeight:700, cursor:'pointer',
}

const btnSmDanger: React.CSSProperties = {
  padding:'4px 8px', borderRadius:6, border:'none', background:'#fee2e2', color:'#e05252',
  fontSize:12, fontWeight:700, cursor:'pointer',
}

const checkLabel: React.CSSProperties = {
  display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'#1E4D83', cursor:'pointer',
}

// ════════════════════════════════════════════
// TAB: 업체 등록 신청 목록
// ════════════════════════════════════════════
type RequestStatus = 'pending' | 'approved' | 'rejected'
type BusinessRequest = {
  id: string
  business_name: string
  address: string
  description: string
  hashtags: string[]
  phone: string | null
  kakao: string | null
  website: string | null
  status: RequestStatus
  created_at: string
}

function RequestsTab() {
  const [requests, setRequests] = useState<BusinessRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<RequestStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadRequests() }, [])

  async function loadRequests() {
    setLoading(true)
    const { supabase } = await import('../lib/supabase')
    const { data } = await supabase
      .from('business_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setRequests((data as BusinessRequest[]) ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: RequestStatus) {
    const { supabase } = await import('../lib/supabase')
    await supabase.from('business_requests').update({ status }).eq('id', id)
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r))

    // 승인 시 businesses 테이블에 자동 등록
    if (status === 'approved') {
      const req = requests.find(r => r.id === id)
      if (req) {
        const suburb = req.address.split(',').slice(-2, -1)[0]?.trim() || ''
        const { error } = await (await import('../lib/supabase')).supabase
          .from('businesses')
          .insert({
            id:          crypto.randomUUID(),
            name:        req.business_name,
            category:    req.category || 'restaurant',
            description: req.description,
            phone:       req.phone    || null,
            website:     req.website  || null,
            kakao:       req.kakao    || null,
            address:     req.address,
            city:        suburb,
            tags:        req.hashtags,
            is_featured: false,
            is_active:   true,
          })
        if (error) {
          alert(`승인됐지만 업체 등록 중 오류가 발생했어요:\n${error.message}`)
        } else {
          alert(`✅ "${req.business_name}" 업체가 등록됐어요!`)
        }
      }
    }
  }

  async function deleteRequest(id: string) {
    if (!window.confirm('이 신청을 삭제할까요?')) return
    const { supabase } = await import('../lib/supabase')
    await supabase.from('business_requests').delete().eq('id', id)
    setRequests(rs => rs.filter(r => r.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  const statusColor: Record<RequestStatus, string> = {
    pending:  '#FFCD00',
    approved: '#16A34A',
    rejected: '#EF4444',
  }
  const statusLabel: Record<RequestStatus, string> = {
    pending:  '대기중',
    approved: '승인됨',
    rejected: '거절됨',
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:900, color:'#0F1B2D' }}>업체 등록 신청</div>
        <button onClick={loadRequests} style={{ ...btnSmGhost }}>새로고침 ↻</button>
      </div>

      {/* 필터 탭 */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {(['all','pending','approved','rejected'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            height:32, padding:'0 12px', borderRadius:8, border:'none',
            background: filter===s ? '#1E4D83' : '#fff',
            color: filter===s ? '#fff' : '#64748B',
            fontSize:12, fontWeight:700, cursor:'pointer',
            boxShadow: filter===s ? '0 2px 8px rgba(30,77,131,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            {s === 'all' ? '전체' : statusLabel[s]} {counts[s] > 0 && `(${counts[s]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>신청 내역이 없어요</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(req => (
            <div key={req.id} style={{
              background:'#fff', borderRadius:12, overflow:'hidden',
              boxShadow:'0 1px 6px rgba(0,0,0,0.07)',
            }}>
              {/* 헤더 */}
              <div
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                style={{ padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}
              >
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:'#1E293B' }}>{req.business_name}</span>
                    <span style={{
                      fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
                      background: statusColor[req.status] + '22',
                      color: statusColor[req.status] === '#FFCD00' ? '#92620a' : statusColor[req.status],
                    }}>{statusLabel[req.status]}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#94A3B8' }}>
                    {new Date(req.created_at).toLocaleDateString('ko-KR')} · {req.address}
                  </div>
                </div>
                <span style={{ color:'#94A3B8', fontSize:14 }}>{expanded === req.id ? '▲' : '▼'}</span>
              </div>

              {/* 상세 */}
              {expanded === req.id && (
                <div style={{ borderTop:'1px solid #F1F5F9', padding:'14px 16px', background:'#FAFAFA' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                    <Row label="주소"    value={req.address} />
                    <Row label="설명"    value={req.description} />
                    <Row label="해시태그" value={req.hashtags.map(t => `#${t}`).join(' ')} />
                    {req.phone   && <Row label="전화번호"   value={req.phone} />}
                    {req.kakao   && <Row label="카카오채팅" value={req.kakao} link />}
                    {req.website && <Row label="웹사이트"   value={req.website} link />}
                  </div>
                  {/* 액션 버튼 */}
                  <div style={{ display:'flex', gap:8 }}>
                    {req.status !== 'approved' && (
                      <button onClick={() => updateStatus(req.id, 'approved')} style={{
                        flex:1, height:38, border:'none', borderRadius:8,
                        background:'#16A34A', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
                      }}>✓ 승인</button>
                    )}
                    {req.status !== 'rejected' && (
                      <button onClick={() => updateStatus(req.id, 'rejected')} style={{
                        flex:1, height:38, border:'none', borderRadius:8,
                        background:'#FEE2E2', color:'#EF4444', fontSize:13, fontWeight:700, cursor:'pointer',
                      }}>✕ 거절</button>
                    )}
                    {req.status !== 'pending' && (
                      <button onClick={() => updateStatus(req.id, 'pending')} style={{
                        ...btnSmGhost, flex:1, height:38, borderRadius:8, fontSize:13,
                      }}>대기로 되돌리기</button>
                    )}
                    <button onClick={() => deleteRequest(req.id)} style={{
                      width:38, height:38, border:'none', borderRadius:8,
                      background:'#FEE2E2', color:'#EF4444', fontSize:16, cursor:'pointer', flexShrink:0,
                    }}>🗑</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'70px 1fr', gap:8, alignItems:'start' }}>
      <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8', paddingTop:1 }}>{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#1E4D83', fontWeight:600, wordBreak:'break-all' }}>{value}</a>
      ) : (
        <span style={{ fontSize:12, color:'#1E293B', fontWeight:500, lineHeight:1.5, wordBreak:'break-all' }}>{value}</span>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// TAB: 버킷리스트 추천 목록
// ════════════════════════════════════════════
type Suggestion = {
  id: string
  suggestion: string
  email: string | null
  status: string
  created_at: string
}

function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => { loadSuggestions() }, [])

  async function loadSuggestions() {
    setLoading(true)
    const { supabase } = await import('../lib/supabase')
    const { data } = await supabase
      .from('item_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
    setSuggestions((data as Suggestion[]) ?? [])
    setLoading(false)
  }

  async function deleteSuggestion(id: string) {
    if (!window.confirm('이 추천을 삭제할까요?')) return
    const { supabase } = await import('../lib/supabase')
    await supabase.from('item_suggestions').delete().eq('id', id)
    setSuggestions(s => s.filter(x => x.id !== id))
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:900, color:'#0F1B2D' }}>버킷리스트 추천</div>
          <div style={{ fontSize:12, color:'#94A3B8', marginTop:2 }}>검토 후 체크리스트에 직접 추가해주세요</div>
        </div>
        <button onClick={loadSuggestions} style={{ ...btnSmGhost }}>새로고침 ↻</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>불러오는 중...</div>
      ) : suggestions.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:13 }}>추천 내역이 없어요</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {suggestions.map(s => (
            <div key={s.id} style={{
              background:'#fff', borderRadius:12, padding:'16px',
              boxShadow:'0 1px 6px rgba(0,0,0,0.07)',
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1 }}>
                  {/* 추천 내용 */}
                  <div style={{ fontSize:14, fontWeight:600, color:'#1E293B', lineHeight:1.6, marginBottom:8 }}>
                    💡 {s.suggestion}
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    {s.email && (
                      <div style={{ fontSize:12, color:'#64748B', display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ color:'#94A3B8' }}>📧</span> {s.email}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'#94A3B8' }}>
                      {new Date(s.created_at).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })}
                    </div>
                  </div>
                </div>
                {/* 삭제 버튼 */}
                <button onClick={() => deleteSuggestion(s.id)} style={{
                  width:36, height:36, border:'none', borderRadius:8, flexShrink:0,
                  background:'#FEE2E2', color:'#EF4444', fontSize:16, cursor:'pointer',
                }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
