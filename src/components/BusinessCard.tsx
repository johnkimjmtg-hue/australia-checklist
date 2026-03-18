import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Business } from '../lib/businessService'
import { isBookmarked, toggleBookmark } from '../lib/businessBookmarks'
import BusinessShareModal from './BusinessShareModal'

type Props = { business: Business }

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

export default function BusinessCard({ business }: Props) {
  const { name, description, phone, website, kakao, address, city, is_featured, tags } = business
  const fullAddress = address || ''
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  const [expanded, setExpanded]             = useState(false)
  const [showPhone, setShowPhone]           = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [bookmarked, setBookmarked]         = useState(() => isBookmarked(business.id))
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const btnBase: React.CSSProperties = {
    display:'flex', alignItems:'center', justifyContent:'center', gap:5,
    height:36, padding:'0 14px', borderRadius:8,
    fontSize:12, fontWeight:700, cursor:'pointer',
    border:'1.5px solid #D1D9E3', whiteSpace:'nowrap', fontFamily:ff,
    color:'#1E293B', background:'#fff',
  }

  const btnBlue: React.CSSProperties = {
    ...btnBase,
    background:'#1B6EF3', color:'#fff', border:'none',
    
  }

  // 버튼 순서: 전화, 경로, 웹사이트, 카톡, 구글리뷰, 공유 (없는건 스킵)
  const allButtons = [
    phone ? (
      isMobile ? (
        <a key="phone" href={`tel:${phone}`} style={{ ...btnBlue, textDecoration:'none' }}>
          <Icon icon="ph:phone" width={13} height={13} color="#fff" />전화하기
        </a>
      ) : (
        <div key="phone" style={{ position:'relative' }}>
          <button onClick={() => setShowPhone(v => !v)} style={{ ...btnBlue }}>
            <Icon icon="ph:phone" width={13} height={13} color="#fff" />전화하기
          </button>
          {showPhone && (
            <div style={{ position:'absolute', bottom:'110%', left:0, background:'#1E293B', color:'#fff', padding:'8px 14px', borderRadius:10, fontSize:13, fontWeight:700, whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', zIndex:50 }}>{phone}</div>
          )}
        </div>
      )
    ) : null,
    mapsUrl ? (
      <a key="map" href={mapsUrl} target="_blank" rel="noreferrer" style={{ ...btnBase, textDecoration:'none' }}>
        <Icon icon="ph:navigation-arrow" width={13} height={13} color="#475569" />경로찾기
      </a>
    ) : null,
    website ? (
      <a key="web" href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer" style={{ ...btnBase, textDecoration:'none' }}>
        <Icon icon="ph:globe" width={13} height={13} color="#475569" />웹사이트
      </a>
    ) : null,
    kakao ? (
      <a key="kakao" href={`https://open.kakao.com/o/${kakao}`} target="_blank" rel="noreferrer"
        style={{ ...btnBase, background:'#FEE500', color:'#3C1E1E', border:'1.5px solid #F0D800', textDecoration:'none' }}>
        <Icon icon="ph:chat-circle" width={13} height={13} color="#3C1E1E" />카톡
      </a>
    ) : null,
    business.google_place_id ? (
      <a key="google" href={`https://search.google.com/local/reviews?placeid=${business.google_place_id}`} target="_blank" rel="noreferrer" style={{ ...btnBase, textDecoration:'none' }}>
        <Icon icon="ph:star-fill" width={13} height={13} color="#FFB800" />구글 리뷰
      </a>
    ) : null,
    <button key="share" onClick={() => setShowShareModal(true)} style={{ ...btnBase }}>
      <Icon icon="ph:share-network" width={13} height={13} color="#475569" />공유
    </button>,
  ].filter(Boolean)

  const visibleButtons = expanded ? allButtons : allButtons.slice(0, 3)

  return (
    <>
      {showShareModal && (
        <BusinessShareModal business={business} onClose={() => setShowShareModal(false)} />
      )}

      <div style={{
        background:'#fff', borderRadius:14,
        overflow:'hidden',
        borderLeft: is_featured ? '4px solid #1B6EF3' : '4px solid #CBD5E1',
        border: '1px solid #E2E8F0',
        borderLeft: is_featured ? '4px solid #1B6EF3' : '4px solid #CBD5E1',
      }}>
        <div style={{ padding:'16px' }}>

          {/* 업체명 + 펼쳐보기 아이콘 + 북마크 */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:17, fontWeight:800, color:'#0F172A', flex:1, paddingRight:8 }}>{name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0 }}>
              <button
                onClick={() => { setExpanded(v => !v) }}
                style={{
                  background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:8,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'transform 0.2s',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                <Icon icon="ph:caret-down" width={18} height={18} color="#94A3B8" />
              </button>
              <button onClick={() => setBookmarked(toggleBookmark(business.id))} style={{
                background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:8,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon icon={bookmarked ? 'ph:bookmark-simple-fill' : 'ph:bookmark-simple'}
                  width={20} height={20} color={bookmarked ? '#FFB800' : '#CBD5E1'} />
              </button>
            </div>
          </div>

          {/* 구글 별점 */}
          {business.google_rating && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <StarRating rating={business.google_rating} />
              <span style={{ fontSize:12, fontWeight:700, color:'#0F172A' }}>{business.google_rating.toFixed(1)}</span>
              {business.google_review_count && (
                <span style={{ fontSize:11, color:'#94A3B8' }}>({business.google_review_count.toLocaleString()})</span>
              )}
            </div>
          )}

          {/* 주소 */}
          {fullAddress && (
            <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8 }}>
              <Icon icon="ph:map-pin-simple" width={13} height={13} color="#64748B" />
              <span style={{ fontSize:12, color:'#475569', fontWeight:500 }}>{fullAddress}</span>
            </div>
          )}

          {/* 설명 — 접힌 상태: 2줄 제한 */}
          {description && (
            <div style={{
              fontSize:13, color:'#334155', lineHeight:1.6, marginBottom:10,
              ...(expanded ? {} : {
                display:'-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any,
                overflow:'hidden',
              }),
            }}>{description}</div>
          )}

          {/* 해시태그 — 접힌 상태: 3개, 펼친 상태: 전체 */}
          {tags && tags.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10, marginTop:12 }}>
              {(expanded ? tags : tags.slice(0, 3)).map(tag => (
                <span key={tag} style={{ background:'#EFF6FF', color:'#1B6EF3', fontSize:11, fontWeight:700, borderRadius:6, padding:'4px 10px', border:'1px solid #BFDBFE' }}>{tag}</span>
              ))}
              {!expanded && tags.length > 3 && (
                <span style={{ fontSize:11, color:'#94A3B8', fontWeight:600, padding:'4px 2px' }}>+{tags.length - 3}</span>
              )}
            </div>
          )}

          {/* 버튼 라인 */}
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {visibleButtons}
          </div>
        </div>
      </div>
    </>
  )
}

// ── 별점 컴포넌트
function StarRating({ rating }: { rating: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const fill = Math.min(1, Math.max(0, rating - (i - 1)))
    const pct = Math.round(fill * 100)
    stars.push(
      <div key={i} style={{ position:'relative', width:14, height:14, flexShrink:0 }}>
        {/* 회색 별 (배경) */}
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ position:'absolute', top:0, left:0 }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#E2E8F0" />
        </svg>
        {/* 노란 별 (채움) */}
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ position:'absolute', top:0, left:0, clipPath:`inset(0 ${100 - pct}% 0 0)` }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFB800" />
        </svg>
      </div>
    )
  }
  return <div style={{ display:'flex', gap:2 }}>{stars}</div>
}
