import { useState, useEffect, useMemo, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import { Business, getBusinesses, searchBusinesses } from '../lib/businessService'
import { getBookmarks } from '../lib/businessBookmarks'
import BusinessCard from '../components/BusinessCard'
import CategoryFilter from '../components/CategoryFilter'

type Props = { onSelectBusiness: (id: string) => void; onBack: () => void }
type ServiceTab = 'all' | 'bookmarks' | 'emergency'

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

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
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('all')
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAll, setShowAll]       = useState(false)
  const [bookmarked, setBookmarked] = useState<Business[]>([])
  const [bookmarkCount, setBookmarkCount] = useState(() => getBookmarks().length)

  // 전체 데이터 최초 1회 로드
  useEffect(() => {
    setLoading(true)
    getBusinesses().then(data => {
      setAllBusinesses(data)
      setLoading(false)
    })
  }, [])

  // 북마크 변경 이벤트 실시간 감지
  useEffect(() => {
    const handler = (e: Event) => {
      const { count } = (e as CustomEvent).detail
      setBookmarkCount(count)
      // 북마크 탭이면 목록도 즉시 갱신
      if (serviceTab === 'bookmarks') {
        const ids = getBookmarks()
        setBookmarked(allBusinesses.filter(b => ids.includes(b.id)))
      }
    }
    window.addEventListener('bookmark-change', handler)
    return () => window.removeEventListener('bookmark-change', handler)
  }, [serviceTab, allBusinesses])

  // 북마크 탭 진입 시 로드
  useEffect(() => {
    if (serviceTab !== 'bookmarks') return
    const ids = getBookmarks()
    setBookmarkCount(ids.length)
    if (ids.length === 0) { setBookmarked([]); return }
    setBookmarked(allBusinesses.filter(b => ids.includes(b.id)))
  }, [serviceTab, allBusinesses])

  // 카테고리별 업체 수 계산
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allBusinesses.length }
    allBusinesses.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1
    })
    return counts
  }, [allBusinesses])

  // 카테고리 내용 많은 순 정렬 (all 제외)
  const sortedCategories = useMemo(() => {
    const [allCat, ...rest] = CATEGORIES
    const sorted = [...rest].sort((a, b) => (catCounts[b.id] || 0) - (catCounts[a.id] || 0))
    return [allCat, ...sorted]
  }, [catCounts])

  // 검색 필터링
  const searchFiltered = useMemo(() => {
    if (!search.trim()) return allBusinesses
    const q = search.trim().toLowerCase()
    return allBusinesses.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q) ||
      b.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [search, allBusinesses])

  // 카테고리 필터링
  const filtered = useMemo(() => {
    if (category === 'all') return searchFiltered
    return searchFiltered.filter(b => b.category === category)
  }, [searchFiltered, category])

  // 정렬된 결과
  const sorted = useMemo(() => sortByName(filtered), [filtered])

  // 랜덤 10개 (전체 탭, 검색 없을 때)
  const randomTen = useMemo(() => pickRandom(allBusinesses, 10), [allBusinesses])

  const isSearch    = !!search.trim()
  const isCatFilter = category !== 'all'
  const isFiltered  = isSearch || isCatFilter

  return (
    <div style={{ minHeight:'100vh', background:'#E8EDF3', fontFamily:ff, paddingBottom:40 }}>

      {/* ── 스티키 헤더 ── */}
      <div style={{
        position:'sticky', top:0, zIndex:10,
        background:'rgba(232,237,243,0.97)', backdropFilter:'blur(10px)',
        padding:'12px 16px 12px',
        borderBottom:'1.5px solid #D1D9E3',
        boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
      }}>
        {/* 전체/북마크/비상연락처 탭 */}
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          {(['all', 'bookmarks', 'emergency'] as ServiceTab[]).map(tab => (
            <button key={tab} onClick={() => { setServiceTab(tab); setShowAll(false) }} style={{
              height:32, padding:'0 14px', borderRadius:10, border:'none',
              cursor:'pointer', fontSize:13, fontWeight:700,
              background: serviceTab === tab ? '#1B6EF3' : '#fff',
              color: serviceTab === tab ? '#fff' : '#64748B',
              boxShadow: serviceTab === tab ? '0 2px 8px rgba(27,110,243,0.25)' : '0 1px 3px rgba(0,0,0,0.07)',
              display:'flex', alignItems:'center', gap:5,
            }}>
              <Icon icon={tab === 'all' ? 'ph:list-bullets' : tab === 'bookmarks' ? 'ph:bookmark-simple-fill' : 'ph:phone-call'}
                width={13} height={13}
                color={tab === 'bookmarks' && serviceTab !== tab ? '#DC2626' : tab === 'emergency' && serviceTab !== tab ? '#DC2626' : serviceTab === tab ? '#fff' : '#94A3B8'} />
              {tab === 'all' ? '전체 업체' : tab === 'bookmarks' ? `내 북마크${bookmarkCount > 0 ? ` (${bookmarkCount})` : ''}` : '비상연락처'}
            </button>
          ))}
        </div>

        {/* 검색창 — 전체 탭만 */}
        {serviceTab === 'all' && (<>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'#fff', borderRadius:12, padding:'0 12px',
          border:'1.5px solid #D1D9E3', height:42,
          boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
          marginBottom:10,
        }}>
          <Icon icon="ph:magnifying-glass" width={16} height={16} color="#94A3B8" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowAll(false) }}
            placeholder="업체명, 키워드 검색..."
            style={{
              flex:1, border:'none', outline:'none',
              fontSize:14, color:'#1E293B', background:'transparent', fontFamily:ff,
            }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setShowAll(false) }}
              style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
              <Icon icon="ph:x-circle" width={16} height={16} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* 카테고리 필터 — 개수 뱃지 포함, 많은 순 정렬 — 전체 탭만 */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, paddingTop:6 }}>
          {sortedCategories.map(cat => {
            const isActive = category === cat.id
            const count = catCounts[cat.id] || 0
            if (cat.id !== 'all' && count === 0) return null
            return (
              <button key={cat.id}
                onClick={() => { setCategory(cat.id); setShowAll(false) }}
                style={{
                  position:'relative',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                  width:64, padding:'8px 4px', borderRadius:10, flexShrink:0,
                  background: isActive ? '#1B6EF3' : '#fff',
                  color: isActive ? '#fff' : '#64748B',
                  border: isActive ? 'none' : '1.5px solid #D1D9E3',
                  fontSize:10, fontWeight:700, cursor:'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(27,110,243,0.20)' : '0 2px 6px rgba(0,0,0,0.07)',
                  transition:'all 0.15s',
                }}>
                {/* 노란 뱃지 */}
                {cat.id !== 'all' && count > 0 && (
                  <div style={{
                    position:'absolute', top:-5, right:-5,
                    background:'#FFB800', color:'#fff',
                    borderRadius:999, minWidth:16, height:16,
                    fontSize:9, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    padding:'0 3px', lineHeight:1,
                    boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                  }}>
                    {count > 99 ? '99+' : count}
                  </div>
                )}
                <Icon icon={CAT_ICONS[cat.id] ?? 'ph:star'} width={18} height={18}
                  color={isActive ? '#fff' : '#94A3B8'} />
                <span style={{ fontSize:10, textAlign:'center', wordBreak:'keep-all', lineHeight:1.3, whiteSpace:'pre-wrap' }}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
        </>)}
      </div>

      {/* ── 콘텐츠 ── */}
      <div style={{ padding:'16px 16px 0' }}>

        {/* 북마크 탭 */}
        {serviceTab === 'bookmarks' && (
          bookmarked.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 0' }}>
              <Icon icon="ph:bookmark-simple" width={48} height={48} color="#CBD5E1" />
              <div style={{ marginTop:14, fontSize:15, fontWeight:700, color:'#64748B' }}>저장된 업체가 없어요</div>
              <div style={{ marginTop:6, fontSize:13, color:'#94A3B8' }}>업체 카드의 북마크 버튼을 눌러 저장하세요</div>
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

        {/* 검색 결과 */}
        {serviceTab === 'all' && isSearch && (
          <>
            <SectionLabel icon="ph:magnifying-glass" label={`검색 결과 (${sorted.length})`} color="#64748B" />
            {loading ? <LoadingState /> : sorted.length === 0 ? <EmptyState /> : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {sorted.map(b => <BusinessCard key={b.id} business={b} />)}
              </div>
            )}
          </>
        )}

        {serviceTab === 'all' && !isSearch && isCatFilter && (
          <>
            <SectionLabel icon="ph:list-bullets"
              label={`${CATEGORIES.find(c=>c.id===category)?.label ?? ''} (${sorted.length})`}
              color="#64748B" />
            {loading ? <LoadingState /> : sorted.length === 0 ? <EmptyState /> : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {sorted.map(b => <BusinessCard key={b.id} business={b} />)}
              </div>
            )}
          </>
        )}

        {serviceTab === 'all' && !isFiltered && (
          <>
            {/* 랜덤 10개 */}
            {!showAll && (
              <>
                <SectionLabel icon="ph:shuffle" label="이런 업체 어때요?" color="#64748B" />
                {loading ? <LoadingState /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {sortByName(randomTen).map(b => <BusinessCard key={b.id} business={b} />)}
                  </div>
                )}
                <button onClick={() => setShowAll(true)} style={{
                  width:'100%', marginTop:14, height:48,
                  background:'#fff', border:'1.5px solid #D1D9E3', borderRadius:12,
                  cursor:'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8,
                  fontSize:14, fontWeight:700, color:'#1B6EF3',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <Icon icon="ph:list-bullets" width={16} height={16} color="#1B6EF3" />
                  더 많은 업체 보기 ({allBusinesses.length - 10})
                  <Icon icon="ph:caret-down" width={14} height={14} color="#94A3B8" />
                </button>
              </>
            )}

            {/* 전체 목록 */}
            {showAll && (
              <>
                <SectionLabel icon="ph:list-bullets" label={`전체 업체 (${sorted.length})`} color="#64748B" />
                {loading ? <LoadingState /> : sorted.length === 0 ? <EmptyState /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {sorted.map(b => <BusinessCard key={b.id} business={b} />)}
                  </div>
                )}
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
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
      <Icon icon={icon} width={15} height={15} color={color} />
      <span style={{ fontSize:13, fontWeight:800, color, letterSpacing:0.2 }}>{label}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          background:'#fff', borderRadius:12, padding:'20px 16px',
          boxShadow:'0 2px 8px rgba(0,0,0,0.06)', opacity:0.6,
        }}>
          <div style={{ height:14, width:'55%', background:'#E2E8F0', borderRadius:6, marginBottom:10 }}/>
          <div style={{ height:10, width:'35%', background:'#F1F5F9', borderRadius:6, marginBottom:8 }}/>
          <div style={{ height:10, width:'80%', background:'#F1F5F9', borderRadius:6 }}/>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign:'center', padding:'48px 0', color:'#94A3B8', fontSize:14, fontWeight:600 }}>
      <Icon icon="ph:magnifying-glass" width={36} height={36} color="#CBD5E1" />
      <div style={{ marginTop:12 }}>검색 결과가 없어요</div>
    </div>
  )
}

// ══════════════════════════════════════════
// 비상연락처 탭
// ══════════════════════════════════════════
const EMERGENCY_DATA = [
  {
    section: '🚨 긴급 상황 (전국 공통)',
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
    section: '🚑 의료 / 병원',
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
    section: '🔥 화재 / 재난',
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
    section: '🚗 로드사이드 어시스턴스',
    color: '#2563EB',
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
    section: '💊 정신건강 / 위기상담',
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
    section: '🧒 아동 / 가정 문제',
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    items: [
      { label: 'Kids Helpline', number: '1800 55 1800', desc: '아동·청소년 상담' },
      { label: 'Domestic Violence', number: '1800 737 732', desc: '가정폭력 상담' },
    ],
  },
  {
    section: '🧳 여행자 / 외국인',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    items: [
      { label: '통역 서비스', number: '13 14 50', desc: 'Interpreter Service' },
      { label: '영사관 긴급', number: '1300 555 135', desc: '호주 정부 영사 긴급' },
    ],
  },
  {
    section: '⚡ 유틸리티 사고',
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
  const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'
  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 안내 배너 */}
      <div style={{
        background:'linear-gradient(135deg,#DC2626,#B91C1C)',
        borderRadius:14, padding:'16px', marginBottom:16,
        display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{ fontSize:32 }}>🇦🇺</div>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:2 }}>호주 긴급 전화번호</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.85)', lineHeight:1.5 }}>전화번호를 누르면 바로 연결돼요</div>
        </div>
      </div>

      {EMERGENCY_DATA.map((group, gi) => (
        <div key={gi} style={{ marginBottom:14 }}>
          {/* 섹션 헤더 */}
          <div style={{
            fontSize:13, fontWeight:800, color: group.color,
            marginBottom:8, paddingLeft:2,
          }}>{group.section}</div>

          {/* 카드 */}
          <div style={{
            background:'#fff', borderRadius:12, overflow:'hidden',
            border:`1.5px solid ${group.border}`,
            boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
          }}>
            {group.items.map((item, ii) => (
              <a
                key={ii}
                href={`tel:${item.number.replace(/\s/g, '')}`}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'13px 16px',
                  borderBottom: ii < group.items.length - 1 ? '1px solid #F1F5F9' : 'none',
                  textDecoration:'none',
                  background: 'transparent',
                }}
              >
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1E293B', fontFamily:ff }}>{item.label}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', marginTop:2, fontFamily:ff }}>{item.desc}</div>
                </div>
                <div style={{
                  display:'flex', alignItems:'center', gap:6,
                  background: group.bg, borderRadius:10,
                  padding:'8px 12px', flexShrink:0,
                }}>
                  <Icon icon="ph:phone-call" width={14} height={14} color={group.color} />
                  <span style={{ fontSize:14, fontWeight:800, color: group.color, fontFamily:ff, letterSpacing:0.3 }}>{item.number}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* 하단 안내 */}
      <div style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:12 }}>
        긴급 상황 시 망설이지 말고 000에 전화하세요
      </div>
    </div>
  )
}
