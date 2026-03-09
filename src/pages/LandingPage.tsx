import { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { AppState } from '../store/state'
import { ITEMS, CATEGORIES } from '../data/checklist'
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
    itemId: 'f36',
    catId: 'food',
  },
  {
    id: 'bondi',
    title: 'Bondi Beach',
    desc: '시드니 대표 해변 즐기기',
    img: imgBeach,
    pos: 'center 30%',
    itemId: 'g24',
    catId: 'places',
  },
  {
    id: 'bridgeclimb',
    title: '하버 브릿지 클라이밍',
    desc: '시드니 전경을 발밑에 두기',
    img: imgUnique,
    pos: 'center',
    itemId: 'g23',
    catId: 'places',
  },
  {
    id: 'bbq',
    title: '공원 BBQ 파티',
    desc: '호주식 바베큐 파티 즐기기',
    img: imgFood,
    pos: 'center',
    itemId: 'f37',
    catId: 'food',
  },
  {
    id: 'kangaroo',
    title: '캥거루 먹이주기',
    desc: '야생동물 공원 체험',
    img: imgNature,
    pos: 'center',
    itemId: 'g25',
    catId: 'places',
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
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&v=weekly`
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
              <Icon icon="ph:map-pin-simple" width={14} height={14} color="#003594" />
              {s.placePrediction?.text?.text || ''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 시드니 주요 명소 고정 지도
const SYDNEY_SPOTS = [
  { name: 'Sydney Opera House', icon: 'ph:music-notes',   lat: -33.8568, lng: 151.2153, desc: '세계적 공연 예술 센터' },
  { name: 'Bondi Beach',        icon: 'ph:waves',         lat: -33.8908, lng: 151.2743, desc: '시드니 대표 해변' },
  { name: 'Harbour Bridge',     icon: 'ph:bridge',        lat: -33.8523, lng: 151.2108, desc: '브릿지클라임 명소' },
  { name: 'Black Star Pastry',  icon: 'ph:cake',          lat: -33.8991, lng: 151.1731, desc: '세계 최고 케이크 맛집' },
  { name: 'Darling Harbour',    icon: 'ph:anchor',        lat: -33.8731, lng: 151.1985, desc: '쇼핑·식사·관광' },
  { name: 'Taronga Zoo',        icon: 'ph:paw-print',     lat: -33.8433, lng: 151.2411, desc: '캥거루·코알라 만나기' },
  { name: 'Royal Botanic Garden', icon: 'ph:tree',        lat: -33.8642, lng: 151.2166, desc: '시드니 중심 공원' },
  { name: 'Manly Beach',        icon: 'ph:sun-horizon',   lat: -33.7969, lng: 151.2868, desc: '페리타고 가는 해변' },
]

function SydneyMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

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

        const pinSvg = (_icon: string) =>
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
              <ellipse cx="16" cy="39" rx="6" ry="2.5" fill="rgba(0,0,0,0.18)"/>
              <path d="M16 0C9.373 0 4 5.373 4 12c0 8.8 12 26 12 26S28 20.8 28 12C28 5.373 22.627 0 16 0z" fill="#FFB800"/>
              <circle cx="16" cy="12" r="6" fill="#fff"/>
              <circle cx="16" cy="12" r="3" fill="#FFB800"/>
            </svg>
          `)

        SYDNEY_SPOTS.forEach((spot, i) => {
          const marker = new google.maps.Marker({
            position: { lat: spot.lat, lng: spot.lng },
            map,
            icon: {
              url: pinSvg(spot.icon),
              scaledSize: new google.maps.Size(36, 46),
              anchor: new google.maps.Point(18, 46),
            },
            title: spot.name,
          })
          marker.addListener('click', () => setSelected(i))
        })
        if (!cancelled) setLoaded(true)
      } catch {}
    }
    init()
    return () => { cancelled = true }
  }, [])

  return (
    <div style={{ background:'#fff', padding:'24px 20px' }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <Icon icon="ph:map-pin" width={20} height={20} color={BLUE} />
          <div style={{ fontSize:18, fontWeight:900, color:'#0F172A' }}>시드니 버킷리스트 지도</div>
        </div>
        <div style={{ fontSize:13, color:'#64748B' }}>꼭 가봐야 할 명소를 지도에서 확인하세요</div>
      </div>

      {/* 명소 태그 가로 스크롤 */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:12, marginBottom:12, scrollbarWidth:'none' }}>
        {SYDNEY_SPOTS.map((s, i) => (
          <div key={i} style={{
            flexShrink:0, display:'flex', alignItems:'center', gap:5,
            background: selected === i ? BLUE : '#F0F4FF',
            color: selected === i ? '#fff' : BLUE,
            borderRadius:20, padding:'5px 12px', fontSize:12, fontWeight:700,
            cursor:'pointer', transition:'all 0.2s',
            border: selected === i ? 'none' : `1px solid rgba(27,110,243,0.15)`,
          }} onClick={() => setSelected(i)}>
            <Icon icon={s.icon} width={13} height={13} color={selected === i ? '#fff' : BLUE} />
            <span style={{ whiteSpace:'nowrap' }}>{s.name}</span>
          </div>
        ))}
      </div>

      {/* 지도 */}
      <div style={{ position:'relative', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,53,148,0.12)' }}>
        <div ref={mapRef} style={{ width:'100%', height:280 }}/>
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

      {/* 선택된 명소 카드 */}
      {selected !== null && (
        <div style={{
          marginTop:12, padding:'12px 14px',
          background:`rgba(27,110,243,0.05)`, borderRadius:12,
          border:`1px solid rgba(27,110,243,0.10)`,
          display:'flex', alignItems:'center', gap:10,
        }}>
          <Icon icon={SYDNEY_SPOTS[selected].icon} width={24} height={24} color={BLUE} />
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:BLUE }}>{SYDNEY_SPOTS[selected].name}</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{SYDNEY_SPOTS[selected].desc}</div>
          </div>
        </div>
      )}
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
      <button onClick={onClose} style={{ width:'100%', height:48, background:'#003594', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>확인</button>
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
              <button key={cat.id} onClick={() => set('category', cat.id)} style={{ height:36, borderRadius:12, border:'none', cursor:'pointer', background: form.category===cat.id ? '#003594' : '#fff', color: form.category===cat.id ? '#fff' : '#1E293B', fontSize:12, fontWeight:700, boxShadow: form.category===cat.id ? '0 2px 8px rgba(0,53,148,0.25)' : '0 1px 4px rgba(0,0,0,0.08)' }}>{cat.label}</button>
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
      <button onClick={handleSubmit} disabled={submitting} style={{ width:'100%', marginTop:16, height:50, background:'#003594', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor: submitting?'default':'pointer', opacity: submitting?0.7:1, boxShadow:'0 4px 14px rgba(0,53,148,0.25)' }}>{submitting ? '제출 중...' : '등록 신청하기'}</button>
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
      <button onClick={onClose} style={{ width:'100%', height:48, background:'#003594', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>확인</button>
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'rgba(0,53,148,0.05)', borderRadius:12, padding:'12px 14px' }}>
        <div style={{ fontSize:13, color:'#003594', fontWeight:700, marginBottom:4 }}>💡 이런 것들을 추천해주세요</div>
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
      <button onClick={handleSubmit} disabled={submitting} style={{ width:'100%', height:50, background:'#003594', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor: submitting?'default':'pointer', opacity: submitting?0.7:1, boxShadow:'0 4px 14px rgba(0,53,148,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:4 }}>
        <Icon icon="ph:paper-plane-tilt" width={16} height={16} color="'${GOLD}'" />
        {submitting ? '제출 중...' : '추천 제출하기'}
      </button>
    </div>
  )
}

// ── 말풍선
function ChatBubble() {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ position:'fixed', bottom:'10%', right:20, zIndex:300, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
      {open && (
        <div style={{ background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 4px 20px rgba(0,53,148,0.15)', maxWidth:240, position:'relative', animation:'fadeInUp 0.25s ease', border:'1px solid rgba(0,53,148,0.08)' }}>
          <button onClick={() => setOpen(false)} style={{ position:'absolute', top:8, right:8, background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:14, lineHeight:1, padding:2 }}>✕</button>
          <div style={{ fontSize:12, fontWeight:800, color:'#003594', marginBottom:6 }}>호주가자 운영자입니다.</div>
          <div style={{ fontSize:12, color:'#475569', lineHeight:1.6 }}>
            본 서비스는 무료로 제공됩니다. 문의는{' '}
            <a href="https://www.threads.net/@palaslouise" target="_blank" rel="noreferrer" style={{ color:'#003594', fontWeight:700, textDecoration:'none' }}>@palaslouise</a>로 연락주세요.
          </div>
          <div style={{ position:'absolute', bottom:-8, right:18, width:0, height:0, borderLeft:'8px solid transparent', borderRight:'8px solid transparent', borderTop:'8px solid #fff', filter:'drop-shadow(0 2px 2px rgba(0,53,148,0.08))' }}/>
        </div>
      )}
      <button onClick={() => setOpen(v => !v)} style={{ width:44, height:44, borderRadius:'50%', background:'#E8EDF5', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.12)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#003594"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════
// ── 메인 컴포넌트
// ══════════════════════════════════════════════════
export default function LandingPage({ state, onStart, onServices }: Props) {
  const navigate = useNavigate()
  const total    = ITEMS.length + (state.customItems?.length ?? 0)
  const checked  = state.checked?.size ?? 0
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0
  const bizCount = BUSINESSES.length

  const [showForm, setShowForm]             = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [logoTap, setLogoTap]               = useState(0)
  const [sliderIdx, setSliderIdx]           = useState(0)
  const [sliderAnimate, setSliderAnimate]   = useState(true)
  const sliderRef  = useRef<HTMLDivElement>(null)
  const logoTimer  = useRef<any>(null)

  // 카드 앞뒤로 복제해서 무한루프
  const CLONED = [...BUCKET_RECS, ...BUCKET_RECS, ...BUCKET_RECS]
  const OFFSET  = BUCKET_RECS.length // 가운데 세트 시작 인덱스
  const [realIdx, setRealIdx] = useState(OFFSET)

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
              <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{total}개 버킷리스트</span>
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
        <div style={{ overflow:'hidden', paddingLeft:20 }}>
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
                  onClick={() => navigate(`/?cat=${item.catId}&item=${item.itemId}`)}
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
