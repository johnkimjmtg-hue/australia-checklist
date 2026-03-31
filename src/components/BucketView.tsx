// ─────────────────────────────────────────────
// BucketView.tsx — 버킷리스트 뷰
// src/components/home/BucketView.tsx
// ─────────────────────────────────────────────
import { useState } from 'react'
import { AppState, TripInfo, getTripDays, toggleItem, setSchedule } from '../../store/state'
import { ITEMS, CATEGORIES } from '../../data/checklist'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

type Props = {
  state: AppState
  setState: (s: AppState) => void
  trip: TripInfo
  selectedDay: number | null
  onGoHome: () => void
  onGoChecklist: () => void
}

export default function BucketView({ state, setState, trip, selectedDay, onGoHome, onGoChecklist }: Props) {
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [addCategory, setAddCategory] = useState('all')

  const tripDays = getTripDays(trip)
  const fmtMD = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`
  const dow = (d: Date) => ['일','월','화','수','목','금','토'][d.getDay()]

  const checkedItems = [
    ...ITEMS.filter(item => state.selected[item.id]),
    ...state.customItems.filter(item => state.selected[item.id]).map(c => ({ ...c, emoji: '✏️' })),
  ]

  // 날짜별 그룹
  const grouped: { dayIdx: number; date: Date; items: typeof checkedItems }[] = []
  const unscheduled: typeof checkedItems = []

  if (selectedDay !== null) {
    const items = checkedItems.filter(item => (state.schedules[item.id] ?? []).includes(selectedDay))
    if (tripDays[selectedDay]) grouped.push({ dayIdx: selectedDay, date: tripDays[selectedDay], items })
  } else {
    tripDays.forEach((date, idx) => {
      const items = checkedItems.filter(item => (state.schedules[item.id] ?? []).includes(idx))
      if (items.length > 0) grouped.push({ dayIdx: idx, date, items })
    })
    checkedItems.forEach(item => {
      if ((state.schedules[item.id] ?? []).length === 0) unscheduled.push(item)
    })
  }

  const handleRemove = (itemId: string) => setState(toggleItem(state, itemId))

  const handleRemoveDay = (itemId: string, dayIdx: number) => {
    const current = state.schedules[itemId] ?? []
    setState(setSchedule(state, itemId, current.filter(d => d !== dayIdx)))
  }

  const handleAdd = (item: typeof ITEMS[0]) => {
    const newState = toggleItem(state, item.id)
    if (selectedDay !== null) setState(setSchedule(newState, item.id, [selectedDay]))
    else setState(newState)
    setShowAddSheet(false)
  }

  const addable = ITEMS.filter(item =>
    !state.selected[item.id] && (addCategory === 'all' || item.categoryId === addCategory)
  )

  const isEmpty = checkedItems.length === 0

  return (
    <>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <button onClick={onGoHome} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:'6px 0', WebkitTapHighlightColor:'transparent', fontFamily:ff }}>
          <span style={{ fontSize:16, color:'#0D3349' }}>‹</span>
          <span style={{ fontSize:13, color:'#0D3349', fontWeight:600 }}>홈</span>
        </button>
        <span style={{ fontSize:16, fontWeight:700, color:'#0D3349' }}>
          {selectedDay !== null && tripDays[selectedDay]
            ? `${fmtMD(tripDays[selectedDay])} 버킷리스트`
            : '버킷리스트'}
        </span>
        <button onClick={() => setShowAddSheet(true)} style={{
          background:'#00838F', border:'none', borderRadius:20, padding:'6px 14px',
          fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:ff,
          WebkitTapHighlightColor:'transparent',
        }}>+ 추가</button>
      </div>

      {isEmpty ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 0', gap:14 }}>
          <div style={{ fontSize:48 }}>🗺️</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#0D3349' }}>아직 버킷리스트가 없어요</div>
          <div style={{ fontSize:14, color:'#1565A0', textAlign:'center', lineHeight:1.6 }}>
            체크리스트에서 항목을 추가하거나<br/>직접 추가해보세요!
          </div>
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button onClick={() => setShowAddSheet(true)} style={{ background:'#00838F', border:'none', borderRadius:50, padding:'12px 20px', fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:ff }}>
              + 직접 추가
            </button>
            <button onClick={onGoChecklist} style={{ background:'#EFFCFC', border:'1.5px solid #00838F', borderRadius:50, padding:'12px 20px', fontSize:14, fontWeight:700, color:'#00838F', cursor:'pointer', fontFamily:ff }}>
              체크리스트 보기
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {grouped.map(({ dayIdx, date, items }) => items.length > 0 && (
            <div key={dayIdx}>
              <div style={{ fontSize:13, fontWeight:700, color:'#00838F', marginBottom:8 }}>
                📅 Day {dayIdx + 1} · {fmtMD(date)} ({dow(date)})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {items.map(item => (
                  <div key={item.id} style={{ background:'#EFFCFC', borderRadius:16, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{item.emoji}</span>
                    <span style={{ flex:1, fontSize:14, fontWeight:600, color:'#0D3349' }}>{item.label}</span>
                    <button onClick={() => handleRemoveDay(item.id, dayIdx)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#bbb', padding:4, WebkitTapHighlightColor:'transparent' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {unscheduled.length > 0 && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1565A0', marginBottom:8 }}>📌 날짜 미지정</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {unscheduled.map(item => (
                  <div key={item.id} style={{ background:'#EFFCFC', borderRadius:16, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{item.emoji}</span>
                    <span style={{ flex:1, fontSize:14, fontWeight:600, color:'#0D3349' }}>{item.label}</span>
                    <button onClick={() => handleRemove(item.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#bbb', padding:4, WebkitTapHighlightColor:'transparent' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 추가 바텀시트 */}
      {showAddSheet && (
        <>
          <div onClick={() => setShowAddSheet(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
          <div style={{ position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 32px)', maxWidth:398, background:'#EFFCFC', borderRadius:20, maxHeight:'85vh', display:'flex', flexDirection:'column', zIndex:801, animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)' }}>
            <div style={{ width:36, height:4, borderRadius:999, background:'rgba(0,0,0,0.15)', margin:'12px auto 0', flexShrink:0 }} />
            <div style={{ padding:'14px 20px 8px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>버킷리스트 추가</div>
              <button onClick={() => setShowAddSheet(false)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }}>
                <span style={{ fontSize:14, color:'#0D3349' }}>✕</span>
              </button>
            </div>
            <div style={{ display:'flex', gap:6, padding:'0 20px 10px', overflowX:'auto', flexShrink:0 }}>
              {['all', ...CATEGORIES.filter(c => c.id !== 'custom').map(c => c.id)].map(cat => {
                const catInfo = CATEGORIES.find(c => c.id === cat)
                const label = cat === 'all' ? '전체' : `${catInfo?.emoji} ${catInfo?.label}`
                return (
                  <button key={cat} onClick={() => setAddCategory(cat)} style={{
                    padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', flexShrink:0,
                    background: addCategory === cat ? '#00838F' : '#fff',
                    color: addCategory === cat ? '#fff' : '#1565A0',
                    fontSize:12, fontWeight:600, fontFamily:ff,
                  }}>{label}</button>
                )
              })}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'0 20px 28px', display:'flex', flexDirection:'column', gap:8 }}>
              {addable.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#1565A0', fontSize:14 }}>모두 추가했어요! 🎉</div>
              ) : addable.map(item => (
                <button key={item.id} onClick={() => handleAdd(item)} style={{ background:'#fff', border:'none', borderRadius:14, padding:'12px 16px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, fontFamily:ff, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', WebkitTapHighlightColor:'transparent' }}>
                  <span style={{ fontSize:20 }}>{item.emoji}</span>
                  <span style={{ fontSize:14, color:'#0D3349', fontWeight:500, flex:1 }}>{item.label}</span>
                  <span style={{ fontSize:20, color:'#00838F' }}>+</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
