import { Icon } from '@iconify/react'
import { TripInfo, getTripDays, fmtMD, dow } from '../store/state'

type Props = { itemLabel:string; trip:TripInfo; currentDays:number[]; onSelect:(days:number[])=>void; onClose:()=>void }

export default function ScheduleSheet({ itemLabel, trip, currentDays, onSelect, onClose }: Props) {
  const days = getTripDays(trip)
  const toggle = (idx:number) => {
    const next = currentDays.includes(idx) ? currentDays.filter(d=>d!==idx) : [...currentDays, idx]
    onSelect(next)
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, animation:'fadeIn 0.2s ease' }} />

      <div style={{
        position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
        width:'calc(100% - 32px)', maxWidth:398,
        background:'#ffffff', borderRadius:20,
        zIndex:501, padding:'12px 16px 20px',
        maxHeight:'85vh', overflowY:'auto',
        animation:'slideUpSheet 0.25s cubic-bezier(0.32,0.72,0,1)',
        boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
        display:'flex', flexDirection:'column', gap:12,
        fontFamily:"-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif",
      }}>



        {/* X 닫기 버튼 */}
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
            <Icon icon="ph:x" width={16} height={16} color="#0D3349" />
          </button>
        </div>

        {/* 제목 */}
        <div style={{ textAlign:'center', flexShrink:0 }}>
          <div style={{ fontSize:11, color:'#7BAAB5', fontWeight:500, marginBottom:4 }}>일정 추가</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#0D3349', lineHeight:1.4 }}>
            <span style={{ color:'#29B6D0' }}>"{itemLabel}"</span>
          </div>
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
          {days.map((d, idx) => {
            const sel = currentDays.includes(idx)
            return (
              <button key={idx} onClick={() => toggle(idx)} style={{
                padding:'10px 4px', borderRadius:10, cursor:'pointer', textAlign:'center',
                border: sel ? '1.5px solid #29B6D0' : '1px solid rgba(0,131,143,0.15)',
                background: sel ? 'rgba(41,182,208,0.12)' : '#ffffff',
                color: sel ? '#29B6D0' : '#1565A0',
                transition:'all 0.12s', WebkitTapHighlightColor:'transparent',
                fontFamily:'inherit',
              }}>
                <div style={{ fontWeight: sel ? 700 : 500, fontSize:14 }}>{idx+1}일</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:2 }}>{fmtMD(d)}</div>
                <div style={{ fontSize:9, opacity:0.6 }}>{dow(d)}</div>
              </button>
            )
          })}
        </div>

        {/* 선택 현황 */}
        {currentDays.length > 0 && (
          <div style={{
            background:'rgba(41,182,208,0.12)', borderRadius:10,
            padding:'8px 12px', textAlign:'center',
            fontSize:13, fontWeight:700, color:'#29B6D0', flexShrink:0,
          }}>
            📅 {currentDays.length}일 선택됨
          </div>
        )}

        {/* 확인 버튼 */}
        {currentDays.length > 0 && (
          <button onClick={onClose} style={{
            width:'100%', height:48, flexShrink:0,
            background:'#29B6D0', color:'#fff',
            border:'none', borderRadius:12,
            fontSize:15, fontWeight:700, cursor:'pointer',
            fontFamily:'inherit', WebkitTapHighlightColor:'transparent', transition:'all 0.15s',
          }}>
            {`${currentDays.length}일 추가하기 ✓`}
          </button>
        )}
      </div>
    </>
  )
}
