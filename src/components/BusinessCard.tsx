import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Business, VOTE_TAGS, getMyVote, getVoteCounts, addVote } from '../lib/businessService'
import { isBookmarked, toggleBookmark } from '../lib/businessBookmarks'
import BusinessShareModal from './BusinessShareModal'

type Props = { business: Business }

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

const CAT_EMOJI: Record<string, string> = {
  realestate:'🏠', lawyer:'⚖️', accounting:'🧾', insurance:'🛡️',
  immigration:'🌏', academy:'🏫', telecom:'📱', travel:'✈️',
  gp:'🏥', dental:'🦷', oriental:'🌿', pharmacy:'💊',
  restaurant:'🍜', cafe:'☕', mart:'🛒', beauty:'💇',
  moving:'📦', handyman:'🔧',
}

const CAT_GRAD: Record<string, string> = {
  realestate:'linear-gradient(135deg,#667eea,#764ba2)',
  lawyer:'linear-gradient(135deg,#2c3e50,#4a6fa5)',
  accounting:'linear-gradient(135deg,#11998e,#38ef7d)',
  insurance:'linear-gradient(135deg,#1B6EF3,#5b9ef9)',
  immigration:'linear-gradient(135deg,#f093fb,#f5576c)',
  academy:'linear-gradient(135deg,#4facfe,#00f2fe)',
  telecom:'linear-gradient(135deg,#43e97b,#38f9d7)',
  travel:'linear-gradient(135deg,#fa709a,#fee140)',
  gp:'linear-gradient(135deg,#f5af19,#f12711)',
  dental:'linear-gradient(135deg,#89d4cf,#a8edea)',
  oriental:'linear-gradient(135deg,#56ab2f,#a8e063)',
  pharmacy:'linear-gradient(135deg,#ff9a9e,#fecfef)',
  restaurant:'linear-gradient(135deg,#f7971e,#ffd200)',
  cafe:'linear-gradient(135deg,#c79081,#dfa579)',
  mart:'linear-gradient(135deg,#89f7fe,#66a6ff)',
  beauty:'linear-gradient(135deg,#fddb92,#d1fdff)',
  moving:'linear-gradient(135deg,#96fbc4,#f9f586)',
  handyman:'linear-gradient(135deg,#b0bec5,#78909c)',
}

export default function BusinessCard({ business }: Props) {
  const { name, description, phone, website, kakao, address, city, is_featured, tags, category } = business
  const fullAddress = [address, city].filter(Boolean).join(', ')
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  const [showVotes, setShowVotes]           = useState(false)
  const [counts, setCounts]                 = useState<Record<string, number> | null>(null)
  const [loading, setLoading]               = useState(false)
  const [myVote, setMyVote]                 = useState<string | null>(() => getMyVote(business.id))
  const [showResult, setShowResult]         = useState(true)
  const [showPhone, setShowPhone]           = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [bookmarked, setBookmarked]         = useState(() => isBookmarked(business.id))
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  useEffect(() => { getVoteCounts(business.id).then(setCounts) }, [business.id])

  const handleToggleVotes = async () => {
    if (!showVotes && counts === null) {
      setLoading(true)
      setCounts(await getVoteCounts(business.id))
      setLoading(false)
    }
    setShowVotes(v => !v)
  }

  const handleVote = async (e: React.MouseEvent, tag: string) => {
    e.stopPropagation()
    if (myVote) return
    const ok = await addVote(business.id, tag)
    if (ok) {
      setMyVote(tag)
      setCounts(prev => prev ? { ...prev, [tag]: (prev[tag] ?? 0) + 1 } : prev)
    }
  }

  const topTags = counts
    ? Object.entries(counts).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,2)
    : []

  const emoji = CAT_EMOJI[category ?? ''] ?? '🏢'
  const grad  = CAT_GRAD[category ?? ''] ?? 'linear-gradient(135deg,#1B6EF3,#5b9ef9)'

  const actionBtn: React.CSSProperties = {
    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
    background:'#fff', color:'#1E293B', borderRadius:12, padding:'11px',
    textDecoration:'none', fontSize:13, fontWeight:700,
    border:'1px solid #E2E8F0', boxShadow:'0 2px 6px rgba(0,0,0,0.05)',
    cursor:'pointer', fontFamily:ff,
  }

  return (
    <>
      {showShareModal && (
        <BusinessShareModal business={business} counts={counts ?? {}} onClose={() => setShowShareModal(false)} />
      )}

      <div style={{
        background:'#fff', borderRadius:20, fontFamily:ff, overflow:'hidden',
        boxShadow: is_featured
          ? '0 8px 32px rgba(27,110,243,0.13),0 2px 8px rgba(0,0,0,0.06)'
          : '0 4px 16px rgba(0,0,0,0.08)',
        border: is_featured ? '1.5px solid rgba(27,110,243,0.15)' : '1px solid rgba(0,0,0,0.04)',
      }}>

        {/* ── 컬러 헤더 배너 ── */}
        <div style={{ background:grad, padding:'16px 16px 36px', position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            {is_featured
              ? <span style={{ background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)', color:'#fff', fontSize:11, fontWeight:800, borderRadius:20, padding:'4px 12px' }}>⭐ 추천 업체</span>
              : <span/>
            }
            <button onClick={() => setBookmarked(toggleBookmark(business.id))} style={{
              background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)',
              border:'none', cursor:'pointer', borderRadius:10, padding:'6px 8px',
              display:'flex', alignItems:'center',
            }}>
              <Icon icon={bookmarked ? 'ph:bookmark-simple-fill' : 'ph:bookmark-simple'}
                width={18} height={18} color={bookmarked ? '#FF4444' : '#fff'} />
            </button>
          </div>
        </div>

        {/* ── 이모지 아바타 ── */}
        <div style={{ display:'flex', justifyContent:'center', marginTop:-32 }}>
          <div style={{
            width:62, height:62, borderRadius:18, background:'#fff',
            boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:32,
          }}>{emoji}</div>
        </div>

        {/* ── 업체명 + 위치 ── */}
        <div style={{ textAlign:'center', padding:'10px 16px 0' }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#1E293B', letterSpacing:-0.3 }}>{name}</div>
          {fullAddress && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, marginTop:5 }}>
              <Icon icon="ph:map-pin-simple-fill" width={12} height={12} color="#94A3B8" />
              <span style={{ fontSize:12, color:'#94A3B8', fontWeight:500 }}>{fullAddress}</span>
            </div>
          )}
        </div>

        {/* ── 한줄평 인기 태그 ── */}
        {topTags.length > 0 && !showVotes && (
          <div style={{ display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap', padding:'10px 16px 0' }}>
            {topTags.map(([tag, count]) => (
              <span key={tag} style={{
                background:'#FFF1F2', color:'#E11D48', fontSize:11, fontWeight:700,
                borderRadius:20, padding:'4px 10px', display:'flex', alignItems:'center', gap:3,
                border:'1px solid #FECDD3',
              }}>👍 {tag} {count}</span>
            ))}
          </div>
        )}

        {/* ── 섹션들 ── */}
        <div style={{ padding:'14px 14px 16px', display:'flex', flexDirection:'column', gap:10 }}>

          {/* 업체 소개 */}
          {description && (
            <Section icon="ph:info" label="업체 소개">
              <div style={{ fontSize:13, color:'#475569', lineHeight:1.7 }}>{description}</div>
            </Section>
          )}

          {/* 서비스 태그 */}
          {tags && tags.length > 0 && (
            <Section icon="ph:tag" label="서비스">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    background:'#fff', color:'#1E293B', fontSize:11, fontWeight:700,
                    borderRadius:8, padding:'5px 10px', border:'1px solid #E2E8F0',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
                  }}>{tag}</span>
                ))}
              </div>
            </Section>
          )}

          {/* 문의 버튼들 */}
          <Section icon="ph:phone" label="문의">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {phone && (
                isMobile ? (
                  <a href={`tel:${phone}`} style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    background:'linear-gradient(135deg,#1B6EF3,#4B8EF5)', color:'#fff',
                    borderRadius:12, padding:'13px', textDecoration:'none',
                    fontSize:14, fontWeight:700, boxShadow:'0 4px 14px rgba(27,110,243,0.35)',
                  }}>
                    <Icon icon="ph:phone-fill" width={16} height={16} color="#fff" />
                    전화하기 · {phone}
                  </a>
                ) : (
                  <div>
                    <button onClick={() => setShowPhone(v => !v)} style={{
                      width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      background:'linear-gradient(135deg,#1B6EF3,#4B8EF5)', color:'#fff',
                      borderRadius:12, padding:'13px', border:'none', cursor:'pointer',
                      fontSize:14, fontWeight:700, boxShadow:'0 4px 14px rgba(27,110,243,0.35)',
                      fontFamily:ff,
                    }}>
                      <Icon icon="ph:phone-fill" width={16} height={16} color="#fff" />
                      전화하기
                    </button>
                    {showPhone && (
                      <div style={{
                        marginTop:6, background:'#1E293B', color:'#fff', textAlign:'center',
                        padding:'10px 14px', borderRadius:10, fontSize:14, fontWeight:700,
                      }}>{phone}</div>
                    )}
                  </div>
                )
              )}
              {(kakao || website) && (
                <div style={{ display:'flex', gap:8 }}>
                  {kakao && (
                    <a href={`https://open.kakao.com/o/${kakao}`} target="_blank" rel="noreferrer" style={{
                      ...actionBtn as any,
                      background:'#FEE500', color:'#3C1E1E', border:'none',
                      boxShadow:'0 2px 8px rgba(254,229,0,0.4)',
                    }}>
                      <Icon icon="ph:chat-circle-fill" width={15} height={15} color="#3C1E1E" />카카오톡
                    </a>
                  )}
                  {website && (
                    <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer" style={actionBtn as any}>
                      <Icon icon="ph:globe" width={15} height={15} color="#64748B" />웹사이트
                    </a>
                  )}
                </div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noreferrer" style={actionBtn as any}>
                    <Icon icon="ph:navigation-arrow-fill" width={15} height={15} color="#1B6EF3" />길찾기
                  </a>
                )}
                <button onClick={() => setShowShareModal(true)} style={actionBtn}>
                  <Icon icon="ph:share-network" width={15} height={15} color="#64748B" />공유
                </button>
              </div>
            </div>
          </Section>

          {/* 한줄평 */}
          <div style={{ background:'#F8FAFC', borderRadius:14, border:'1px solid #F1F5F9', overflow:'hidden' }}>
            <button onClick={handleToggleVotes} style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'14px', background:'none', border:'none', cursor:'pointer', fontFamily:ff,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Icon icon="ph:thumbs-up" width={15} height={15} color="#64748B" />
                <span style={{ fontSize:12, fontWeight:800, color:'#64748B', letterSpacing:0.3 }}>한줄평{myVote ? ' ✓' : ''}</span>
              </div>
              <Icon icon={showVotes ? 'ph:caret-up' : 'ph:caret-down'} width={14} height={14} color="#94A3B8" />
            </button>

            {showVotes && (
              <div style={{ borderTop:'1px solid #F1F5F9', padding:'14px' }}>
                {loading ? (
                  <div style={{ textAlign:'center', padding:'12px 0', color:'#94A3B8', fontSize:13 }}>불러오는 중...</div>
                ) : (
                  <>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#64748B' }}>
                        {myVote ? `내 한줄평: ${myVote}` : showResult ? '다른 분들의 한줄평' : '이 업체 어떠셨나요?'}
                      </span>
                      {!myVote && (
                        <button onClick={() => setShowResult(v => !v)} style={{
                          background: showResult ? '#1B6EF3' : 'none',
                          border: showResult ? 'none' : '1px solid #E2E8F0',
                          cursor:'pointer', fontSize:11, fontWeight:700,
                          color: showResult ? '#fff' : '#64748B',
                          padding:'4px 10px', borderRadius:6, fontFamily:ff,
                        }}>{showResult ? '투표하기' : '결과 보기'}</button>
                      )}
                    </div>
                    {(() => {
                      const maxCount = Math.max(...VOTE_TAGS.map(t => counts?.[t] ?? 0), 1)
                      return (
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {VOTE_TAGS.map(tag => {
                            const count  = counts?.[tag] ?? 0
                            const isMine = myVote === tag
                            const pct    = Math.round((count / maxCount) * 100)
                            return (myVote || showResult) ? (
                              <div key={tag}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                                  <span style={{ fontSize:12, fontWeight: isMine ? 800 : 500, color: isMine ? '#E11D48' : '#1E293B', display:'flex', alignItems:'center', gap:4 }}>
                                    <Icon icon="ph:thumbs-up" width={12} height={12} color={isMine ? '#E11D48' : '#94A3B8'} />{tag}
                                  </span>
                                  <span style={{ fontSize:11, fontWeight:700, color: isMine ? '#E11D48' : '#94A3B8' }}>{count}</span>
                                </div>
                                <div style={{ height:6, borderRadius:4, background:'#E2E8F0', overflow:'hidden' }}>
                                  <div style={{ height:'100%', borderRadius:4, width:`${pct}%`, background: isMine ? '#E11D48' : '#1B6EF3', transition:'width 0.4s ease', minWidth: count > 0 ? 8 : 0 }}/>
                                </div>
                              </div>
                            ) : (
                              <button key={tag} onClick={(e) => handleVote(e, tag)} style={{
                                display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
                                borderRadius:10, border:'1px solid #E2E8F0', background:'#fff',
                                cursor:'pointer', textAlign:'left', fontFamily:ff,
                              }}>
                                <Icon icon="ph:thumbs-up" width={14} height={14} color="#94A3B8" />
                                <span style={{ fontSize:13, fontWeight:500, color:'#1E293B' }}>{tag}</span>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Section({ icon, label, children }: { icon:string; label:string; children:React.ReactNode }) {
  return (
    <div style={{ background:'#F8FAFC', borderRadius:14, padding:'14px', border:'1px solid #F1F5F9' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
        <Icon icon={icon} width={15} height={15} color="#64748B" />
        <span style={{ fontSize:12, fontWeight:800, color:'#64748B', letterSpacing:0.3 }}>{label}</span>
      </div>
      {children}
    </div>
  )
}
