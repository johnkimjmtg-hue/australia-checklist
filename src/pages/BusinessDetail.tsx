import { useState, useEffect } from 'react'
import { CATEGORIES } from '../data/businesses'
import { Business, Review, getBusiness, getReviews, addReview } from '../lib/businessService'

type Props = {
  businessId: string
  onBack: () => void
}

export default function BusinessDetail({ businessId, onBack }: Props) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [reviews, setReviews]   = useState<Review[]>([])
  const [loading, setLoading]   = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewName, setReviewName]   = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [b, r] = await Promise.all([
        getBusiness(businessId),
        getReviews(businessId),
      ])
      setBusiness(b)
      setReviews(r)
      setLoading(false)
    }
    load()
  }, [businessId])

  const handleSubmitReview = async () => {
    if (!reviewName.trim() || !reviewContent.trim()) return
    setSubmitting(true)
    const r = await addReview({
      business_id: businessId,
      author_name: reviewName.trim(),
      rating: reviewRating,
      content: reviewContent.trim(),
    })
    if (r) {
      setReviews(prev => [r, ...prev])
      // 평점 갱신
      const updated = await getBusiness(businessId)
      if (updated) setBusiness(updated)
    }
    setReviewName(''); setReviewContent(''); setReviewRating(5)
    setShowReviewForm(false); setSubmitting(false)
  }

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
          <div style={{ fontSize:13, color:'#f5a623', fontWeight:800 }}>
            ⭐ {business.rating}
            <span style={{ color:'#aab', fontWeight:600, fontSize:12 }}> ({business.reviews_count} reviews)</span>
          </div>
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
        <Section title="📝 업체 소개">
          <p style={{ fontSize:13, color:'#4a5a6a', lineHeight:1.8, margin:0 }}>{business.description}</p>
        </Section>

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

        {/* 리뷰 */}
        <Section title={`⭐ 리뷰 (${reviews.length})`}>
          <button
            onClick={() => setShowReviewForm(v => !v)}
            style={{
              width:'100%', padding:'10px', marginBottom:16,
              background:'rgba(200,218,248,0.4)', border:'1px dashed rgba(30,77,131,0.2)',
              borderRadius:10, color:'#1E4D83', fontWeight:800, fontSize:13, cursor:'pointer',
            }}
          >✏️ 리뷰 작성하기</button>

          {showReviewForm && (
            <div style={{
              background:'rgba(238,245,255,0.8)', borderRadius:12, padding:16, marginBottom:16,
              border:'1px solid rgba(30,77,131,0.12)',
            }}>
              <input
                placeholder="이름"
                value={reviewName}
                onChange={e => setReviewName(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display:'flex', gap:8, margin:'10px 0' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)} style={{
                    fontSize:20, background:'none', border:'none', cursor:'pointer',
                    opacity: n <= reviewRating ? 1 : 0.3,
                  }}>⭐</button>
                ))}
              </div>
              <textarea
                placeholder="리뷰 내용을 입력해 주세요"
                value={reviewContent}
                onChange={e => setReviewContent(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize:'none' }}
              />
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                style={{
                  width:'100%', marginTop:10, padding:'11px',
                  background:'linear-gradient(135deg,#3A7FCC,#1E4D83)',
                  color:'#fff', border:'none', borderRadius:10,
                  fontWeight:800, fontSize:13, cursor:'pointer',
                  opacity: submitting ? 0.6 : 1,
                }}
              >{submitting ? '제출 중...' : '리뷰 등록'}</button>
            </div>
          )}

          {reviews.length === 0 ? (
            <div style={{ textAlign:'center', color:'#aab', fontSize:13, padding:'20px 0' }}>
              아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {reviews.map(r => (
                <div key={r.id} style={{
                  background:'#fff', borderRadius:10, padding:'12px 14px',
                  border:'1px solid rgba(200,215,240,0.5)',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontWeight:800, fontSize:13, color:'#0F1B2D' }}>{r.author_name}</span>
                    <span style={{ fontSize:12, color:'#f5a623' }}>{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#4a5a6a', lineHeight:1.7, margin:0 }}>{r.content}</p>
                  <div style={{ fontSize:10, color:'#bbc', marginTop:6 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
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

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'10px 12px',
  border:'1px solid rgba(30,77,131,0.15)', borderRadius:8,
  fontSize:13, color:'#0F1B2D', background:'#fff',
  fontFamily:'-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
  boxSizing:'border-box', outline:'none',
}
