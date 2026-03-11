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
type MainTab = 'business' | 'categories' | 'items' | 'requests' | 'suggestions'

// ── 탭 메타
const TAB_META: { id: MainTab; icon: string; label: string }[] = [
  { id:'business',    icon:'ph:buildings',         label:'업체' },
  { id:'requests',    icon:'ph:envelope-open',      label:'신청' },
  { id:'suggestions', icon:'ph:lightbulb',          label:'추천' },
  { id:'categories',  icon:'ph:folder-open',        label:'카테고리' },
  { id:'items',       icon:'ph:list-checks',        label:'체크리스트' },
]


// ── 업체 폼 초기값
const EMPTY_FORM = {
  id:'', name:'', category:'realestate', description:'',
  phone:'', website:'', kakao:'', address:'', city:'',
  is_featured:false, is_active:true, tags:'',
}

// ── 체크리스트 타입 (DB 기반)
type Cat  = { id:string; label:string; emoji:string; sort_order:number }
type Item = { id:string; category_id:string; label:string; icon:string|null; sort_order:number; is_active:boolean; suburb?:string|null; description?:string|null; related_business_id?:string|null }

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
    if (!form.name) { showToast('업체명은 필수예요'); return }
    setSaving(true)
    // city가 없으면 address에서 suburb 추출해서 채우기
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
  const filtered = search ? PH_ICONS.filter(i => i.includes(search)) : PH_ICONS
  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width:44, height:38, border:'1.5px solid #e0e0e0', borderRadius:9,
        background:'#fafafa', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon icon={value || 'ph:star'} width={20} height={20} color="#1B6EF3" />
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

  useEffect(() => {
    supabase.from('businesses').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => { if (data) setBusinesses(data) })
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const catItems = items.filter(i => i.category_id === selCat)

  async function addItem() {
    if (!newLabel.trim()) return
    const id = 'i_' + Date.now()
    const sort_order = catItems.length + 1
    setSaving(true)
    const { error } = await supabase.from('checklist_items').insert({
      id, category_id: selCat, label: newLabel.trim(),
      icon: newIcon, sort_order, is_active: true,
    })
    if (!error) {
      setItems([...items, { id, category_id: selCat, label: newLabel.trim(), icon: newIcon, sort_order, is_active: true }])
      setNewLabel('')
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

  async function saveDetail(id: string, field: 'suburb'|'description'|'related_business_id', val: string) {
    const value = val.trim() || null
    await supabase.from('checklist_items').update({ [field]: value }).eq('id', id)
    setItems(items.map(i => i.id===id ? {...i, [field]: value} : i))
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
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <IconPicker value={newIcon} onChange={setNewIcon} />
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addItem()}
            placeholder="버킷리스트 항목 이름"
            style={{ ...inputStyle, flex:1 }} />
          <button onClick={addItem} disabled={saving} style={{ ...btnPrimary, flexShrink:0, padding:'11px 16px', fontSize:13 }}>추가</button>
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
              <div key={item.id} style={{ borderRadius:10, overflow:'hidden' }}>
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
                    defaultValue={item.suburb ?? ''}
                    onBlur={e => saveDetail(item.id, 'suburb', e.target.value)}
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
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#64748B', fontWeight:600, width:70, flexShrink:0 }}>🏢 관련업체</span>
                  <select
                    value={item.related_business_id ?? ''}
                    onChange={e => saveDetail(item.id, 'related_business_id', e.target.value)}
                    style={{ ...inputStyle, flex:1, fontSize:12, padding:'5px 8px' }}
                  >
                    <option value="">없음</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
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
    const suburb = req.city || req.address.split(',').slice(-2,-1)[0]?.trim() || ''
    return {
      business_name: req.business_name,
      category:      req.category || 'restaurant',
      address:       req.address,
      city:          suburb,
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
