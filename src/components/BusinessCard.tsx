import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Business, VOTE_TAGS, getMyVote, getVoteCounts, addVote } from '../lib/businessService'

type Props = { business: Business }

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

/* ── 공유용 카드 (숨겨진 렌더링) ── */
function ShareCard({ business, counts }: { business: Business; counts: Record<string,number> }) {
  const { name, description, phone, website, kakao, address, city, is_featured, tags } = business
  const fullAddress = [address, city].filter(Boolean).join(', ')
  const maxCount = Math.max(...VOTE_TAGS.map(t => counts[t] ?? 0), 1)
  const topVotes = VOTE_TAGS.map(t => [t, counts[t] ?? 0] as [string,number]).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1])

  return (
    <div id={`share-card-${business.id}`} style={{
      width: 320, background:'#fff', borderRadius:16, overflow:'hidden',
      fontFamily: ff, boxShadow:'0 8px 32px rgba(0,53,148,0.15)',
    }}>
      {/* 헤더 */}
      <div style={{ background:'linear-gradient(135deg,#002870,#003594)', padding:'20px 20px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#fff', flex:1 }}>{name}</div>
          {is_featured && (
            <div style={{ background:'#FFCD00', color:'#002870', fontSize:10, fontWeight:800, borderRadius:20, padding:'3px 10px', flexShrink:0 }}>추천</div>
          )}
        </div>
        {fullAddress && (
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>📍 {fullAddress}</span>
          </div>
        )}
        {tags && tags.length > 0 && (
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
            {tags.map(tag => (
              <span key={tag} style={{ background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:10, fontWeight:700, borderRadius:6, padding:'2px 8px' }}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* 연락처 */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9' }}>
        {description && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6, marginBottom:10 }}>{description}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {phone && (
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#1E293B' }}>
              <span style={{ fontSize:14 }}>📞</span> {phone}
            </div>
          )}
          {kakao && (
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#1E293B' }}>
              <span style={{ fontSize:14 }}>💬</span> 카카오톡: {kakao}
            </div>
          )}
          {website && (
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#003594' }}>
              <span style={{ fontSize:14 }}>🌐</span> {website}
            </div>
          )}
        </div>
      </div>

      {/* 한줄평 바 차트 */}
      {topVotes.length > 0 && (
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#94A3B8', marginBottom:10, letterSpacing:0.5 }}>한줄평</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {topVotes.map(([tag, count]) => (
              <div key={tag}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'#1E293B' }}>👍 {tag}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8' }}>{count}</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:'#F1F5F9' }}>
                  <div style={{ height:'100%', borderRadius:3, width:`${Math.round((count/maxCount)*100)}%`, background:'#FCA5A5' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 푸터 홍보 */}
      <div style={{ background:'linear-gradient(135deg,#002870,#003594)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:900, color:'#FFCD00', letterSpacing:1 }}>HOJUGAJA</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:1 }}>무료 호주 버킷리스트</div>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>hojugaja.com</div>
      </div>
    </div>
  )
}

export default function BusinessCard({ business }: Props) {
  const { name, description, phone, website, kakao, address, city, is_featured, tags } = business
  const fullAddress = [address, city].filter(Boolean).join(', ')
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  const [showVotes, setShowVotes]   = useState(false)
  const [counts, setCounts]         = useState<Record<string, number> | null>(null)
  const [loading, setLoading]       = useState(false)
  const [myVote, setMyVote]         = useState<string | null>(() => getMyVote(business.id))
  const [showResult, setShowResult] = useState(true)
  const [showPhone, setShowPhone]   = useState(false)
  const [sharing, setSharing]       = useState(false)
  const shareRef                    = useRef<HTMLDivElement>(null)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  useEffect(() => {
    getVoteCounts(business.id).then(setCounts)
  }, [business.id])

  const handleToggleVotes = async () => {
    if (!showVotes && counts === null) {
      setLoading(true)
      const data = await getVoteCounts(business.id)
      setCounts(data)
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

  const handleShare = async () => {
    setSharing(true)
    // 공유 카드 렌더링 대기
    await new Promise(r => setTimeout(r, 100))
    const el = document.getElementById(`share-card-${business.id}`)
    if (!el) { setSharing(false); return }
    // @ts-ignore
    const h2c = (await import('html2canvas')).default
    const canvas = await h2c(el, { scale: 3, backgroundColor: '#fff', useCORS: true })
    const blob: Blob = await new Promise(res => canvas.toBlob((b: Blob) => res(b!), 'image/png'))
    try {
      if (navigator.share) {
        await navigator.share({ files: [new File([blob], `${business.name}.png`, { type: 'image/png' })] })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `${business.name}.png`
        a.click(); URL.revokeObjectURL(url)
      }
    } catch {}
    setSharing(false)
  }

  const topTags = counts
    ? Object.entries(counts).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,2)
    : []

  const btnBase: React.CSSProperties = {
    display:'flex', alignItems:'center', justifyContent:'center', gap:5,
    height:34, padding:'0 12px', borderRadius:8,
    fontSize:12, fontWeight:700, cursor:'pointer',
    border:'none', whiteSpace:'nowrap', fontFamily:ff,
    boxShadow:'0 2px 6px rgba(0,0,0,0.09)',
  }

  return (
    <>
      {/* 공유용 카드 — 화면 밖에 숨김 */}
      {sharing && (
        <div style={{ position:'fixed', top:'-9999px', left:'-9999px', zIndex:-1 }} ref={shareRef}>
          <ShareCard business={business} counts={counts ?? {}} />
        </div>
      )}

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
              <div style={{ background:'#003594', color:'#FFCD00', fontSize:10, fontWeight:800, borderRadius:20, padding:'3px 10px', flexShrink:0 }}>추천</div>
            )}
          </div>

          {/* 주소 */}
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

          {/* 서비스 태그 */}
          {tags && tags.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {tags.map(tag => (
                <span key={tag} style={{ background:'rgba(0,53,148,0.07)', color:'#003594', fontSize:10, fontWeight:700, borderRadius:6, padding:'3px 8px' }}>{tag}</span>
              ))}
            </div>
          )}

          {/* 한줄평 미리보기 */}
          {!showVotes && topTags.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {topTags.map(([tag, count]) => (
                <span key={tag} style={{ background:'rgba(0,53,148,0.06)', color:'#003594', fontSize:10, fontWeight:700, borderRadius:6, padding:'3px 8px', display:'flex', alignItems:'center', gap:3 }}>
                  <Icon icon="ph:thumbs-up" width={11} height={11} color="#003594" /> {tag} {count}
                </span>
              ))}
            </div>
          )}

          {/* 버튼 행 */}
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {phone && (
              isMobile ? (
                <a href={`tel:${phone}`} style={{ ...btnBase, background:'#fff', color:'#1E293B', textDecoration:'none' }}>
                  <Icon icon="ph:phone" width={13} height={13} color="#64748B" />전화
                </a>
              ) : (
                <div style={{ position:'relative' }}>
                  <button onClick={() => setShowPhone(v => !v)} style={{ ...btnBase, background:'#fff', color:'#1E293B' }}>
                    <Icon icon="ph:phone" width={13} height={13} color="#64748B" />전화
                  </button>
                  {showPhone && (
                    <div style={{ position:'absolute', bottom:'110%', left:0, background:'#1E293B', color:'#fff', padding:'8px 14px', borderRadius:10, fontSize:13, fontWeight:700, whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', zIndex:50 }}>{phone}</div>
                  )}
                </div>
              )
            )}
            {kakao && (
              <a href={`https://open.kakao.com/o/${kakao}`} target="_blank" rel="noreferrer"
                style={{ ...btnBase, background:'#FEE500', color:'#3C1E1E', textDecoration:'none' }}>
                <Icon icon="ph:chat-circle" width={13} height={13} color="#3C1E1E" />카톡
              </a>
            )}
            {website && (
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer"
                style={{ ...btnBase, background:'#fff', color:'#1E293B', textDecoration:'none' }}>
                <Icon icon="ph:globe" width={13} height={13} color="#64748B" />웹사이트
              </a>
            )}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                style={{ ...btnBase, background:'#fff', color:'#1E293B', textDecoration:'none' }}>
                <Icon icon="ph:navigation-arrow" width={13} height={13} color="#64748B" />경로
              </a>
            )}
            <button onClick={handleToggleVotes}
              style={{ ...btnBase, background: showVotes ? '#003594' : '#fff', color: showVotes ? '#fff' : '#1E293B' }}>
              <Icon icon="ph:thumbs-up" width={13} height={13} color={showVotes ? '#fff' : '#64748B'} />
              한줄평{myVote ? ' ✓' : ''}
            </button>
            {/* 공유 버튼 */}
            <button onClick={handleShare} disabled={sharing}
              style={{ ...btnBase, background: sharing ? '#E2E8F0' : '#fff', color:'#1E293B' }}>
              <Icon icon="ph:share-network" width={13} height={13} color="#64748B" />
              {sharing ? '준비 중...' : '공유'}
            </button>
          </div>
        </div>

        {/* ── 한줄평 패널 ── */}
        {showVotes && (
          <div style={{ borderTop:'1px solid #F1F5F9', background:'#F8FAFC', padding:'14px 16px' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'12px 0', color:'#94A3B8', fontSize:13 }}>불러오는 중...</div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748B' }}>
                    {myVote ? `내 한줄평: ${myVote}` : showResult ? '다른 분들의 한줄평이에요!' : '이 업체 어떠셨나요?'}
                  </div>
                  {!myVote && (
                    <button onClick={() => setShowResult(v => !v)} style={{
                      background: showResult ? '#003594' : 'none',
                      border: showResult ? 'none' : '1px solid #E2E8F0',
                      cursor:'pointer', fontSize:11, fontWeight:700,
                      color: showResult ? '#fff' : '#64748B',
                      padding:'4px 10px', borderRadius:6,
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
                        const voted  = !!myVote
                        const pct    = Math.round((count / maxCount) * 100)
                        return (myVote || showResult) ? (
                          <div key={tag}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                              <span style={{ fontSize:12, fontWeight: isMine ? 800 : 500, color: isMine ? '#FCA5A5' : '#1E293B', display:'flex', alignItems:'center', gap:4 }}>
                                <Icon icon="ph:thumbs-up" width={12} height={12} color={isMine ? '#FCA5A5' : '#94A3B8'} />{tag}
                              </span>
                              <span style={{ fontSize:11, fontWeight:700, color: isMine ? '#FCA5A5' : '#94A3B8' }}>{count}</span>
                            </div>
                            <div style={{ height:7, borderRadius:4, background:'#E2E8F0', overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:4, width:`${pct}%`, background:'#FCA5A5', transition:'width 0.4s ease', minWidth: count > 0 ? 8 : 0 }}/>
                            </div>
                          </div>
                        ) : (
                          <button key={tag} onClick={(e) => handleVote(e, tag)} style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'10px 12px', borderRadius:9,
                            border:'1px solid #E2E8F0', background:'#fff',
                            cursor:'pointer', textAlign:'left', fontFamily:ff,
                            boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
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
    </>
  )
}
