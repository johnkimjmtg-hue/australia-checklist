import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { CATEGORIES } from '../data/businesses'
import { Business, getBusinesses, getFeaturedBusinesses, searchBusinesses } from '../lib/businessService'
import { getBookmarks } from '../lib/businessBookmarks'
import BusinessCard from '../components/BusinessCard'
import CategoryFilter from '../components/CategoryFilter'

type Props = { onSelectBusiness: (id: string) => void; onBack: () => void }
type ServiceTab = 'all' | 'bookmarks'

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

export default function Services({ onSelectBusiness, onBack }: Props) {
  const [serviceTab, setServiceTab]   = useState<ServiceTab>('all')
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('all')
  const [businesses, setBusinesses]   = useState<Business[]>([])
  const [featured, setFeatured]       = useState<Business[]>([])
  const [bookmarked, setBookmarked]   = useState<Business[]>([])
  const [loading, setLoading]         = useState(true)
  const [showAll, setShowAll]         = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(() => getBookmarks().length)

  useEffect(() => {
    getFeaturedBusinesses().then(setFeatured)
  }, [])

  useEffect(() => {
    setLoading(true)
    const run = async () => {
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
    const t = setTimeout(run, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search, category])

  // 북마크 탭 진입 시 북마크된 업체 로드
  useEffect(() => {
    if (serviceTab !== 'bookmarks') return
    const ids = getBookmarks()
    setBookmarkCount(ids.length)
    if (ids.length === 0) { setBookmarked([]); return }
    getBusinesses('all').then(all => {
      setBookmarked(all.filter(b => ids.includes(b.id)))
    })
  }, [serviceTab])

  const isSearch    = !!search.trim()
  const isCatFilter = category !== 'all'
  const isFiltered  = isSearch || isCatFilter

  return (
    <div style={{ minHeight:'100vh', background:'#F1F5F9', fontFamily:ff, paddingBottom:40 }}>

      {/* ── 스티키 헤더 ── */}
      <div style={{
        position:'sticky', top:0, zIndex:10,
        background:'rgba(241,245,249,0.97)', backdropFilter:'blur(10px)',
        padding:'12px 16px 10px',
        borderBottom:'1px solid #E2E8F0',
      }}>

        {/* 전체/북마크 탭 */}
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          {(['all','bookmarks'] as ServiceTab[]).map(tab => {
            const isBookmarkTab = tab === 'bookmarks'
            const isActive = serviceTab === tab
            const activeColor = isBookmarkTab ? '#DC2626' : '#1B6EF3'
            const activeShadow = isBookmarkTab ? '0 2px 8px rgba(220,38,38,0.25)' : '0 2px 8px rgba(27,110,243,0.25)'
            return (
              <button key={tab} onClick={() => setServiceTab(tab)} style={{
                height:32, padding:'0 14px', borderRadius:10, border:'none',
                cursor:'pointer', fontSize:13, fontWeight:700,
                background: isActive ? activeColor : '#fff',
                color: isActive ? '#fff' : '#64748B',
                boxShadow: isActive ? activeShadow : '0 1px 3px rgba(0,0,0,0.07)',
                display:'flex', alignItems:'center', gap:5,
              }}>
                <Icon icon={isBookmarkTab ? 'ph:bookmark-simple-fill' : 'ph:list-bullets'}
                  width={13} height={13} color={isActive ? '#fff' : (isBookmarkTab ? '#DC2626' : '#94A3B8')} />
                {tab === 'all' ? '전체 업체' : `내 북마크 ${bookmarkCount > 0 ? `(${bookmarkCount})` : ''}`}
              </button>
            )
          })}
        </div>

        {/* 전체 탭에서만 검색창 + 카테고리 필터 */}
        {serviceTab === 'all' && (
          <>
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background:'#fff', borderRadius:10, padding:'0 12px',
              border:'1px solid #E2E8F0', height:40,
              boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
              marginBottom:10,
            }}>
              <Icon icon="ph:magnifying-glass" width={16} height={16} color="#94A3B8" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowAll(true) }}
                placeholder="업체명, 키워드 검색..."
                style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#1E293B', background:'transparent', fontFamily:ff }}
              />
              {search && (
                <button onClick={() => { setSearch(''); setShowAll(false) }}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                  <Icon icon="ph:x-circle" width={16} height={16} color="#94A3B8" />
                </button>
              )}
            </div>
            <CategoryFilter selected={category} onChange={c => { setCategory(c); setShowAll(false) }} />
          </>
        )}
      </div>

      {/* ── 콘텐츠 ── */}
      <div style={{ padding:'16px 16px 0' }}>

        {/* ── 북마크 탭 ── */}
        {serviceTab === 'bookmarks' && (
          <>
            {bookmarked.length === 0 ? (
              <div style={{ textAlign:'center', padding:'64px 0', color:'#94A3B8' }}>
                <Icon icon="ph:bookmark-simple" width={48} height={48} color="#CBD5E1" />
                <div style={{ marginTop:14, fontSize:15, fontWeight:700, color:'#64748B' }}>저장된 업체가 없어요</div>
                <div style={{ marginTop:6, fontSize:13, color:'#94A3B8' }}>업체 카드의 북마크 버튼을 눌러 저장하세요</div>
              </div>
            ) : (
              <>
                <SectionLabel icon="ph:bookmark-simple-fill" label={`내 북마크 (${bookmarked.length})`} color="#1B6EF3" />
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {bookmarked.map(b => <BusinessCard key={b.id} business={b} />)}
                </div>
              </>
            )}
          </>
        )}

        {/* ── 전체 탭 ── */}
        {serviceTab === 'all' && (
          <>
            {/* 검색 결과 */}
            {isSearch && (
              <>
                <SectionLabel icon="ph:magnifying-glass" label={`검색 결과 (${businesses.length})`} color="#64748B" />
                {loading ? <LoadingState /> : businesses.length === 0 ? <EmptyState /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {businesses.map(b => <BusinessCard key={b.id} business={b} />)}
                  </div>
                )}
              </>
            )}

            {/* 카테고리 필터 결과 */}
            {!isSearch && isCatFilter && (
              <>
                <SectionLabel icon="ph:list-bullets" label={`${CATEGORIES.find(c=>c.id===category)?.label ?? ''} (${businesses.length})`} color="#64748B" />
                {loading ? <LoadingState /> : businesses.length === 0 ? <EmptyState /> : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {businesses.map(b => <BusinessCard key={b.id} business={b} />)}
                  </div>
                )}
              </>
            )}

            {/* 전체 보기 */}
            {!isFiltered && (
              <>
                {featured.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {featured.map(b => <BusinessCard key={b.id} business={b} />)}
                  </div>
                )}
                {!showAll && (
                  <button onClick={() => setShowAll(true)} style={{
                    width:'100%', marginTop:14, height:48,
                    background:'#fff', border:'none', borderRadius:12,
                    cursor:'pointer', display:'flex', alignItems:'center',
                    justifyContent:'center', gap:8,
                    fontSize:14, fontWeight:700, color:'#1B6EF3',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <Icon icon="ph:list-bullets" width={16} height={16} color="#1B6EF3" />
                    더 많은 업체 보기
                    <Icon icon="ph:caret-down" width={14} height={14} color="#94A3B8" />
                  </button>
                )}
                {showAll && (
                  <div style={{ marginTop:14 }}>
                    <SectionLabel icon="ph:list-bullets" label={`전체 업체 (${businesses.length})`} color="#64748B" />
                    {loading ? <LoadingState /> : businesses.length === 0 ? <EmptyState /> : (
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {businesses.filter(b => !featured.some(f => f.id === b.id)).map(b => <BusinessCard key={b.id} business={b} />)}
                      </div>
                    )}
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
