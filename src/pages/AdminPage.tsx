import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import {
  Business, getBusinesses, createBusiness,
  updateBusiness, toggleFeatured,
} from '../lib/businessService'
import { supabase } from '../lib/supabase'
import { CATEGORIES as CL_CATEGORIES, ITEMS as CL_ITEMS, ITEM_ICONS as CL_ITEM_ICONS } from '../data/checklist'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'hojugaja2024'

// ── 탭 타입
type MainTab = 'business' | 'categories' | 'items' | 'export' | 'requests' | 'suggestions'

// ── 탭 메타
const TAB_META: { id: MainTab; icon: string; label: string }[] = [
  { id:'business',    icon:'ph:buildings',         label:'업체' },
  { id:'requests',    icon:'ph:envelope-open',      label:'신청' },
  { id:'suggestions', icon:'ph:lightbulb',          label:'추천' },
  { id:'categories',  icon:'ph:folder-open',        label:'카테고리' },
  { id:'items',       icon:'ph:list-checks',        label:'체크리스트' },
  { id:'export',      icon:'ph:code',               label:'내보내기' },
]


// ── 업체 폼 초기값
const EMPTY_FORM = {
  id:'', name:'', category:'realestate', description:'',
  phone:'', website:'', kakao:'', address:'', city:'',
  is_featured:false, is_active:true, tags:'',
}

// ── 체크리스트 타입
type Cat  = { id:string; label:string; receiptLabel:string; emoji:string }
type Item = { id:string; categoryId:string; label:string; emoji:string }

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

  // ── 공유 checklist state (카테고리·아이템·아이콘 탭 간 공유)
  // checklist.ts를 직접 읽어서 초기화 → 코드 내보내기 후 배포해도 항상 최신 상태 유지
  const [sharedCats,    setSharedCats]    = useState<Cat[]>(() =>
    JSON.parse(JSON.stringify(CL_CATEGORIES))
  )
  const [sharedItems,   setSharedItems]   = useState<Item[]>(() =>
    JSON.parse(JSON.stringify(CL_ITEMS))
  )
  const [sharedIconMap, setSharedIconMap] = useState<Record<string,string>>(() =>
    JSON.parse(JSON.stringify(CL_ITEM_ICONS))
  )

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
    }}>
    <div style={{ maxWidth:430, margin:'0 auto', minHeight:'100vh', position:'relative', background:'#F0F2F7', paddingBottom:72 }}>
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
        {tab==='categories'  && <CategoriesTab cats={sharedCats} setCats={setSharedCats} items={sharedItems} setItems={setSharedItems} />}
        {tab==='items'       && <ItemsTab cats={sharedCats} items={sharedItems} setItems={setSharedItems} iconMap={sharedIconMap} setIconMap={setSharedIconMap} />}
        {tab==='export'      && <ExportTab cats={sharedCats} items={sharedItems} iconMap={sharedIconMap} />}
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
      // custom 항상 맨 마지막 강제
      const customIdx = next.findIndex(c => c.id === 'custom')
      if (customIdx !== -1 && customIdx !== next.length - 1) {
        const [custom] = next.splice(customIdx, 1)
        next.push(custom)
      }
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
          <button onClick={addCat} style={{ ...btnPrimary, flexShrink:0, padding:'11px 16px', fontSize:13 }}>추가</button>
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
  // 기본
  'ph:heart','ph:star','ph:check-circle','ph:map-pin','ph:calendar',
  'ph:camera','ph:gift','ph:flag','ph:crown','ph:trophy',
  'ph:sparkle','ph:shooting-star','ph:smiley','ph:sun','ph:moon',
  // ── 호주 & 동물 (신규) ──
  'ph:paw-print','ph:bird','ph:butterfly','ph:horse','ph:bug',
  'ph:fish','ph:fish-simple','ph:shrimp','ph:crab','ph:seal',
  'ph:feather','ph:leaf','ph:tree-palm','ph:island','ph:waves',
  'ph:sun-horizon','ph:rainbow','ph:cloud','ph:lightning','ph:snowflake',
  'ph:mountains','ph:mountain','ph:cave','ph:lighthouse','ph:anchor',
  'ph:boomerang','ph:tent','ph:campfire','ph:compass','ph:map-trifold',
  // 카페/브런치
  'ph:coffee','ph:tea-bag','ph:croissant','ph:bread','ph:cake',
  'ph:cookie','ph:egg','ph:drop','ph:drop-half','ph:orange',
  'ph:plant','ph:flower','ph:jar-label','ph:bottle',
  // ── 음식/먹거리 (대폭 확충) ──
  'ph:fork-knife','ph:bowl-food','ph:beer-stein','ph:wine','ph:whiskey',
  'ph:flame','ph:pepper','ph:nut','ph:pie','ph:popcorn','ph:grains',
  'ph:ice-cream','ph:donut','ph:hamburger','ph:hot-dog','ph:cheese',
  'ph:bread','ph:pretzel','ph:corn','ph:apple','ph:strawberry',
  'ph:avocado','ph:lemon','ph:jar','ph:jar-label','ph:bottle-water',
  'ph:knife','ph:fork-knife-fill','ph:grains',
  'ph:meat','ph:pizza','ph:taco','ph:wrap',
  'ph:noodle','ph:bowl-steam','ph:pot','ph:frying-pan',
  'ph:soup-bowl','ph:sticker','ph:receipt',
  // 쇼핑
  'ph:shopping-bag','ph:shopping-cart','ph:package','ph:t-shirt',
  'ph:diamond','ph:sunglasses','ph:boot','ph:wallet','ph:lipstick',
  'ph:baby','ph:pill','ph:bandaids','ph:first-aid-kit',
  // 도시/문화
  'ph:buildings','ph:building','ph:castle','ph:church','ph:bank',
  'ph:palette','ph:music-note','ph:microphone','ph:film-slate','ph:ticket',
  'ph:binoculars','ph:books','ph:graduation-cap','ph:medal','ph:dove',
  'ph:frame-corners','ph:lightbulb','ph:clock','ph:bridge',
  // 해변/물놀이
  'ph:umbrella','ph:umbrella-simple','ph:oar','ph:boat','ph:sailboat',
  'ph:swimming-pool','ph:shell','ph:wave','ph:surf',
  // 백패커/여행
  'ph:airplane','ph:airplane-takeoff','ph:train','ph:train-simple',
  'ph:bus','ph:car','ph:van','ph:jeep','ph:bicycle',
  'ph:backpack','ph:globe','ph:bed',
  'ph:wifi','ph:device-mobile','ph:paper-plane',
  'ph:identification-card','ph:certificate','ph:hand-waving',
  // 이색경험/활동
  'ph:parachute','ph:balloon','ph:helicopter','ph:guitar','ph:drum',
  'ph:bat','ph:owl','ph:clothes-hanger','ph:coin',
  'ph:film-reel','ph:confetti','ph:party-popper',
  // 기타
  'ph:person-simple','ph:users','ph:users-three','ph:house','ph:house-line',
  'ph:pencil-simple','ph:note','ph:alarm','ph:shield',
  'ph:storefront','ph:syringe','ph:stethoscope','ph:heartbeat',
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
  const [dragIdx, setDragIdx]     = useState<number|null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number|null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  function handleItemDragStart(localIdx: number) { setDragIdx(localIdx) }
  function handleItemDragOver(e: React.DragEvent, localIdx: number) {
    e.preventDefault(); setDragOverIdx(localIdx)
  }
  function handleItemDragEnd() {
    if (dragIdx === null || dragOverIdx === null || dragIdx === dragOverIdx) {
      setDragIdx(null); setDragOverIdx(null); return
    }
    const catIs = items.filter(i => i.categoryId === selCat)
    const allItems = [...items]
    const fromGlobal = allItems.findIndex(i => i.id === catIs[dragIdx].id)
    const toGlobal   = allItems.findIndex(i => i.id === catIs[dragOverIdx].id)
    const [moved] = allItems.splice(fromGlobal, 1)
    allItems.splice(toGlobal, 0, moved)
    setItems(allItems as any)
    setDragIdx(null); setDragOverIdx(null)
    showToast('순서 변경됨')
  }

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
              padding:'8px 14px', borderRadius:10, border:'1.5px solid',
              borderColor: selCat===c.id ? '#1B6EF3' : '#E2E8F0',
              background: selCat===c.id ? '#1B6EF3' : '#fff',
              color: selCat===c.id ? '#fff' : '#475569',
              fontSize:13, fontWeight:700, cursor:'pointer', minHeight:38,
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
            {catItems.map((item, localIdx) => {
              const isDragging = dragIdx === localIdx
              const isOver     = dragOverIdx === localIdx
              return (
                <div key={item.id}
                  draggable={!isLocked}
                  onDragStart={() => handleItemDragStart(localIdx)}
                  onDragOver={e => handleItemDragOver(e, localIdx)}
                  onDragEnd={handleItemDragEnd}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'8px 0', borderBottom:'1px solid #f3f3f3',
                    opacity: isDragging ? 0.4 : 1,
                    background: isOver ? '#eef2fb' : 'transparent',
                    borderRadius: isOver ? 8 : 0,
                    cursor: isLocked ? 'default' : 'grab',
                    transition:'background 0.15s',
                  }}>
                  {/* 드래그 핸들 */}
                  {!isLocked && (
                    <Icon icon="ph:dots-six-vertical" width={16} height={16} color="#ccc" style={{ flexShrink:0, cursor:'grab' }} />
                  )}
                  <IconPicker value={iconMap[item.id] || CAT_DEFAULT[selCat] || 'ph:star'} onChange={v => updateIcon(item.id, v)} />
                  <input value={item.label} onChange={e=>updateItem(item.id,'label',e.target.value)} style={{ flex:1, fontSize:13, border:'none', background:'transparent', color:'#444' }} />
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => moveItem(item.id,-1)} disabled={localIdx===0} style={{ ...btnSmGhost, opacity:localIdx===0?0.3:1 }}>↑</button>
                    <button onClick={() => moveItem(item.id, 1)} disabled={localIdx===catItems.length-1} style={{ ...btnSmGhost, opacity:localIdx===catItems.length-1?0.3:1 }}>↓</button>
                    <button onClick={() => deleteItem(item.id)} style={{ ...btnSmDanger }}>✕</button>
                  </div>
                </div>
              )
            })}
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
    // custom 항상 맨 마지막 정렬
    const sortedCats = [...cats.filter(c => c.id !== 'custom'), ...cats.filter(c => c.id === 'custom')]
    let out = `export type Category = { id: string; label: string; receiptLabel: string; emoji: string }\n`
    out += `export type CheckItem = { id: string; categoryId: string; label: string; emoji: string }\n\n`
    out += `export const CATEGORIES: Category[] = [\n`
    sortedCats.forEach((c: Cat) => { out += `  { id:'${esc(c.id)}', label:'${esc(c.label)}', receiptLabel:'${esc(c.receiptLabel)}', emoji:'${c.emoji}' },\n` })
    out += `]\n\nexport const ITEMS: CheckItem[] = [`
    let lastCat = ''
    items.forEach((item: Item) => {
      const cat = sortedCats.find((c: Cat) => c.id === item.categoryId)
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
        style={{ width:'100%', minHeight:240, padding:14, border:'1.5px solid #E2E8F0', borderRadius:10, fontFamily:'monospace', fontSize:11, color:'#334155', background:'#F8FAFC', resize:'vertical', outline:'none', lineHeight:1.6, boxSizing:'border-box' }}
      />
    </Card>
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
    const { error: updateError } = await supabase.from('business_requests').update({ status }).eq('id', id)
    if (updateError) {
      alert(`상태 변경 실패:\n${updateError.message}\n\n(business_requests 테이블에 status 컬럼이 있는지 확인해주세요)`)
      return
    }
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
