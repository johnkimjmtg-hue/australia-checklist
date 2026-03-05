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
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.45)', zIndex:500, animation:'fadeIn 0.2s ease' }} />
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'#fff', borderRadius:'22px 22px 0 0',
        zIndex:501, padding:'20px 20px 40px',
        maxHeight:'72vh', overflowY:'auto',
        animation:'slideUp 0.28s ease',
        boxShadow:'0 -4px 30px rgba(48,79,180,0.14)',
        border:'1px solid rgba(48,79,180,0.08)',
      }}>
        <div style={{ width:40, height:4, background:'rgba(48,79,180,0.15)', borderRadius:2, margin:'0 auto 16px' }} />
        <p style={{ fontWeight:700, fontSize:16, textAlign:'center', marginBottom:16 }}>
          <span style={{ color:'#304FB4' }}>"{itemLabel}"</span> 일정에 추가
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {days.map((d, idx) => {
            const sel = currentDays.includes(idx)
            return (
              <button key={idx} onClick={() => toggle(idx)} style={{
                padding:'10px 4px', borderRadius:12, cursor:'pointer', textAlign:'center', transition:'all 0.15s',
                border: sel ? 'none' : '1px solid rgba(48,79,180,0.15)',
                background: sel ? 'linear-gradient(180deg,#4F6BDC,#304FB4)' : 'rgba(255,255,255,0.9)',
                color: sel ? '#fff' : '#333',
                boxShadow: sel ? '0 4px 12px rgba(48,79,180,0.25)' : '0 1px 4px rgba(48,79,180,0.06)',
              }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{idx+1}일차</div>
                <div style={{ fontSize:10, opacity:.7, marginTop:2 }}>{fmtMD(d)} {dow(d)}</div>
              </button>
            )
          })}
        </div>
        <button onClick={onClose} style={{
          width:'100%', marginTop:18, padding:'14px',
          background:'rgba(48,79,180,0.06)', border:'none', borderRadius:12,
          fontSize:15, fontWeight:600, color:'#6B7280', cursor:'pointer',
        }}>닫기</button>
      </div>
    </>
  )
}
