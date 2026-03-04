import { TripInfo, getTripDays, fmtMD, dow } from '../store/state'

type Props = {
  itemLabel: string; trip: TripInfo
  currentDays: number[]
  onSelect: (days: number[]) => void
  onClose: () => void
}

export default function ScheduleSheet({ itemLabel, trip, currentDays, onSelect, onClose }: Props) {
  const days = getTripDays(trip)
  const toggle = (idx: number) => {
    const next = currentDays.includes(idx) ? currentDays.filter(d => d !== idx) : [...currentDays, idx]
    onSelect(next)
  }
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:500, animation:'fadeIn 0.2s ease' }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'#fff', borderRadius:'22px 22px 0 0',
        zIndex:501, padding:'20px 20px 40px',
        maxHeight:'72vh', overflowY:'auto',
        animation:'slideUp 0.28s ease',
        boxShadow:'0 -4px 30px rgba(0,0,0,0.12)',
      }}>
        <div style={{ width:40, height:4, background:'#e0e0e0', borderRadius:2, margin:'0 auto 16px' }} />
        <p style={{ fontWeight:700, fontSize:16, textAlign:'center', marginBottom:16 }}>
          <span style={{ color:'#1a2e5e' }}>"{itemLabel}"</span> 일정에 추가
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {days.map((d, idx) => {
            const sel = currentDays.includes(idx)
            return (
              <button key={idx} onClick={() => toggle(idx)} style={{
                padding:'10px 4px', borderRadius:12,
                border: sel ? '2px solid #1a2e5e' : '1.5px solid #e8e8e8',
                background: sel ? '#1a2e5e' : '#fff',
                color: sel ? '#fff' : '#333',
                cursor:'pointer', textAlign:'center', transition:'all 0.15s',
              }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{idx+1}일차</div>
                <div style={{ fontSize:10, opacity:.7, marginTop:2 }}>{fmtMD(d)} {dow(d)}</div>
              </button>
            )
          })}
        </div>
        <button onClick={onClose} style={{
          width:'100%', marginTop:18, padding:'14px',
          background:'#f4f6fa', border:'none', borderRadius:12,
          fontSize:15, fontWeight:600, color:'#666', cursor:'pointer',
        }}>닫기</button>
      </div>
    </>
  )
}
