// ─────────────────────────────────────────────
// TripCalendar.tsx
// 공통 달력 컴포넌트 - HomePage, BucketListPage 등에서 공유
// ─────────────────────────────────────────────
import { useState } from 'react'
import { TripInfo, getTripDays } from '../store/state'
import { AppState } from '../store/state'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const TODAY = new Date()

type DotInfo = { color: string }

type Props = {
  trip: TripInfo
  state?: AppState
  selectedDay: number | null
  onDaySelect: (dayIndex: number | null) => void
  getDots?: (dayIndex: number) => DotInfo[]
}

export default function TripCalendar({ trip, state, selectedDay, onDaySelect, getDots }: Props) {
  const startDate = new Date(trip.startDate)
  const endDate = new Date(trip.endDate)
  const tripDays = getTripDays(trip)

  const [vy, setVy] = useState(() => startDate.getFullYear())
  const [vm, setVm] = useState(() => startDate.getMonth())

  const chgMo = (d: number) => {
    let ny = vy, nm = vm + d
    if (nm > 11) { nm = 0; ny++ }
    if (nm < 0) { nm = 11; ny-- }
    setVy(ny); setVm(nm)
  }

  const fmtMD = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`
  const dow = (d: Date) => ['일','월','화','수','목','금','토'][d.getDay()]

  const renderCal = () => {
    const first = new Date(vy, vm, 1).getDay()
    const days = new Date(vy, vm+1, 0).getDate()
    const todayMidnight = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
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
      const dots = dayIdx >= 0 && getDots ? getDots(dayIdx) : []

      let bg = 'transparent'
      let color = isPast ? '#7BAAB5' : '#0D3349'
      let radius = '50%'
      let fw: number = 400

      if (isSelected) { bg = '#00838F'; color = '#fff'; fw = 800 }
      else if (isStart || isEnd) { bg = '#00838F'; color = '#fff'; fw = 800 }
      else if (isInTrip) { bg = '#B2EBF2'; color = '#006064'; radius = '0' }

      cells.push(
        <div key={d} onClick={() => dayIdx >= 0 && onDaySelect(selectedDay === dayIdx ? null : dayIdx)}
          style={{
            aspectRatio:'1', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            borderRadius: radius, background: bg, color, fontWeight: fw,
            fontSize: 12, cursor: dayIdx >= 0 ? 'pointer' : 'default',
            border: isToday && !isSelected && !isStart && !isEnd ? '1.5px solid #00838F' : 'none',
            position:'relative', WebkitTapHighlightColor:'transparent',
            userSelect:'none',
          }}>
          {d}
          {dots.length > 0 && !isSelected && (
            <div style={{ display:'flex', gap:2, position:'absolute', bottom:3 }}>
              {dots.slice(0,3).map((dot, i) => (
                <div key={i} style={{ width:3, height:3, borderRadius:'50%', background: dot.color }} />
              ))}
            </div>
          )}
        </div>
      )
    }
    return cells
  }

  const selectedDayDate = selectedDay !== null ? tripDays[selectedDay] : null

  return (
    <div style={{ background:'#EFFCFC', borderRadius:22, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.10)' }}>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 8px' }}>
        <button onClick={() => chgMo(-1)} style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8, WebkitTapHighlightColor:'transparent' }}>‹</button>
        <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>
          <span style={{ color:'#00838F' }}>{vy}년</span> · {MONTHS[vm]}
        </div>
        <button onClick={() => chgMo(1)} style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8, WebkitTapHighlightColor:'transparent' }}>›</button>
      </div>

      {/* 요일 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 10px' }}>
        {['일','월','화','수','목','금','토'].map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11, color:'#1565A0', fontWeight:600, padding:'4px 0 6px' }}>{d}</div>
        ))}
      </div>

      {/* 날짜 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'0 10px 12px' }}>
        {renderCal()}
      </div>

      {/* 선택된 날짜 표시 */}
      {selectedDayDate && (
        <div style={{ padding:'8px 16px 12px', borderTop:'1px solid rgba(0,131,143,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#00838F' }}>
            {fmtMD(selectedDayDate)} ({dow(selectedDayDate)}) 일정
          </span>
          <button onClick={() => onDaySelect(null)} style={{ background:'none', border:'none', fontSize:12, color:'#1565A0', cursor:'pointer', fontFamily:'inherit' }}>전체 보기</button>
        </div>
      )}
    </div>
  )
}
