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
type MainTab = 'business' | 'categories' | 'items' | 'requests' | 'suggestions' | 'community' | 'shopping' | 'bingo' | 'google'

// ── 탭 메타
const TAB_META: { id: MainTab; icon: string; label: string }[] = [
  { id:'business',    icon:'ph:buildings',         label:'업체' },
  { id:'requests',    icon:'ph:envelope-open',      label:'신청' },
  { id:'suggestions', icon:'ph:lightbulb',          label:'추천' },
  { id:'categories',  icon:'ph:folder-open',        label:'카테고리' },
  { id:'items',       icon:'ph:list-checks',        label:'체크리스트' },
  { id:'community',   icon:'ph:chats-circle',       label:'커뮤니티' },
  { id:'shopping',    icon:'ph:shopping-bag',        label:'쇼핑' },
  { id:'bingo',       icon:'ph:coffee',              label:'빙고' },
  { id:'google',      icon:'ph:magnifying-glass',    label:'구글매핑' },
]


// ── 업체 폼 초기값
const EMPTY_FORM = {
  id:'', name:'', category:'realestate', description:'',
  phone:'', website:'', kakao:'', address:'', city:'',
  is_featured:false, is_active:true, tags:'', google_place_id:'',
}

// ── 체크리스트 타입 (DB 기반)
type Cat  = { id:string; label:string; emoji:string; sort_order:number }
type Item = { id:string; category_id:string; label:string; icon:string|null; sort_order:number; is_active:boolean; address?:string|null; description?:string|null; related_business_id?:string|null; related_business_ids?:string[]|null }

const EMOJI_MAP: [string[], string][] = [
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

  // 수정 모드로 열릴 때 prop 변경 반영
  useEffect(() => {
    setQuery(address || '')
    setManualCity(city || '')
  }, [address, city])
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
      const address = components.find((c: any) => c.types.includes('locality') || c.types.includes('sublocality_level_1'))?.longText || ''
      const state  = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.shortText || ''
      const post   = components.find((c: any) => c.types.includes('postal_code'))?.longText || ''
      const streetNum = components.find((c: any) => c.types.includes('street_number'))?.longText || ''
      const route     = components.find((c: any) => c.types.includes('route'))?.longText || ''
      const streetAddress = [streetNum, route, address, state, post].filter(Boolean).join(', ')
      setQuery(streetAddress)
      setManualCity(address)
      onSelect(streetAddress, address)
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

  // ── 공유 checklist state (DB 기반)
  const [sharedCats,    setSharedCats]    = useState<Cat[]>([])
  const [sharedItems,   setSharedItems]   = useState<Item[]>([])
  const [sharedIconMap, setSharedIconMap] = useState<Record<string,string>>({})
  const [clLoading,     setClLoading]     = useState(true)

  useEffect(() => {
    const fetchCL = async () => {
      const [{ data: cats }, { data: items }] = await Promise.all([
        supabase.from('checklist_categories').select('*').order('sort_order'),
        supabase.from('checklist_items').select('*').order('sort_order'),
      ])
      if (cats) setSharedCats(cats)
      if (items) {
        setSharedItems(items)
        const iconMap: Record<string,string> = {}
        items.forEach((i: Item) => { if (i.icon) iconMap[i.id] = i.icon })
        setSharedIconMap(iconMap)
      }
      setClLoading(false)
    }
    fetchCL()
  }, [])

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else { setPwError(true) }
  }

  if (!authed) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#F0F2F7',
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
        <button onClick={handleLogin} style={{ ...btnPrimary, marginTop:12, width:'100%', justifyContent:'center', display:'flex' }}>로그인</button>
        <button onClick={onBack} style={{ ...btnGhost, marginTop:8, width:'100%', justifyContent:'center', display:'flex', alignItems:'center', gap:6 }}><Icon icon="ph:arrow-left" width={14} height={14} /> 돌아가기</button>
      </div>
    </div>
  )

  const currentTab = TAB_META.find(t => t.id === tab)!

  return (
    <div style={{
      minHeight:'100vh', background:'#F0F2F7',
      fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      paddingBottom:72,
    }}>
      {/* 헤더 */}
      <div style={{
        background:'#1B6EF3', color:'#fff',
        padding:'14px 16px 14px',
        display:'flex', alignItems:'center', gap:10,
        position:'sticky', top:0, zIndex:50,
        boxShadow:'0 2px 8px rgba(27,110,243,0.18)',
      }}>
        <button onClick={onBack} style={{
          background:'rgba(255,255,255,0.15)', border:'none', color:'#fff',
          width:36, height:36, borderRadius:10, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon icon="ph:arrow-left" width={18} height={18} color="#fff" />
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:900, lineHeight:1.2 }}>호주가자 Admin</div>
          <div style={{ fontSize:11, opacity:0.75 }}>{currentTab.label}</div>
        </div>
        <div style={{
          background:'rgba(255,255,255,0.15)', borderRadius:8,
          padding:'4px 10px', fontSize:11, fontWeight:700,
        }}>🔒 관리자</div>
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ padding:'16px 14px 16px' }}>
        {tab==='business'    && <BusinessTab />}
        {tab==='requests'    && <RequestsTab />}
        {tab==='suggestions' && <SuggestionsTab />}
        {tab==='categories'  && (clLoading ? <div style={{padding:32,textAlign:'center',color:'#aaa'}}>불러오는 중...</div> : <CategoriesTab cats={sharedCats} setCats={setSharedCats} />)}
        {tab==='items'       && (clLoading ? <div style={{padding:32,textAlign:'center',color:'#aaa'}}>불러오는 중...</div> : <ItemsTab cats={sharedCats} items={sharedItems} setItems={setSharedItems} />)}
        {tab==='community'   && <CommunityTab />}
        {tab==='shopping'    && <ShoppingTab />}
        {tab==='bingo'       && <BingoTab />}
        {tab==='google'      && <GoogleMappingTab />}
      </div>

      {/* 하단 네비바 */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        background:'#fff', borderTop:'1px solid #E8EDF3',
        display:'flex', boxShadow:'0 -4px 16px rgba(0,0,0,0.08)',
        paddingBottom:'env(safe-area-inset-bottom)',
      }}>
        {TAB_META.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, border:'none', background:'none', cursor:'pointer',
            padding:'8px 2px 6px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            color: tab===t.id ? '#1B6EF3' : '#94A3B8',
          }}>
            <Icon icon={t.icon} width={22} height={22} color={tab===t.id ? '#1B6EF3' : '#94A3B8'} />
            <span style={{ fontSize:9, fontWeight:700, lineHeight:1 }}>{t.label}</span>
            {tab===t.id && (
              <div style={{ width:16, height:2, borderRadius:2, background:'#1B6EF3', marginTop:1 }} />
            )}
          </button>
        ))}
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
  const [bizSearch, setBizSearch]   = useState('')
  const [bizCat, setBizCat]         = useState('all')
  const [mapping, setMapping]       = useState(false)
  const [mapResult, setMapResult]   = useState<{ total:number; matched:number; failed:{id:string;name:string;reason:string}[] } | null>(null)

  async function handleAutoMap() {
    if (!confirm(`google_place_id가 없는 업체를 자동 매핑할까요?\n(Google Places API 호출)`)) return
    setMapping(true)
    setMapResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('match-place-ids')
      if (error) throw error
      setMapResult(data)
      await load()
    } catch (e) {
      showToast('자동 매핑 실패: ' + String(e))
    }
    setMapping(false)
  }

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
      google_place_id:b.google_place_id||'',
    })
    setEditTarget(b); setShowForm(true)
  }

  async function save() {
    if (!form.name) { showToast('업체명은 필수예요'); return }
    setSaving(true)
    // city가 없으면 address에서 address 추출해서 채우기
    const cityVal = form.city || form.address.split(',').find(p => /[A-Z]{2,3}/.test(p.trim()) === false && p.trim().length > 2)?.trim() || ''
    const payload = { ...form, city: cityVal, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean), rating:0, reviews_count:0 }
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
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <button onClick={() => setShowForm(false)} style={{ ...btnGhost, display:'flex', alignItems:'center', gap:6, padding:'9px 14px' }}>
              <Icon icon="ph:arrow-left" width={15} height={15} /> 목록
            </button>
            <h2 style={{ fontSize:16, fontWeight:900, color:'#0F172A', margin:0 }}>{editTarget ? '업체 수정' : '업체 등록'}</h2>
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
            <Field label="태그 (쉼표 구분)"><input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} style={inputStyle} placeholder="예: 부동산 구매, 투자 상담" /></Field>            <Grid2>
              <Field label="전화번호"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={inputStyle} placeholder="+61 2 1234 5678" /></Field>
              <Field label="카카오 ID"><input value={form.kakao} onChange={e=>setForm(f=>({...f,kakao:e.target.value}))} style={inputStyle} /></Field>
            </Grid2>
            <Field label="웹사이트"><input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} style={inputStyle} placeholder="https://..." /></Field>
            <Field label="Google Place ID">
              <div style={{ display:'flex', gap:8 }}>
                <input value={form.google_place_id} onChange={e=>setForm(f=>({...f,google_place_id:e.target.value}))} style={{ ...inputStyle, flex:1, margin:0 }} placeholder="ChIJ..." />
                {editTarget && (
                  <button
                    onClick={async () => {
                      await supabase.from('businesses').update({ google_rating: null, google_review_count: null }).eq('id', editTarget.id)
                      showToast('별점 초기화 완료')
                    }}
                    style={{ height:40, padding:'0 12px', borderRadius:8, border:'1px solid #E2E8F0', background:'#FFF7ED', color:'#D97706', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
                  >⭐ 별점 초기화</button>
                )}
              </div>
            </Field>
            <div style={{ display:'flex', gap:20, marginTop:8 }}>
              <label style={checkLabel}><input type="checkbox" checked={form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} /> ⭐ 추천 업체</label>
              <label style={checkLabel}><input type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} /> ✅ 활성화</label>
            </div>
            <button onClick={save} disabled={saving} style={{ ...btnPrimary, marginTop:16, width:'100%', justifyContent:'center', display:'flex', alignItems:'center', gap:8 }}>
              <Icon icon={saving ? 'ph:spinner' : 'ph:check'} width={16} height={16} />
              {saving ? '저장 중...' : editTarget ? '수정 완료' : '등록하기'}
            </button>
          </Card>

          {/* 리뷰 관리 - 수정 모드일 때만 */}
          {editTarget && <ReviewManager businessId={editTarget.id} onRefresh={load} showToast={showToast} />}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:13, color:'#64748B', fontWeight:700 }}>총 {businesses.length}개 업체</span>
            <button onClick={openNew} style={{ ...btnPrimary, padding:'9px 16px', fontSize:13 }}>+ 등록</button>
          </div>

          {/* 검색 + 카테고리 필터 */}
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <input
              value={bizSearch}
              onChange={e => setBizSearch(e.target.value)}
              placeholder="업체명 검색..."
              style={{ ...inputStyle, flex:1, margin:0 }}
            />
            <select
              value={bizCat}
              onChange={e => setBizCat(e.target.value)}
              style={{ ...inputStyle, width:130, margin:0, flexShrink:0 }}
            >
              <option value="all">전체 카테고리</option>
              {CATEGORIES.filter(c=>c.id!=='all').map(c=>(
                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          {/* 필터 결과 수 */}
          {(bizSearch || bizCat !== 'all') && (
            <div style={{ fontSize:12, color:'#888', marginBottom:8 }}>
              {businesses.filter(b =>
                (bizCat === 'all' || b.category === bizCat) &&
                (!bizSearch || b.name.toLowerCase().includes(bizSearch.toLowerCase()))
              ).length}개 표시 중
              <button onClick={() => { setBizSearch(''); setBizCat('all') }}
                style={{ marginLeft:8, fontSize:11, color:'#1E4D83', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
                초기화
              </button>
            </div>
          )}

          {loading ? <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>불러오는 중...</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {businesses.filter(b =>
                (bizCat === 'all' || b.category === bizCat) &&
                (!bizSearch || b.name.toLowerCase().includes(bizSearch.toLowerCase()))
              ).map(b => (
                <Card key={b.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <span style={{ fontSize:15, fontWeight:900, color:'#0F172A' }}>{b.name}</span>
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
// TAB 2: 카테고리 관리 (DB 기반)
// ════════════════════════════════════════════
function CategoriesTab({ cats, setCats }: {
  cats: Cat[]
  setCats: (cats: Cat[]) => void
}) {
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [toast, setToast]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [dragIdx, setDragIdx]   = useState<number|null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number|null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function addCat() {
    if (!newLabel.trim()) return
    const emoji = newEmoji.trim() || '📌'
    const id = 'cat_' + Date.now()
    const sort_order = cats.length + 1
    setSaving(true)
    const { error } = await supabase.from('checklist_categories').insert({
      id, label: newLabel.trim(), emoji, sort_order
    })
    if (!error) {
      setCats([...cats, { id, label: newLabel.trim(), emoji, sort_order }])
      setNewEmoji(''); setNewLabel('')
      showToast('카테고리 추가됨: ' + newLabel)
    } else showToast('오류: ' + error.message)
    setSaving(false)
  }

  async function deleteCat(id: string) {
    if (!confirm('이 카테고리와 하위 항목을 모두 삭제할까요?')) return
    await supabase.from('checklist_items').delete().eq('category_id', id)
    await supabase.from('checklist_categories').delete().eq('id', id)
    setCats(cats.filter(c => c.id !== id))
    showToast('삭제됨')
  }

  async function updateCat(id: string, field: 'label'|'emoji', val: string) {
    if (!val) return
    const updated = cats.map(c => c.id===id ? {...c, [field]:val} : c)
    setCats(updated)
    await supabase.from('checklist_categories').update({ [field]: val }).eq('id', id)
  }

  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx) }
  function handleDragEnd() { setDragIdx(null); setDragOverIdx(null) }

  async function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...cats]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(toIdx, 0, moved)
    // sort_order 재계산
    const reordered = next.map((c, i) => ({ ...c, sort_order: i + 1 }))
    setCats(reordered)
    setDragIdx(null); setDragOverIdx(null)
    // DB 업데이트
    await Promise.all(reordered.map(c =>
      supabase.from('checklist_categories').update({ sort_order: c.sort_order }).eq('id', c.id)
    ))
    showToast('순서 저장됨')
  }

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
          <button onClick={addCat} disabled={saving} style={{ ...btnPrimary, flexShrink:0, padding:'11px 16px', fontSize:13 }}>추가</button>
        </div>
      </Card>

      <Card>
        <SectionTitle>카테고리 목록 ({cats.length}) — 드래그로 순서 변경</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {cats.map((cat, idx) => {
            const isDragging = dragIdx === idx
            const isOver = dragOverIdx === idx
            return (
              <div
                key={cat.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                style={{
                  border: isOver ? '2px dashed #1B6EF3' : '1.5px solid #e8e8e8',
                  borderRadius:12, padding:'12px 14px',
                  background: isDragging ? '#e8f0fe' : '#fafafa',
                  display:'flex', alignItems:'center', gap:10,
                  cursor:'grab', opacity: isDragging ? 0.5 : 1,
                  transition:'background 0.1s',
                }}>
                <span style={{ color:'#aaa', fontSize:16, userSelect:'none' }}>⠿</span>
                <input
                  value={cat.emoji} maxLength={2}
                  onChange={e => updateCat(cat.id, 'emoji', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{ width:36, textAlign:'center', fontSize:20, border:'none', background:'transparent' }}
                />
                <input
                  value={cat.label}
                  onChange={e => updateCat(cat.id, 'label', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{ flex:1, fontSize:13, fontWeight:700, border:'none', background:'transparent', color:'#222' }}
                />
                <span style={{ fontSize:11, color:'#aaa' }}>#{cat.sort_order}</span>
                <button onClick={e => { e.stopPropagation(); deleteCat(cat.id) }}
                  style={{ background:'none', border:'none', color:'#e05252', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// TAB 3: 체크리스트 항목 (DB 기반)
// ════════════════════════════════════════════
const PH_ICONS = [
  'ph:heart','ph:star','ph:check-circle','ph:map-pin','ph:calendar',
  'ph:camera','ph:gift','ph:flag','ph:crown','ph:trophy',
  'ph:sparkle','ph:shooting-star','ph:smiley','ph:sun','ph:moon',
  'ph:paw-print','ph:bird','ph:butterfly','ph:horse','ph:bug',
  'ph:fish','ph:fish-simple','ph:shrimp','ph:feather','ph:leaf',
  'ph:tree-palm','ph:island','ph:waves','ph:sun-horizon','ph:rainbow',
  'ph:mountains','ph:lighthouse','ph:anchor','ph:tent','ph:compass',
  'ph:coffee','ph:tea-bag','ph:bread','ph:cake','ph:cookie',
  'ph:egg','ph:drop','ph:drop-half','ph:orange','ph:plant','ph:flower',
  'ph:fork-knife','ph:bowl-food','ph:beer-stein','ph:wine','ph:flame',
  'ph:hamburger','ph:cheese','ph:ice-cream','ph:nut','ph:pepper',
  'ph:shopping-bag','ph:shopping-cart','ph:t-shirt','ph:diamond',
  'ph:boot','ph:wallet','ph:pill','ph:baby',
  'ph:buildings','ph:building','ph:palette','ph:music-note',
  'ph:film-slate','ph:ticket','ph:binoculars','ph:books',
  'ph:graduation-cap','ph:medal','ph:frame-corners','ph:clock','ph:bridge',
  'ph:umbrella','ph:boat','ph:sailboat','ph:airplane','ph:train',
  'ph:bus','ph:car','ph:van','ph:bicycle','ph:backpack','ph:bed',
  'ph:device-mobile','ph:identification-card','ph:certificate',
  'ph:parachute','ph:balloon','ph:guitar','ph:coin','ph:confetti',
  'ph:person-simple','ph:users','ph:house','ph:pencil-simple',
  'ph:storefront','ph:stethoscope','ph:first-aid-kit',
]

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top:0, left:0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const filtered = search ? PH_ICONS.filter(i => i.includes(search)) : PH_ICONS
  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }
  return (
    <div style={{ position:'relative' }}>
      <button ref={btnRef} type="button" onClick={handleOpen} style={{
        width:44, height:38, border:'1.5px solid #e0e0e0', borderRadius:9,
        background:'#fafafa', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon icon={value || 'ph:star'} width={20} height={20} color="#1B6EF3" />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:700 }}/>
          <div style={{
            position:'fixed', top: pos.top, left: pos.left, zIndex:9999,
            background:'#fff', borderRadius:12, padding:12,
            boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
            width:260, maxHeight:300, overflowY:'auto',
          }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="아이콘 검색..."
              style={{ ...inputStyle, marginBottom:10, fontSize:12, padding:'6px 10px' }}
              autoFocus
            />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {filtered.map(ic => (
                <button key={ic} type="button" onClick={() => { onChange(ic); setOpen(false); setSearch('') }}
                  title={ic.replace('ph:','')}
                  style={{
                    width:32, height:32, border: value===ic ? '2px solid #1B6EF3' : '1px solid #eee',
                    borderRadius:6, background: value===ic ? '#eef2fb' : '#fafafa',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                  }}>
                  <Icon icon={ic} width={16} height={16} color={value===ic ? '#1B6EF3' : '#555'} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ItemsTab({ cats, items, setItems }: {
  cats: Cat[]
  items: Item[]
  setItems: (items: Item[]) => void
}) {
  const [selCat, setSelCat] = useState(cats[0]?.id ?? '')
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon]   = useState('ph:star')
  const [toast, setToast]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [dragIdx, setDragIdx]       = useState<number|null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number|null>(null)
  const [editId, setEditId]     = useState<string|null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [businesses, setBusinesses] = useState<{id:string;name:string}[]>([])
  const [newSuburb, setNewSuburb]   = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [newBizIds, setNewBizIds]   = useState<string[]>([])
  const [bizSearch, setBizSearch]   = useState('')
  const [bizFocused, setBizFocused] = useState(false)

  useEffect(() => {
    supabase.from('businesses').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => { if (data) setBusinesses(data) })
  }, [])

  const filteredBiz = businesses
    .filter(b => !newBizIds.includes(b.id) && (!bizSearch || b.name.toLowerCase().includes(bizSearch.toLowerCase())))
    .slice(0, 8)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const catItems = items.filter(i => i.category_id === selCat)

  async function addItem() {
    if (!newLabel.trim()) return
    const id = 'i_' + Date.now()
    const sort_order = catItems.length + 1
    setSaving(true)
    const insertData: any = {
      id, category_id: selCat, label: newLabel.trim(),
      icon: newIcon, sort_order, is_active: true,
    }
    if (newSuburb.trim()) insertData.address = newSuburb.trim()
    if (newDesc.trim()) insertData.description = newDesc.trim()
    if (newBizIds.length > 0) { insertData.related_business_id = newBizIds[0]; insertData.related_business_ids = newBizIds }
    const { error } = await supabase.from('checklist_items').insert(insertData)
    if (!error) {
      setItems([...items, { ...insertData }])
      setNewLabel(''); setNewSuburb(''); setNewDesc(''); setNewBizIds([]); setBizSearch('')
      showToast('항목 추가됨: ' + newLabel)
    } else showToast('오류: ' + error.message)
    setSaving(false)
  }

  async function deleteItem(id: string) {
    if (!confirm('이 항목을 삭제할까요?')) return
    await supabase.from('checklist_items').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
    showToast('항목 삭제됨')
  }

  async function saveLabel(id: string) {
    if (!editLabel.trim()) return
    await supabase.from('checklist_items').update({ label: editLabel.trim() }).eq('id', id)
    setItems(items.map(i => i.id===id ? {...i, label: editLabel.trim()} : i))
    setEditId(null)
    showToast('저장됨')
  }

  async function saveDetail(id: string, field: 'address'|'description', val: string) {
    const value = val.trim() || null
    await supabase.from('checklist_items').update({ [field]: value }).eq('id', id)
    setItems(items.map(i => i.id===id ? {...i, [field]: value} : i))
    showToast('저장됨')
  }

  async function saveRelatedBiz(id: string, ids: string[]) {
    await supabase.from('checklist_items').update({ related_business_ids: ids }).eq('id', id)
    setItems(items.map(i => i.id===id ? {...i, related_business_ids: ids} : i))
    showToast('저장됨')
  }

  async function updateIcon(id: string, icon: string) {
    await supabase.from('checklist_items').update({ icon }).eq('id', id)
    setItems(items.map(i => i.id===id ? {...i, icon} : i))
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('checklist_items').update({ is_active: !current }).eq('id', id)
    setItems(items.map(i => i.id===id ? {...i, is_active: !current} : i))
  }

  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx) }
  function handleDragEnd() { setDragIdx(null); setDragOverIdx(null) }

  async function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return }
    const catIs = [...catItems]
    const [moved] = catIs.splice(dragIdx, 1)
    catIs.splice(toIdx, 0, moved)
    // sort_order 재계산
    const reordered = catIs.map((item, i) => ({ ...item, sort_order: i + 1 }))
    // 전체 items에서 이 카테고리 항목들 교체
    const otherItems = items.filter(i => i.category_id !== selCat)
    setItems([...otherItems, ...reordered])
    setDragIdx(null); setDragOverIdx(null)
    // DB 업데이트
    await Promise.all(reordered.map(item =>
      supabase.from('checklist_items').update({ sort_order: item.sort_order }).eq('id', item.id)
    ))
    showToast('순서 저장됨')
  }

  return (
    <>
      {toast && <Toast msg={toast} />}
      {/* 카테고리 선택 */}
      <Card>
        <SectionTitle>카테고리 선택</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setSelCat(c.id)} style={{
              padding:'8px 14px', borderRadius:10, border:'1.5px solid',
              borderColor: selCat===c.id ? '#1B6EF3' : '#e0e0e0',
              background: selCat===c.id ? '#1B6EF3' : '#fff',
              color: selCat===c.id ? '#fff' : '#444',
              fontWeight:700, fontSize:13, cursor:'pointer',
            }}>
              {c.emoji} {c.label}
              <span style={{ marginLeft:6, opacity:0.7, fontSize:11 }}>
                ({items.filter(i=>i.category_id===c.id).length})
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* 새 항목 추가 */}
      <Card>
        <SectionTitle>새 항목 추가</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {/* 아이콘 + 이름 */}
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <IconPicker value={newIcon} onChange={setNewIcon} />
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addItem()}
              placeholder="버킷리스트 항목 이름 *"
              style={{ ...inputStyle, flex:1 }} />
          </div>
          {/* Suburb */}
          <input value={newSuburb} onChange={e=>setNewSuburb(e.target.value)}
            placeholder="📍 Suburb (선택)"
            style={{ ...inputStyle, fontSize:13 }} />
          {/* 설명 */}
          <input value={newDesc} onChange={e=>setNewDesc(e.target.value)}
            placeholder="📝 한 줄 설명 (선택)"
            style={{ ...inputStyle, fontSize:13 }} />
          {/* 관련업체 검색 — 최대 3개 */}
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {newBizIds.map(id => {
              const biz = businesses.find(b => b.id === id)
              return biz ? (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:6,
                  background:'rgba(27,110,243,0.08)', borderRadius:8, padding:'5px 10px' }}>
                  <span style={{ flex:1, fontSize:12, color:'#1B6EF3', fontWeight:600 }}>🏢 {biz.name}</span>
                  <button onClick={() => setNewBizIds(newBizIds.filter(i => i !== id))}
                    style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:13 }}>✕</button>
                </div>
              ) : null
            })}
            {newBizIds.length < 3 && (
              <div style={{ position:'relative' }}>
                <input
                  value={bizSearch}
                  onChange={e => setBizSearch(e.target.value)}
                  onFocus={() => setBizFocused(true)}
                  onBlur={() => setTimeout(() => setBizFocused(false), 150)}
                  placeholder="🏢 관련업체 검색 (최대 3개)"
                  style={{ ...inputStyle, fontSize:13 }}
                />
                {filteredBiz.length > 0 && bizFocused && (
                  <div style={{
                    position:'absolute', top:'100%', left:0, right:0, zIndex:10,
                    background:'#fff', borderRadius:8, boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
                    border:'1px solid #E2E8F0', overflow:'hidden',
                  }}>
                    {filteredBiz.map(b => (
                      <div key={b.id} onClick={() => { setNewBizIds([...newBizIds, b.id]); setBizSearch('') }}
                        style={{ padding:'9px 12px', fontSize:13, cursor:'pointer', borderBottom:'1px solid #F1F5F9' }}
                        onMouseEnter={e => (e.currentTarget.style.background='#F8FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background='#fff')}
                      >{b.name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={addItem} disabled={saving}
            style={{ ...btnPrimary, padding:'11px', fontSize:13 }}>추가</button>
        </div>
      </Card>

      {/* 항목 목록 */}
      <Card>
        <SectionTitle>항목 목록 ({catItems.length}개) — 드래그로 순서 변경</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {catItems.map((item, idx) => {
            const isDragging = dragIdx === idx
            const isOver = dragOverIdx === idx
            const isEditing = editId === item.id
            return (
              <div key={item.id} style={{ borderRadius:10 }}>
              <div
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                style={{
                  border: isOver ? '2px dashed #1B6EF3' : '1.5px solid #e8e8e8',
                  borderRadius: expandedId === item.id ? '10px 10px 0 0' : 10,
                  padding:'10px 12px',
                  background: isDragging ? '#e8f0fe' : item.is_active ? '#fafafa' : '#f5f5f5',
                  display:'flex', alignItems:'center', gap:8,
                  cursor:'grab', opacity: isDragging ? 0.5 : item.is_active ? 1 : 0.5,
                }}>
                <span style={{ color:'#aaa', fontSize:14, userSelect:'none' }}>⠿</span>
                <IconPicker value={item.icon || 'ph:star'} onChange={icon => updateIcon(item.id, icon)} />
                {isEditing ? (
                  <input
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter') saveLabel(item.id); if(e.key==='Escape') setEditId(null) }}
                    autoFocus
                    style={{ ...inputStyle, flex:1, fontSize:13, padding:'4px 8px' }}
                  />
                ) : (
                  <span
                    onClick={() => { setEditId(item.id); setEditLabel(item.label) }}
                    style={{ flex:1, fontSize:13, color:'#222', cursor:'text' }}
                    title="클릭하여 수정"
                  >{item.label}</span>
                )}
                {isEditing && (
                  <button onClick={() => saveLabel(item.id)}
                    style={{ ...btnPrimary, padding:'4px 10px', fontSize:12 }}>저장</button>
                )}
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  title="상세정보 편집"
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, opacity:0.7, color: expandedId===item.id ? '#1B6EF3' : '#888' }}>
                  ✏️
                </button>
                <button onClick={() => toggleActive(item.id, item.is_active)}
                  title={item.is_active ? '비활성화' : '활성화'}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, opacity:0.7 }}>
                  {item.is_active ? '✅' : '⬜'}
                </button>
                <button onClick={() => deleteItem(item.id)}
                  style={{ background:'none', border:'none', color:'#e05252', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            {/* 상세정보 편집 패널 */}
            {expandedId === item.id && (
              <div style={{
                border:'1px solid #E2E8F0', borderTop:'none',
                borderRadius:'0 0 10px 10px', padding:'12px 14px',
                background:'#F8FAFC', display:'flex', flexDirection:'column', gap:8,
              }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#64748B', fontWeight:600, width:70, flexShrink:0 }}>📍 Suburb</span>
                  <input
                    defaultValue={item.address ?? ''}
                    onBlur={e => saveDetail(item.id, 'address', e.target.value)}
                    placeholder="예: Surry Hills"
                    style={{ ...inputStyle, flex:1, fontSize:12, padding:'5px 8px' }}
                  />
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ fontSize:12, color:'#64748B', fontWeight:600, width:70, flexShrink:0, paddingTop:6 }}>📝 설명</span>
                  <textarea
                    defaultValue={item.description ?? ''}
                    onBlur={e => saveDetail(item.id, 'description', e.target.value)}
                    placeholder="한 줄 설명 (선택)"
                    rows={2}
                    style={{ ...inputStyle, flex:1, fontSize:12, padding:'5px 8px', resize:'vertical' }}
                  />
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ fontSize:12, color:'#64748B', fontWeight:600, width:70, flexShrink:0, paddingTop:6 }}>🏢 관련업체</span>
                  <EditBizMultiSearch
                    businesses={businesses}
                    values={item.related_business_ids ?? (item.related_business_id ? [item.related_business_id] : [])}
                    onChange={ids => saveRelatedBiz(item.id, ids)}
                  />
                </div>
              </div>
            )}
              </div>
            )
          })}
          {catItems.length === 0 && (
            <div style={{ textAlign:'center', color:'#aaa', fontSize:13, padding:'20px 0' }}>
              이 카테고리에 항목이 없어요
            </div>
          )}
        </div>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// SHARED UI COMPONENTS
// ════════════════════════════════════════════
function EditBizMultiSearch({ businesses, values, onChange }: {
  businesses: {id:string;name:string}[]
  values: string[]
  onChange: (ids: string[]) => void
}) {
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const filtered = focused
    ? businesses.filter(b => !values.includes(b.id) && (!search || b.name.toLowerCase().includes(search.toLowerCase()))).slice(0, 8)
    : []
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
      {values.map(id => {
        const biz = businesses.find(b => b.id === id)
        return biz ? (
          <div key={id} style={{ display:'flex', alignItems:'center', gap:6,
            background:'rgba(27,110,243,0.08)', borderRadius:6, padding:'4px 8px' }}>
            <span style={{ flex:1, fontSize:12, color:'#1B6EF3', fontWeight:600 }}>{biz.name}</span>
            <button onMouseDown={() => onChange(values.filter(i => i !== id))}
              style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:12 }}>✕</button>
          </div>
        ) : null
      })}
      {values.length < 3 && (
        <div style={{ position:'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="업체명 검색... (최대 3개)"
            style={{ ...inputStyle, fontSize:12, padding:'5px 8px' }}
          />
          {filtered.length > 0 && focused && (
            <div style={{
              position:'fixed', zIndex:9999,
              background:'#fff', borderRadius:8, boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
              border:'1px solid #E2E8F0', overflow:'hidden',
            }}>
              {filtered.map(b => (
                <div key={b.id}
                  onMouseDown={() => { onChange([...values, b.id]); setSearch('') }}
                  style={{ padding:'8px 12px', fontSize:12, cursor:'pointer', borderBottom:'1px solid #F1F5F9' }}
                  onMouseEnter={e => (e.currentTarget.style.background='#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background='#fff')}
                >{b.name}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditBizSearch({ businesses, value, onChange }: {
  businesses: {id:string;name:string}[]
  value: string
  onChange: (val: string) => void
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const selected = businesses.find(b => b.id === value)
  const filtered = search
    ? businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : []
  return (
    <div style={{ flex:1, position:'relative' }}>
      <div style={{ display:'flex', gap:4 }}>
        <input
          value={selected ? selected.name : search}
          onChange={e => { onChange(''); setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="업체명 검색..."
          style={{ ...inputStyle, flex:1, fontSize:12, padding:'5px 8px' }}
        />
        {value && (
          <button onClick={() => { onChange(''); setSearch(''); setOpen(false) }}
            style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:13 }}>✕</button>
        )}
      </div>
      {open && filtered.length > 0 && !value && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:20,
          background:'#fff', borderRadius:8, boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
          border:'1px solid #E2E8F0', overflow:'hidden',
        }}>
          {filtered.map(b => (
            <div key={b.id}
              onMouseDown={() => { onChange(b.id); setSearch(''); setOpen(false) }}
              style={{ padding:'8px 12px', fontSize:12, cursor:'pointer', borderBottom:'1px solid #F1F5F9' }}
              onMouseEnter={e => (e.currentTarget.style.background='#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background='#fff')}
            >{b.name}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background:'#fff', borderRadius:16, padding:'18px 16px', marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #F1F5F9' }}>{children}</div>
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize:14, fontWeight:800, color:'#0F172A', marginBottom:14, letterSpacing:0.3, ...style }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom:14 }}><div style={{ fontSize:12, fontWeight:800, color:'#1B6EF3', marginBottom:6, letterSpacing:0.3 }}>{label}</div>{children}</div>
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:10 }}>{children}</div>
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position:'fixed', bottom:86, left:'50%', transform:'translateX(-50%)', background:'#1E293B', color:'#fff', padding:'11px 22px', borderRadius:12, fontSize:13, fontWeight:700, zIndex:999, boxShadow:'0 4px 16px rgba(0,0,0,0.2)', whiteSpace:'nowrap' }}>{msg}</div>
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
  width:'100%', minWidth:0, padding:'11px 14px', border:'1.5px solid #E2E8F0', borderRadius:10,
  fontSize:14, color:'#1E293B', outline:'none', boxSizing:'border-box',
  fontFamily:'inherit', display:'block', background:'#fff',
}

const btnPrimary: React.CSSProperties = {
  padding:'11px 20px', borderRadius:10, border:'none', background:'#1B6EF3', color:'#fff',
  fontSize:14, fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
  minHeight:44,
}

const btnGhost: React.CSSProperties = {
  padding:'11px 16px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#fff', color:'#475569',
  fontSize:14, fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
  minHeight:44,
}

const btnSmGhost: React.CSSProperties = {
  padding:'7px 12px', borderRadius:8, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#64748B',
  fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36,
}

const btnSmDanger: React.CSSProperties = {
  padding:'7px 12px', borderRadius:8, border:'none', background:'#FEE2E2', color:'#DC2626',
  fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36,
}

const checkLabel: React.CSSProperties = {
  display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:700, color:'#1B6EF3', cursor:'pointer',
  padding:'8px 0',
}

// ════════════════════════════════════════════
// TAB: 업체 등록 신청 목록
// ════════════════════════════════════════════
type RequestStatus = 'pending' | 'approved' | 'rejected'
type BusinessRequest = {
  id: string
  business_name: string
  category?: string
  address: string
  city?: string
  description: string
  hashtags: string[]
  phone: string | null
  kakao: string | null
  website: string | null
  status: RequestStatus
  created_at: string
}

type EditableRequest = {
  business_name: string
  category: string
  address: string
  city: string
  description: string
  tags: string
  phone: string
  kakao: string
  website: string
}

function RequestsTab() {
  const [requests, setRequests] = useState<BusinessRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<RequestStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editMap, setEditMap]   = useState<Record<string, EditableRequest>>({})

  function getEdit(req: BusinessRequest): EditableRequest {
    if (editMap[req.id]) return editMap[req.id]
    const address = req.city || req.address.split(',').slice(-2,-1)[0]?.trim() || ''
    return {
      business_name: req.business_name,
      category:      req.category || 'restaurant',
      address:       req.address,
      city:          address,
      description:   req.description || '',
      tags:          Array.isArray(req.hashtags) ? req.hashtags.join(', ') : '',
      phone:         req.phone || '',
      kakao:         req.kakao || '',
      website:       req.website || '',
    }
  }

  function setEdit(id: string, field: keyof EditableRequest, val: string) {
    setEditMap(prev => ({
      ...prev,
      [id]: { ...getEdit(requests.find(r => r.id === id)!), ...prev[id], [field]: val }
    }))
  }

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
    const { error: updateError } = await supabase.from('business_requests').update({ status }).eq('id', id)
    if (updateError) {
      alert(`상태 변경 실패:\n${updateError.message}\n\n(business_requests 테이블에 status 컬럼이 있는지 확인해주세요)`)
      return
    }
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r))

    // 승인 시 businesses 테이블에 자동 등록 (editMap 수정 내용 반영)
    if (status === 'approved') {
      const req = requests.find(r => r.id === id)
      if (req) {
        const ed = editMap[id] || getEdit(req)
        const tags = ed.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        const { error } = await (await import('../lib/supabase')).supabase
          .from('businesses')
          .insert({
            id:          crypto.randomUUID(),
            name:        ed.business_name,
            category:    ed.category || 'restaurant',
            description: ed.description,
            phone:       ed.phone    || null,
            website:     ed.website  || null,
            kakao:       ed.kakao    || null,
            address:     ed.address,
            city:        ed.city || ed.address.split(',').slice(-2,-1)[0]?.trim() || '',
            tags:        tags,
            is_featured: false,
            is_active:   true,
          })
        if (error) {
          alert(`승인됐지만 업체 등록 중 오류가 발생했어요:\n${error.message}`)
        } else {
          alert(`✅ "${ed.business_name}" 업체가 등록됐어요!`)
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
        <div style={{ fontSize:16, fontWeight:900, color:'#0F172A' }}>업체 등록 신청</div>
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

              {/* 상세 - 편집 가능 폼 */}
              {expanded === req.id && (() => {
                const ed = editMap[req.id] || getEdit(req)
                const fld = (label: string, field: keyof EditableRequest, opts?: { type?: string; placeholder?: string }) => (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:'#1B6EF3', marginBottom:4 }}>{label}</div>
                    <input
                      value={ed[field] as string}
                      onChange={e => setEdit(req.id, field, e.target.value)}
                      type={opts?.type || 'text'}
                      placeholder={opts?.placeholder || ''}
                      style={{ ...inputStyle, fontSize:13, padding:'8px 10px' }}
                    />
                  </div>
                )
                return (
                <div style={{ borderTop:'1px solid #F1F5F9', padding:'14px 16px', background:'#F8FAFF' }}>
                  {/* 업체명 + 카테고리 */}
                  {fld('업체명 *', 'business_name')}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:'#1B6EF3', marginBottom:4 }}>카테고리</div>
                    <select value={ed.category} onChange={e => setEdit(req.id, 'category', e.target.value)} style={{ ...inputStyle, fontSize:13, padding:'8px 10px' }}>
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                      ))}
                    </select>
                  </div>
                  {fld('주소', 'address', { placeholder: '123 George St, Sydney NSW 2000' })}
                  {fld('Suburb / City', 'city', { placeholder: 'Sydney' })}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:'#1B6EF3', marginBottom:4 }}>설명</div>
                    <textarea
                      value={ed.description}
                      onChange={e => setEdit(req.id, 'description', e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, fontSize:13, padding:'8px 10px', resize:'none' }}
                    />
                  </div>
                  {fld('태그 (쉼표 구분)', 'tags', { placeholder: '부동산, 투자, 컨설팅' })}
                  {fld('전화번호', 'phone', { placeholder: '+61 2 1234 5678' })}
                  {fld('카카오 ID', 'kakao')}
                  {fld('웹사이트', 'website', { placeholder: 'https://...' })}
                  {/* 액션 버튼 */}
                  <div style={{ display:'flex', gap:8, marginTop:14 }}>
                    {req.status !== 'approved' && (
                      <button onClick={() => updateStatus(req.id, 'approved')} style={{
                        flex:1, height:44, border:'none', borderRadius:10,
                        background:'#16A34A', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
                      }}>✓ 수정 후 승인</button>
                    )}
                    {req.status !== 'rejected' && (
                      <button onClick={() => updateStatus(req.id, 'rejected')} style={{
                        flex:1, height:44, border:'none', borderRadius:10,
                        background:'#FEE2E2', color:'#EF4444', fontSize:13, fontWeight:700, cursor:'pointer',
                      }}>✕ 거절</button>
                    )}
                    {req.status !== 'pending' && (
                      <button onClick={() => updateStatus(req.id, 'pending')} style={{
                        ...btnSmGhost, flex:1, height:44, borderRadius:10, fontSize:13,
                      }}>대기로 되돌리기</button>
                    )}
                    <button onClick={() => deleteRequest(req.id)} style={{
                      width:38, height:38, border:'none', borderRadius:8,
                      background:'#FEE2E2', color:'#EF4444', fontSize:16, cursor:'pointer', flexShrink:0,
                    }}>🗑</button>
                  </div>
                </div>
                )})()}
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
          <div style={{ fontSize:16, fontWeight:900, color:'#0F172A' }}>버킷리스트 추천</div>
          <div style={{ fontSize:12, color:'#94A3B8', marginTop:2 }}>검토 후 체크리스트에 추가해주세요</div>
        </div>
        <button onClick={loadSuggestions} style={{ ...btnSmGhost, display:'flex', alignItems:'center', gap:4 }}>
          <Icon icon="ph:arrow-clockwise" width={13} height={13} /> 새로고침
        </button>
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

// ════════════════════════════════════════════
// TAB 6: 커뮤니티 관리
// ════════════════════════════════════════════
interface CommunityPost {
  id: string
  text: string
  author_id: string
  likes: number
  created_at: string
  comments?: { id: string; text: string; author_id: string; created_at: string }[]
}

function CommunityTab() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmCommentId, setConfirmCommentId] = useState<{postId:string; commentId:string} | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    const { data: postsData } = await supabase
      .from('community_posts').select('*').order('created_at', { ascending: false })
    if (!postsData) { setLoading(false); return }

    const { data: commentsData } = await supabase
      .from('community_comments').select('*').in('post_id', postsData.map(p => p.id)).order('created_at', { ascending: true })
    const { data: likesData } = await supabase
      .from('community_likes').select('post_id').in('post_id', postsData.map(p => p.id))

    const commentsByPost: Record<string, any[]> = {}
    commentsData?.forEach(c => {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = []
      commentsByPost[c.post_id].push(c)
    })
    const likeCount: Record<string, number> = {}
    likesData?.forEach(l => { likeCount[l.post_id] = (likeCount[l.post_id] ?? 0) + 1 })

    setPosts(postsData.map(p => ({ ...p, likes: likeCount[p.id] ?? 0, comments: commentsByPost[p.id] ?? [] })))
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const deletePost = async (id: string) => {
    await supabase.from('community_posts').delete().eq('id', id)
    setConfirmId(null)
    await fetchAll()
  }

  const deleteComment = async (commentId: string) => {
    await supabase.from('community_comments').delete().eq('id', commentId)
    setConfirmCommentId(null)
    await fetchAll()
  }

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return '방금 전'
    if (m < 60) return `${m}분 전`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}시간 전`
    return `${Math.floor(h / 24)}일 전`
  }

  if (loading) return <div style={{ padding:32, textAlign:'center', color:'#aaa' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ fontSize:13, fontWeight:700, color:'#1E293B', marginBottom:12 }}>
        커뮤니티 게시글 관리 <span style={{ color:'#94A3B8', fontWeight:500 }}>({posts.length}개)</span>
      </div>

      {posts.map(post => (
        <div key={post.id} style={{
          background:'#fff', borderRadius:12, marginBottom:10,
          border:'1px solid #E2E8F0', overflow:'hidden',
        }}>
          {/* 글 헤더 */}
          <div style={{ padding:'12px 14px' }}>
            <div style={{ fontSize:13, color:'#1E293B', lineHeight:1.6, marginBottom:8 }}>
              {post.text}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11, color:'#94A3B8' }}>{timeAgo(post.created_at)}</span>
              <span style={{ fontSize:11, color:'#94A3B8' }}>❤️ {post.likes}</span>
              <button onClick={() => setExpandedId(expandedId === post.id ? null : post.id)} style={{
                fontSize:11, color:'#1B6EF3', background:'none', border:'none', cursor:'pointer', padding:0,
              }}>
                💬 댓글 {post.comments?.length ?? 0}개
              </button>
              <div style={{ flex:1 }} />
              <button onClick={() => setConfirmId(post.id)} style={{
                fontSize:11, color:'#DC2626', background:'#FFF5F5',
                border:'1px solid #FECDD3', borderRadius:6,
                padding:'3px 10px', cursor:'pointer', fontWeight:600,
              }}>삭제</button>
            </div>
          </div>

          {/* 댓글 목록 */}
          {expandedId === post.id && (post.comments?.length ?? 0) > 0 && (
            <div style={{ borderTop:'1px solid #F1F5F9', background:'#F8FAFC', padding:'10px 14px' }}>
              {post.comments!.map(c => (
                <div key={c.id} style={{
                  display:'flex', gap:8, alignItems:'flex-start', marginBottom:8,
                }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#CBD5E1', marginTop:6, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:'#334155', lineHeight:1.5 }}>{c.text}</div>
                    <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>{timeAgo(c.created_at)}</div>
                  </div>
                  <button onClick={() => setConfirmCommentId({ postId: post.id, commentId: c.id })} style={{
                    fontSize:10, color:'#DC2626', background:'none',
                    border:'none', cursor:'pointer', padding:'2px 4px', flexShrink:0,
                  }}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 글 삭제 확인 모달 */}
      {confirmId && (
        <>
          <div onClick={() => setConfirmId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:900 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background:'#fff', borderRadius:14, padding:'24px 20px',
            zIndex:901, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
          }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🗑️</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:6 }}>게시글을 삭제할까요?</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:20 }}>댓글도 함께 삭제됩니다.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmId(null)} style={{
                flex:1, height:44, border:'1px solid #E2E8F0', borderRadius:8,
                background:'#fff', color:'#64748B', fontWeight:600, fontSize:13, cursor:'pointer',
              }}>취소</button>
              <button onClick={() => deletePost(confirmId)} style={{
                flex:2, height:44, border:'none', borderRadius:8,
                background:'#DC2626', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer',
              }}>삭제하기</button>
            </div>
          </div>
        </>
      )}

      {/* 댓글 삭제 확인 모달 */}
      {confirmCommentId && (
        <>
          <div onClick={() => setConfirmCommentId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:900 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background:'#fff', borderRadius:14, padding:'24px 20px',
            zIndex:901, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
          }}>
            <div style={{ fontSize:28, marginBottom:8 }}>💬</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:6 }}>댓글을 삭제할까요?</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:20 }}>삭제된 댓글은 복구되지 않습니다.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmCommentId(null)} style={{
                flex:1, height:44, border:'1px solid #E2E8F0', borderRadius:8,
                background:'#fff', color:'#64748B', fontWeight:600, fontSize:13, cursor:'pointer',
              }}>취소</button>
              <button onClick={() => deleteComment(confirmCommentId.commentId)} style={{
                flex:2, height:44, border:'none', borderRadius:8,
                background:'#DC2626', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer',
              }}>삭제하기</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// TAB 7: 쇼핑 상품 관리
// ════════════════════════════════════════════
interface ShopCat  { id: number; name: string; emoji: string; sort_order: number; is_active: boolean }
interface ShopProd {
  id: string; category_id: number; name: string; brand: string
  description: string; price_range: string; where_to_buy: string[]
  tags: string[]; image_url: string | null; is_active: boolean; is_featured: boolean; sort_order: number
}

const EMPTY_PROD: Omit<ShopProd,'id'> = {
  category_id: 0, name: '', brand: '', description: '',
  price_range: '$', where_to_buy: [], tags: [],
  image_url: null, is_active: true, is_featured: false, sort_order: 0,
}

function ShoppingTab() {
  const [cats, setCats]       = useState<ShopCat[]>([])
  const [prods, setProds]     = useState<ShopProd[]>([])
  const [loading, setLoading] = useState(true)
  const [selCat, setSelCat]   = useState<number|null>(null)
  const [view, setView]       = useState<'list'|'form'>('list')
  const [editing, setEditing] = useState<ShopProd|null>(null)
  const [form, setForm]       = useState<Omit<ShopProd,'id'>>(EMPTY_PROD)
  const [imgFile, setImgFile] = useState<File|null>(null)
  const [imgPreview, setImgPreview] = useState<string|null>(null)
  const [saving, setSaving]   = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('shopping_categories').select('*').order('sort_order'),
      supabase.from('shopping_products').select('*').order('sort_order'),
    ])
    setCats(c ?? [])
    setProds(p ?? [])
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const filtered = selCat ? prods.filter(p => p.category_id === selCat) : prods

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_PROD, category_id: selCat ?? cats[0]?.id ?? 0 })
    setImgFile(null); setImgPreview(null)
    setView('form')
  }

  const openEdit = (p: ShopProd) => {
    setEditing(p)
    setForm({ category_id:p.category_id, name:p.name, brand:p.brand, description:p.description,
      price_range:p.price_range, where_to_buy:p.where_to_buy, tags:p.tags,
      image_url:p.image_url, is_active:p.is_active, is_featured:p.is_featured, sort_order:p.sort_order })
    setImgPreview(p.image_url)
    setImgFile(null)
    setView('form')
  }

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    let imageUrl = form.image_url

    if (imgFile) {
      const ext  = imgFile.name.split('.').pop()
      const path = `products/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('shopping-images').upload(path, imgFile, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('shopping-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    const payload = { ...form, image_url: imageUrl }
    if (editing) {
      await supabase.from('shopping_products').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('shopping_products').insert(payload)
    }
    setSaving(false)
    setView('list')
    await fetchAll()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('shopping_products').delete().eq('id', id)
    setDeleteId(null)
    await fetchAll()
  }

  const inputStyle = {
    width:'100%', padding:'9px 10px', borderRadius:8,
    border:'1px solid #E2E8F0', fontSize:13, color:'#1E293B',
    fontFamily:'inherit', boxSizing:'border-box' as const, outline:'none',
  }
  const labelStyle = { fontSize:11, fontWeight:700, color:'#64748B', display:'block' as const, marginBottom:4 }

  if (loading) return <div style={{padding:32,textAlign:'center',color:'#aaa'}}>불러오는 중...</div>

  if (view === 'form') return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <button onClick={() => setView('list')} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <Icon icon="ph:arrow-left" width={20} height={20} color="#475569" />
        </button>
        <div style={{ fontSize:15, fontWeight:800, color:'#1E293B' }}>
          {editing ? '상품 수정' : '새 상품 추가'}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {/* 이미지 */}
        <div>
          <span style={labelStyle}>상품 이미지</span>
          <label style={{ cursor:'pointer', display:'block' }}>
            <div style={{
              width:'100%', height:160, borderRadius:10, overflow:'hidden',
              background: imgPreview ? 'none' : '#F1F5F9',
              border:'2px dashed #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {imgPreview
                ? <img src={imgPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <div style={{ textAlign:'center', color:'#94A3B8' }}>
                    <Icon icon="ph:camera-plus" width={28} height={28} color="#CBD5E1" />
                    <div style={{ fontSize:11, marginTop:4 }}>이미지 업로드</div>
                  </div>
              }
            </div>
            <input type="file" accept="image/*" onChange={handleImgChange} style={{ display:'none' }} />
          </label>
        </div>

        {/* 카테고리 */}
        <div>
          <span style={labelStyle}>카테고리</span>
          <select value={form.category_id} onChange={e => setForm(f => ({...f, category_id: Number(e.target.value)}))} style={inputStyle}>
            {cats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>

        {/* 상품명 */}
        <div>
          <span style={labelStyle}>상품명 *</span>
          <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} style={inputStyle} placeholder="상품명 입력" />
        </div>

        {/* 브랜드 */}
        <div>
          <span style={labelStyle}>브랜드</span>
          <input value={form.brand} onChange={e => setForm(f => ({...f, brand:e.target.value}))} style={inputStyle} placeholder="브랜드명" />
        </div>

        {/* 설명 */}
        <div>
          <span style={labelStyle}>설명</span>
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
            style={{...inputStyle, height:200, resize:'vertical'}} placeholder="상품 설명" />
        </div>

        {/* 가격대 */}
        <div>
          <span style={labelStyle}>가격대</span>
          <div style={{ display:'flex', gap:8 }}>
            {(['$','$$','$$$'] as const).map(p => (
              <button key={p} onClick={() => setForm(f => ({...f, price_range:p}))} style={{
                flex:1, height:38, borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
                background: form.price_range === p ? '#1B6EF3' : '#F1F5F9',
                color: form.price_range === p ? '#fff' : '#475569',
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* 구매처 */}
        <div>
          <span style={labelStyle}>구매처 (쉼표로 구분)</span>
          <input
            value={form.where_to_buy.join(', ')}
            onChange={e => setForm(f => ({...f, where_to_buy: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}))}
            style={inputStyle} placeholder="Chemist Warehouse, Woolworths"
          />
        </div>

        {/* 태그 */}
        <div>
          <span style={labelStyle}>태그 (쉼표로 구분)</span>
          <input
            value={form.tags.join(', ')}
            onChange={e => setForm(f => ({...f, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}))}
            style={inputStyle} placeholder="인기, 강추, 선물용"
          />
        </div>

        {/* 옵션 */}
        <div style={{ display:'flex', gap:12 }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:'#475569' }}>
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({...f, is_featured:e.target.checked}))} />
            ⭐ 추천 상품
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:'#475569' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active:e.target.checked}))} />
            노출
          </label>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          width:'100%', height:50, borderRadius:12, border:'none',
          background: saving ? '#94A3B8' : '#1B6EF3', color:'#fff',
          fontSize:15, fontWeight:700, cursor: saving ? 'default' : 'pointer',
        }}>{saving ? '저장 중...' : '저장하기'}</button>
      </div>
    </div>
  )

  return (
    <div>
      {/* 카테고리 필터 */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:12, paddingBottom:2 }}>
        <button onClick={() => setSelCat(null)} style={{
          flexShrink:0, height:30, padding:'0 12px', borderRadius:15, border:'none', cursor:'pointer', fontSize:11, fontWeight:700,
          background: selCat===null ? '#1B6EF3' : '#F1F5F9', color: selCat===null ? '#fff' : '#475569',
        }}>전체</button>
        {cats.map(c => (
          <button key={c.id} onClick={() => setSelCat(c.id)} style={{
            flexShrink:0, height:30, padding:'0 12px', borderRadius:15, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, whiteSpace:'nowrap',
            background: selCat===c.id ? '#1B6EF3' : '#F1F5F9', color: selCat===c.id ? '#fff' : '#475569',
          }}>{c.emoji} {c.name}</button>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>상품 <span style={{ color:'#94A3B8', fontWeight:500 }}>({filtered.length}개)</span></div>
        <button onClick={openNew} style={{
          display:'flex', alignItems:'center', gap:4, height:34, padding:'0 12px', borderRadius:8,
          background:'#1B6EF3', border:'none', cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700,
        }}>
          <Icon icon="ph:plus" width={14} height={14} color="#fff" />새 상품
        </button>
      </div>

      {filtered.map(p => (
        <div key={p.id} style={{
          background:'#fff', borderRadius:12, padding:'12px 14px',
          border:'1px solid #E2E8F0', marginBottom:8,
          display:'flex', gap:12, alignItems:'center',
        }}>
          {/* 썸네일 */}
          <div style={{
            width:52, height:52, borderRadius:8, flexShrink:0, overflow:'hidden',
            background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            {p.image_url
              ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <Icon icon="ph:shopping-bag" width={20} height={20} color="#CBD5E1" />
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>{p.name}</span>
              {p.is_featured && <span style={{ fontSize:9, background:'#FEF3C7', color:'#D97706', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>추천</span>}
              {!p.is_active && <span style={{ fontSize:9, background:'#F1F5F9', color:'#94A3B8', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>비노출</span>}
            </div>
            <div style={{ fontSize:11, color:'#94A3B8' }}>{p.brand} · {p.price_range} · {cats.find(c=>c.id===p.category_id)?.name}</div>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={() => openEdit(p)} style={{ background:'#F1F5F9', border:'none', borderRadius:7, padding:'6px 10px', cursor:'pointer', fontSize:11, fontWeight:600, color:'#475569' }}>수정</button>
            <button onClick={() => setDeleteId(p.id)} style={{ background:'#FFF5F5', border:'1px solid #FECDD3', borderRadius:7, padding:'6px 10px', cursor:'pointer', fontSize:11, fontWeight:600, color:'#DC2626' }}>삭제</button>
          </div>
        </div>
      ))}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <>
          <div onClick={() => setDeleteId(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:900 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            background:'#fff', borderRadius:14, padding:'24px 20px',
            zIndex:901, width:'calc(100% - 48px)', maxWidth:300, textAlign:'center',
          }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🗑️</div>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>상품을 삭제할까요?</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:20 }}>삭제된 상품은 복구되지 않아요.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex:1, height:44, border:'1px solid #E2E8F0', borderRadius:8, background:'#fff', color:'#64748B', fontWeight:600, fontSize:13, cursor:'pointer' }}>취소</button>
              <button onClick={() => handleDelete(deleteId)} style={{ flex:2, height:44, border:'none', borderRadius:8, background:'#DC2626', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>삭제하기</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── 빙고 탭
function BingoTab() {
  const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
  type BingoCafe = { id: string; city: string; sort_order: number; name: string; business_id: string | null; is_active: boolean }
  type Business  = { id: string; name: string }

  const [cafes, setCafes]           = useState<BingoCafe[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [city, setCity]             = useState<'melbourne'|'sydney'>('melbourne')
  const [saving, setSaving]         = useState<string | null>(null)
  const [editName, setEditName]     = useState<Record<string, string>>({})
  const [bizSearch, setBizSearch]   = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const [{ data: cafeData }, { data: bizData }] = await Promise.all([
        supabase.from('bingo_cafes').select('*').order('city').order('sort_order'),
        supabase.from('businesses').select('id, name').eq('is_active', true).order('name'),
      ])
      if (cafeData) setCafes(cafeData)
      if (bizData)  setBusinesses(bizData)
      setLoading(false)
    }
    load()
  }, [])

  const handleBusinessLink = async (cafeId: string, businessId: string) => {
    setSaving(cafeId)
    const val = businessId === '' ? null : businessId
    await supabase.from('bingo_cafes').update({ business_id: val }).eq('id', cafeId)
    setCafes(prev => prev.map(c => c.id === cafeId ? { ...c, business_id: val } : c))
    setSaving(null)
  }

  const handleNameSave = async (cafeId: string) => {
    const newName = editName[cafeId]?.trim()
    if (!newName) return
    setSaving(cafeId)
    await supabase.from('bingo_cafes').update({ name: newName }).eq('id', cafeId)
    setCafes(prev => prev.map(c => c.id === cafeId ? { ...c, name: newName } : c))
    setEditName(prev => { const n = { ...prev }; delete n[cafeId]; return n })
    setSaving(null)
  }

  const filtered = cafes.filter(c => c.city === city)

  if (loading) return (
    <div style={{ textAlign:'center', padding:40, color:'#94A3B8', fontFamily:ff }}>불러오는 중...</div>
  )

  return (
    <div style={{ fontFamily: ff }}>
      {/* 도시 탭 */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {(['melbourne', 'sydney'] as const).map(c => (
          <button key={c} onClick={() => setCity(c)} style={{
            height:34, padding:'0 16px', borderRadius:20, border:'none', cursor:'pointer',
            background: city === c ? '#1B6EF3' : '#F1F5F9',
            color: city === c ? '#fff' : '#475569',
            fontSize:13, fontWeight:700,
          }}>{c === 'melbourne' ? '멜번' : '시드니'}</button>
        ))}
      </div>

      {/* 카페 리스트 */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.map(cafe => (
          <div key={cafe.id} style={{
            background:'#fff', borderRadius:12, padding:'12px 14px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
            border:'1px solid #F1F5F9',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              {/* 번호 */}
              <div style={{
                width:28, height:28, borderRadius:8, background:'#EFF6FF',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800, color:'#1B6EF3', flexShrink:0,
              }}>{cafe.sort_order}</div>
              {/* 이름 편집 */}
              <input
                value={editName[cafe.id] ?? cafe.name}
                onChange={e => setEditName(prev => ({ ...prev, [cafe.id]: e.target.value }))}
                style={{
                  flex:1, height:32, border:'1px solid #E2E8F0', borderRadius:8,
                  padding:'0 10px', fontSize:13, fontWeight:700, color:'#0F172A',
                  background:'#F8FAFC', fontFamily:ff,
                }}
              />
              {/* 저장 버튼 - 수정된 경우에만 표시 */}
              {editName[cafe.id] !== undefined && editName[cafe.id] !== cafe.name && (
                <button
                  onClick={() => handleNameSave(cafe.id)}
                  disabled={saving === cafe.id}
                  style={{
                    height:32, padding:'0 10px', borderRadius:8, border:'none',
                    background:'#1B6EF3', color:'#fff', fontSize:12, fontWeight:700,
                    cursor:'pointer', flexShrink:0,
                  }}
                >{saving === cafe.id ? '...' : '저장'}</button>
              )}
            </div>
            {/* 업체 연결 */}
            <div>
              {/* 현재 연결된 업체 + 해제 버튼 */}
              {cafe.business_id ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, padding:'6px 10px', background:'#DCFCE7', borderRadius:8 }}>
                  <div style={{ fontSize:12, color:'#16A34A', fontWeight:700 }}>
                    ✓ {businesses.find(b => b.id === cafe.business_id)?.name ?? '연결됨'}
                  </div>
                  <button
                    onClick={() => { handleBusinessLink(cafe.id, ''); setBizSearch(prev => ({ ...prev, [cafe.id]: '' })) }}
                    disabled={saving === cafe.id}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:11, fontWeight:700 }}
                  >연결 해제</button>
                </div>
              ) : (
                <div style={{ fontSize:11, color:'#94A3B8', marginBottom:6 }}>업체 미연결</div>
              )}
              {/* 검색 input */}
              <input
                value={bizSearch[cafe.id] ?? ''}
                onChange={e => setBizSearch(prev => ({ ...prev, [cafe.id]: e.target.value }))}
                placeholder="업체 검색..."
                style={{
                  width:'100%', height:34, borderRadius:8,
                  border:'1px solid #E2E8F0', padding:'0 10px',
                  fontSize:12, color:'#1E293B', background:'#F8FAFC',
                  fontFamily:ff, boxSizing:'border-box',
                }}
              />
              {/* 검색 결과 */}
              {bizSearch[cafe.id]?.trim() && (
                <div style={{ border:'1px solid #E2E8F0', borderRadius:8, marginTop:4, maxHeight:160, overflowY:'auto', background:'#fff' }}>
                  {businesses
                    .filter(b => b.name.toLowerCase().includes((bizSearch[cafe.id] ?? '').toLowerCase()))
                    .map(b => (
                      <div
                        key={b.id}
                        onClick={() => { handleBusinessLink(cafe.id, b.id); setBizSearch(prev => ({ ...prev, [cafe.id]: '' })) }}
                        style={{
                          padding:'8px 12px', fontSize:12, color:'#1E293B', cursor:'pointer',
                          borderBottom:'1px solid #F1F5F9',
                          background: cafe.business_id === b.id ? '#EFF6FF' : '#fff',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
                        onMouseLeave={e => (e.currentTarget.style.background = cafe.business_id === b.id ? '#EFF6FF' : '#fff')}
                      >{b.name}</div>
                    ))
                  }
                  {businesses.filter(b => b.name.toLowerCase().includes((bizSearch[cafe.id] ?? '').toLowerCase())).length === 0 && (
                    <div style={{ padding:'10px 12px', fontSize:12, color:'#94A3B8' }}>검색 결과 없음</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 구글 Place ID 자동 매핑 탭
function GoogleMappingTab() {
  const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
  const [running, setRunning]   = useState(false)
  const [results, setResults]   = useState<{ id: string; name: string; place_id: string | null; status: string }[]>([])
  const [total, setTotal]       = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const handleRun = async () => {
    setRunning(true)
    setResults([])
    setError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-google-places`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      )
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error(`응답 파싱 실패: ${text}`) }
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      if (data.error) throw new Error(data.error)
      setTotal(data.total ?? 0)
      setRemaining(data.remaining ?? 0)
      setResults(prev => [...prev, ...(Array.isArray(data.results) ? data.results : [])])
    } catch (e: any) {
      setError(String(e?.message ?? e))
    }
    setRunning(false)
  }

  const matched   = results.filter(r => r.place_id).length
  const unmatched = results.filter(r => !r.place_id).length

  return (
    <div style={{ fontFamily: ff }}>
      <div style={{ background:'#EFF6FF', borderRadius:12, padding:'14px 16px', marginBottom:16, fontSize:13, color:'#1E293B', lineHeight:1.7 }}>
        <div style={{ fontWeight:800, color:'#1B6EF3', marginBottom:4 }}>🔍 구글 Place ID 자동 매핑</div>
        google_place_id가 없는 업체를 Google Places API로 자동 매핑합니다.<br />
        업체명 + 주소로 검색하며, 찾지 못한 업체는 수동으로 입력해 주세요.
      </div>

      <button
        onClick={handleRun}
        disabled={running}
        style={{
          width:'100%', height:48, borderRadius:12, border:'none',
          background: running ? '#94A3B8' : '#1B6EF3',
          color:'#fff', fontSize:15, fontWeight:700,
          cursor: running ? 'default' : 'pointer',
          marginBottom:16,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}
      >
        {running ? '매핑 중... (잠시 기다려 주세요)' : remaining !== null && remaining > 0 ? `🚀 다음 20개 매핑 (${remaining}개 남음)` : '🚀 자동 매핑 시작'}
      </button>

      {error && (
        <div style={{ background:'#FEE2E2', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:13, color:'#DC2626' }}>
          ❌ 오류: {error}
        </div>
      )}

      {total !== null && (
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <div style={{ flex:1, background:'#DCFCE7', borderRadius:10, padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#16A34A' }}>{matched}</div>
            <div style={{ fontSize:12, color:'#16A34A', fontWeight:600 }}>매핑 완료</div>
          </div>
          <div style={{ flex:1, background:'#FEE2E2', borderRadius:10, padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#DC2626' }}>{unmatched}</div>
            <div style={{ fontSize:12, color:'#DC2626', fontWeight:600 }}>찾지 못함</div>
          </div>
          <div style={{ flex:1, background:'#F1F5F9', borderRadius:10, padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#475569' }}>{total}</div>
            <div style={{ fontSize:12, color:'#475569', fontWeight:600 }}>전체</div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {results.map(r => (
            <div key={r.id} style={{
              background:'#fff', borderRadius:10, padding:'10px 14px',
              border:`1px solid ${r.place_id ? '#DCFCE7' : '#FEE2E2'}`,
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{r.name}</div>
                {r.place_id && <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{r.place_id}</div>}
              </div>
              <div style={{ fontSize:12, fontWeight:700, color: r.place_id ? '#16A34A' : '#DC2626', flexShrink:0 }}>
                {r.status}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 별점 업데이트 섹션 */}
      <RatingUpdateSection ff={ff} />
    </div>
  )
}

function RatingUpdateSection({ ff }: { ff: string }) {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<{ name: string; rating: number | null; status: string }[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-google-ratings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      )
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error(`응답 파싱 실패: ${text}`) }
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setRemaining(data.remaining ?? 0)
      setResults(prev => [...prev, ...(Array.isArray(data.results) ? data.results : [])])
    } catch (e: any) {
      setError(String(e?.message ?? e))
    }
    setRunning(false)
  }

  const updated = results.filter(r => r.rating !== null).length
  const failed  = results.filter(r => r.rating === null).length

  return (
    <div style={{ marginTop:24, fontFamily: ff }}>
      <div style={{ background:'#FFF7ED', borderRadius:12, padding:'14px 16px', marginBottom:16, fontSize:13, color:'#1E293B', lineHeight:1.7 }}>
        <div style={{ fontWeight:800, color:'#D97706', marginBottom:4 }}>⭐ 구글 별점 업데이트</div>
        google_place_id가 없는 업체의 별점을 가져옵니다.<br />
        100개씩 처리되며, 매일 오전 9시에 자동 업데이트됩니다.
      </div>

      <button
        onClick={handleRun}
        disabled={running}
        style={{
          width:'100%', height:48, borderRadius:12, border:'none',
          background: running ? '#94A3B8' : '#FFB800',
          color:'#fff', fontSize:15, fontWeight:700,
          cursor: running ? 'default' : 'pointer',
          marginBottom:16,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}
      >
        {running ? '업데이트 중...' : remaining !== null && remaining > 0 ? `⭐ 다음 100개 업데이트 (${remaining}개 남음)` : '⭐ 별점 업데이트 시작'}
      </button>

      {error && (
        <div style={{ background:'#FEE2E2', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:13, color:'#DC2626' }}>
          ❌ 오류: {error}
        </div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <div style={{ flex:1, background:'#DCFCE7', borderRadius:10, padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:'#16A34A' }}>{updated}</div>
              <div style={{ fontSize:11, color:'#16A34A', fontWeight:600 }}>업데이트 완료</div>
            </div>
            <div style={{ flex:1, background:'#FEE2E2', borderRadius:10, padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:'#DC2626' }}>{failed}</div>
              <div style={{ fontSize:11, color:'#DC2626', fontWeight:600 }}>실패</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                background:'#fff', borderRadius:10, padding:'10px 14px',
                border:`1px solid ${r.rating !== null ? '#DCFCE7' : '#FEE2E2'}`,
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{r.name}</div>
                <div style={{ fontSize:12, fontWeight:700, color: r.rating !== null ? '#16A34A' : '#DC2626' }}>
                  {r.rating !== null ? `⭐ ${r.rating}` : r.status}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
