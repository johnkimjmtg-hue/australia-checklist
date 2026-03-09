import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Business, VOTE_TAGS, getMyVote, getVoteCounts, addVote } from '../lib/businessService'
import { isBookmarked, toggleBookmark } from '../lib/businessBookmarks'

type Props = { business: Business; onClick?: () => void }

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

const CAT_EMOJI: Record<string, string> = {
  realestate:'🏠', lawyer:'⚖️', accounting:'🧾', insurance:'🛡️',
  immigration:'🌏', academy:'🏫', telecom:'📱', travel:'✈️',
  gp:'🏥', dental:'🦷', oriental:'🌿', pharmacy:'💊',
  restaurant:'🍜', cafe:'☕', mart:'🛒', beauty:'💇',
  moving:'📦', handyman:'🔧',
}

export default function BusinessCard({ business, onClick }: Props) {
  const { name, description, address, city, is_featured, tags, category } = business
  const fullAddress = [address, city].filter(Boolean).join(', ')

  const [counts, setCounts]         = useState<Record<string, number> | null>(null)
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(business.id))

  useEffect(() => { getVoteCounts(business.id).then(setCounts) }, [business.id])

  const topTags = counts
    ? Object.entries(counts).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,2)
    : []

  const emoji = CAT_EMOJI[category ?? ''] ?? '🏢'

  return (
    <div onClick={onClick} style={{
      background:'#fff', borderRadius:14, overflow:'hidden', cursor: onClick ? 'pointer' : 'default',
      boxShadow: is_featured
        ? '0 4px 20px rgba(27,110,243,0.10),0 1px 4px rgba(0,0,0,0.06)'
        : '0 2px 8px rgba(0,0,0,0.06)',
      border: is_featured ? '1.5px solid rgba(27,110,243,0.12)' : '1px solid rgba(0,0,0,0.04)',
      fontFamily:ff,
    }}>
      <div style={{ padding:'14px 14px 14px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>

          {/* 이모지 아바타 */}
          <div style={{
            width:44, height:44, borderRadius:12, background:'#F1F5F9',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, flexShrink:0,
          }}>{emoji}</div>

          {/* 내용 */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:15, fontWeight:800, color:'#1E293B' }}>{name}</span>
                {is_featured && (
                  <span style={{ background:'#1B6EF3', color:'#FFCD00', fontSize:9, fontWeight:800, borderRadius:20, padding:'2px 7px' }}>추천</span>
                )}
              </div>
              <button onClick={e => { e.stopPropagation(); setBookmarked(toggleBookmark(business.id)) }} style={{
                background: bookmarked ? 'rgba(220,38,38,0.08)' : 'none',
                border:'none', cursor:'pointer', padding:'3px 5px', borderRadius:7,
                display:'flex', alignItems:'center',
              }}>
                <Icon icon={bookmarked ? 'ph:bookmark-simple-fill' : 'ph:bookmark-simple'}
                  width={17} height={17} color={bookmarked ? '#DC2626' : '#CBD5E1'} />
              </button>
            </div>

            {fullAddress && (
              <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:5 }}>
                <Icon icon="ph:map-pin-simple" width={11} height={11} color="#94A3B8" />
                <span style={{ fontSize:11, color:'#94A3B8' }}>{fullAddress}</span>
              </div>
            )}

            {description && (
              <div style={{ fontSize:12, color:'#64748B', lineHeight:1.5, marginBottom:7,
                overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any,
              }}>{description}</div>
            )}

            {/* 서비스 태그 */}
            {tags && tags.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
                {tags.slice(0,3).map(tag => (
                  <span key={tag} style={{
                    background:'rgba(27,110,243,0.07)', color:'#1B6EF3',
                    fontSize:10, fontWeight:700, borderRadius:6, padding:'2px 7px',
                  }}>{tag}</span>
                ))}
                {tags.length > 3 && (
                  <span style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>+{tags.length-3}</span>
                )}
              </div>
            )}

            {/* 한줄평 인기 태그 */}
            {topTags.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {topTags.map(([tag, count]) => (
                  <span key={tag} style={{
                    background:'#FFF1F2', color:'#E11D48', fontSize:10, fontWeight:700,
                    borderRadius:6, padding:'2px 7px', display:'flex', alignItems:'center', gap:2,
                    border:'1px solid #FECDD3',
                  }}>👍 {tag} {count}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 상세보기 힌트 */}
        {onClick && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
            <span style={{ fontSize:11, color:'#94A3B8', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>
              상세보기 <Icon icon="ph:caret-right" width={11} height={11} color="#94A3B8" />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
