import { useState, useEffect } from 'react'
import { CATEGORIES } from '../data/businesses'
import { Business, getBusinesses, getFeaturedBusinesses, searchBusinesses } from '../lib/businessService'
import BusinessCard from '../components/BusinessCard'
import CategoryFilter from '../components/CategoryFilter'
import SearchBar from '../components/SearchBar'

type Props = {
  onSelectBusiness: (id: string) => void
  onBack: () => void
}

export default function Services({ onSelectBusiness, onBack }: Props) {
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('all')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [featured, setFeatured]     = useState<Business[]>([])
  const [loading, setLoading]       = useState(true)

  // 추천 업체 최초 1회 로드
  useEffect(() => {
    getFeaturedBusinesses().then(setFeatured)
  }, [])

  // 카테고리/검색어 변경 시 업체 재조회
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

    // 검색어 디바운스 300ms
    const timer = setTimeout(fetch, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, category])

  const isFiltered = !!search || category !== 'all'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg,#eef2fa 0%,#f3f6fb 50%,#f5f7fb 100%)',
      fontFamily: '-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      paddingBottom: 40,
    }}>

      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(238,242,250,0.95)', backdropFilter: 'blur(10px)',
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(200,215,240,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, padding: 0, color: '#1E4D83',
          }}>←</button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#0F1B2D' }}>업체/서비스 찾기</div>
            <div style={{ fontSize: 11, color: '#7a8fb5', fontWeight: 600 }}>📍 Sydney 한인 업체</div>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* 추천 업체 — 필터 없을 때만 */}
        {!isFiltered && featured.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle>⭐ 추천 업체</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {featured.map(b => (
                <BusinessCard key={b.id} business={b} onClick={onSelectBusiness} />
              ))}
            </div>
          </div>
        )}

        {/* 전체 / 필터 결과 */}
        <div>
          <SectionTitle>
            {isFiltered
              ? `🔎 검색 결과 (${businesses.length})`
              : `📋 전체 업체 (${businesses.length})`
            }
          </SectionTitle>

          {loading ? (
            <LoadingState />
          ) : businesses.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {businesses.map(b => (
                <BusinessCard key={b.id} business={b} onClick={onSelectBusiness} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 900, color: '#1E4D83',
      marginBottom: 12, letterSpacing: 0.3,
    }}>{children}</div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          background: '#fff', borderRadius: 16, padding: '20px 16px',
          boxShadow: '0 2px 10px rgba(30,77,131,0.07)',
          opacity: 0.6,
        }}>
          <div style={{ height: 14, width: '60%', background: 'rgba(180,205,240,0.4)', borderRadius: 6, marginBottom: 10 }}/>
          <div style={{ height: 10, width: '40%', background: 'rgba(180,205,240,0.3)', borderRadius: 6, marginBottom: 8 }}/>
          <div style={{ height: 10, width: '80%', background: 'rgba(180,205,240,0.3)', borderRadius: 6 }}/>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 0',
      color: '#aab', fontSize: 14, fontWeight: 700,
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
      검색 결과가 없어요
    </div>
  )
}
