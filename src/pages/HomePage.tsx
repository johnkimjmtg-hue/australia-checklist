// ─────────────────────────────────────────────
// HomePage.tsx — 달력 중심 홈
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import sydneyImg from '../assets/sydney.jpg'
import { Icon } from '@iconify/react'
import { TripInfo, AppState, getTripDays } from '../store/state'
import { ITEMS } from '../data/checklist'
import { getCachedChecklist, getCachedShopping, getCachedEvents } from '../lib/dataCache'
import AppHeader from '../components/AppHeader'
import BucketSheet from '../components/BucketSheet'
import ShoppingSheet from '../components/ShoppingSheet'
import ChecklistSheet from '../components/ChecklistSheet'
import ServicesSheet from '../components/ServicesSheet'
import NearbySheet from '../components/NearbySheet'
import NoteSheet from '../components/NoteSheet'
import BingoSheet from '../components/BingoSheet'
import PackingSheet from '../components/PackingSheet'

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
  const [calSlideDir, setCalSlideDir] = useState<'left'|'right'>('left')
  const touchStartX = useRef<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  const [dbItems, setDbItems] = useState<any[]>([])
  const [achieved, setAchieved] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} }
  })
  const [memos, setMemos] = useState<Record<string,string>>({})

  const [events, setEvents] = useState<any[]>(() => getCachedEvents() ?? [])

  useEffect(() => {
    const cached = getCachedChecklist()
    if (cached?.items?.length) setDbItems(cached.items)
    const cachedEvents = getCachedEvents()
    if (cachedEvents?.length) setEvents(cachedEvents)
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
  const [showPacking, setShowPacking] = useState(false)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

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
    setCalSlideDir(d > 0 ? 'right' : 'left')
    let ny = vy, nm = vm + d
    if (nm > 11) { nm = 0; ny++ }
    if (nm < 0) { nm = 11; ny-- }
    setVy(ny); setVm(nm)
  }

  const renderCal = () => {
    const first = new Date(vy, vm, 1).getDay()
    const days = new Date(vy, vm+1, 0).getDate()

    const HEADER_H = 22  // 날짜 숫자 영역
    const ITEM_H   = 14  // 항목 한 줄 높이
    const ITEM_GAP = 2   // 항목 간 gap
    const PADDING  = 6   // 상하 패딩

    // 각 날짜별 데이터 미리 계산
    const allDayData: {
      d: number; dt: Date; isPast: boolean; isInTrip: boolean; isToday: boolean
      dayIdx: number; isSelected: boolean; cellBg: string; numColor: string; numFw: number
      labels: { text: string; color: string; bg: string; barColor: string }[]
    }[] = []

    const shoppingSchedules: Record<string, number[]> = (() => {
      try { return JSON.parse(localStorage.getItem('shopping-schedules') ?? '{}') } catch { return {} }
    })()
    const myList: string[] = (() => {
      try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]') } catch { return [] }
    })()
    const allNotes: any[] = (() => {
      try { return JSON.parse(localStorage.getItem('app-notes') ?? '[]') } catch { return [] }
    })()
    const cachedShopping = getCachedShopping()
    const allProds = cachedShopping?.products ?? []

    for (let d = 1; d <= days; d++) {
      const dt = new Date(vy, vm, d)
      const isPast = dt < todayMidnight
      const isInTrip = dt >= startDate && dt <= endDate
      const isToday = dt.toDateString() === TODAY.toDateString()
      const dayIdx = tripDays.findIndex(td => td.toDateString() === dt.toDateString())
      const isSelected = selectedDay === dayIdx && dayIdx >= 0
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`

      const dayEvents = events.filter(ev => ev.is_active && ev.start_date <= dateStr && ev.end_date >= dateStr)
      const bucketItems = dayIdx >= 0
        ? [...ITEMS.filter(i => state.selected[i.id]), ...state.customItems.filter(i => state.selected[i.id])]
            .filter(item => (state.schedules[item.id] ?? []).includes(dayIdx))
        : []
      const shoppingItems = dayIdx >= 0
        ? myList.filter(id => (shoppingSchedules[id] ?? []).includes(dayIdx))
            .map(id => allProds.find((p:any) => p.id === id)).filter(Boolean)
        : []
      const dayNotes = allNotes.filter((n: any) => n.date === dateStr)

      const numColor = isSelected ? '#fff' : isToday ? '#00838F' : isPast ? '#7BAAB5' : '#0D3349'
      const numFw = isToday || isSelected ? 800 : 500
      const cellBg = isSelected ? '#00838F' : isInTrip ? 'rgba(0,0,0,0.06)' : 'transparent'

      const labels: { text: string; bg: string }[] = [
        ...(dayEvents.length > 0 ? [{ text: `행사 (${dayEvents.length})`, bg:'#FEF3C7' }] : []),
        ...(bucketItems.length > 0 ? [{ text: `버킷 (${bucketItems.length})`, bg:'rgba(41,182,208,0.20)' }] : []),
        ...(shoppingItems.length > 0 ? [{ text: `쇼핑 (${shoppingItems.length})`, bg:'rgba(255,107,157,0.20)' }] : []),
        ...(dayNotes.length > 0 ? [{ text: `노트 (${dayNotes.length})`, bg:'rgba(249,115,22,0.18)' }] : []),
      ]

      allDayData.push({ d, dt, isPast, isInTrip, isToday, dayIdx, isSelected, cellBg, numColor, numFw, labels })
    }

    // 주 단위로 묶어서 행 높이 계산
    const totalCells = first + days
    const weeks = Math.ceil(totalCells / 7)
    const rows: JSX.Element[] = []

    for (let w = 0; w < weeks; w++) {
      const weekCells: JSX.Element[] = []
      let maxLabels = 0

      // 이 주의 최대 항목 수 계산
      for (let col = 0; col < 7; col++) {
        const cellIdx = w * 7 + col - first
        if (cellIdx >= 0 && cellIdx < days) {
          maxLabels = Math.max(maxLabels, allDayData[cellIdx].labels.length)
        }
      }

      // 셀 너비 기준 최소 높이 (정사각형) = 약 (430 - 20) / 7 ≈ 58px
      const minH = 52
      const rowH = Math.max(minH, HEADER_H + maxLabels * (ITEM_H + ITEM_GAP) + PADDING)

      // 이 주의 셀 렌더링
      for (let col = 0; col < 7; col++) {
        const cellIdx = w * 7 + col - first

        if (cellIdx < 0 || cellIdx >= days) {
          // 빈 셀
          weekCells.push(
            <div key={`e_${w}_${col}`} style={{ height: rowH, borderTop:'1px solid rgba(0,0,0,0.06)' }} />
          )
          continue
        }

        const { d, dt, isSelected, cellBg, numColor, numFw, labels } = allDayData[cellIdx]
        const dayIdx = allDayData[cellIdx].dayIdx

        weekCells.push(
          <div key={d}
            onClick={() => { setSelectedDay(dayIdx); setSelectedDayDate(dt) }}
            style={{
              height: rowH, background: cellBg,
              borderTop:'1px solid rgba(0,0,0,0.06)',
              borderRadius: isSelected ? 6 : 0,
              cursor:'pointer', padding:'3px 2px 3px 2px',
              display:'flex', flexDirection:'column',
              WebkitTapHighlightColor:'transparent',
              boxSizing:'border-box', overflow:'hidden',
            }}>
            {/* 날짜 숫자 - 우상단 */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:2 }}>
              <div style={{
                fontSize:11, fontWeight: numFw, color: numColor, lineHeight:1,
                width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'50%',
                background: allDayData[cellIdx].isToday && !isSelected ? 'rgba(0,131,143,0.12)' : 'transparent',
              }}>{d}</div>
            </div>
            {/* 일정 텍스트 - 왼쪽 바 포함 */}
            <div style={{ display:'flex', flexDirection:'column', gap:2, overflow:'hidden' }}>
              {labels.map((lbl, i) => (
                <div key={i} style={{ borderRadius:2, overflow:'hidden', background: lbl.bg, padding:'1px 3px' }}>
                  <div style={{ fontSize:9, fontWeight:400, color:'#0D3349', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.4 }}>
                    {lbl.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      rows.push(
        <div key={`week_${w}`} style={{ display:'contents' }}>
          {weekCells}
        </div>
      )
    }

    return rows
  }

  const ddayText = diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? 'D-Day' : `D+${Math.abs(diffDays)}`
  const ddayColor = diffDays > 0 ? '#D4703A' : diffDays === 0 ? '#D4703A' : '#00838F'

  const lastDay = new Date(endDate)
  const isLastDay = todayMidnight.toDateString() === lastDay.toDateString()
  const isAfterTrip = todayMidnight > lastDay

  const ddayLabel = (() => {
    if (isAfterTrip) return '호주 여행 어떠셨나요? 좋은 추억 담아오셨길! 🦘'
    if (isLastDay) return '마지막 날이에요, 아쉽지만 좋은 마무리! 🥹'
    if (diffDays < 0) {
      const dayNum = Math.abs(diffDays)
      return `호주 여행 ${dayNum}일차! 오늘도 즐겁게! 🌞`
    }
    if (diffDays === 0) return '오늘 출발! 즐거운 여행 되세요! 🎊'
    if (diffDays === 1) return '내일이에요! 오늘 밤 잘 수 있을까요? 😄'
    if (diffDays === 2) return '내일모레 출발! 설렘 폭발 🎉'
    if (diffDays === 3) return '72시간 후엔 호주 공기를 마셔요 🌊'
    if (diffDays === 4) return '4일 후 호주의 하늘 아래 있을 거예요 ☀️'
    if (diffDays === 5) return '이제 손가락으로 셀 수 있어요! 🖐️'
    if (diffDays === 6) return '6일 후면 호주예요! 준비됐나요? 🦘'
    if (diffDays === 7) return '딱 일주일 남았어요! 설레지 않나요? ✈️'
    if (diffDays <= 30) return '슬슬 짐 싸볼까요? 🧳'
    return '호주 출발까지'
  })()

  const fmtDate = (d: Date) => `${d.getMonth()+1}월 ${d.getDate()}일`

  const MENUS = [
    { id:'checklist' as Tab, icon:'✅', title:'짐싸기 체크리스트', sub:'공항 통과 완벽 가이드', badge: 0, local: false },
    { id:'bucketlist' as Tab, icon:'🗺️', title:'버킷리스트', sub:'꼭 해볼 것들', badge: bucketCount, local: false },
    { id:'shopping' as Tab, icon:'🛍️', title:'쇼핑리스트', sub:'꼭 살 것들', badge: myShoppingCount, local: false },
    { id:'nearby' as Tab, icon:'📍', title:'내 주변', sub:'주변 업체 지도', badge: 0, local: false },
  ]

  return (
    <div style={{
      minHeight:'100dvh',
      background:'linear-gradient(180deg, #00BCD4 0%, #80DEEA 28%, #FFF0C8 50%, #F5C97A 70%, #D4703A 100%)', backgroundSize:'100% 200%', animation:'gradientShift 12s ease-in-out infinite',
      fontFamily: ff, maxWidth:430, margin:'0 auto', display:'flex', flexDirection:'column',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .menu-card-hover { transition: transform 0.12s; -webkit-tap-highlight-color: transparent; }
        @keyframes gradientShift {
          0%   { background-position: 0% 0%; }
          50%  { background-position: 0% 100%; }
          100% { background-position: 0% 0%; }
        }
        .menu-card-hover:active { transform: scale(0.97); }
        .cal-nav-btn:hover { background: rgba(0,131,143,0.15) !important; }
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes slideOutLeft { from{transform:translateX(0);opacity:1} to{transform:translateX(-100%);opacity:0} }
        @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slideOutRight { from{transform:translateX(0);opacity:1} to{transform:translateX(100%);opacity:0} }
        @keyframes slideInLeft { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }
        .cal-view { animation: slideInLeft 0.28s ease both; }
        .day-view { animation: slideInRight 0.28s ease both; }
        .cal-slide-left { animation: slideInLeft 0.28s ease both; }
        .cal-slide-right { animation: slideInRight 0.28s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .card-anim { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* 공통 헤더 (날씨 + 메뉴) */}
      <AppHeader />

      {/* 달력 / 일별뷰 */}
      <div style={{ padding:'0 18px 18px' }}>
        <div style={{ background:'rgba(255,255,255,0.88)', borderRadius:22, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.12)' }}>
          {selectedDayDate && selectedDay !== null ? (
            /* ── 일별 뷰 */
            <div className="day-view" style={{ overflow:'hidden' }}
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
              onTouchEnd={e => {
                if (touchStartX.current === null) return
                const dx = e.changedTouches[0].clientX - touchStartX.current
                if (Math.abs(dx) > 50) { setSelectedDay(null); setSelectedDayDate(null) }
                touchStartX.current = null
              }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 8px' }}>
                <button onClick={() => { setSelectedDay(null); setSelectedDayDate(null) }}
                  style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>‹</button>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>
                    <span style={{ color:'#00838F' }}>{selectedDayDate.getFullYear()}년</span> · {selectedDayDate.getMonth()+1}월 {selectedDayDate.getDate()}일
                  </div>
                  <div style={{ fontSize:11, color:'#00838F', fontWeight:600 }}>{selectedDay >= 0 ? `여행 ${selectedDay+1}일차 · ` : ''}{['일','월','화','수','목','금','토'][selectedDayDate.getDay()]}요일</div>
                </div>
                <div style={{ width:36 }} />
              </div>
              {/* 일별 내용 */}
              <div style={{ padding:'0 14px 16px' }}>
                {/* 버킷리스트 - 여행 날짜만 */}
                {selectedDay >= 0 && (() => {
                  const allItems = [...ITEMS.filter(i => state.selected[i.id]), ...state.customItems.filter(i => state.selected[i.id])]
                  const dayBucket = allItems.filter(item => (state.schedules[item.id] ?? []).includes(selectedDay!))
                  return (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: dayBucket.length ? 8 : 0 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#29B6D0' }} />
                        <div style={{ fontSize:12, fontWeight:700, color:'#0D3349' }}>버킷리스트 ({dayBucket.length})</div>
                      </div>
                      {dayBucket.length > 0 && (
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
                {/* 쇼핑리스트 - 여행 날짜만 */}
                {selectedDay >= 0 && (() => {
                  try {
                    const schedules: Record<string, number[]> = JSON.parse(localStorage.getItem('shopping-schedules') ?? '{}')
                    const myList: string[] = JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]')
                    const myChecked: Record<string, boolean> = JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}')
                    const dayShoppingIds = myList.filter(id => (schedules[id] ?? []).includes(selectedDay!))
                    const cachedShopping = getCachedShopping()
                    const allProds = cachedShopping?.products ?? []
                    return (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: dayShoppingIds.length ? 8 : 0 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:'#FF6B9D' }} />
                          <div style={{ fontSize:12, fontWeight:700, color:'#0D3349' }}>쇼핑리스트 ({dayShoppingIds.length})</div>
                        </div>
                        {dayShoppingIds.length > 0 && (
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
                                    <span style={{ fontSize:11, fontWeight:700, color: isChecked ? '#fff' : '#aaa' }}>구매완료</span>
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
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
                          <div style={{ width:7, height:7, borderRadius:'50%', background:'#EAB308' }} />
                          <div style={{ fontSize:12, fontWeight:700, color:'#0D3349' }}>노트 ({dayNotes.length})</div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {dayNotes.map((note: any) => {
                            const isExpanded = expandedEventId === `note_${note.id}`
                            return (
                              <div key={note.id} style={{ borderRadius:10, overflow:'hidden', border:'1px solid rgba(249,115,22,0.2)' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(249,115,22,0.06)', padding:'9px 12px' }}>
                                  <Icon icon="ph:note" width={16} height={16} color="#F97316" style={{ flexShrink:0 }} />
                                  <div style={{ flex:1, fontSize:13, fontWeight:600, color:'#0D3349', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</div>
                                  {note.content && (
                                    <button
                                      onClick={() => setExpandedEventId(isExpanded ? null : `note_${note.id}`)}
                                      style={{ width:26, height:26, borderRadius:'50%', background:'rgba(249,115,22,0.15)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, WebkitTapHighlightColor:'transparent', transition:'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                      <Icon icon="ph:caret-down" width={14} height={14} color="#F97316" />
                                    </button>
                                  )}
                                </div>
                                {isExpanded && note.content && (
                                  <div style={{ background:'#fff', padding:'10px 12px', borderTop:'1px solid rgba(249,115,22,0.1)' }}>
                                    <div style={{ fontSize:13, color:'#64748B', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{note.content}</div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  } catch { return null }
                })()}

                {/* 행사 */}
                {(() => {
                  const dateStr = `${selectedDayDate!.getFullYear()}-${String(selectedDayDate!.getMonth()+1).padStart(2,'0')}-${String(selectedDayDate!.getDate()).padStart(2,'0')}`
                  const dayEvents = events.filter(ev => ev.is_active && ev.start_date <= dateStr && ev.end_date >= dateStr)
                  if (!dayEvents.length) return null
                  const CITY_COLOR: Record<string, string> = { sydney: '#29B6D0', melbourne: '#7C3AED', both: '#F59E0B' }
                  const CITY_LABEL: Record<string, string> = { sydney: '시드니', melbourne: '멜번', both: '전국' }
                  const CAT_ICON: Record<string, string> = { festival:'🎉', sports:'🏆', nature:'🌿', culture:'🎭', food:'🍽' }
                  return (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#F59E0B' }} />
                        <div style={{ fontSize:12, fontWeight:700, color:'#0D3349' }}>행사 ({dayEvents.length})</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {dayEvents.map((ev: any) => {
                          const c = CITY_COLOR[ev.city] ?? '#F59E0B'
                          const rgbMap: Record<string,string> = { '#29B6D0':'41,182,208', '#7C3AED':'124,58,237', '#F59E0B':'245,158,11' }
                          const rgb = rgbMap[c] ?? '245,158,11'
                          const isExpanded = expandedEventId === ev.id
                          return (
                            <div key={ev.id} style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${c}33` }}>
                              {/* 카드 헤더 */}
                              <div style={{ display:'flex', alignItems:'center', gap:10, background:`rgba(${rgb},0.08)`, padding:'9px 12px' }}>
                                <span style={{ fontSize:18, flexShrink:0 }}>{CAT_ICON[ev.category] ?? '📅'}</span>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:600, color:'#0D3349', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                                  <div style={{ fontSize:11, color: c, fontWeight:600, marginTop:1 }}>{CITY_LABEL[ev.city] ?? ev.city}</div>
                                </div>
                                {/* 펼치기 버튼 */}
                                <button
                                  onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                                  style={{ width:26, height:26, borderRadius:'50%', background:`rgba(${rgb},0.15)`, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, WebkitTapHighlightColor:'transparent', transition:'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                  <Icon icon="ph:caret-down" width={14} height={14} color={c} />
                                </button>
                              </div>
                              {/* 펼쳐진 상세 */}
                              {isExpanded && (
                                <div style={{ background:'#fff', padding:'12px 14px', borderTop:`1px solid ${c}22` }}>
                                  {/* 이미지 */}
                                  {ev.image_url && (
                                    <div style={{ width:'100%', height:140, borderRadius:8, overflow:'hidden', marginBottom:10 }}>
                                      <img src={ev.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                    </div>
                                  )}
                                  {/* 날짜 */}
                                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, fontSize:12, color:'#7BAAB5', fontWeight:600 }}>
                                    <Icon icon="ph:calendar" width={13} height={13} color="#7BAAB5" />
                                    {ev.start_date === ev.end_date
                                      ? ev.start_date.replace(/-/g,'/')
                                      : `${ev.start_date.replace(/-/g,'/')} ~ ${ev.end_date.replace(/-/g,'/')}`}
                                  </div>
                                  {/* 설명 */}
                                  {ev.description && (
                                    <div style={{ fontSize:13, color:'#475569', lineHeight:1.7, marginBottom:10, whiteSpace:'pre-wrap' }}>{ev.description}</div>
                                  )}
                                  {/* 공식 홈페이지 */}
                                  {ev.website_url && (
                                    <button
                                      onClick={() => window.open(ev.website_url, '_blank')}
                                      style={{ display:'flex', alignItems:'center', gap:6, width:'100%', background:`rgba(${rgb},0.12)`, border:`1px solid ${c}44`, borderRadius:8, padding:'9px 12px', cursor:'pointer', fontFamily:ff }}>
                                      <Icon icon="ph:globe" width={14} height={14} color={c} />
                                      <span style={{ fontSize:12, fontWeight:700, color:c, flex:1, textAlign:'left' }}>공식 홈페이지 보기</span>
                                      <Icon icon="ph:arrow-square-out" width={13} height={13} color={c} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* 메모 */}
                {(() => {
                  const memoKey = `memo_${selectedDayDate.getFullYear()}-${String(selectedDayDate.getMonth()+1).padStart(2,'0')}-${String(selectedDayDate.getDate()).padStart(2,'0')}`
                  const memoVal = memos[memoKey] ?? localStorage.getItem(memoKey) ?? ''
                  return (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:'#16A34A' }} />
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
            <div className={`cal-slide-${calSlideDir}`} style={{ overflow:'hidden' }}
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
              onTouchEnd={e => {
                if (touchStartX.current === null) return
                const dx = e.changedTouches[0].clientX - touchStartX.current
                if (dx < -50) chgMo(1)
                else if (dx > 50) chgMo(-1)
                touchStartX.current = null
              }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 8px' }}>
                <button className="cal-nav-btn" onClick={() => chgMo(-1)} style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>‹</button>
                <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>
                  <span style={{ color:'#00838F' }}>{vy}년</span> · {MONTHS[vm]}
                </div>
                <button className="cal-nav-btn" onClick={() => chgMo(1)} style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>›</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 10px' }}>
                {['일','월','화','수','목','금','토'].map(d => (
                  <div key={d} style={{ textAlign:'right', fontSize:10, color:'#1565A0', fontWeight:600, padding:'4px 4px 4px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:0, padding:'0 10px 12px' }}>
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
            <div style={{ borderRadius:22, marginBottom:18, boxShadow:'0 2px 12px rgba(0,0,0,0.12)', overflow:'hidden', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:`url(${sydneyImg})`, backgroundSize:'cover', backgroundPosition:'center' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)' }} />
              <div style={{ position:'relative', zIndex:1, padding:'20px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:52, fontWeight:900, color: '#ffffff', lineHeight:1 }}>{ddayText}</div>
                <div style={{ fontSize:15, color:'rgba(255,255,255,0.85)', marginTop:6 }}>{ddayLabel}</div>
              </div>
              <div style={{ textAlign:'right', fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:2 }}>
                <div>✈️ {fmtDate(startDate)} 출발</div>
                <div>🏠 {fmtDate(endDate)} 귀국</div>
                <div style={{ marginTop:6, fontSize:13, color:'rgba(255,255,255,0.9)', fontWeight:700 }}>{tripNights}박 {tripNights+1}일</div>
                <button onClick={onChangeDates} style={{ marginTop:6, background:'none', border:'none', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', cursor:'pointer', textDecoration:'underline', fontFamily:ff }}>날짜 변경</button>
              </div>
              </div>
            </div>


            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* 짐싸기 체크리스트 */}
              {(() => {
                const packChecked: Record<string,boolean> = (() => { try { return JSON.parse(localStorage.getItem('packing-checked') ?? '{}') } catch { return {} } })()
                const packExcluded: Record<string,boolean> = (() => { try { return JSON.parse(localStorage.getItem('packing-excluded') ?? '{}') } catch { return {} } })()
                const packingTotal = (() => { try { return parseInt(localStorage.getItem('packing-total') ?? '0') } catch { return 0 } })()
                const packingCustomCount = (() => { try { return parseInt(localStorage.getItem('packing-custom-count') ?? '0') } catch { return 0 } })()
                const totalPack = (packingTotal + packingCustomCount) - Object.keys(packExcluded).length
                const donePack  = Object.keys(packChecked).filter(id => !packExcluded[id]).length
                const remainPack = totalPack - donePack
                return (
                  <div className="menu-card-hover card-anim" onClick={() => setShowPacking(true)}
                    style={{ background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:'rgba(139,92,246,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🧳</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>짐싸기 체크리스트</div>
                      <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>공항 통과 완벽 가이드</div>
                    </div>
                    {remainPack > 0 && <div style={{ background:'#8B5CF6', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, flexShrink:0 }}>{remainPack}개</div>}
                  </div>
                )
              })()}
              {/* 버킷리스트 */}
              {(() => {
                const checkedItems = [...ITEMS.filter(i => state.selected[i.id]), ...state.customItems.filter(i => state.selected[i.id])]
                // 날짜 배정 기준 total 계산
                const allRows: { id: string; day?: number }[] = []
                checkedItems.forEach(item => {
                  const days = state.schedules[item.id] ?? []
                  if (days.length === 0) allRows.push({ id: item.id })
                  else days.forEach(d => allRows.push({ id: item.id, day: d }))
                })
                const total = allRows.length
                // BucketCheckView와 동일한 로직: allRows 기반 미완료 계산
                const bucketAchieved: Record<string,boolean> = (() => { try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} } })()
                const getKey = (id: string, day?: number) => day !== undefined ? `${id}_${day}` : id
                const achievedCount = allRows.filter(r => !!bucketAchieved[getKey(r.id, r.day)]).length
                const remainCount = total - achievedCount
                // 미리보기: 아직 완료 안 된 항목
                const undoneItems = checkedItems.filter(item => {
                  const days = state.schedules[item.id] ?? []
                  if (days.length === 0) return !bucketAchieved[item.id]
                  return days.some(d => !bucketAchieved[`${item.id}_${d}`])
                })
                const previewItems = undoneItems.slice(0, 3)
                return (
                  <div className="card-anim" style={{ background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'16px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div onClick={() => setShowBucket(true)} style={{ display:'flex', alignItems:'center', gap:14, cursor:'pointer', WebkitTapHighlightColor:'transparent', flex:1 }}>
                        <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🗺️</div>
                        <div>
                          <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>버킷리스트</div>
                          <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>꼭 해볼 것들</div>
                        </div>
                      </div>
                      {remainCount > 0 && <div style={{ background:'#29B6D0', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, flexShrink:0 }}>{remainCount}개</div>}
                    </div>
                    {previewItems.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', marginTop:12 }}>
                        {previewItems.map((item: any) => {
                          const db = dbItems.find((d:any) => d.id === item.id)
                          return (
                            <div key={item.id} onClick={() => setShowBucket(true)} style={{
                              display:'flex', alignItems:'center', gap:10, padding:'8px 4px',
                              borderTop:'1px solid rgba(0,0,0,0.06)', cursor:'pointer',
                              WebkitTapHighlightColor:'transparent',
                            }}>
                              {db?.image_url
                                ? <img src={db.image_url} alt="" style={{ width:32, height:32, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                                : <div style={{ width:32, height:32, borderRadius:8, background:'rgba(0,131,143,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    <Icon icon="ph:map-trifold" width={14} height={14} color="#00838F" />
                                  </div>
                              }
                              <div style={{ fontSize:13, fontWeight:500, color:'#0D3349', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</div>
                              <Icon icon="ph:caret-right" width={12} height={12} color="#CBD5E1" style={{ flexShrink:0 }} />
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
                const myList: string[] = (() => { try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]') } catch { return [] } })()
                const myChecked: Record<string,boolean> = (() => { try { return JSON.parse(localStorage.getItem('my-shopping-checked') ?? '{}') } catch { return {} } })()
                const cachedShopping = getCachedShopping()
                const allProds = cachedShopping?.products ?? []
                const undoneList = myList.filter(id => !myChecked[id])
                const previewProds = undoneList.slice(0, 3).map(id => allProds.find((p:any) => p.id === id)).filter(Boolean)
                const shoppingRemain = undoneList.length
                return (
                  <div className="card-anim" style={{ background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'16px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div onClick={() => setShowShopping(true)} style={{ display:'flex', alignItems:'center', gap:14, cursor:'pointer', WebkitTapHighlightColor:'transparent', flex:1 }}>
                        <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,107,157,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🛍️</div>
                        <div>
                          <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>쇼핑리스트</div>
                          <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>꼭 살 것들</div>
                        </div>
                      </div>
                      {shoppingRemain > 0 && <div style={{ background:'#FF6B9D', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, flexShrink:0 }}>{shoppingRemain}개</div>}
                    </div>
                    {previewProds.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', marginTop:12 }}>
                        {previewProds.map((prod: any) => (
                          <div key={prod.id} onClick={() => setShowShopping(true)} style={{
                            display:'flex', alignItems:'center', gap:10, padding:'8px 4px',
                            borderTop:'1px solid rgba(0,0,0,0.06)', cursor:'pointer',
                            WebkitTapHighlightColor:'transparent',
                          }}>
                            {prod.image_url
                              ? <img src={prod.image_url} alt="" style={{ width:32, height:32, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                              : <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,107,157,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                  <Icon icon="ph:shopping-bag" width={14} height={14} color="#FF6B9D" />
                                </div>
                            }
                            <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden' }}>
                                <span style={{ fontSize:13, fontWeight:500, color:'#0D3349', whiteSpace:'nowrap', flexShrink:0 }}>{prod.name}</span>
                                {prod.brand && <span style={{ fontSize:11, color:'#94A3B8', whiteSpace:'nowrap', flexShrink:0 }}>· {prod.brand}</span>}
                                <span style={{ display:'flex', gap:4, overflow:'hidden', minWidth:0 }}>
                                  {prod.tags?.map((tag:string) => (
                                    <span key={tag} style={{ fontSize:10, fontWeight:700, color:'#FF6B9D', background:'rgba(255,107,157,0.1)', borderRadius:6, padding:'1px 6px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:1 }}>{tag}</span>
                                  ))}
                                </span>
                              </div>
                            </div>
                            <Icon icon="ph:caret-right" width={12} height={12} color="#CBD5E1" style={{ flexShrink:0 }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
              {/* 내 주변 */}
              <div className="menu-card-hover card-anim" onClick={() => setShowNearby(true)}
                style={{ background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📍</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>내 주변</div>
                  <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>주변 업체 지도</div>
                </div>
              </div>
              {(() => {
                const savedNotes = (() => { try { return JSON.parse(localStorage.getItem('app-notes') ?? '[]') } catch { return [] } })()
                const previewNotes = savedNotes.slice(0, 3)
                return (
                  <div className="card-anim" style={{ background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'16px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', animationDelay:`${(MENUS.length + 1) * 0.08}s` }}>
                    {/* 헤더 - 다른 타일과 동일한 구조 */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div onClick={() => setShowNote(true)} style={{ display:'flex', alignItems:'center', gap:14, cursor:'pointer', WebkitTapHighlightColor:'transparent', flex:1 }}>
                        <div style={{ width:44, height:44, borderRadius:14, background:'rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📝</div>
                        <div>
                          <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>노트</div>
                          <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>메모·기록·여행 노트</div>
                        </div>
                      </div>
                      <button onClick={() => { setNoteInitialView('write'); setNoteInitialId(undefined); setShowNote(true) }} style={{
                        width:28, height:28, borderRadius:'50%', background:'rgba(249,115,22,0.15)',
                        border:'none', display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', WebkitTapHighlightColor:'transparent', flexShrink:0,
                      }}>
                        <Icon icon="ph:plus-bold" width={14} height={14} color="#F97316" />
                      </button>
                    </div>
                    {/* 노트 리스트 */}
                    {previewNotes.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', marginTop:12 }}>
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
                  </div>
                )
              })()}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                <div className="menu-card-hover card-anim" onClick={() => setShowBingo(true)}
                  style={{ background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', cursor:'pointer' }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:10 }}>☕</div>
                  <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>카페 빙고</div>
                  <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>시드니·멜번 카페 투어</div>
                </div>
                <div className="menu-card-hover card-anim" onClick={() => setShowServices(true)}
                  style={{ background:'rgba(255,255,255,0.88)', borderRadius:20, padding:'18px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', cursor:'pointer' }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:10 }}>🏢</div>
                  <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>업체정보</div>
                  <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>한인 업체·병원</div>
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

      {/* 짐싸기 바텀시트 */}
      {showPacking && (
        <PackingSheet onClose={() => setShowPacking(false)} />
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
