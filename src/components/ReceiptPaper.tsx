import { AppState, TripInfo, getTripDays, fmtMD, dow } from '../store/state'
import { ITEMS } from '../data/checklist'
import { getGrade, getGradeLabel, getGradeColor } from '../utils/grade'

type Props = { state: AppState; trip: TripInfo; issuedAt: string }

export default function ReceiptPaper({ state, trip, issuedAt }: Props) {
  const allItems = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji: '📝' }))]
  const done  = Object.keys(state.selected).length
  const total = allItems.length
  const grade = getGrade(done, total)
  const days  = getTripDays(trip)

  const dayGroups = days.map((date, idx) => ({
    dayIdx: idx, date,
    items: allItems.filter(item =>
      state.selected[item.id] && (state.schedules[item.id] ?? []).includes(idx)
    ),
  })).filter(g => g.items.length > 0)

  const unscheduled = allItems.filter(item =>
    state.selected[item.id] && !(state.schedules[item.id]?.length)
  )

  return (
    <div id="receipt-root" style={{
      background: '#fff', width: 320, margin: '0 auto',
      fontFamily: "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
      borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(30,77,131,0.10)',
    }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #3A7FCC 0%, #1E4D83 100%)',
        padding: '20px 20px 16px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative bucket SVG */}
        <div style={{ position:'absolute', right:16, top:10, opacity:0.12 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path d="M18 28L46 28L42 58L22 58Z" fill="white"/>
            <rect x="14" y="22" width="36" height="8" rx="4" fill="white"/>
            <path d="M22 22 Q32 12 42 22" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.07)'}}/>

        <div style={{ position:'relative' }}>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:8, letterSpacing:3, fontWeight:700, marginBottom:6 }}>BUCKET LIST</div>
          <div style={{ color:'#fff', fontSize:22, fontWeight:900, letterSpacing:-0.5, marginBottom:2 }}>호주가자</div>
          <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10 }}>{issuedAt} 발행</div>
        </div>

        <div style={{ display:'flex', gap:14, marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.18)' }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:8, letterSpacing:1.5, marginBottom:2 }}>여행기간</div>
            <div style={{ color:'#fff', fontSize:11, fontWeight:700 }}>
              {trip.startDate.slice(5).replace('-','/')} ~ {trip.endDate.slice(5).replace('-','/')}
            </div>
          </div>
          <div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:8, letterSpacing:1.5, marginBottom:2 }}>완료 항목</div>
            <div style={{ color:'#fff', fontSize:11, fontWeight:700 }}>{done} / {total}</div>
          </div>
          <div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:8, letterSpacing:1.5, marginBottom:2 }}>등급</div>
            <div style={{ color:'#fff', fontSize:11, fontWeight:700 }}>{grade} CLASS</div>
          </div>
        </div>
      </div>

      {/* ── Perforation ── */}
      <div style={{ display:'flex', alignItems:'center', background:'#F4F7FB', padding:'0 10px', height:18 }}>
        <div style={{ flex:1, borderTop:'1.5px dashed rgba(30,77,131,0.18)' }}/>
        <div style={{ width:18, height:18, borderRadius:'50%', background:'#EEF2F8', border:'1px solid rgba(30,77,131,0.14)', margin:'0 6px', flexShrink:0 }}/>
        <div style={{ flex:1, borderTop:'1.5px dashed rgba(30,77,131,0.18)' }}/>
      </div>

      {/* ── Items ── */}
      <div style={{ padding:'14px 18px' }}>
        <div style={{ fontSize:8, color:'#8AAAC8', letterSpacing:3, fontWeight:800, marginBottom:12 }}>BUCKET LIST ITEMS</div>

        {dayGroups.length === 0 && unscheduled.length === 0 ? (
          <p style={{ color:'#C0CCD8', textAlign:'center', fontSize:12, padding:'12px 0' }}>체크한 항목이 없습니다</p>
        ) : (
          <>
            {dayGroups.map(({ dayIdx, date, items }) => (
              <div key={dayIdx} style={{ marginBottom:12 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:8, marginBottom:5,
                  background:'rgba(30,77,131,0.06)', borderRadius:6, padding:'4px 8px',
                  borderLeft:'2.5px solid #1E4D83',
                }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'#1E4D83' }}>{dayIdx+1}일차</span>
                  <span style={{ fontSize:10, color:'#8AAAC8' }}>{fmtMD(date)} ({dow(date)})</span>
                </div>
                {items.map(item => (
                  <div key={item.id} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    fontSize:12, color:'#2A3A50', padding:'3px 4px',
                    borderBottom:'1px solid #F0F4FA',
                  }}>
                    <span>{item.emoji} {item.label}</span>
                    <span style={{ color:'#1E4D83', fontWeight:800, fontSize:11 }}>✓</span>
                  </div>
                ))}
              </div>
            ))}
            {unscheduled.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:'#8AAAC8', fontWeight:700, marginBottom:5 }}>미지정</div>
                {unscheduled.map(item => (
                  <div key={item.id} style={{
                    display:'flex', justifyContent:'space-between', fontSize:12, color:'#8AAAC8', padding:'3px 4px',
                  }}>
                    <span>{item.emoji} {item.label}</span>
                    <span style={{ color:'#1E4D83', fontWeight:800, fontSize:11 }}>✓</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ borderTop:'1px dashed rgba(30,77,131,0.15)', margin:'12px 0' }}/>

        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontWeight:900, fontSize:14, letterSpacing:0.5, color:'#0F1B2D' }}>TOTAL</span>
          <span style={{ color:'#1E4D83', fontWeight:900, fontSize:14 }}>{done}/{total}건</span>
        </div>

        {/* Grade box */}
        <div style={{
          background:'linear-gradient(135deg,#EEF3FA,#F4F7FB)',
          border:'1px solid rgba(30,77,131,0.12)',
          borderRadius:12, padding:'14px 12px', textAlign:'center', marginBottom:14,
        }}>
          <div style={{ fontSize:8, color:'#8AAAC8', letterSpacing:3, marginBottom:6, fontWeight:800 }}>AU GRADE</div>
          <div style={{ fontSize:50, fontWeight:900, color:getGradeColor(grade), lineHeight:1, marginBottom:6 }}>{grade}</div>
          <div style={{ fontSize:11, color:'#5A7090', fontWeight:700 }}>"{getGradeLabel(grade)}"</div>
        </div>

        <div style={{ borderTop:'1px dashed rgba(30,77,131,0.15)', marginBottom:12 }}/>

        {/* Footer */}
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'#8AAAC8', fontSize:10, marginBottom:8, fontWeight:600 }}>
            호주가자 · 여행 버킷리스트 🦘
          </div>
          {/* Barcode */}
          <div style={{ display:'flex', gap:1.5, justifyContent:'center', height:32, alignItems:'stretch', margin:'0 0 6px' }}>
            {[2,1,3,1,2,1,3,2,1,2,3,1,2,1,2,3,1,2,1,3,2,1,2,1,3,2,1,2,3,1,2,1].map((w,i) => (
              <div key={i} style={{
                width:w,
                background: i%2===0 ? '#1E4D83' : 'rgba(30,77,131,0.2)',
                borderRadius:1, opacity: i%2===0 ? 0.65 : 0.3,
              }}/>
            ))}
          </div>
          <div style={{ fontSize:8, color:'#B0C0D4', letterSpacing:2, fontWeight:700 }}>{state.meta.receiptCode}</div>
        </div>
      </div>

      {/* ── Torn bottom ── */}
      <div style={{ height:14, backgroundImage:'radial-gradient(circle at 8px 19px, #F4F7FB 7px, #fff 7px)', backgroundSize:'16px 16px', backgroundRepeat:'repeat-x' }}/>
    </div>
  )
}
