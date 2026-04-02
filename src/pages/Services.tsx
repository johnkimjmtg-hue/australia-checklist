import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import { Business, getBusinesses } from '../lib/businessService'
import { getBookmarks } from '../lib/businessBookmarks'
import { getCachedBusinesses } from '../lib/dataCache'
import BusinessCard from '../components/BusinessCard'
import CategoryFilter from '../components/CategoryFilter'
import { colors, font, radius, spacing } from '../styles/tokens'

type Props = { onSelectBusiness: (id: string) => void; onBack: () => void }
type ServiceTab = 'all' | 'korean' | 'bookmarks' | 'emergency'

const ff = font.family

// 가나다 → ABC 정렬
function sortByName(list: Business[]): Business[] {
  return [...list].sort((a, b) => {
    const aKor = /[가-힣]/.test(a.name[0])
    const bKor = /[가-힣]/.test(b.name[0])
    if (aKor && !bKor) return -1
    if (!aKor && bKor) return 1
    return a.name.localeCompare(b.name, aKor ? 'ko' : 'en')
  })
}

// ── Google Maps 주소 자동완성
const GOOGLE_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY
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

function AddressAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingAc, setLoadingAc]     = useState(false)
  const [manualMode, setManualMode]   = useState(false)
  const debounceRef = useRef<any>(null)

  async function handleInput(val: string) {
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoadingAc(true)
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
      finally { setLoadingAc(false) }
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
    width:'100%', height:44, border:`1px solid ${colors.border}`, borderRadius:radius.sm,
    padding:'0 12px', fontSize:font.size.md, color:colors.textPrimary, background:colors.bgCard,
    boxSizing:'border-box', fontFamily:ff, outline:'none',
  }

  if (manualMode) {
    return (
      <div>
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="주소를 직접 입력하세요" style={iStyle} autoFocus />
        <button onClick={() => { setManualMode(false); onChange('') }}
          style={{ background:'none', border:'none', fontSize:11, color:colors.textTertiary, cursor:'pointer', marginTop:4, padding:0 }}>
          ← 자동완성으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div style={{ position:'relative' }}>
      <input value={value} onChange={e => handleInput(e.target.value)}
        placeholder="123 George St, Sydney NSW 2000" style={iStyle} />
      {loadingAc && <div style={{ fontSize:11, color:colors.textTertiary, marginTop:4 }}>검색 중...</div>}
      {suggestions.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:200,
          background:colors.bgCard, borderRadius:radius.sm, boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          border:`1px solid ${colors.border}`, overflow:'hidden', marginTop:4,
        }}>
          {suggestions.map((s: any, i: number) => (
            <div key={i} onClick={() => handleSelect(s)} style={{
              padding:'10px 14px', fontSize:font.size.sm, cursor:'pointer',
              borderBottom:`1px solid ${colors.gray100}`, color:colors.textPrimary,
              display:'flex', alignItems:'center', gap:8,
            }}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(16,185,129,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background=colors.bgCard)}
            >
              <Icon icon="ph:map-pin-simple" width={14} height={14} color={'#10B981'} />
              {s.placePrediction?.text?.text || ''}
            </div>
          ))}
          <div onClick={() => { setSuggestions([]); setManualMode(true); onChange('') }} style={{
            padding:'10px 14px', fontSize:font.size.sm, cursor:'pointer',
            color:'#10B981', fontWeight:font.weight.bold,
            display:'flex', alignItems:'center', gap:8,
            borderTop:`1px solid ${colors.border}`, background:'rgba(16,185,129,0.12)',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity='0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity='1')}
          >
            <Icon icon="ph:pencil-simple" width={14} height={14} color={'#10B981'} />
            찾는 주소가 없어요 — 직접 입력하기
          </div>
        </div>
      )}
      {!loadingAc && !suggestions.length && value.length >= 3 && (
        <button onClick={() => setManualMode(true)} style={{
          background:'none', border:'none', fontSize:11, color:'#10B981',
          cursor:'pointer', marginTop:4, padding:0, fontWeight:font.weight.bold,
        }}>
          주소를 찾을 수 없나요? 직접 입력하기 →
        </button>
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

  const iStyle: React.CSSProperties = { width:'100%', height:44, border:`1px solid ${colors.border}`, borderRadius:radius.sm, padding:'0 12px', fontSize:font.size.md, color:colors.textPrimary, background:colors.bgCard, boxSizing:'border-box', fontFamily:ff, outline:'none' }
  const taStyle: React.CSSProperties = { ...iStyle, height:80, padding:'10px 12px', resize:'none' as any }
  const lbl = (t: string, s?: string) => <div style={{ fontSize:font.size.xs, fontWeight:font.weight.bold, color:colors.textSecondary, marginBottom:5 }}>{t} {s && <span style={{ fontWeight:font.weight.regular, color:colors.textTertiary }}>{s}</span>}</div>
  const businessCats = CATEGORIES.filter(c => c.id !== 'all')

  if (done) return (
    <div style={{ textAlign:'center', padding:'32px 0' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
      <div style={{ fontSize:font.size.lg, fontWeight:font.weight.bold, color:colors.textPrimary, marginBottom:8 }}>신청이 완료됐어요!</div>
      <div style={{ fontSize:font.size.sm, color:colors.textSecondary, lineHeight:1.6, marginBottom:24 }}>검토 후 등록해드릴게요.<br/>감사합니다 🙏</div>
      <button onClick={onClose} style={{ width:'100%', height:48, background:'rgba(16,185,129,0.12)', color:'#10B981', border:`1px solid ${colors.border}`, borderRadius:radius.sm, fontSize:font.size.md, fontWeight:font.weight.bold, cursor:'pointer', fontFamily:ff }}>확인</button>
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
              <button key={cat.id} onClick={() => set('category', cat.id)} style={{ height:36, borderRadius:radius.sm, border: form.category===cat.id ? `1.5px solid ${'#10B981'}` : `1px solid ${colors.border}`, cursor:'pointer', background: form.category===cat.id ? 'rgba(16,185,129,0.12)' : colors.bgCard, color: form.category===cat.id ? '#10B981' : colors.textSecondary, fontSize:font.size.sm, fontWeight: form.category===cat.id ? font.weight.bold : font.weight.regular, fontFamily:ff }}>{cat.label}</button>
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
      {error && <div style={{ marginTop:10, padding:'8px 12px', background:colors.dangerLight, borderRadius:radius.sm, fontSize:font.size.sm, color:colors.danger, fontWeight:font.weight.bold }}>{error}</div>}
      <button onClick={handleSubmit} disabled={submitting} style={{ width:'100%', marginTop:16, height:50, background:'#10B981', color:'#fff', border:'none', borderRadius:radius.sm, fontSize:font.size.md, fontWeight:font.weight.bold, cursor: submitting?'default':'pointer', opacity: submitting?0.7:1, fontFamily:ff }}>{submitting ? '제출 중...' : '등록 신청하기'}</button>
    </div>
  )
}


export default function Services({ onSelectBusiness, onBack }: Props) {
  const [serviceTab, setServiceTab]   = useState<ServiceTab>('all')
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('')
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [loading, setLoading]         = useState(true)
  const [bookmarkCount, setBookmarkCount] = useState(() => getBookmarks().length)
  const [catCounts, setCatCounts]     = useState<Record<string, number>>({})
  const [sortedCategories, setSortedCategories] = useState(CATEGORIES)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimerRef = useRef<any>(null)

  // 캐시에서 전체 업체 로드 (캐시 없으면 syncDataCache 완료 대기)
  useEffect(() => {
    const cached = getCachedBusinesses()
    if (cached && cached.length > 0) {
      setAllBusinesses(cached)
      setLoading(false)
      return
    }
    // 캐시 없음 → 500ms 간격으로 최대 10초 대기
    let attempts = 0
    const interval = setInterval(() => {
      const c = getCachedBusinesses()
      if (c && c.length > 0) {
        setAllBusinesses(c)
        setLoading(false)
        clearInterval(interval)
      } else if (++attempts >= 20) {
        // 10초 후에도 없으면 DB에서 직접
        getBusinesses(undefined, 0, 9999).then(data => {
          setAllBusinesses(data)
          setLoading(false)
        })
        clearInterval(interval)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // 검색 디바운스
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 300)
  }, [search])

  // 카테고리 카운트 (캐시 데이터 기반)
  useEffect(() => {
    const counts: Record<string, number> = {}
    CATEGORIES.filter(c => c.id !== 'all').forEach(c => {
      counts[c.id] = allBusinesses.filter(b => b.category === c.id).length
    })
    setCatCounts(counts)
  }, [allBusinesses])

  // 카테고리 정렬
  useEffect(() => {
    const rest = CATEGORIES.filter(c => c.id !== 'all')
    setSortedCategories([...rest].sort((a, b) => (catCounts[b.id] || 0) - (catCounts[a.id] || 0)))
  }, [catCounts])

  // 북마크 이벤트
  useEffect(() => {
    const handler = (e: Event) => {
      const { count } = (e as CustomEvent).detail
      setBookmarkCount(count)
    }
    window.addEventListener('bookmark-change', handler)
    return () => window.removeEventListener('bookmark-change', handler)
  }, [])

  // ── 필터링된 업체 목록
  const displayedBusinesses = useMemo(() => {
    let list = [...allBusinesses]

    // 한인업체 필터
    if (serviceTab === 'korean') list = list.filter(b => b.is_korean)
    else if (serviceTab === 'all') {} // 전체

    // 검색
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.description ?? '').toLowerCase().includes(q) ||
        (b.city ?? '').toLowerCase().includes(q)
      )
      return sortByName(list)
    }

    // 카테고리 필터
    if (category) list = list.filter(b => b.category === category)

    // 전체업종 + 카테고리 없음: 추천 앞에, 나머지 뒤에
    if (!category) {
      const featured = sortByName(list.filter(b => b.is_featured))
      const normal   = sortByName(list.filter(b => !b.is_featured))
      return [...featured, ...normal]
    }

    // 카테고리 선택 시: 가나다 ABC 순 전체
    return sortByName(list)
  }, [allBusinesses, serviceTab, category, debouncedSearch])

  // 북마크 목록
  const bookmarked = useMemo(() => {
    const ids = getBookmarks()
    return sortByName(allBusinesses.filter(b => ids.includes(b.id)))
  }, [allBusinesses, bookmarkCount])

  const [displayLimit, setDisplayLimit] = useState(50)
  const [showRequestForm, setShowRequestForm] = useState(false)

  // category나 tab 바뀌면 showAll 리셋
  useEffect(() => { setDisplayLimit(50) }, [category, serviceTab, debouncedSearch])

  const isSearch    = !!debouncedSearch.trim()
  const isCatFilter = !!category
  const isFiltered  = isSearch || isCatFilter

  return (
    <div style={{ minHeight:'100dvh', background:'#ffffff', fontFamily:ff, paddingBottom:130 }}>
      <style>{`
        .chip-btn { transition: all .12s; -webkit-tap-highlight-color: transparent; }
        .svc-btn  { transition: all .12s; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .cat-scroll { overflow-x:auto; scrollbar-width:thin; scrollbar-color:${colors.gray300} #ffffff; }
        .cat-scroll::-webkit-scrollbar { height:4px; }
        .cat-scroll::-webkit-scrollbar-track { background:#ffffff; border-radius:2px; }
        .cat-scroll::-webkit-scrollbar-thumb { background:${colors.gray300}; border-radius:2px; }
        @keyframes slideUpSheet { from { transform: translateX(-50%) translateY(100%); } to { transform: translateX(-50%) translateY(0); } }
      `}</style>

      {/* ── 스티키 헤더 (탭+검색+카테고리) — 연한 회색 배경 ── */}
      <div style={{
        position:'sticky', top:0, zIndex:10,
        background:'#ffffff',
        borderBottom:`1px solid ${colors.border}`,
        padding:`${spacing[3]}px ${spacing[4]}px ${spacing[3]}px`,
      }}>
        {/* 전체/한인업체/북마크/비상연락처 탭 */}
        <div style={{ display:'flex', gap:spacing[2], marginBottom:spacing[3] }}>
          {(['all', 'korean', 'bookmarks', 'emergency'] as ServiceTab[]).filter(tab => tab !== 'korean').map(tab => {
            const isActive = serviceTab === tab
            const iconName = tab === 'all' ? 'ph:list-bullets' : tab === 'korean' ? 'ph:flag' : tab === 'bookmarks' ? 'ph:bookmark-simple-fill' : 'ph:bell-fill'
            const label = tab === 'all' ? '전체 업종' : tab === 'korean' ? '한인업체' : tab === 'bookmarks' ? `내 북마크${bookmarkCount > 0 ? ` (${bookmarkCount})` : ''}` : '비상연락처'
            const activeColor = tab === 'emergency' ? colors.danger : '#10B981'
            const iconColor = isActive ? (tab === 'emergency' ? colors.danger : '#10B981') : tab === 'korean' ? '#EA580C' : tab === 'bookmarks' ? '#FFB800' : tab === 'emergency' ? colors.danger : colors.textTertiary
            return (
              <button key={tab} onClick={() => { setServiceTab(tab); setCategory(''); setSearch('') }}
                className="svc-btn"
                style={{
                  height:34, padding:`0 ${spacing[3]}px`, borderRadius:radius.full,
                  cursor:'pointer', fontSize:font.size.sm, fontWeight:font.weight.bold,
                  background: isActive ? (tab === 'emergency' ? colors.dangerLight : tab === 'korean' ? '#FFF7ED' : 'rgba(16,185,129,0.12)') : colors.bgCard,
                  color: isActive ? (tab === 'korean' ? '#EA580C' : activeColor) : colors.textSecondary,
                  border: isActive ? `1.5px solid ${tab === 'korean' ? '#FED7AA' : activeColor}` : `1px solid ${colors.border}`,
                  display:'flex', alignItems:'center', gap:5,
                  whiteSpace:'nowrap', fontFamily:ff,
                }}>
                <Icon icon={iconName} width={13} height={13} color={iconColor} />
                {label}
              </button>
            )
          })}
        </div>

        {/* 검색창 + 카테고리 — 전체 탭만 */}
        {(serviceTab === 'all' || serviceTab === 'korean') && (<>
        <div style={{ display:'flex', alignItems:'center', gap:spacing[2], marginBottom:spacing[3] }}>
          <div style={{
            flex:1, display:'flex', alignItems:'center', gap:spacing[2],
            background:colors.bgCard, borderRadius:radius.sm, padding:`0 ${spacing[3]}px`,
            border:`1.5px solid ${colors.border}`, height:42,
          }}>
            <Icon icon="ph:magnifying-glass" width={16} height={16} color={colors.textTertiary} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value) }}
              placeholder="업체명, 키워드 검색..."
              style={{
                flex:1, border:'none', outline:'none',
                fontSize:font.size.md, color:colors.textPrimary, background:'transparent', fontFamily:ff,
              }}
            />
            {search && (
              <button onClick={() => { setSearch('') }}
                style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                <Icon icon="ph:x-circle" width={16} height={16} color={colors.textTertiary} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            style={{
              flexShrink:0, height:42, padding:`0 ${spacing[3]}px`,
              background:'#10B981', color:'#fff',
              border:'none', borderRadius:radius.sm,
              fontSize:font.size.sm, fontWeight:font.weight.bold,
              cursor:'pointer', display:'flex', alignItems:'center', gap:4,
              fontFamily:ff, whiteSpace:'nowrap',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            <Icon icon="ph:plus" width={14} height={14} color="#fff" />
            업체 등록
          </button>
        </div>
        {/* 카테고리 가로 스크롤 */}
        <div className="cat-scroll" style={{ display:'flex', gap:spacing[2], paddingBottom:4 }}>
          {sortedCategories.map(cat => {
            const isActive = category === cat.id
            const count = catCounts[cat.id] || 0
            if (count === 0) return null
            return (
              <button key={cat.id} className="chip-btn svc-btn"
                onClick={() => { setCategory(isActive ? '' : cat.id) }}
                style={{
                  height:34, borderRadius:radius.sm,
                  background: isActive ? '#10B981' : colors.bgCard,
                  color: isActive ? '#fff' : colors.gray600,
                  fontSize:font.size.sm, fontWeight:font.weight.bold,
                  cursor:'pointer', flexShrink:0,
                  padding:`0 ${spacing[3]}px`,
                  border: isActive ? `2px solid ${'#10B981'}` : `1px solid ${colors.gray300}`,
                  display:'flex', alignItems:'center', gap:4,
                  whiteSpace:'nowrap', fontFamily:ff,
                  WebkitTapHighlightColor:'transparent',
                }}>
                {cat.label}
                <span style={{ fontSize:font.size.xs, opacity:0.75 }}>({count})</span>
              </button>
            )
          })}
        </div>
        </>)}
      </div>

      {/* ── 콘텐츠 ── */}
      <div style={{ padding:`${spacing[4]}px ${spacing[4]}px 0` }}>

        {/* 북마크 탭 */}
        {serviceTab === 'bookmarks' && (
          bookmarked.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 0' }}>
              <Icon icon="ph:bookmark-simple" width={48} height={48} color={colors.gray300} />
              <div style={{ marginTop:spacing[3], fontSize:font.size.lg, fontWeight:font.weight.bold, color:colors.textSecondary }}>저장된 업체가 없어요</div>
              <div style={{ marginTop:spacing[1], fontSize:font.size.sm, color:colors.textTertiary }}>업체 카드의 북마크 버튼을 눌러 저장하세요</div>
            </div>
          ) : (
            <>
              <SectionLabel icon="ph:bookmark-simple-fill" label={`내 북마크 (${bookmarked.length})`} color={'#10B981'} />
              <div style={{ display:'flex', flexDirection:'column', gap:spacing[3] }}>
                {sortByName(bookmarked).map(b => <BusinessCard key={b.id} business={b} />)}
              </div>
            </>
          )
        )}

        {/* 비상연락처 탭 */}
        {serviceTab === 'emergency' && <EmergencyTab />}

        {/* 전체업종 / 한인업체 탭 */}
        {(serviceTab === 'all' || serviceTab === 'korean') && (
          <>
            <SectionLabel
              icon={!isFiltered
                ? (serviceTab === 'korean' ? 'ph:flag' : 'ph:star')
                : isSearch ? 'ph:magnifying-glass' : 'ph:list-bullets'}
              label={!isFiltered
                ? (serviceTab === 'korean' ? `한인업체 (${displayedBusinesses.length})` : `전체 업체 (${displayedBusinesses.length})`)
                : isSearch
                  ? `검색 결과 (${displayedBusinesses.length})`
                  : `${CATEGORIES.find(c => c.id === category)?.label ?? ''} (${displayedBusinesses.length})`}
              color={colors.textSecondary}
            />
            {loading ? <LoadingState /> : displayedBusinesses.length === 0 ? <EmptyState /> : (() => {
              // 전체/카테고리 모두 50개씩 로드
              const isFirstScreen = !isFiltered && !category
              const featured = isFirstScreen ? displayedBusinesses.filter(b => b.is_featured) : []
              const normal   = isFirstScreen ? displayedBusinesses.filter(b => !b.is_featured) : displayedBusinesses
              const visibleNormal = normal.slice(0, displayLimit)
              const hasMore  = displayLimit < normal.length

              const listToRender = isFirstScreen
                ? [...featured, ...visibleNormal]
                : visibleNormal

              return (
                <>
                  <div style={{ display:'flex', flexDirection:'column', gap:spacing[3] }}>
                    {listToRender.map(b => <BusinessCard key={b.id} business={b} />)}
                  </div>
                  {hasMore && (
                    <button
                      onClick={() => setDisplayLimit(l => l + 50)}
                      style={{
                        width:'100%', marginTop:spacing[4], height:48,
                        borderRadius:radius.md, border:`1px solid ${colors.border}`,
                        background:colors.bgCard, color:colors.textSecondary,
                        fontSize:font.size.md, fontWeight:font.weight.bold,
                        cursor:'pointer', fontFamily:ff,
                        display:'flex', alignItems:'center', justifyContent:'center', gap:spacing[2],
                      }}
                    >
                      더 보기 ({Math.min(50, normal.length - displayLimit)}개 더)
                    </button>
                  )}
                </>
              )
            })()}
          </>
        )}
      </div>

      {/* ── 업체 등록 신청 모달 */}
      {showRequestForm && (
        <>
          <div onClick={() => setShowRequestForm(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:1100 }}/>
          <div onClick={e => e.stopPropagation()} style={{
            position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:430, background:'#ffffff',
            borderRadius:'20px 20px 0 0', zIndex:1101,
            animation:'slideUpSheet 0.25s ease', maxHeight:'72vh', overflowY:'auto',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
            display:'flex', flexDirection:'column',
          }}>
            <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setShowRequestForm(false)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:`${spacing[4]}px ${spacing[4]}px ${spacing[10]}px` }}>
              <div style={{ marginBottom:spacing[4] }}>
                <div style={{ fontSize:font.size.lg, fontWeight:font.weight.bold, color:colors.textPrimary }}>업체 등록 신청</div>
                <div style={{ fontSize:font.size.sm, color:colors.textSecondary, marginTop:2 }}>검토 후 등록해드려요</div>
              </div>
              <RequestForm onClose={() => setShowRequestForm(false)} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const CAT_ICONS: Record<string, string> = {
  all:'ph:squares-four', realestate:'ph:house-line', lawyer:'ph:scales',
  accounting:'ph:receipt', insurance:'ph:shield-check', immigration:'ph:globe',
  academy:'ph:graduation-cap', telecom:'ph:device-mobile', travel:'ph:airplane',
  hotel:'ph:bed', banking:'ph:currency-dollar', gp:'ph:first-aid-kit',
  dental:'ph:tooth', oriental:'ph:leaf', pharmacy:'ph:pill',
  restaurant:'ph:fork-knife', cafe:'ph:coffee', mart:'ph:shopping-cart',
  beauty:'ph:scissors', moving:'ph:package', handyman:'ph:wrench',
  shopping:'ph:bag-simple', culture:'ph:buildings', transport:'ph:bus',
  etc:'ph:dots-three-circle',
}

function SectionLabel({ icon, label, color }: { icon:string; label:string; color:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:spacing[3] }}>
      <Icon icon={icon} width={14} height={14} color={color} />
      <span style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color, letterSpacing:0.2 }}>{label}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:spacing[2] }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          background:colors.bgCard, borderRadius:radius.md, padding:`${spacing[4]}px`,
          border:`1px solid ${colors.border}`, opacity:0.6,
        }}>
          <div style={{ height:14, width:'55%', background:colors.gray100, borderRadius:radius.sm, marginBottom:spacing[2] }}/>
          <div style={{ height:10, width:'35%', background:colors.gray100, borderRadius:radius.sm, marginBottom:spacing[2] }}/>
          <div style={{ height:10, width:'80%', background:colors.gray100, borderRadius:radius.sm }}/>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign:'center', padding:'48px 0', color:colors.textTertiary, fontSize:font.size.md, fontWeight:font.weight.medium }}>
      <Icon icon="ph:magnifying-glass" width={36} height={36} color={colors.gray300} />
      <div style={{ marginTop:spacing[3] }}>검색 결과가 없어요</div>
    </div>
  )
}

// ══════════════════════════════════════════
// 비상연락처 탭
// ══════════════════════════════════════════
const EMERGENCY_DATA = [
  {
    section: '긴급 상황 (전국 공통)', icon: 'ph:siren',
    color: '#DC2626',
    bg: '#FFF5F5',
    border: '#FECDD3',
    items: [
      { label: '경찰 / 구급차 / 화재', number: '000', desc: '모든 긴급상황' },
      { label: '휴대폰 긴급번호', number: '112', desc: '000과 동일' },
      { label: '음성·청각 장애 긴급', number: '106', desc: 'TTY 전용' },
      { label: '비긴급 경찰 신고', number: '131 444', desc: '긴급하지 않은 신고' },
    ],
  },
  {
    section: '의료 / 병원', icon: 'ph:first-aid-kit',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    items: [
      { label: '구급차 (긴급)', number: '000', desc: '생명 위험 시' },
      { label: 'Healthdirect', number: '1800 022 222', desc: '24시간 의료 상담' },
      { label: 'Poison Information', number: '13 11 26', desc: '독극물·약물 중독' },
    ],
  },
  {
    section: '화재 / 재난', icon: 'ph:fire',
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    items: [
      { label: '소방서 (긴급)', number: '000', desc: '화재 긴급' },
      { label: 'NSW Rural Fire', number: '1800 679 737', desc: 'NSW 산불' },
      { label: 'VIC Emergency', number: '1800 226 226', desc: 'VIC 재난' },
      { label: 'QLD Disaster', number: '13 74 68', desc: 'QLD 재난' },
    ],
  },
  {
    section: '로드사이드 어시스턴스', icon: 'ph:car',
    color: '#10B981',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    items: [
      { label: 'NRMA (NSW/ACT)', number: '13 11 22', desc: '차량 긴급출동' },
      { label: 'RACV (VIC)', number: '13 11 11', desc: '차량 긴급출동' },
      { label: 'RACQ (QLD)', number: '13 11 11', desc: '차량 긴급출동' },
      { label: 'RAC (WA)', number: '13 11 11', desc: '차량 긴급출동' },
      { label: 'RAA (SA)', number: '13 11 11', desc: '차량 긴급출동' },
    ],
  },
  {
    section: '정신건강 / 위기상담', icon: 'ph:heart',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    items: [
      { label: 'Lifeline (자살예방)', number: '13 11 14', desc: '24시간 위기상담' },
      { label: 'Beyond Blue', number: '1300 224 636', desc: '정신건강 상담' },
      { label: 'Suicide Call Back', number: '1300 659 467', desc: '자살예방 콜백' },
    ],
  },
  {
    section: '아동 / 가정 문제', icon: 'ph:baby',
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    items: [
      { label: 'Kids Helpline', number: '1800 55 1800', desc: '아동·청소년 상담' },
      { label: 'Domestic Violence', number: '1800 737 732', desc: '가정폭력 상담' },
    ],
  },
  {
    section: '여행자 / 외국인', icon: 'ph:airplane',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    items: [
      { label: '통역 서비스', number: '13 14 50', desc: 'Interpreter Service' },
      { label: '호주 영사관 긴급', number: '1300 555 135', desc: '호주 정부 영사 긴급' },
      { label: '한국 긴급 영사콜센터', number: '+82-2-3210-0404', desc: '재외국민 24시간 긴급지원' },
    ],
  },
  {
    section: '유틸리티 사고', icon: 'ph:lightning',
    color: '#CA8A04',
    bg: '#FEFCE8',
    border: '#FEF08A',
    items: [
      { label: '가스 누출', number: '1800 898 220', desc: '가스 긴급' },
      { label: '정전 신고 (NSW)', number: '13 20 80', desc: 'NSW 전력' },
    ],
  },
]

function EmergencyTab() {
  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 안내 배너 */}
      <div style={{
        background:`linear-gradient(135deg,${colors.danger},#B91C1C)`,
        borderRadius:radius.md, padding:`${spacing[4]}px`, marginBottom:spacing[4],
        display:'flex', alignItems:'center', gap:spacing[3],
      }}>
        <Icon icon="ph:flag" width={36} height={36} color="#fff" />
        <div>
          <div style={{ fontSize:font.size.lg, fontWeight:font.weight.bold, color:'#fff', marginBottom:2 }}>호주 긴급 전화번호</div>
          <div style={{ fontSize:font.size.sm, color:'rgba(255,255,255,0.85)', lineHeight:1.5 }}>전화번호를 누르면 바로 연결돼요</div>
        </div>
      </div>

      {EMERGENCY_DATA.map((group, gi) => (
        <div key={gi} style={{ marginBottom:spacing[3] }}>
          {/* 섹션 헤더 */}
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            fontSize:font.size.sm, fontWeight:font.weight.bold, color:group.color,
            marginBottom:spacing[2], paddingLeft:2,
          }}>
            <Icon icon={group.icon} width={14} height={14} color={group.color} />
            {group.section}
          </div>

          {/* 카드 */}
          <div style={{
            background:colors.bgCard, borderRadius:radius.md, overflow:'hidden',
            border:`1px solid ${group.border}`,
          }}>
            {group.items.map((item, ii) => (
              <a
                key={ii}
                href={`tel:${item.number.replace(/\s/g, '')}`}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:`${spacing[3]}px ${spacing[4]}px`,
                  borderBottom: ii < group.items.length - 1 ? `1px solid ${colors.gray100}` : 'none',
                  textDecoration:'none', background:'transparent',
                }}
              >
                <div>
                  <div style={{ fontSize:font.size.sm, fontWeight:font.weight.bold, color:colors.textPrimary, fontFamily:ff }}>{item.label}</div>
                  <div style={{ fontSize:font.size.xs, color:colors.textTertiary, marginTop:2, fontFamily:ff }}>{item.desc}</div>
                </div>
                <div style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:group.bg, borderRadius:radius.sm,
                  padding:`${spacing[2]}px ${spacing[3]}px`, flexShrink:0,
                }}>
                  <Icon icon="ph:phone-call" width={14} height={14} color={group.color} />
                  <span style={{ fontSize:font.size.md, fontWeight:font.weight.bold, color:group.color, fontFamily:ff, letterSpacing:0.3 }}>{item.number}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* 하단 안내 */}
      <div style={{ textAlign:'center', padding:`${spacing[4]}px 0`, color:colors.textTertiary, fontSize:font.size.sm }}>
        긴급 상황 시 망설이지 말고 000에 전화하세요
      </div>
    </div>
  )
}