import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Business, VOTE_TAGS, getMyVote, getVoteCounts, addVote } from '../lib/businessService'
import {
  isBookmarked, getBookmarkFolders, toggleBookmarkFolder,
  getFolders, addFolder, Folder
} from '../lib/businessBookmarks'
import BusinessShareModal from './BusinessShareModal'

type Props = { business: Business }

const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

export default function BusinessCard({ business }: Props) {
  const { name, description, phone, website, kakao, address, city, is_featured, tags } = business
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
  const [myFolders, setMyFolders]           = useState<string[]>(() => getBookmarkFolders(business.id))
  const [showFolderPop, setShowFolderPop]   = useState(false)
  const [folders, setFolders]               = useState<Folder[]>(() => getFolders())
  const [newFolderMode, setNewFolderMode]   = useState(false)
  const [newFolderName, setNewFolderName]   = useState('')
  const popRef = useRef<HTMLDivElement>(null)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  useEffect(() => {
    getVoteCounts(business.id).then(setCounts)
  }, [business.id])

  // 팝업 바깥 클릭 시 닫기
  useEffect(() => {
    if (!showFolderPop) return
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setShowFolderPop(false)
        setNewFolderMode(false)
        setNewFolderName('')
      }
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFolderPop])

  const handleBookmarkClick = () => {
    setFolders(getFolders())
    setShowFolderPop(v => !v)
  }

  const handleFolderToggle = (folderId: string) => {
    toggleBookmarkFolder(business.id, folderId)
    const next = getBookmarkFolders(business.id)
    setMyFolders(next)
    setBookmarked(next.length > 0)
  }

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return
    const folder = addFolder(newFolderName.trim())
    toggleBookmarkFolder(business.id, folder.id)
    const next = getBookmarkFolders(business.id)
    setMyFolders(next)
    setBookmarked(true)
    setFolders(getFolders())
    setNewFolderName('')
    setNewFolderMode(false)
  }

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
      {showShareModal && (
        <BusinessShareModal
          business={business}
          counts={counts ?? {}}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <div style={{
        background:'#fff', borderRadius:12,
        boxShadow: is_featured
          ? '0 4px 20px rgba(27,110,243,0.10),0 1px 4px rgba(0,0,0,0.06)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        overflow:'hidden',
      }}>
        <div style={{ padding:'16px' }}>

          {/* 업체명 + 북마크 + 추천 뱃지 */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#1E293B', flex:1, paddingRight:8 }}>{name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, position:'relative' }}>
              {is_featured && (
                <div style={{ background:'#1B6EF3', color:'#FFCD00', fontSize:10, fontWeight:800, borderRadius:20, padding:'3px 10px' }}>추천</div>
              )}
              <button onClick={handleBookmarkClick} style={{
                background: bookmarked ? 'rgba(220,38,38,0.08)' : 'none',
                border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:8,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon
                  icon={bookmarked ? 'ph:bookmark-simple-fill' : 'ph:bookmark-simple'}
                  width={20} height={20}
                  color={bookmarked ? '#DC2626' : '#CBD5E1'}
                />
              </button>

              {/* 폴더 선택 팝업 */}
              {showFolderPop && (
                <div ref={popRef} style={{
                  position:'absolute', top:'110%', right:0, zIndex:100,
                  background:'#fff', borderRadius:14, padding:'14px',
                  boxShadow:'0 8px 32px rgba(0,0,0,0.15)', minWidth:200,
                  border:'1px solid #F1F5F9',
                }}>
                  <div style={{ fontSize:12, fontWeight:800, color:'#94A3B8', marginBottom:10, letterSpacing:0.5 }}>폴더에 저장</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {folders.map(folder => {
                      const isIn = myFolders.includes(folder.id)
                      return (
                        <button key={folder.id} onClick={() => handleFolderToggle(folder.id)} style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'8px 10px', borderRadius:9, border:'none', cursor:'pointer',
                          background: isIn ? 'rgba(220,38,38,0.07)' : '#F8FAFC',
                          fontFamily:ff,
                        }}>
                          <span style={{ fontSize:13, fontWeight:600, color: isIn ? '#DC2626' : '#1E293B' }}>
                            {folder.emoji} {folder.name}
                          </span>
                          {isIn && <Icon icon="ph:check" width={14} height={14} color="#DC2626" />}
                        </button>
                      )
                    })}
                  </div>

                  {/* 새 폴더 추가 */}
                  <div style={{ marginTop:10, borderTop:'1px solid #F1F5F9', paddingTop:10 }}>
                    {!newFolderMode ? (
                      <button onClick={() => setNewFolderMode(true)} style={{
                        width:'100%', padding:'7px 0', border:'1px dashed #CBD5E1',
                        borderRadius:8, background:'none', cursor:'pointer',
                        fontSize:12, fontWeight:700, color:'#94A3B8', fontFamily:ff,
                        display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                      }}>
                        <Icon icon="ph:plus" width={13} height={13} color="#94A3B8" />
                        새 폴더 만들기
                      </button>
                    ) : (
                      <div style={{ display:'flex', gap:6 }}>
                        <input
                          autoFocus
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') { setNewFolderMode(false); setNewFolderName('') } }}
                          placeholder="폴더 이름..."
                          style={{
                            flex:1, border:'1px solid #E2E8F0', borderRadius:8, padding:'6px 10px',
                            fontSize:13, outline:'none', fontFamily:ff, color:'#1E293B',
                          }}
                        />
                        <button onClick={handleAddFolder} style={{
                          background:'#DC2626', border:'none', borderRadius:8, padding:'6px 10px',
                          cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700, fontFamily:ff,
                        }}>추가</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 내 폴더 태그 표시 */}
          {myFolders.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
              {myFolders.map(fid => {
                const f = folders.find(x => x.id === fid)
                if (!f) return null
                return (
                  <span key={fid} style={{
                    background:'rgba(220,38,38,0.08)', color:'#DC2626',
                    fontSize:10, fontWeight:700, borderRadius:20, padding:'2px 8px',
                    display:'flex', alignItems:'center', gap:3,
                  }}>
                    {f.emoji} {f.name}
                  </span>
                )
              })}
            </div>
          )}

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
                <span key={tag} style={{ background:'rgba(27,110,243,0.07)', color:'#1B6EF3', fontSize:10, fontWeight:700, borderRadius:6, padding:'3px 8px' }}>{tag}</span>
              ))}
            </div>
          )}

          {/* 한줄평 미리보기 */}
          {!showVotes && topTags.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {topTags.map(([tag, count]) => (
                <span key={tag} style={{
                  background:'#FFF1F2', color:'#E11D48',
                  fontSize:10, fontWeight:700, borderRadius:6, padding:'3px 8px',
                  display:'flex', alignItems:'center', gap:3,
                  border:'1px solid #FECDD3',
                }}>
                  <Icon icon="ph:thumbs-up" width={11} height={11} color="#E11D48" /> {tag} {count}
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
              style={{ ...btnBase, background: showVotes ? '#1B6EF3' : '#fff', color: showVotes ? '#fff' : '#1E293B' }}>
              <Icon icon="ph:thumbs-up" width={13} height={13} color={showVotes ? '#fff' : '#64748B'} />
              한줄평{myVote ? ' ✓' : ''}
            </button>
            <button onClick={() => setShowShareModal(true)}
              style={{ ...btnBase, background:'#fff', color:'#1E293B' }}>
              <Icon icon="ph:share-network" width={13} height={13} color="#64748B" />공유
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
                      background: showResult ? '#1B6EF3' : 'none',
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
