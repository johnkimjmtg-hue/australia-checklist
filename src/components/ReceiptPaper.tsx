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
    <div id="receipt-root"
      style={{ background:'#fff', width:320, margin:'0 auto', fontFamily:"'Noto Sans KR', sans-serif", borderRadius:4, overflow:'hidden' }}>

      {/* ── Boarding pass header ── */}
      <div style={{
        background:'linear-gradient(135deg, #4F6BDC 0%, #304FB4 100%)',
        padding:'18px 20px 14px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
        <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:9, letterSpacing:3, fontWeight:700, marginBottom:4 }}>BOARDING PASS</div>
            <div style={{ color:'#fff', fontSize:20, fontWeight:900, letterSpacing:1 }}>호주가자 🦘</div>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, marginTop:4 }}>{issuedAt}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:9, letterSpacing:2, marginBottom:4 }}>DESTINATION</div>
            <div style={{ color:'#fff', fontSize:22, fontWeight:900 }}>AUS</div>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10 }}>AUSTRALIA</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:16, marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.2)' }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:8, letterSpacing:1.5 }}>FROM</div>
            <div style={{ color:'#fff', fontSize:12, fontWeight:700 }}>KOR ✈ AUS</div>
          </div>
          <div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:8, letterSpacing:1.5 }}>TOTAL ITEMS</div>
            <div style={{ color:'#fff', fontSize:12, fontWeight:700 }}>{done}/{total}</div>
          </div>
          <div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:8, letterSpacing:1.5 }}>GRADE</div>
            <div style={{ color:'#fff', fontSize:12, fontWeight:700 }}>{grade} CLASS</div>
          </div>
        </div>
      </div>

      {/* ── Perforation ── */}
      <div style={{ display:'flex', alignItems:'center', background:'#F0F4FF', padding:'0 12px', height:20 }}>
        <div style={{ flex:1, borderTop:'2px dashed rgba(48,79,180,0.2)' }}/>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'#EEF2FF', border:'1px solid rgba(48,79,180,0.15)', margin:'0 8px', flexShrink:0 }}/>
        <div style={{ flex:1, borderTop:'2px dashed rgba(48,79,180,0.2)' }}/>
      </div>

      {/* ── Items ── */}
      <div style={{ padding:'14px 20px' }}>
        <div style={{ fontSize:9, color:'#9CA3AF', letterSpacing:3, fontWeight:700, marginBottom:12 }}>RECEIPT TO DO [AU]</div>

        {dayGroups.length === 0 && unscheduled.length === 0 ? (
          <p style={{ color:'#ccc', textAlign:'center', fontSize:13, padding:'12px 0' }}>체크한 항목이 없습니다</p>
        ) : (
          <>
            {dayGroups.map(({ dayIdx, date, items }) => (
              <div key={dayIdx} style={{ marginBottom:12 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:8, marginBottom:6,
                  background:'rgba(48,79,180,0.06)', borderRadius:8, padding:'4px 10px',
                  borderLeft:'3px solid #304FB4',
                }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'#304FB4' }}>{dayIdx+1}일차</span>
                  <span style={{ fontSize:11, color:'#9CA3AF' }}>{fmtMD(date)} ({dow(date)})</span>
                </div>
                {items.map(item => (
                  <div key={item.id} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    fontSize:13, color:'#333', padding:'3px 4px', borderBottom:'1px solid #F0F4FF',
                  }}>
                    <span>{item.emoji} {item.label}</span>
                    <span style={{ color:'#304FB4', fontWeight:700 }}>✓</span>
                  </div>
                ))}
              </div>
            ))}
            {unscheduled.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, marginBottom:6 }}>미지정</div>
                {unscheduled.map(item => (
                  <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#999', padding:'3px 4px' }}>
                    <span>{item.emoji} {item.label}</span>
                    <span style={{ color:'#304FB4', fontWeight:700 }}>✓</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ borderTop:'1px dashed rgba(48,79,180,0.2)', margin:'12px 0' }} />
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontWeight:900, fontSize:15, letterSpacing:1 }}>TOTAL</span>
          <span style={{ color:'#304FB4', fontWeight:900, fontSize:15 }}>{done}/{total}건</span>
        </div>

        {/* Grade box */}
        <div style={{
          background:'linear-gradient(135deg, #EEF2FF, #F0F4FF)',
          border:'1.5px solid rgba(48,79,180,0.15)',
          borderRadius:14, padding:'14px', textAlign:'center', marginBottom:16,
        }}>
          <div style={{ fontSize:9, color:'#6B7280', letterSpacing:3, marginBottom:8, fontWeight:700 }}>AU GRADE</div>
          <div style={{ fontSize:52, fontWeight:900, color:getGradeColor(grade), lineHeight:1, marginBottom:8 }}>{grade}</div>
          <div style={{ fontSize:12, color:'#4F6BDC', fontWeight:600 }}>"{getGradeLabel(grade)}"</div>
        </div>

        <div style={{ borderTop:'1px dashed rgba(48,79,180,0.2)', marginBottom:14 }} />

        {/* Footer */}
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'#6B7280', fontSize:11, marginBottom:8, fontWeight:500 }}>Thank you for visiting Australia! 🦘</div>
          <div style={{ display:'flex', gap:1.5, justifyContent:'center', height:36, alignItems:'stretch', margin:'0 0 8px' }}>
            {[2,1,3,1,2,1,3,2,1,2,3,1,2,1,2,3,1,2,1,3,2,1,2,1,3,2,1,2,3,1,2,1].map((w,i) => (
              <div key={i} style={{
                width:w,
                background: i%2===0 ? '#304FB4' : 'rgba(48,79,180,0.2)',
                borderRadius:1, opacity: i%2===0 ? 0.7 : 0.4,
              }}/>
            ))}
          </div>
          <div style={{ fontSize:9, color:'#9CA3AF', letterSpacing:2, fontWeight:700 }}>{state.meta.receiptCode}</div>
        </div>
      </div>

      {/* ── Torn bottom ── */}
      <div style={{ height:16, backgroundImage:'radial-gradient(circle at 8px 21px, #F0F4FF 8px, #fff 8px)', backgroundSize:'16px 16px', backgroundRepeat:'repeat-x' }} />
    </div>
  )
}
