import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import { Business, getBusinesses, getFeaturedBusinesses, searchBusinesses } from '../lib/businessService'
import BusinessCard from '../components/BusinessCard'
import CategoryFilter from '../components/CategoryFilter'

type Props = { onSelectBusiness: (id: string) => void; onBack: () => void }

export default function Services({ onSelectBusiness, onBack }: Props) {
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('all')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [featured, setFeatured]     = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAll, setShowAll]       = useState(false)

  useEffect(() => {
    getFeaturedBusinesses().then(setFeatured)
  }, [])

  useEffect(() => {
    setLoading(true)
    const fetch = async () => {
      let data: Business[]
      if (search.trim()) {
        data = await searchBusinesses(search.trim())
        if (category !== 'all') data = data.filter(b => b.category === category)
      } else {
        data = await getBusinesses(category)
      }
      setBusinesses(data)
      setLoading(false)
    }
    const timer = setTimeout(fetch, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, category])

  const isFiltered = !!search || category !== 'all'
  const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F1F5F9',
      fontFamily: ff,
      paddingBottom: 40,
    }}>

      {/* ── 스티키 헤더 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(241,245,249,0.97)', backdropFilter: 'blur(10px)',
        padding: '12px 16px 10px',
        borderBottom: '1px solid #E2E8F0',
      }}>
        {/* 검색창 */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <button onClick={onBack} style={{
            background:'none', border:'none', cursor:'pointer',
            padding:0, color:'#003594', flexShrink:0, display:'flex', alignItems:'center',
          }}>
            <Icon icon="ph:arrow-left" width={22} height={22} color="#003594" />
          </button>
          <div style={{
            flex:1, display:'flex', alignItems:'center', gap:8,
            background:'#fff', borderRadius:10, padding:'0 12px',
            border:'1px solid #E2E8F0', height:40,
            boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <Icon icon="ph:magnifying-glass" width={16} height={16} color="#94A3B8" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowAll(true) }}
              placeholder="업체명, 키워드 검색..."
              style={{
                flex:1, border:'none', outline:'none', fontSize:14,
                color:'#1E293B', background:'transparent',
                fontFamily: ff,
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                <Icon icon="ph:x-circle" width={16} height={16} color="#94A3B8" />
              </button>
            )}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <CategoryFilter selected={category} onChange={c => { setCategory(c); setShowAll(false) }} />
      </div>

      {/* ── 콘텐츠 ── */}
      <div style={{ padding:'16px 16px 0' }}>

        {/* 기본화면: 추천 업체만 */}
        {!isFiltered && !showAll && (
          <>
            {featured.length > 0 ? (
              <>
                <SectionLabel icon="ph:seal-check" label="추천 업체" color="#003594" />
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {featured.map(b => (
                    <BusinessCard key={b.id} business={b} onClick={onSelectBusiness} />
                  ))}
                </div>

                {/* 더 많은 업체 보기 버튼 */}
                <button onClick={() => setShowAll(true)} style={{
                  width:'100%', marginTop:16, height:48,
                  background:'#fff', border:'1px solid #E2E8F0',
                  borderRadius:12, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  fontSize:14, fontWeight:700, color:'#003594',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <Icon icon="ph:list-bullets" width={16} height={16} color="#003594" />
                  더 많은 업체 보기
                  <Icon icon="ph:caret-down" width={14} height={14} color="#94A3B8" />
                </button>
              </>
            ) : (
              <EmptyState />
            )}
          </>
        )}

        {/* 전체 보기 or 검색/필터 결과 */}
        {(isFiltered || showAll) && (
          <>
            {/* 추천 업체 (필터 없을 때만) */}
            {!isFiltered && showAll && featured.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <SectionLabel icon="ph:seal-check" label="추천 업체" color="#003594" />
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {featured.map(b => (
                    <BusinessCard key={b.id} business={b} onClick={onSelectBusiness} />
                  ))}
                </div>
              </div>
            )}

            <SectionLabel
              icon={isFiltered ? 'ph:magnifying-glass' : 'ph:list-bullets'}
              label={isFiltered ? `검색 결과 (${businesses.length})` : `전체 업체 (${businesses.length})`}
              color="#64748B"
            />

            {loading ? (
              <LoadingState />
            ) : businesses.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {businesses.map(b => (
                  <BusinessCard key={b.id} business={b} onClick={onSelectBusiness} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
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
