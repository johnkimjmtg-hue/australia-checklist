import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Business } from '../lib/businessService'

type Props = { business: Business; onClick: (id: string) => void }

export default function BusinessCard({ business, onClick }: Props) {
  const { name, description, phone, website, kakao, address, city, rating, reviews_count, is_featured, tags } = business
  const fullAddress = [address, city].filter(Boolean).join(', ')
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  return (
    <div onClick={() => onClick(business.id)} style={{
      background: '#fff',
      borderRadius: 12,
      padding: '16px',
      boxShadow: is_featured
        ? '0 4px 20px rgba(0,53,148,0.10),0 1px 4px rgba(0,0,0,0.06)'
        : '0 2px 8px rgba(0,0,0,0.06)',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      transition: 'transform 0.15s',
    }}>
      {/* 추천 뱃지 */}
      {is_featured && (
        <div style={{
          position:'absolute', top:12, right:12,
          background:'#003594', color:'#FFCD00',
          fontSize:10, fontWeight:800,
          borderRadius:20, padding:'3px 10px',
        }}>추천</div>
      )}

      {/* 업체명 */}
      <div style={{ fontSize:16, fontWeight:800, color:'#1E293B', marginBottom:4, paddingRight: is_featured ? 50 : 0 }}>{name}</div>

      {/* 주소 — 물방울 위치 아이콘 */}
      {fullAddress && (
        <a href={mapsUrl!} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8, textDecoration:'none' }}>
          <Icon icon="ph:map-pin-simple" width={13} height={13} color="#94A3B8" />
          <span style={{ fontSize:12, color:'#64748B', fontWeight:500 }}>{fullAddress}</span>
        </a>
      )}

      {/* 설명 */}
      {description && (
        <div style={{ fontSize:13, color:'#64748B', lineHeight:1.6, marginBottom:10 }}>{description}</div>
      )}

      {/* 태그 */}
      {tags && tags.length > 0 && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              background:'rgba(0,53,148,0.07)', color:'#003594',
              fontSize:10, fontWeight:700, borderRadius:6, padding:'3px 8px',
            }}>{tag}</span>
          ))}
        </div>
      )}

      {/* 평점 */}
      {(rating > 0) && (
        <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:12 }}>
          <Icon icon="ph:star-fill" width={13} height={13} color="#FFCD00" />
          <span style={{ fontSize:12, fontWeight:800, color:'#1E293B' }}>{rating}</span>
          {reviews_count > 0 && (
            <span style={{ fontSize:11, color:'#94A3B8', fontWeight:500 }}>({reviews_count})</span>
          )}
        </div>
      )}

      {/* 버튼들 */}
      <div style={{ display:'flex', gap:7, flexWrap:'wrap' }} onClick={e => e.stopPropagation()}>
        {phone && <PhoneButton phone={phone} />}
        {kakao && (
          <a href={`https://open.kakao.com/o/${kakao}`} target="_blank" rel="noreferrer"
            style={btnStyle('#FEE500','#3C1E1E')}>
            <Icon icon="ph:chat-circle" width={13} height={13} color="#3C1E1E" />
            카톡
          </a>
        )}
        {website && (
          <a href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank" rel="noreferrer"
            style={btnStyle('rgba(0,53,148,0.08)','#003594')}>
            <Icon icon="ph:globe" width={13} height={13} color="#003594" />
            웹사이트
          </a>
        )}
      </div>
    </div>
  )
}

function PhoneButton({ phone }: { phone: string }) {
  const [showNumber, setShowNumber] = useState(false)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  if (isMobile) {
    return (
      <a href={`tel:${phone}`} style={btnStyle('#003594','#fff')}>
        <Icon icon="ph:phone" width={13} height={13} color="#fff" />
        전화
      </a>
    )
  }

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button onClick={() => setShowNumber(v => !v)}
        style={{ ...btnStyle('#003594','#fff'), border:'none', cursor:'pointer' }}>
        <Icon icon="ph:phone" width={13} height={13} color="#fff" />
        전화
      </button>
      {showNumber && (
        <div style={{
          position:'absolute', bottom:'110%', left:0,
          background:'#1E293B', color:'#fff',
          padding:'8px 14px', borderRadius:10,
          fontSize:13, fontWeight:700, whiteSpace:'nowrap',
          boxShadow:'0 4px 16px rgba(0,0,0,0.2)', zIndex:50,
        }}>{phone}</div>
      )}
    </div>
  )
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color,
    fontSize: 12, fontWeight: 700,
    borderRadius: 8, padding: '7px 12px',
    textDecoration: 'none', border: 'none',
    cursor: 'pointer', whiteSpace: 'nowrap',
    display: 'flex', alignItems: 'center', gap: 5,
  }
}
