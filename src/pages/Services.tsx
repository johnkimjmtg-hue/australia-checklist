import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import { Business, getBusinesses, getBusinessesCount, searchBusinesses, searchBusinessesCount } from '../lib/businessService'
import { getBookmarks } from '../lib/businessBookmarks'
import BusinessCard from '../components/BusinessCard'
import CategoryFilter from '../components/CategoryFilter'
import { colors, font, radius, spacing } from '../styles/tokens'

type Props = { onSelectBusiness: (id: string) => void; onBack: () => void }
type ServiceTab = 'all' | 'bookmarks' | 'emergency'

const ff = font.family
const PAGE_SIZE = 30

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

// 랜덤 N개 추출
function pickRandom<T>(list: T[], n: number): T[] {
  const shuffled = [...list].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export default function Services({ onSelectBusiness, onBack }: Props) {
  const [serviceTab, setServiceTab]   = useState<ServiceTab>('all')
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('all')
  const [businesses, setBusinesses]   = useState<Business[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(true)
  const [page, setPage]               = useState(0)
  const [totalCount, setTotalCount]   = useState(0)
  const [showAll, setShowAll]         = useState(false)
  const [initialTen, setInitialTen]   = useState<Business[]>([])
  const [bookmarked, setBookmarked]   = useState<Business[]>([])
  const [bookmarkCount, setBookmarkCount] = useState(() => getBookmarks().length)
  const [catCounts, setCatCounts]     = useState<Record<string, number>>({})
  const [sortedCategories, setSortedCategories] = useState(CATEGORIES)
  const loaderRef = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<any>(null)

  // 초기 로드 + 카테고리/검색 변경 시 재로드
  const loadData = useCallback(async (cat: string, q: string, reset = true) => {
    if (reset) {
      setLoading(true)
      setPage(0)
      setBusinesses([])
    } else {
      setLoadingMore(true)
    }

    const currentPage = reset ? 0 : page
    let data: Business[]

    if (q.trim()) {
      data = await searchBusinesses(q.trim(), currentPage, PAGE_SIZE)
    } else {
      data = await getBusinesses(cat === 'all' ? undefined : cat, currentPage, PAGE_SIZE)
    }

    // 추천업체 가나다순 → 일반업체 가나다순 정렬
    const sortMixed = (list: Business[]) => {
      const featured = sortByName(list.filter(b => b.is_featured))
      const normal   = sortByName(list.filter(b => !b.is_featured))
      return [...featured, ...normal]
    }

    if (reset) {
      setBusinesses(sortMixed(data))
      setLoading(false)
      // 총 개수 가져오기 (카테고리 탭 표시용)
      if (!q.trim()) {
        getBusinessesCount(cat === 'all' ? undefined : cat).then(c => setTotalCount(c))
      } else {
        searchBusinessesCount(q.trim()).then(c => setTotalCount(c))
      }
    } else {
      setBusinesses(prev => {
        const newData = [...prev, ...data]
        const featured = sortByName(newData.filter(b => b.is_featured))
        const normal   = sortByName(newData.filter(b => !b.is_featured))
        return [...featured, ...normal]
      })
      setLoadingMore(false)
      if (!reset) setPage(p => p + 1)
    }

    setHasMore(data.length === PAGE_SIZE)
  }, [page])

  // 카테고리 카운트 (한번만)
  useEffect(() => {
    // 전체 count
    getBusinessesCount().then(total => {
      setCatCounts(prev => ({ ...prev, all: total }))
    })
    // 카테고리별 count 병렬 로드
    const cats = CATEGORIES.filter(c => c.id !== 'all')
    Promise.all(
      cats.map(c => getBusinessesCount(c.id).then(n => ({ id: c.id, n })))
    ).then(results => {
      const counts: Record<string, number> = {}
      results.forEach(r => { counts[r.id] = r.n })
      setCatCounts(prev => ({ ...prev, ...counts }))
    })
    // 초기 10개 — 추천 가나다/ABC순, 부족하면 일반 가나다/ABC순으로 채움
    getBusinesses(undefined, 0, 200).then(data => {
      const featured = sortByName(data.filter(b => b.is_featured))
      const normal   = sortByName(data.filter(b => !b.is_featured))
      if (featured.length >= 10) setInitialTen(featured.slice(0, 10))
      else setInitialTen([...featured, ...normal].slice(0, 10))
    })
  }, [])

  // 카테고리 정렬
  useEffect(() => {
    const [allCat, ...rest] = CATEGORIES
    const sorted = [...rest].sort((a, b) => (catCounts[b.id] || 0) - (catCounts[a.id] || 0))
    setSortedCategories([allCat, ...sorted])
  }, [catCounts])

  // 검색어/카테고리 변경 시 재로드
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setShowAll(false)
      loadData(category, search, true)
    }, search.trim() ? 400 : 0)
  }, [category, search])

  // 무한 스크롤 — IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current || !showAll) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setPage(p => {
          const nextPage = p + 1
          setLoadingMore(true)
          const q = search.trim()
          const cat = category
          Promise.resolve().then(async () => {
            let data: Business[]
            if (q) data = await searchBusinesses(q, nextPage, PAGE_SIZE)
            else data = await getBusinesses(cat === 'all' ? undefined : cat, nextPage, PAGE_SIZE)
            setBusinesses(prev => {
                const newData = [...prev, ...data]
                const featured = sortByName(newData.filter(b => b.is_featured))
                const normal   = sortByName(newData.filter(b => !b.is_featured))
                return [...featured, ...normal]
              })
            setLoadingMore(false)
            setHasMore(data.length === PAGE_SIZE)
          })
          return nextPage
        })
      }
    }, { threshold: 0.1 })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [showAll, hasMore, loadingMore, loading, search, category])

  // 북마크
  useEffect(() => {
    const handler = (e: Event) => {
      const { count } = (e as CustomEvent).detail
      setBookmarkCount(count)
      if (serviceTab === 'bookmarks') {
        const ids = getBookmarks()
        setBookmarked(businesses.filter(b => ids.includes(b.id)))
      }
    }
    window.addEventListener('bookmark-change', handler)
    return () => window.removeEventListener('bookmark-change', handler)
  }, [serviceTab, businesses])

  useEffect(() => {
    if (serviceTab !== 'bookmarks') return
    const ids = getBookmarks()
    setBookmarkCount(ids.length)
    if (ids.length === 0) { setBookmarked([]); return }
    // 북마크는 전체에서 가져와야 해서 별도 로드
    getBusinesses(undefined, 0, 1000).then(all => {
      setBookmarked(all.filter(b => ids.includes(b.id)))
    })
  }, [serviceTab])

  const isSearch    = !!search.trim()
  const isCatFilter = category !== 'all'
  const isFiltered  = isSearch || isCatFilter

  return (
    <div style={{ minHeight:'100dvh', background:colors.bgPage, fontFamily:ff, paddingBottom:40 }}>
      <style>{`
        .chip-btn { transition: all .12s; -webkit-tap-highlight-color: transparent; }
        .svc-btn  { transition: all .12s; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .cat-scroll { overflow-x:auto; scrollbar-width:thin; scrollbar-color:${colors.gray300} ${colors.bgPage}; }
        .cat-scroll::-webkit-scrollbar { height:4px; }
        .cat-scroll::-webkit-scrollbar-track { background:${colors.bgPage}; border-radius:2px; }
        .cat-scroll::-webkit-scrollbar-thumb { background:${colors.gray300}; border-radius:2px; }
      `}</style>

      {/* ── 스티키 헤더 ── */}
      <div style={{
        position:'sticky', top:0, zIndex:10,
        background:colors.bgCard,
        borderBottom:`1px solid ${colors.border}`,
        padding:`${spacing[3]}px ${spacing[4]}px ${spacing[3]}px`,
      }}>
        {/* 전체/북마크/비상연락처 탭 */}
        <div style={{ display:'flex', gap:spacing[2], marginBottom:spacing[3] }}>
          {(['all', 'bookmarks', 'emergency'] as ServiceTab[]).map(tab => {
            const isActive = serviceTab === tab
            const iconName = tab === 'all' ? 'ph:list-bullets' : tab === 'bookmarks' ? 'ph:bookmark-simple-fill' : 'ph:bell-fill'
            const label = tab === 'all' ? '전체 업종' : tab === 'bookmarks' ? `내 북마크${bookmarkCount > 0 ? ` (${bookmarkCount})` : ''}` : '비상연락처'
            const activeColor = tab === 'emergency' ? colors.danger : colors.primary
            const iconColor = isActive ? (tab === 'emergency' ? colors.danger : colors.primary) : tab === 'bookmarks' ? '#FFB800' : tab === 'emergency' ? colors.danger : colors.textTertiary
            return (
              <button key={tab} onClick={() => { setServiceTab(tab); setShowAll(false) }}
                className="svc-btn"
                style={{
                  height:34, padding:`0 ${spacing[3]}px`, borderRadius:radius.full,
                  cursor:'pointer', fontSize:font.size.sm, fontWeight:font.weight.bold,
                  background: isActive ? (tab === 'emergency' ? colors.dangerLight : colors.primaryLight) : colors.bgCard,
                  color: isActive ? activeColor : colors.textSecondary,
                  border: isActive ? `1.5px solid ${activeColor}` : `1px solid ${colors.border}`,
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
        {serviceTab === 'all' && (<>
        <div style={{
          display:'flex', alignItems:'center', gap:spacing[2],
          background:colors.bgCard, borderRadius:radius.sm, padding:`0 ${spacing[3]}px`,
          border:`1.5px solid ${colors.border}`, height:42,
          marginBottom:spacing[3],
        }}>
          <Icon icon="ph:magnifying-glass" width={16} height={16} color={colors.textTertiary} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowAll(false) }}
            placeholder="업체명, 키워드 검색..."
            style={{
              flex:1, border:'none', outline:'none',
              fontSize:font.size.md, color:colors.textPrimary, background:'transparent', fontFamily:ff,
            }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setShowAll(false) }}
              style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
              <Icon icon="ph:x-circle" width={16} height={16} color={colors.textTertiary} />
            </button>
          )}
        </div>
        {/* 카테고리 가로 스크롤 유지 */}
        <div className="cat-scroll" style={{ display:'flex', gap:spacing[2], paddingBottom:4 }}>
          {sortedCategories.map(cat => {
            const isActive = category === cat.id
            const count = catCounts[cat.id] || 0
            if (cat.id !== 'all' && count === 0) return null
            return (
              <button key={cat.id} className="chip-btn svc-btn"
                onClick={() => { setCategory(cat.id); setShowAll(false) }}
                style={{
                  height:34, borderRadius:radius.sm,
                  background: isActive ? colors.primary : colors.bgCard,
                  color: isActive ? '#fff' : colors.gray600,
                  fontSize:font.size.xs, fontWeight:font.weight.bold,
                  cursor:'pointer', flexShrink:0, minWidth:72,
                  border: isActive ? `2px solid ${colors.primary}` : `1px solid ${colors.gray300}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  whiteSpace:'nowrap', fontFamily:ff,
                  WebkitTapHighlightColor:'transparent',
                }}>
                {cat.label}
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
              <SectionLabel icon="ph:bookmark-simple-fill" label={`내 북마크 (${bookmarked.length})`} color="#1B6EF3" />
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {sortByName(bookmarked).map(b => <BusinessCard key={b.id} business={b} />)}
              </div>
            </>
          )
        )}


        {/* 비상연락처 탭 */}
        {serviceTab === 'emergency' && <EmergencyTab />}

        {/* 검색/카테고리 결과 + 무한스크롤 */}
        {serviceTab === 'all' && isFiltered && (
          <>
            <SectionLabel
              icon={isSearch ? 'ph:magnifying-glass' : 'ph:list-bullets'}
              label={isSearch
                ? `검색 결과 (${totalCount})`
                : `${CATEGORIES.find(c=>c.id===category)?.label ?? ''} (${totalCount})`}
              color="#64748B"
            />
            {loading ? <LoadingState /> : businesses.length === 0 ? <EmptyState /> : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {businesses.map(b => <BusinessCard key={b.id} business={b} />)}
              </div>
            )}
            {/* 무한스크롤 트리거 */}
            <div ref={loaderRef} style={{ height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {loadingMore && <Icon icon="ph:spinner" width={20} height={20} color="#94A3B8" style={{ animation:'spin 1s linear infinite' }} />}
            </div>
          </>
        )}

        {serviceTab === 'all' && !isFiltered && (
          <>
            {/* 처음 10개 */}
            {!showAll && (
              <>
                <SectionLabel icon="ph:shuffle" label="이런 업체 어때요?" color="#64748B" />
                {loading ? <LoadingState /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {initialTen.map(b => <BusinessCard key={b.id} business={b} />)}
                  </div>
                )}
                <button onClick={() => { setShowAll(true); loadData(category, search, true) }} style={{
                  width:'100%', marginTop:spacing[3], height:48,
                  background:colors.bgCard, border:`1px solid ${colors.border}`, borderRadius:radius.md,
                  cursor:'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', gap:spacing[2],
                  fontSize:font.size.md, fontWeight:font.weight.bold, color:colors.primary,
                  WebkitTapHighlightColor:'transparent', fontFamily:ff,
                }}>
                  <Icon icon="ph:list-bullets" width={16} height={16} color={colors.primary} />
                  더 많은 업체 보기 ({totalCount > 10 ? totalCount - 10 : ''})
                  <Icon icon="ph:caret-down" width={14} height={14} color={colors.primary} />
                </button>
              </>
            )}

            {/* 전체 목록 — 무한스크롤 */}
            {showAll && (
              <>
                <SectionLabel icon="ph:list-bullets" label={`전체 업체 (${totalCount})`} color="#64748B" />
                {loading ? <LoadingState /> : businesses.length === 0 ? <EmptyState /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {businesses.map(b => <BusinessCard key={b.id} business={b} />)}
                  </div>
                )}
                {/* 무한스크롤 트리거 */}
                <div ref={loaderRef} style={{ height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {loadingMore && <Icon icon="ph:spinner" width={20} height={20} color="#94A3B8" style={{ animation:'spin 1s linear infinite' }} />}
                </div>
              </>
            )}
          </>
        )}
      </div>
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
    color: '#1B6EF3',
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
