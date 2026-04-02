// ─────────────────────────────────────────────
// HomePage.tsx — 달력 중심 홈
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { TripInfo, AppState, getTripDays } from '../store/state'
import { ITEMS } from '../data/checklist'
import { getCachedChecklist, getCachedShopping } from '../lib/dataCache'
import AppHeader from '../components/AppHeader'
import BucketSheet from '../components/BucketSheet'
import ShoppingSheet from '../components/ShoppingSheet'
import ChecklistSheet from '../components/ChecklistSheet'
import ServicesSheet from '../components/ServicesSheet'
import NearbySheet from '../components/NearbySheet'
import NoteSheet from '../components/NoteSheet'
import BingoSheet from '../components/BingoSheet'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const TODAY = new Date()

type Tab = 'bucketlist' | 'shopping' | 'services' | 'nearby' | 'bingo' | 'checklist'
type Props = {
  trip: TripInfo
  state: AppState
  setState: (s: AppState) => void
  onNavigate: (tab: Tab) => void
  onChangeDates: () => void
}

export default function HomePage({ trip, state, setState, onNavigate, onChangeDates }: Props) {
  const [vy, setVy] = useState(TODAY.getFullYear())
  const [vm, setVm] = useState(TODAY.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  const [dbItems, setDbItems] = useState<any[]>([])
  const [achieved, setAchieved] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} }
  })
  const [memos, setMemos] = useState<Record<string,string>>({})

  useEffect(() => {
    const cached = getCachedChecklist()
    if (cached?.items?.length) setDbItems(cached.items)
  }, [])
  const [showBucket, setShowBucket] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [showShopping, setShowShopping] = useState(false)
  const [showServices, setShowServices] = useState(false)
  const [showNearby, setShowNearby] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [noteInitialId, setNoteInitialId] = useState<string | undefined>(undefined)
  const [noteInitialView, setNoteInitialView] = useState<'list'|'write'|undefined>(undefined)
  const [showBingo, setShowBingo] = useState(false)

  const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

  const tripDays = getTripDays(trip)
  const startDate = new Date(trip.startDate)
  const endDate = new Date(trip.endDate)
  const todayMidnight = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
  const diffDays = Math.ceil((startDate.getTime() - todayMidnight.getTime()) / (1000*60*60*24))
  const tripNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000*60*60*24))

  const bucketCount = Object.keys(state.selected).length
  const myShoppingCount = (() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]').length } catch { return 0 }
  })()

  const chgMo = (d: number) => {
    let ny = vy, nm = vm + d
    if (nm > 11) { nm = 0; ny++ }
    if (nm < 0) { nm = 11; ny-- }
    setVy(ny); setVm(nm)
  }

  const renderCal = () => {
    const first = new Date(vy, vm, 1).getDay()
    const days = new Date(vy, vm+1, 0).getDate()
    const cells = []
    for (let i = 0; i < first; i++) {
      cells.push(<div key={`e${i}`} style={{ aspectRatio:'1' }} />)
    }
    for (let d = 1; d <= days; d++) {
      const dt = new Date(vy, vm, d)
      const isPast = dt < todayMidnight
      const isStart = dt.toDateString() === startDate.toDateString()
      const isEnd = dt.toDateString() === endDate.toDateString()
      const isInTrip = dt >= startDate && dt <= endDate
      const isToday = dt.toDateString() === TODAY.toDateString()
      const dayIdx = tripDays.findIndex(td => td.toDateString() === dt.toDateString())
      const isSelected = selectedDay === dayIdx && dayIdx >= 0
      const hasBucket = dayIdx >= 0 && [...ITEMS.filter(i => state.selected[i.id]), ...state.customItems.filter(i => state.selected[i.id])].some(item => (state.schedules[item.id] ?? []).includes(dayIdx))
      const memoKey = `memo_${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
      const hasMemo = dayIdx >= 0 && !!(localStorage.getItem(memoKey) ?? '').trim()
      const hasShopping = dayIdx >= 0 && (() => { try { const s = JSON.parse(localStorage.getItem('shopping-schedules') ?? '{}'); return Object.values(s).some((days: any) => days.includes(dayIdx)) } catch { return false } })()
      const hasNote = dayIdx >= 0 && (() => {
        try {
          const notes = JSON.parse(localStorage.getItem('app-notes') ?? '[]')
          const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
          return notes.some((n: any) => n.date === dateStr)
        } catch { return false }
      })()

      let bg = 'transparent', color = isPast ? '#7BAAB5' : '#0D3349', radius = '50%', fw: number = 400
      if (isSelected) { bg = '#00838F'; color = '#fff'; fw = 800 }
      else if (isStart || isEnd) { bg = '#00838F'; color = '#fff'; fw = 800 }
      else if (isInTrip) { bg = '#B2EBF2'; color = '#006064'; radius = '0' }

      cells.push(
        <div key={d} onClick={() => {
            if (dayIdx < 0) return
            setSelectedDay(dayIdx)
            setSelectedDayDate(dt)
          }}
          style={{
            aspectRatio:'1', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            borderRadius: radius, background: bg, color, fontWeight: fw, fontSize: 13,
            border: isToday && !isSelected && !isStart && !isEnd ? '1.5px solid #00838F' : 'none',
            cursor: dayIdx >= 0 ? 'pointer' : 'default', position:'relative',
            WebkitTapHighlightColor:'transparent',
          }}>
          {d}
          {(hasBucket || hasShopping || hasMemo || hasNote) && (
            <div style={{ position:'absolute', bottom:3, display:'flex', gap:2 }}>
              {hasBucket && <div style={{ width:4, height:4, borderRadius:'50%', background:'#29B6D0' }} />}
              {hasShopping && <div style={{ width:4, height:4, borderRadius:'50%', background:'#FF6B9D' }} />}
              {hasMemo && <div style={{ width:4, height:4, borderRadius:'50%', background:'#F59E0B' }} />}
              {hasNote && <div style={{ width:4, height:4, borderRadius:'50%', background:'#F97316' }} />}
            </div>
          )}
        </div>
      )
    }
    return cells
  }

  const ddayText = diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? 'D-Day' : `D+${Math.abs(diffDays)}`
  const ddayLabel = diffDays > 0 ? '호주 출발까지' : diffDays === 0 ? '오늘 출발! 🎉' : '호주 여행 중! ✈️'
  const ddayColor = diffDays > 0 ? '#0D3349' : diffDays === 0 ? '#00838F' : '#00695C'
  const fmtDate = (d: Date) => `${d.getMonth()+1}월 ${d.getDate()}일`

  const MENUS = [
    { id:'checklist' as Tab, icon:'✅', title:'준비 체크리스트', sub:'여행 준비 할 것들', badge: 0, local: false },
    { id:'bucketlist' as Tab, icon:'🗺️', title:'버킷리스트', sub:'꼭 해볼 것들', badge: bucketCount, local: false },
    { id:'shopping' as Tab, icon:'🛍️', title:'쇼핑리스트', sub:'꼭 살 것들', badge: myShoppingCount, local: false },
    { id:'nearby' as Tab, icon:'📍', title:'내 주변', sub:'주변 업체 지도', badge: 0, local: false },
  ]

  return (
    <div style={{
      minHeight:'100dvh',
      background:'linear-gradient(180deg, #00BCD4 0%, #80DEEA 28%, #FFF0C8 50%, #F5C97A 70%, #D4703A 100%)',
      fontFamily: ff, maxWidth:430, margin:'0 auto', display:'flex', flexDirection:'column',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .menu-card-hover { transition: transform 0.12s; -webkit-tap-highlight-color: transparent; }
        .menu-card-hover:active { transform: scale(0.97); }
        .cal-nav-btn:hover { background: rgba(0,131,143,0.15) !important; }
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes slideOutLeft { from{transform:translateX(0);opacity:1} to{transform:translateX(-100%);opacity:0} }
        @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slideOutRight { from{transform:translateX(0);opacity:1} to{transform:translateX(100%);opacity:0} }
        @keyframes slideInLeft { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }
        .cal-view { animation: slideInLeft 0.28s ease both; }
        .day-view { animation: slideInRight 0.28s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .card-anim { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* 공통 헤더 (날씨 + 메뉴) */}
      <AppHeader />

      {/* 달력 / 일별뷰 */}
      <div style={{ padding:'0 18px 14px' }}>
        <div style={{ background:'rgba(255,255,255,0.88)', borderRadius:22, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.12)' }}>
          {selectedDayDate && selectedDay !== null ? (
            /* ── 일별 뷰 */
            <div className="day-view" style={{ overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 8px' }}>
                <button onClick={() => { setSelectedDay(null); setSelectedDayDate(null) }}
                  style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>‹</button>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>
                    <span style={{ color:'#00838F' }}>{selectedDayDate.getFullYear()}년</span> · {selectedDayDate.getMonth()+1}월 {selectedDayDate.getDate()}일
                  </div>
                  <div style={{ fontSize:11, color:'#00838F', fontWeight:600 }}>여행 {selectedDay+1}일차 · {['일','월','화','수','목','금','토'][selectedDayDate.getDay()]}요일</div>
                </div>
                <div style={{ width:36 }} />
              </div>
              {/* 일별 내용 */}
              <div style={{ padding:'0 14px 16px' }}>
                {/* 버킷리스트 */}
                {(() => {
                  const allItems = [...ITEMS.filter(i => state.selected[i.id]), ...state.customItems.filter(i => state.selected[i.id])]
                  const dayBucket = allItems.filter(item => (state.schedules[item.id] ?? []).includes(selectedDay!))
                  return (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#29B6D0' }} />
                        <div style={{ fontSize:12, fontWeight:700, color:'#0D3349' }}>버킷리스트 ({dayBucket.length})</div>
                      </div>
                      {dayBucket.length === 0 ? (
                        <div style={{ fontSize:12, color:'#7BAAB5', padding:'8px 0' }}>배정된 항목이 없어요</div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {dayBucket.map(item => {
                            const key = `${item.id}_${selectedDay}`
                            const isDone = !!achieved[key]
                            const db = dbItems.find((d:any) => d.id === item.id)
                            return (
                              <div key={item.id} style={{
                                display:'flex', alignItems:'center', gap:10,
                                background: isDone ? 'rgba(41,182,208,0.08)' : 'rgba(0,0,0,0.03)',
                                borderRadius:10, padding:'9px 12px',
                                border: isDone ? '1px solid rgba(41,182,208,0.25)' : '1px solid transparent',
                              }}>
                                {db?.image_url && (
                                  <div style={{ width:36, height:36, borderRadius:6, overflow:'hidden', flexShrink:0 }}>
                                    <img src={db.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                  </div>
                                )}
                                <div style={{ flex:1, fontSize:13, fontWeight:600, color: isDone ? '#7BAAB5' : '#0D3349', textDecoration: isDone ? 'line-through' : 'none' }}>{item.label}</div>
                                <button onClick={() => {
                                  const next = { ...achieved, [key]: !achieved[key] }
                                  if (!next[key]) delete next[key]
                                  setAchieved(next)
                                  try { localStorage.setItem('bucket-achieved', JSON.stringify(next)) } catch {}
                                }} style={{
                                  height:26, padding:'0 8px', borderRadius:20, border:'none', cursor:'pointer', flexShrink:0,
                                  background: isDone ? '#29B6D0' : 'rgba(0,0,0,0.08)',
                                  display:'flex', alignItems:'center', justifyContent:'center', gap:3,
                                  WebkitTapHighlightColor:'transparent',
                                }}>
                                  <svg width="11" height="11" viewBox="0 0 12 12"><path d="M1.5 6L4.5 9L10.5 3" stroke={isDone ? '#fff' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                                  <span style={{ fontSize:11, fontWeight:700, color: isDone ? '#fff' : '#aaa' }}>완료</span>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
                {/* 쇼핑리스트 */}
                {(() => {
                  try {
                    const schedules: Record<string, number[]> = JSON.parse(localStorage.getItem('shopping-schedules') ?? '{}')
                    const myList: string[] = JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]')
                    const myChecked: Record<string, boolean> = JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}')
                    const dayShoppingIds = myList.filter(id => (schedules[id] ?? []).includes(selectedDay!))
                    if (!dayShoppingIds.length) return null
                    const cachedShopping = getCachedShopping()
                    const allProds = cachedShopping?.products ?? []
                    return (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:'#FF6B9D' }} />
                          <div style={{ fontSize:12, fontWeight:700, color:'#0D3349' }}>쇼핑리스트 ({dayShoppingIds.length})</div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {dayShoppingIds.map(id => {
                            const prod = allProds.find((p:any) => p.id === id)
                            const isChecked = !!myChecked[id]
                            return (
                              <div key={id} style={{
                                display:'flex', alignItems:'center', gap:10,
                                background: isChecked ? 'rgba(255,107,157,0.08)' : 'rgba(0,0,0,0.03)',
                                borderRadius:10, padding:'9px 12px',
                                border: isChecked ? '1px solid rgba(255,107,157,0.25)' : '1px solid transparent',
                              }}>
                                {prod?.image_url && (
                                  <div style={{ width:36, height:36, borderRadius:6, overflow:'hidden', flexShrink:0 }}>
                                    <img src={prod.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                  </div>
                                )}
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:600, color: isChecked ? '#7BAAB5' : '#0D3349', textDecoration: isChecked ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{prod?.name ?? id}{prod?.brand ? <span style={{ fontSize:11, fontWeight:400, color:'#7BAAB5' }}> · {prod.brand}</span> : null}</div>
                                </div>
                                <button onClick={() => {
                                  const next = { ...myChecked, [id]: !myChecked[id] }
                                  if (!next[id]) delete next[id]
                                  try { localStorage.setItem('my-shopping-checked', JSON.stringify(next)) } catch {}
                                  setMemos(m => ({ ...m }))
                                }} style={{
                                  height:26, padding:'0 8px', borderRadius:20, border:'none', cursor:'pointer', flexShrink:0,
                                  background: isChecked ? '#FF6B9D' : 'rgba(0,0,0,0.08)',
                                  display:'flex', alignItems:'center', justifyContent:'center', gap:3,
                                  WebkitTapHighlightColor:'transparent',
                                }}>
                                  <svg width="11" height="11" viewBox="0 0 12 12"><path d="M1.5 6L4.5 9L10.5 3" stroke={isChecked ? '#fff' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                                  <span style={{ fontSize:11, fontWeight:700, color: isChecked ? '#fff' : '#aaa' }}>구매</span>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  } catch { return null }
                })()}

                {/* 노트 */}
                {(() => {
                  try {
                    const notes = JSON.parse(localStorage.getItem('app-notes') ?? '[]')
                    const dateStr = `${selectedDayDate!.getFullYear()}-${String(selectedDayDate!.getMonth()+1).padStart(2,'0')}-${String(selectedDayDate!.getDate()).padStart(2,'0')}`
                    const dayNotes = notes.filter((n: any) => n.date === dateStr)
                    if (!dayNotes.length) return null
                    return (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:'#F97316' }} />
                          <div style={{ fontSize:12, fontWeight:700, color:'#0D3349' }}>노트 ({dayNotes.length})</div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {dayNotes.map((note: any) => (
                            <div key={note.id} style={{
                              background:'rgba(249,115,22,0.06)', borderRadius:10, padding:'10px 12px',
                              border:'1px solid rgba(249,115,22,0.15)',
                            }}>
                              <div style={{ fontSize:13, fontWeight:700, color:'#0D3349', marginBottom: note.content ? 4 : 0 }}>{note.title}</div>
                              {note.content && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{note.content}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  } catch { return null }
                })()}

                {/* 메모 */}
                {(() => {
                  const memoKey = `memo_${selectedDayDate.getFullYear()}-${String(selectedDayDate.getMonth()+1).padStart(2,'0')}-${String(selectedDayDate.getDate()).padStart(2,'0')}`
                  const memoVal = memos[memoKey] ?? localStorage.getItem(memoKey) ?? ''
                  return (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#F59E0B' }} />
                        <div style={{ fontSize:12, fontWeight:700, color:'#0D3349' }}>메모</div>
                      </div>
                      <textarea
                        value={memoVal}
                        onChange={e => {
                          const next = { ...memos, [memoKey]: e.target.value }
                          setMemos(next)
                          localStorage.setItem(memoKey, e.target.value)
                        }}
                        placeholder="이 날의 메모를 남겨보세요..."
                        style={{
                          width:'100%', minHeight:80, borderRadius:10,
                          border: memoVal ? '1.5px solid rgba(245,158,11,0.4)' : '1.5px dashed #CBD5E1',
                          outline:'none', padding:'10px 12px',
                          fontSize:13, color:'#0D3349',
                          background: memoVal ? '#FFFBEB' : '#F8FAFC',
                          fontFamily: ff, resize:'none', lineHeight:1.6,
                          boxSizing:'border-box',
                        }}
                      />
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : (
            /* ── 달력 뷰 */
            <div className="cal-view" style={{ overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 8px' }}>
                <button className="cal-nav-btn" onClick={() => chgMo(-1)} style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>‹</button>
                <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>
                  <span style={{ color:'#00838F' }}>{vy}년</span> · {MONTHS[vm]}
                </div>
                <button className="cal-nav-btn" onClick={() => chgMo(1)} style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>›</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 10px' }}>
                {['일','월','화','수','목','금','토'].map(d => (
                  <div key={d} style={{ textAlign:'center', fontSize:11, color:'#1565A0', fontWeight:600, padding:'4px 0 6px' }}>{d}</div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'0 10px 12px' }}>
                {renderCal()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div style={{ flex:1, padding:'0 18px 40px', overflowY:'auto' }}>
          <>
            {/* D-day */}
            <div style={{ background:'rgba(255,255,255,0.88)', borderRadius:22, padding:'20px 22px', marginBottom:14, boxShadow:'0 2px 12px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:52, fontWeight:900, color: ddayColor, lineHeight:1 }}>{ddayText}</div>
                <div style={{ fontSize:15, color:'#1565A0', marginTop:6 }}>{ddayLabel}</div>
              </div>
              <div style={{ textAlign:'right', fontSize:13, color:'#1565A0', lineHeight:2 }}>
                <div>✈️ {fmtDate(startDate)} 출발</div>
                <div>🏠 {fmtDate(endDate)} 귀국</div>
                <div style={{ marginTop:6, fontSize:13, color:'#00838F', fontWeight:700 }}>{tripNights}박 {tripNights+1}일</div>
                <button onClick={onChangeDates} style={{ marginTop:6, background:'none', border:'none', fontSize:12, color:'#00838F', cursor:'pointer', textDecoration:'underline', fontFamily:ff }}>날짜 변경</button>
              </div>
            </div>

            <div style={{ fontSize:16, fontWeight:700, color:'#0D4F6E', margin:'8px 0 12px' }}>나의 호주 여행 리스트</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {MENUS.map((m, i) => (
                <div key={m.id} className="menu-card-hover card-anim"
                  onClick={() => m.id === 'bucketlist' ? setShowBucket(true) : m.id === 'checklist' ? setShowChecklist(true) : m.id === 'shopping' ? setShowShopping(true) : m.id === 'services' ? setShowServices(true) : m.id === 'nearby' ? setShowNearby(true) : onNavigate(m.id)}
                  style={{ background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', cursor:'pointer', animationDelay:`${i * 0.08}s` }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:10 }}>{m.icon}</div>
                  <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>{m.title}</div>
                  <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>{m.sub}</div>
                  {m.badge > 0 && <div style={{ display:'inline-block', background:'#00838F', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, marginTop:8 }}>{m.badge}개</div>}
                </div>
              ))}
              <div className="menu-card-hover card-anim" onClick={() => setShowServices(true)}
                style={{ gridColumn:'span 2', background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', cursor:'pointer', display:'flex', alignItems:'center', gap:14, animationDelay:`${MENUS.length * 0.08}s` }}>
                <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏢</div>
                <div>
                  <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>업체정보</div>
                  <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>한인 업체·병원</div>
                </div>
              </div>
              {(() => {
                const savedNotes = (() => { try { return JSON.parse(localStorage.getItem('app-notes') ?? '[]') } catch { return [] } })()
                const previewNotes = savedNotes.slice(0, 3)
                return (
                  <div className="card-anim" style={{ gridColumn:'span 2', background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', animationDelay:`${(MENUS.length + 1) * 0.08}s` }}>
                    {/* 헤더 */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: previewNotes.length > 0 ? 12 : 0 }}>
                      <div onClick={() => setShowNote(true)} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                        <div style={{ width:36, height:36, borderRadius:12, background:'rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📝</div>
                        <div style={{ fontSize:16, fontWeight:700, color:'#0D3349' }}>노트</div>
                      </div>
                      <button onClick={() => { setNoteInitialView('write'); setNoteInitialId(undefined); setShowNote(true) }} style={{
                        width:28, height:28, borderRadius:'50%', background:'rgba(249,115,22,0.15)',
                        border:'none', display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', WebkitTapHighlightColor:'transparent',
                      }}>
                        <Icon icon="ph:plus-bold" width={14} height={14} color="#F97316" />
                      </button>
                    </div>
                    {/* 노트 리스트 */}
                    {previewNotes.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column' }}>
                        {previewNotes.map((note: any) => (
                          <div key={note.id} onClick={() => { setNoteInitialId(note.id); setNoteInitialView(undefined); setShowNote(true) }} style={{
                            display:'flex', alignItems:'center', gap:8, padding:'8px 4px',
                            borderTop:'1px solid rgba(0,0,0,0.06)', cursor:'pointer',
                            WebkitTapHighlightColor:'transparent',
                          }}>
                            <Icon icon="ph:note" width={13} height={13} color="#F97316" style={{ flexShrink:0 }} />
                            <div style={{ fontSize:13, fontWeight:500, color:'#0D3349', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</div>
                            <Icon icon="ph:caret-right" width={12} height={12} color="#CBD5E1" style={{ flexShrink:0 }} />
                          </div>
                        ))}
                      </div>
                    )}
                    {previewNotes.length === 0 && (
                      <div onClick={() => setShowNote(true)} style={{ fontSize:13, color:'#94A3B8', cursor:'pointer', paddingTop:4 }}>메모·기록·여행 노트</div>
                    )}
                  </div>
                )
              })()}
              <div className="menu-card-hover card-anim" onClick={() => setShowBingo(true)}
                style={{ gridColumn:'span 2', background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', cursor:'pointer', display:'flex', alignItems:'center', gap:14, animationDelay:`${(MENUS.length + 2) * 0.08}s` }}>
                <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>☕</div>
                <div>
                  <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>카페 빙고</div>
                  <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>시드니·멜번 카페 25곳 투어</div>
                </div>
              </div>
            </div>
          </>
      </div>
      {/* 카페 빙고 바텀시트 */}
      {showBingo && (
        <BingoSheet onClose={() => setShowBingo(false)} />
      )}

      {/* 내 주변 바텀시트 */}
      {showNearby && (
        <NearbySheet onClose={() => setShowNearby(false)} />
      )}

      {/* 업체정보 바텀시트 */}
      {showServices && (
        <ServicesSheet onClose={() => setShowServices(false)} />
      )}

      {/* 쇼핑리스트 바텀시트 */}
      {showShopping && (
        <ShoppingSheet
          onClose={() => setShowShopping(false)}
          trip={trip}
        />
      )}

      {/* 체크리스트 바텀시트 */}
      {showChecklist && (
        <ChecklistSheet
          state={state}
          setState={setState}
          onClose={() => setShowChecklist(false)}
        />
      )}

      {/* 노트 바텀시트 */}
      {showNote && <NoteSheet onClose={() => { setShowNote(false); setNoteInitialId(undefined); setNoteInitialView(undefined) }} initialNoteId={noteInitialId} initialView={noteInitialView} trip={trip} />}

      {/* 버킷리스트 바텀시트 */}
      {showBucket && (
        <BucketSheet
          trip={trip}
          state={state}
          setState={setState}
          onClose={() => setShowBucket(false)}
        />
      )}
    </div>
  )
}
