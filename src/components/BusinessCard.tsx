import { Business } from '../data/businesses'

type Props = {
  business: Business
  onClick: (id: string) => void
}

export default function BusinessCard({ business, onClick }: Props) {
  const { name, category, description, phone, website, kakao, city, rating, reviews, isFeatured, tags } = business

  return (
    <div
      onClick={() => onClick(business.id)}
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '16px',
        boxShadow: isFeatured
          ? '0 4px 20px rgba(30,77,131,0.13)'
          : '0 2px 10px rgba(30,77,131,0.07)',
        border: isFeatured ? '1.5px solid rgba(30,77,131,0.18)' : '1px solid rgba(200,215,240,0.5)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      {/* 추천 뱃지 */}
      {isFeatured && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'linear-gradient(135deg,#3A7FCC,#1E4D83)',
          color: '#fff', fontSize: 10, fontWeight: 800,
          borderRadius: 20, padding: '3px 9px', letterSpacing: 0.5,
        }}>⭐ 추천</div>
      )}

      {/* 업체명 + 위치 */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#0F1B2D', marginBottom: 3 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#7a8fb5', fontWeight: 600 }}>📍 {city}</div>
      </div>

      {/* 설명 */}
      <div style={{ fontSize: 12, color: '#4a5a6a', lineHeight: 1.6, marginBottom: 10 }}>
        {description}
      </div>

      {/* 태그 */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            background: 'rgba(200,218,248,0.5)',
            color: '#3a5fa5', fontSize: 10, fontWeight: 700,
            borderRadius: 6, padding: '3px 8px',
          }}>{tag}</span>
        ))}
      </div>

      {/* 평점 */}
      <div style={{ fontSize: 12, color: '#f5a623', fontWeight: 800, marginBottom: 12 }}>
        ⭐ {rating} <span style={{ color: '#aab', fontWeight: 600 }}>({reviews} reviews)</span>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
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
