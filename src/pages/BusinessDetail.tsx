import { useState, useEffect } from 'react'
import { CATEGORIES } from '../data/businesses'
import { Business, getBusiness } from '../lib/businessService'

type Props = {
  businessId: string
  onBack: () => void
}

export default function BusinessDetail({ businessId, onBack }: Props) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getBusiness(businessId).then(b => { setBusiness(b); setLoading(false) })
  }, [businessId])

  const catInfo = CATEGORIES.find(c => c.id === business?.category)

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif' }}>
      <div style={{ color:'#8AAAC8', fontSize:14, fontWeight:700 }}>불러오는 중...</div>
    </div>
  )

  if (!business) return (
    <div style={{ padding:32, textAlign:'center', color:'#aab', fontSize:14,
      fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif' }}>
      업체를 찾을 수 없어요.
      <br/>
      <button onClick={onBack} style={{ marginTop:16, color:'#1E4D83', background:'none', border:'none', cursor:'pointer', fontWeight:800 }}>← 돌아가기</button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg,#eef2fa 0%,#f3f6fb 100%)',
      fontFamily: '-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
      paddingBottom: 40,
    }}>

      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(238,242,250,0.95)', backdropFilter: 'blur(10px)',
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(200,215,240,0.4)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, padding:0, color:'#1E4D83' }}>←</button>
        <div style={{ fontSize:16, fontWeight:900, color:'#0F1B2D' }}>{business.name}</div>
      </div>

      <div style={{ padding: '24px 16px 0' }}>

        {/* 업체 헤더 카드 */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '24px 20px',
          boxShadow: '0 4px 20px rgba(30,77,131,0.10)',
          marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{
            width:64, height:64, borderRadius:20,
            background:'linear-gradient(135deg,rgba(200,218,248,0.6),rgba(168,200,240,0.4))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, margin:'0 auto 14px',
          }}>{catInfo?.emoji}</div>

          <div style={{ fontSize:20, fontWeight:900, color:'#0F1B2D', marginBottom:4 }}>{business.name}</div>
          <div style={{ fontSize:12, color:'#7a8fb5', fontWeight:700, marginBottom:8 }}>
            {catInfo?.label} · 📍 {business.city}
          </div>
          {business.google_rating && (
            <div style={{ fontSize:13, color:'#f5a623', fontWeight:800 }}>
              ⭐ {business.google_rating}
              <span style={{ color:'#aab', fontWeight:600, fontSize:12 }}> ({business.google_review_count} Google 리뷰)</span>
            </div>
          )}
          {business.is_featured && (
            <div style={{
              display:'inline-block', marginTop:10,
              background:'linear-gradient(135deg,#3A7FCC,#1E4D83)',
              color:'#fff', fontSize:10, fontWeight:800,
              borderRadius:20, padding:'4px 12px',
            }}>⭐ 추천 업체</div>
          )}
        </div>

        {/* 소개 */}
        {business.description && (
          <Section title="📝 업체 소개">
            <p style={{ fontSize:13, color:'#4a5a6a', lineHeight:1.8, margin:0 }}>{business.description}</p>
          </Section>
        )}

        {/* 서비스 태그 */}
        {business.tags?.length > 0 && (
          <Section title="🛠 서비스">
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {business.tags.map(tag => (
                <span key={tag} style={{
                  background:'rgba(200,218,248,0.5)', color:'#3a5fa5',
                  fontSize:12, fontWeight:700, borderRadius:8, padding:'6px 12px',
                }}>{tag}</span>
              ))}
            </div>
          </Section>
        )}

        {/* 위치 */}
        {business.address && (
          <Section title="📍 위치">
            <div style={{ fontSize:13, color:'#4a5a6a', fontWeight:600 }}>{business.address}, {business.city}</div>
          </Section>
        )}

        {/* 문의 */}
        <Section title="📞 문의">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {business.phone && (
              <a href={`tel:${business.phone}`} style={contactBtn('#1E4D83','#fff')}>📞 전화하기 · {business.phone}</a>
            )}
            {business.kakao && (
              <a href={`https://open.kakao.com/o/${business.kakao}`} target="_blank" rel="noreferrer" style={contactBtn('#FEE500','#3C1E1E')}>💬 카카오톡 문의</a>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noreferrer" style={contactBtn('rgba(200,218,248,0.5)','#1E4D83')}>🌐 웹사이트 방문</a>
            )}
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '18px 16px',
      marginBottom: 12, boxShadow: '0 2px 10px rgba(30,77,131,0.06)',
    }}>
      <div style={{ fontSize:13, fontWeight:900, color:'#1E4D83', marginBottom:12 }}>{title}</div>
      {children}
    </div>
  )
}

function contactBtn(bg: string, color: string): React.CSSProperties {
  return {
    display:'block', textAlign:'center',
    background:bg, color,
    fontSize:14, fontWeight:800,
    borderRadius:12, padding:'14px',
    textDecoration:'none',
  }
}
