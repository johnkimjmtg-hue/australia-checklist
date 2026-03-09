import { useState, useEffect, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import { Business, getBusinesses, searchBusinesses } from '../lib/businessService'
import BusinessCard from '../components/BusinessCard'
import CategoryFilter from '../components/CategoryFilter'

type Props = { onSelectBusiness: (id: string) => void; onBack: () => void }

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
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('all')
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAll, setShowAll]       = useState(false)

  // 전체 데이터 최초 1회 로드
  useEffect(() => {
    setLoading(true)
    getBusinesses().then(data => {
      setAllBusinesses(data)
      setLoading(false)
    })
  }, [])

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
        padding:'12px 16px 10px',
        borderBottom:'1.5px solid #D1D9E3',
        boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
      }}>
        {/* 검색창 */}
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

        {/* 카테고리 필터 — 개수 뱃지 포함, 많은 순 정렬 */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
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
                  padding:'8px 10px', borderRadius:10, flexShrink:0,
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
                <span style={{ fontSize:10, textAlign:'center', wordBreak:'keep-all', lineHeight:1.2 }}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 콘텐츠 ── */}
      <div style={{ padding:'16px 16px 0' }}>

        {/* 검색 결과 */}
        {isSearch && (
          <>
            <SectionLabel icon="ph:magnifying-glass" label={`검색 결과 (${sorted.length})`} color="#64748B" />
            {loading ? <LoadingState /> : sorted.length === 0 ? <EmptyState /> : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {sorted.map(b => <BusinessCard key={b.id} business={b} />)}
              </div>
            )}
          </>
        )}

        {/* 카테고리 필터 결과 */}
        {!isSearch && isCatFilter && (
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

        {/* 전체 보기 */}
        {!isFiltered && (
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
