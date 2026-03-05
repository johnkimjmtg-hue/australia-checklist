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
  const nightCount = days.length - 1

  const dayGroups = days.map((date, idx) => ({
    dayIdx: idx, date,
    items: allItems.filter(item =>
      state.selected[item.id] && (state.schedules[item.id] ?? []).includes(idx)
    ),
  })).filter(g => g.items.length > 0)

  const unscheduled = allItems.filter(item =>
    state.selected[item.id] && !(state.schedules[item.id]?.length)
  )

  const ff = (s:string) => "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif"

  return (
    <div id="receipt-root" style={{
      width: 320, margin: '0 auto',
      fontFamily: "-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>

      {/* ══════════════════════════════════
          TICKET HEADER — 항공권 상단
      ══════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3d6e 0%, #1E4D83 50%, #2E6BB0 100%)',
        borderRadius: '16px 16px 0 0',
        padding: '18px 20px 14px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 배경 원형 장식 */}
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

        {/* 항공사 로고 row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, position:'relative' }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:8, letterSpacing:3, fontWeight:800 }}>BUCKET LIST TICKET</div>
            <div style={{ color:'#fff', fontSize:24, fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginTop:2 }}>호주가자</div>
          </div>
          {/* 비행기 아이콘 */}
          <div style={{ fontSize:32, opacity:0.9 }}>✈️</div>
        </div>

        {/* 출발 → 도착 */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px',
          marginBottom:12,
        }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:8, letterSpacing:2, fontWeight:700 }}>FROM</div>
            <div style={{ color:'#fff', fontSize:20, fontWeight:900, letterSpacing:-0.5 }}>ICN</div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:9, fontWeight:600 }}>인천</div>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'0 10px' }}>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:9, fontWeight:700 }}>{nightCount}박 {days.length}일</div>
            <div style={{ width:'100%', display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.3)' }}/>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12 }}>✦</div>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.3)' }}/>
            </div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:8 }}>
              {trip.startDate.slice(5).replace('-','/')} ~ {trip.endDate.slice(5).replace('-','/')}
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:8, letterSpacing:2, fontWeight:700 }}>TO</div>
            <div style={{ color:'#fff', fontSize:20, fontWeight:900, letterSpacing:-0.5 }}>AUS</div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:9, fontWeight:600 }}>호주</div>
          </div>
        </div>

        {/* 발행 정보 */}
        <div style={{ display:'flex', gap:16 }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.45)', fontSize:7, letterSpacing:1.5, fontWeight:700 }}>PASSENGER</div>
            <div style={{ color:'#fff', fontSize:10, fontWeight:700 }}>호주 여행자</div>
          </div>
          <div>
            <div style={{ color:'rgba(255,255,255,0.45)', fontSize:7, letterSpacing:1.5, fontWeight:700 }}>ISSUED</div>
            <div style={{ color:'#fff', fontSize:10, fontWeight:700 }}>{issuedAt}</div>
          </div>
          <div>
            <div style={{ color:'rgba(255,255,255,0.45)', fontSize:7, letterSpacing:1.5, fontWeight:700 }}>ITEMS</div>
            <div style={{ color:'#fff', fontSize:10, fontWeight:700 }}>{done}건 완료</div>
          </div>
        </div>
      </div>

      {/* 티켓 찢는 선 */}
      <div style={{
        background:'#F0F4FA',
        display:'flex', alignItems:'center',
        position:'relative', height:20,
      }}>
        {/* 왼쪽 반원 */}
        <div style={{ width:20, height:20, borderRadius:'0 10px 10px 0', background:'#E8EDF6', flexShrink:0 }}/>
        {/* 점선 */}
        <div style={{ flex:1, borderTop:'2px dashed rgba(30,77,131,0.2)', margin:'0 4px' }}/>
        {/* TEAR HERE */}
        <div style={{ fontSize:7, color:'rgba(30,77,131,0.35)', fontWeight:800, letterSpacing:1.5, flexShrink:0 }}>✂ TEAR HERE</div>
        <div style={{ flex:1, borderTop:'2px dashed rgba(30,77,131,0.2)', margin:'0 4px' }}/>
        {/* 오른쪽 반원 */}
        <div style={{ width:20, height:20, borderRadius:'10px 0 0 10px', background:'#E8EDF6', flexShrink:0 }}/>
      </div>

      {/* ══════════════════════════════════
          BUCKET LIST BODY
      ══════════════════════════════════ */}
      <div style={{
        background:'#fff',
        border:'1px solid rgba(30,77,131,0.08)',
        borderTop:'none',
        padding:'16px 18px',
      }}>
        <div style={{ fontSize:8, color:'#8AAAC8', letterSpacing:3, fontWeight:800, marginBottom:12 }}>
          ✦ BUCKET LIST ITEMS ✦
        </div>

        {dayGroups.length === 0 && unscheduled.length === 0 ? (
          <p style={{ color:'#C0CCD8', textAlign:'center', fontSize:12, padding:'20px 0' }}>체크한 항목이 없습니다</p>
        ) : (
          <>
            {/* 날짜별 티켓 카드 */}
            {dayGroups.map(({ dayIdx, date, items }) => (
              <div key={dayIdx} style={{ marginBottom:10 }}>
                {/* 날짜 헤더 — 티켓 스텁 느낌 */}
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  background:'linear-gradient(90deg, #1E4D83, #2E6BB0)',
                  borderRadius:'6px 6px 0 0', padding:'5px 10px',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ color:'rgba(255,255,255,0.7)', fontSize:9, fontWeight:800 }}>{dayIdx+1}일차</span>
                    <span style={{ color:'rgba(255,255,255,0.5)', fontSize:9 }}>·</span>
                    <span style={{ color:'rgba(255,255,255,0.85)', fontSize:9, fontWeight:700 }}>
                      {fmtMD(date)} ({dow(date)})
                    </span>
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.6)', fontSize:9, fontWeight:700 }}>{items.length}건</span>
                </div>
                {/* 아이템 목록 */}
                <div style={{
                  border:'1px solid rgba(30,77,131,0.1)', borderTop:'none',
                  borderRadius:'0 0 6px 6px', overflow:'hidden',
                }}>
                  {items.map((item, i) => (
                    <div key={item.id} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'6px 10px',
                      background: i%2===0 ? '#fff' : '#F8FAFD',
                      borderBottom: i < items.length-1 ? '1px solid rgba(30,77,131,0.05)' : 'none',
                    }}>
                      <span style={{ fontSize:12, color:'#2A3A50', fontWeight:500 }}>
                        {item.emoji} {item.label}
                      </span>
                      <span style={{
                        width:18, height:18, borderRadius:'50%',
                        background:'#1E4D83',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:9, color:'#fff', fontWeight:900, flexShrink:0,
                      }}>✓</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 미지정 항목 */}
            {unscheduled.length > 0 && (
              <div style={{ marginBottom:10 }}>
                <div style={{
                  background:'#F0F4FA', borderRadius:'6px 6px 0 0',
                  padding:'5px 10px',
                  display:'flex', justifyContent:'space-between',
                }}>
                  <span style={{ fontSize:9, color:'#8AAAC8', fontWeight:800 }}>날짜 미지정</span>
                  <span style={{ fontSize:9, color:'#8AAAC8', fontWeight:700 }}>{unscheduled.length}건</span>
                </div>
                <div style={{ border:'1px solid rgba(30,77,131,0.08)', borderTop:'none', borderRadius:'0 0 6px 6px', overflow:'hidden' }}>
                  {unscheduled.map((item, i) => (
                    <div key={item.id} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'6px 10px',
                      background: i%2===0 ? '#fff' : '#F8FAFD',
                      borderBottom: i < unscheduled.length-1 ? '1px solid rgba(30,77,131,0.05)' : 'none',
                    }}>
                      <span style={{ fontSize:12, color:'#8AAAC8', fontWeight:500 }}>{item.emoji} {item.label}</span>
                      <span style={{ fontSize:9, color:'#8AAAC8' }}>✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 합계 */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          borderTop:'1.5px dashed rgba(30,77,131,0.15)', paddingTop:10, marginTop:4,
        }}>
          <span style={{ fontWeight:900, fontSize:13, color:'#0F1B2D', letterSpacing:0.5 }}>TOTAL</span>
          <span style={{ color:'#1E4D83', fontWeight:900, fontSize:13 }}>{done} / {total}건</span>
        </div>
      </div>

      {/* 티켓 찢는 선 2 */}
      <div style={{
        background:'#F0F4FA',
        display:'flex', alignItems:'center',
        position:'relative', height:20,
      }}>
        <div style={{ width:20, height:20, borderRadius:'0 10px 10px 0', background:'#E8EDF6', flexShrink:0 }}/>
        <div style={{ flex:1, borderTop:'2px dashed rgba(30,77,131,0.2)', margin:'0 4px' }}/>
        <div style={{ width:20, height:20, borderRadius:'10px 0 0 10px', background:'#E8EDF6', flexShrink:0 }}/>
      </div>

      {/* ══════════════════════════════════
          STUB — 등급 + 바코드
      ══════════════════════════════════ */}
      <div style={{
        background:'#F8FAFD',
        border:'1px solid rgba(30,77,131,0.08)',
        borderTop:'none',
        borderRadius:'0 0 16px 16px',
        padding:'14px 18px 16px',
      }}>
        {/* 등급 */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'#fff', borderRadius:10, padding:'10px 14px', marginBottom:12,
          border:'1px solid rgba(30,77,131,0.08)',
          boxShadow:'0 2px 8px rgba(30,77,131,0.06)',
        }}>
          <div>
            <div style={{ fontSize:7, color:'#8AAAC8', letterSpacing:2, fontWeight:800, marginBottom:3 }}>AU GRADE</div>
            <div style={{ fontSize:9, color:'#5A7090', fontWeight:700 }}>"{getGradeLabel(grade)}"</div>
          </div>
          <div style={{ fontSize:44, fontWeight:900, color:getGradeColor(grade), lineHeight:1 }}>{grade}</div>
        </div>

        {/* 바코드 */}
        <div style={{ textAlign:'center' }}>
          <div style={{ display:'flex', gap:1.5, justifyContent:'center', height:36, alignItems:'stretch', marginBottom:5 }}>
            {[2,1,3,1,2,1,3,2,1,2,3,1,2,1,2,3,1,2,1,3,2,1,2,1,3,2,1,2,3,1,2,1,2,1,3,1,2].map((w,i) => (
              <div key={i} style={{
                width:w,
                background: i%2===0 ? '#1E4D83' : 'transparent',
                borderRadius:1,
                opacity: i%2===0 ? 0.7 : 1,
              }}/>
            ))}
          </div>
          <div style={{ fontSize:8, color:'#B0C0D4', letterSpacing:3, fontWeight:700 }}>{state.meta.receiptCode}</div>
          <div style={{ fontSize:9, color:'#8AAAC8', marginTop:6, fontWeight:600 }}>호주가자 · BUCKET LIST TICKET 🦘</div>
        </div>
      </div>
    </div>
  )
}
