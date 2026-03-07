import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Business, Review, getReviews, addReview } from '../lib/businessService'

type Props = { business: Business }

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

export default function BusinessCard({ business }: Props) {
  const { name, description, phone, website, kakao, address, city, rating, reviews_count, is_featured, tags } = business
  const fullAddress = [address, city].filter(Boolean).join(', ')
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  const [showReviews, setShowReviews] = useState(false)
  const [reviews, setReviews]         = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [showForm, setShowForm]       = useState(false)
  const [authorName, setAuthorName]   = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [content, setContent]         = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [showPhone, setShowPhone]     = useState(false)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const handleToggleReviews = async () => {
    if (!showReviews && reviews.length === 0) {
      setLoadingReviews(true)
      const data = await getReviews(business.id)
      setReviews(data)
      setLoadingReviews(false)
    }
    setShowReviews(v => !v)
    setShowForm(false)
  }

  const handleSubmitReview = async () => {
    if (!authorName.trim() || !content.trim()) return
    setSubmitting(true)
    const newReview = await addReview({
      business_id: business.id,
      author_name: authorName.trim(),
      rating: reviewRating,
      content: content.trim(),
    })
    if (newReview) {
      setReviews(prev => [newReview, ...prev])
      setAuthorName(''); setContent(''); setReviewRating(5)
      setShowForm(false)
    }
    setSubmitting(false)
  }

  const btnBase: React.CSSProperties = {
    display:'flex', alignItems:'center', justifyContent:'center', gap:5,
    height:34, padding:'0 12px', borderRadius:8,
    fontSize:12, fontWeight:700, cursor:'pointer',
    border:'none', whiteSpace:'nowrap', fontFamily:ff,
    boxShadow:'0 2px 6px rgba(0,0,0,0.09)',
  }

  return (
    <div style={{
      background:'#fff', borderRadius:12,
      boxShadow: is_featured
        ? '0 4px 20px rgba(0,53,148,0.10),0 1px 4px rgba(0,0,0,0.06)'
        : '0 2px 8px rgba(0,0,0,0.06)',
      overflow:'hidden',
    }}>
      <div style={{ padding:'16px' }}>

        {/* 업체명 + 추천 뱃지 */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#1E293B', flex:1, paddingRight:8 }}>{name}</div>
          {is_featured && (
            <div style={{
              background:'#003594', color:'#FFCD00',
              fontSize:10, fontWeight:800,
              borderRadius:20, padding:'3px 10px', flexShrink:0,
            }}>추천</div>
          )}
        </div>

        {/* 주소 — 구글맵 링크 없음 */}
        {fullAddress && (
          <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8 }}>
            <Icon icon="ph:map-pin-simple" width={13} height={13} color="#94A3B8" />
            <span style={{ fontSize:12, color:'#64748B' }}>{fullAddress}</span>
          </div>
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
        {rating > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:12 }}>
            <Icon icon="ph:star-fill" width={13} height={13} color="#FFCD00" />
            <span style={{ fontSize:12, fontWeight:800, color:'#1E293B' }}>{rating}</span>
            {reviews_count > 0 && (
              <span style={{ fontSize:11, color:'#94A3B8' }}>({reviews_count})</span>
            )}
          </div>
        )}

        {/* 버튼 행 */}
        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
          {/* 전화 */}
          {phone && (
            isMobile ? (
              <a href={`tel:${phone}`} style={{ ...btnBase, background:'#fff', color:'#1E293B', textDecoration:'none' }}>
                <Icon icon="ph:phone" width={13} height={13} color="#64748B" />전화
              </a>
            ) : (
              <div style={{ position:'relative' }}>
                <button onClick={() => setShowPhone(v => !v)}
                  style={{ ...btnBase, background:'#fff', color:'#1E293B' }}>
                  <Icon icon="ph:phone" width={13} height={13} color="#64748B" />전화
                </button>
                {showPhone && (
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
          )}

          {/* 카톡 — 노란색 유지 */}
          {kakao && (
            <a href={`https://open.kakao.com/o/${kakao}`} target="_blank" rel="noreferrer"
              style={{ ...btnBase, background:'#FEE500', color:'#3C1E1E', textDecoration:'none' }}>
              <Icon icon="ph:chat-circle" width={13} height={13} color="#3C1E1E" />카톡
            </a>
          )}

          {/* 웹사이트 */}
          {website && (
            <a href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank" rel="noreferrer"
              style={{ ...btnBase, background:'#fff', color:'#1E293B', textDecoration:'none' }}>
              <Icon icon="ph:globe" width={13} height={13} color="#64748B" />웹사이트
            </a>
          )}

          {/* 경로 — 구글맵 */}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noreferrer"
              style={{ ...btnBase, background:'#fff', color:'#1E293B', textDecoration:'none' }}>
              <Icon icon="ph:navigation-arrow" width={13} height={13} color="#64748B" />경로
            </a>
          )}

          {/* 리뷰 */}
          <button onClick={handleToggleReviews}
            style={{ ...btnBase, background: showReviews ? '#003594' : '#fff', color: showReviews ? '#fff' : '#1E293B' }}>
            <Icon icon="ph:chat-dots" width={13} height={13} color={showReviews ? '#fff' : '#64748B'} />
            리뷰{reviews_count > 0 ? ` (${reviews_count})` : ''}
          </button>
        </div>
      </div>

      {/* ── 리뷰 패널 (인라인) ── */}
      {showReviews && (
        <div style={{
          borderTop:'1px solid #F1F5F9',
          background:'#F8FAFC',
          padding:'14px 16px',
        }}>
          {/* 리뷰 작성 토글 */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>리뷰</span>
            <button onClick={() => setShowForm(v => !v)} style={{
              background: showForm ? '#E2E8F0' : '#003594',
              color: showForm ? '#64748B' : '#fff',
              border:'none', borderRadius:8, padding:'5px 12px',
              fontSize:11, fontWeight:700, cursor:'pointer',
            }}>
              {showForm ? '취소' : '리뷰 쓰기'}
            </button>
          </div>

          {/* 리뷰 작성 폼 */}
          {showForm && (
            <div style={{
              background:'#fff', borderRadius:10, padding:'12px',
              marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <input
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="이름 (닉네임)"
                style={{
                  width:'100%', height:36, border:'1px solid #E2E8F0',
                  borderRadius:8, padding:'0 10px', fontSize:13,
                  marginBottom:8, boxSizing:'border-box', fontFamily:ff, outline:'none',
                }}
              />
              {/* 별점 */}
              <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:2 }}>
                    <Icon icon={s <= reviewRating ? 'ph:star-fill' : 'ph:star'} width={20} height={20}
                      color={s <= reviewRating ? '#FFCD00' : '#CBD5E1'} />
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="후기를 남겨주세요"
                rows={3}
                style={{
                  width:'100%', border:'1px solid #E2E8F0', borderRadius:8,
                  padding:'8px 10px', fontSize:13, resize:'none',
                  boxSizing:'border-box', fontFamily:ff, outline:'none',
                  marginBottom:8,
                }}
              />
              <button onClick={handleSubmitReview} disabled={submitting || !authorName.trim() || !content.trim()}
                style={{
                  width:'100%', height:36, background:'#003594', color:'#fff',
                  border:'none', borderRadius:8, fontSize:13, fontWeight:700,
                  cursor:'pointer', opacity: (!authorName.trim() || !content.trim()) ? 0.5 : 1,
                }}>
                {submitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          )}

          {/* 리뷰 목록 */}
          {loadingReviews ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:13 }}>
              <Icon icon="ph:circle-notch" width={20} height={20} color="#94A3B8" />
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign:'center', padding:'16px 0', color:'#94A3B8', fontSize:13 }}>
              아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {reviews.map(r => (
                <div key={r.id} style={{
                  background:'#fff', borderRadius:10, padding:'10px 12px',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1E293B' }}>{r.author_name}</span>
                    <div style={{ display:'flex', gap:2 }}>
                      {[1,2,3,4,5].map(s => (
                        <Icon key={s} icon={s <= r.rating ? 'ph:star-fill' : 'ph:star'}
                          width={11} height={11} color={s <= r.rating ? '#FFCD00' : '#E2E8F0'} />
                      ))}
                    </div>
                  </div>
                  {r.content && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6 }}>{r.content}</div>}
                  {r.created_at && (
                    <div style={{ fontSize:10, color:'#CBD5E1', marginTop:4 }}>
                      {new Date(r.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
