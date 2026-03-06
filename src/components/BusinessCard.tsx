import { Business } from '../lib/businessService'

type Props = {
  business: Business
  onClick: (id: string) => void
}

export default function BusinessCard({ business, onClick }: Props) {
  const { name, description, phone, website, kakao, address, city, rating, reviews_count, is_featured, tags } = business

  const fullAddress = [address, city].filter(Boolean).join(', ')
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  return (
    <div
      onClick={() => onClick(business.id)}
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '16px',
        boxShadow: is_featured
          ? '0 4px 20px rgba(30,77,131,0.13)'
          : '0 2px 10px rgba(30,77,131,0.07)',
        border: is_featured ? '1.5px solid rgba(30,77,131,0.18)' : '1px solid rgba(200,215,240,0.5)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      {/* 추천 뱃지 */}
      {is_featured && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'linear-gradient(135deg,#3A7FCC,#1E4D83)',
          color: '#fff', fontSize: 10, fontWeight: 800,
          borderRadius: 20, padding: '3px 9px', letterSpacing: 0.5,
        }}>⭐ 추천</div>
      )}

      {/* 업체명 */}
      <div style={{ fontSize: 15, fontWeight: 900, color: '#0F1B2D', marginBottom: 4 }}>{name}</div>

      {/* 주소 - 클릭하면 구글맵 */}
      {fullAddress && (
        <a
          href={mapsUrl!}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 12, color: '#3a7fcc', fontWeight: 600, textDecoration: 'none', display: 'block', marginBottom: 8 }}
        >
          📍 {fullAddress}
        </a>
      )}

      {/* 설명 */}
      <div style={{ fontSize: 12, color: '#4a5a6a', lineHeight: 1.6, marginBottom: 10 }}>
        {description}
      </div>

      {/* 태그 */}
      {tags && tags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              background: 'rgba(200,218,248,0.5)',
              color: '#3a5fa5', fontSize: 10, fontWeight: 700,
              borderRadius: 6, padding: '3px 8px',
            }}>{tag}</span>
          ))}
        </div>
      )}

      {/* 평점 */}
      <div style={{ fontSize: 12, color: '#f5a623', fontWeight: 800, marginBottom: 12 }}>
        ⭐ {rating} <span style={{ color: '#aab', fontWeight: 600 }}>({reviews_count} reviews)</span>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
        {phone && (
          <a href={`tel:${phone}`} style={btnStyle('#1E4D83', '#fff')}>📞 전화</a>
        )}
        {kakao && (
          <a href={`https://open.kakao.com/o/${kakao}`} target="_blank" rel="noreferrer" style={btnStyle('#FEE500', '#3C1E1E')}>
            💬 카톡
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noreferrer" style={btnStyle('rgba(200,218,248,0.6)', '#1E4D83')}>
            🌐 웹사이트
          </a>
        )}
      </div>
    </div>
  )
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color,
    fontSize: 11, fontWeight: 800,
    borderRadius: 8, padding: '7px 12px',
    textDecoration: 'none', border: 'none',
    cursor: 'pointer', whiteSpace: 'nowrap',
  }
}
