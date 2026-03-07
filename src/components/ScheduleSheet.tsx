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
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(10,20,40,0.45)', zIndex:500, animation:'fadeIn 0.2s ease' }}/>
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:390,
        background:'#fff', borderRadius:'18px 18px 0 0',
        zIndex:501, padding:'18px 16px 36px',
        maxHeight:'70vh', overflowY:'auto',
        animation:'slideUpSheet 0.25s ease',
        boxShadow:'0 -4px 24px rgba(30,77,131,0.12)',
      }}>
        <div style={{ width:36, height:4, background:'rgba(30,77,131,0.15)', borderRadius:2, margin:'0 auto 14px' }}/>
        <p style={{ fontWeight:800, fontSize:14, textAlign:'center', marginBottom:14, color:'#0F1B2D' }}>
          <span style={{ color:'#1E4D83' }}>"{itemLabel}"</span> 일정 추가
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
          {days.map((d, idx) => {
            const sel = currentDays.includes(idx)
            return (
              <button key={idx} onClick={() => toggle(idx)} style={{
                padding:'8px 4px', borderRadius:10, cursor:'pointer', textAlign:'center',
                border: sel ? 'none' : '1px solid rgba(30,77,131,0.14)',
                background: sel ? '#1E4D83' : '#fff',
                color: sel ? '#fff' : '#3A4A5C',
                boxShadow: sel ? '0 3px 10px rgba(30,77,131,0.22)' : '0 1px 3px rgba(30,77,131,0.06)',
                transition:'all .12s',
              }}>
                <div style={{ fontWeight:800, fontSize:12 }}>{idx+1}일</div>
                <div style={{ fontSize:10, opacity:.7, marginTop:1 }}>{fmtMD(d)}</div>
                <div style={{ fontSize:9, opacity:.6 }}>{dow(d)}</div>
              </button>
            )
          })}
        </div>
        <button onClick={onClose} style={{
          width:'100%', marginTop:14, height:44,
          background: currentDays.length > 0 ? '#003594' : 'rgba(30,77,131,0.06)',
          border:'none', borderRadius:10,
          fontSize:13, fontWeight:700,
          color: currentDays.length > 0 ? '#fff' : '#5A7090',
          cursor:'pointer',
          boxShadow: currentDays.length > 0 ? '0 4px 14px rgba(0,53,148,0.25)' : 'none',
        }}>{currentDays.length > 0 ? `${currentDays.length}일 추가하기 ✓` : '닫기'}</button>
      </div>
    </>
  )
}
