// ─────────────────────────────────────────────
// LandingPage.tsx
// ─────────────────────────────────────────────
import { useState } from 'react'
import { saveTrip } from '../store/state'
import type { TripInfo } from '../store/state'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const TODAY = new Date()
const MIN_Y = TODAY.getFullYear()
const MAX_Y = TODAY.getFullYear() + 2

function fmt(d: Date) { return `${d.getMonth()+1}월 ${d.getDate()}일` }
function toISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

type Props = { onComplete: (trip: TripInfo) => void }

export default function LandingPage({ onComplete }: Props) {
  const [vy, setVy] = useState(TODAY.getFullYear())
  const [vm, setVm] = useState(TODAY.getMonth())
  const [sDate, setSDate] = useState<Date|null>(null)
  const [eDate, setEDate] = useState<Date|null>(null)
  const [picker, setPicker] = useState<'none'|'year'|'month'>('none')

  const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

  const chgMo = (d: number) => {
    let ny = vy, nm = vm + d
    if (nm > 11) { nm = 0; ny++ }
    if (nm < 0) { nm = 11; ny-- }
    if (ny < MIN_Y) { ny = MIN_Y; nm = 0 }
    if (ny > MAX_Y) { ny = MAX_Y; nm = 11 }
    setVy(ny); setVm(nm); setPicker('none')
  }

  const pick = (dt: Date) => {
    if (!sDate || (sDate && eDate)) { setSDate(dt); setEDate(null) }
    else { if (dt < sDate) { setEDate(sDate); setSDate(dt) } else { setEDate(dt) } }
  }

  const handleComplete = () => {
    if (!sDate || !eDate) return
    const trip: TripInfo = { startDate: toISO(sDate), endDate: toISO(eDate) }
    saveTrip(trip)
    onComplete(trip)
  }

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
      const isStart = !!(sDate && dt.toDateString() === sDate.toDateString())
      const isEnd = !!(eDate && dt.toDateString() === eDate.toDateString())
      const isRange = !!(sDate && eDate && dt > sDate && dt < eDate)
      const isToday = dt.toDateString() === TODAY.toDateString()

      let bg = 'transparent', color = isPast ? '#7BAAB5' : '#0D3349', radius = '50%', fw = 400
      if (isStart || isEnd) { bg = '#00838F'; color = '#fff'; fw = 800 }
      else if (isRange) { bg = '#B2EBF2'; color = '#006064'; radius = '0' }

      cells.push(
        <div key={d} onClick={isPast ? undefined : () => pick(dt)}
          style={{
            aspectRatio: '1', display:'flex', alignItems:'center', justifyContent:'center',
            borderRadius: radius, background: bg, color, fontWeight: fw,
            fontSize: 13, cursor: isPast ? 'default' : 'pointer',
            border: isToday && !isStart && !isEnd ? '1.5px solid #00838F' : 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >{d}</div>
      )
    }
    return cells
  }

  const canNext = !!(sDate && eDate)

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(180deg, #E0F7FA 0%, #80DEEA 35%, #26C6DA 65%, #00E5CC 100%)', fontFamily: ff,
      maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes floatA { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.04)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) scale(1) rotate(0deg)} 50%{transform:translateY(-10px) scale(1.06) rotate(8deg)} }
        @keyframes bounceIn { 0%{transform:scale(0.5) translateY(30px);opacity:0} 60%{transform:scale(1.08) translateY(-6px);opacity:1} 80%{transform:scale(0.96) translateY(2px)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes ripple { 0%{transform:scale(0.8);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        .blob1 { animation: floatA 7s ease-in-out infinite; }
        .blob2 { animation: floatA 5s ease-in-out infinite; animation-delay:1s; }
        .blob3 { animation: floatB 5.5s ease-in-out infinite; animation-delay:0.5s; }
        .icon-bounce { animation: bounceIn 0.7s cubic-bezier(.4,0,.2,1) both; }
        .icon-pulse { animation: pulse 3s ease-in-out infinite; }
        .ripple-anim { animation: ripple 2s ease-out infinite; }
        .title-anim { animation: slideUp 0.6s 0.2s both; }
        .sub-anim { animation: slideUp 0.6s 0.35s both; }
        .cal-day-hover:hover { background: #E0F7FA !important; }
        .nav-hover:hover { background: #E0F7FA; color: #FF7043 !important; }
        .hdr-btn-hover:hover { background: #E0F7FA; }
        .pick-item { padding:11px 6px; text-align:center; border-radius:12px; font-size:14px; font-weight:600; color:#555; cursor:pointer; border:1.5px solid transparent; transition:all 0.12s; }
        .pick-item:hover { border-color:#00838F; color:#00838F; background:#FFF0EA; }
        .pick-item.sel { background:#00838F; color:#fff; border-color:#00838F; }
        .main-btn { transition: transform 0.12s, opacity 0.12s; }
        .main-btn:active { transform: scale(0.97); opacity: 0.9; }
      `}</style>

      {/* ── 상단 히어로 */}
      <div style={{ position:'relative', overflow:'hidden', background:'transparent', padding:'52px 28px 36px', minHeight:280 }}>
        <div className="blob1" style={{ position:'absolute', width:180, height:180, borderRadius:'50%', background:'#80DEEA', top:-40, right:-30 }} />
        <div className="blob2" style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'#26C6DA', top:60, left:-20 }} />
        <div className="blob3" style={{ position:'absolute', width:90, height:90, borderRadius:'50%', background:'#00ACC1', bottom:40, right:30 }} />

        <div className="icon-bounce" style={{ position:'relative', display:'inline-block', marginBottom:20 }}>
          <div className="ripple-anim" style={{ position:'absolute', inset:-8, borderRadius:'50%', background:'rgba(0,172,193,0.2)' }} />
          <div className="icon-pulse" style={{ width:72, height:72, borderRadius:24, background:'#FF7043', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, position:'relative', zIndex:1 }}>✈️</div>
        </div>

        <h1 className="title-anim" style={{ fontSize:32, fontWeight:800, color:'#0D3349', lineHeight:1.3, margin:0 }}>
          호주 여행,<br />언제 떠나세요?
        </h1>
        <p className="sub-anim" style={{ fontSize:16, color:'#0D4F6E', marginTop:10, lineHeight:1.65 }}>
          출발일과 귀국일을 선택하면<br />맞춤 여행 리스트를 만들어드려요
        </p>
      </div>

      {/* ── 날짜 칩 */}
      <div style={{ padding:'20px 18px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {[
          { label:'✈️ 출발일', val: sDate ? fmt(sDate) : null },
          { label:'🏠 귀국일', val: eDate ? fmt(eDate) : null },
        ].map((c, i) => (
          <div key={i} style={{ background:'#EFFCFC', borderRadius:16, padding:'12px 14px', border:'none', boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize:11, color:'#1565A0', marginBottom:3, fontWeight:600 }}>{c.label}</div>
            <div style={{ fontSize:14, fontWeight: c.val ? 700 : 400, color: c.val ? '#0D3349' : '#1565A0' }}>
              {c.val ?? '날짜 선택'}
            </div>
          </div>
        ))}
      </div>

      {/* ── 피커 시트 */}
      {picker === 'year' && (
        <div style={{ margin:'12px 18px 0', background:'#EFFCFC', borderRadius:16, padding:14, border:'none', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, boxShadow:'0 4px 20px rgba(0,0,0,0.10)' }}>
          {Array.from({ length: MAX_Y - MIN_Y + 1 }, (_, i) => MIN_Y + i).map(y => (
            <div key={y} className={`pick-item${y === vy ? ' sel' : ''}`}
              onClick={() => { setVy(y); setPicker('none') }}
            >{y}년</div>
          ))}
        </div>
      )}
      {picker === 'month' && (
        <div style={{ margin:'12px 18px 0', background:'#EFFCFC', borderRadius:16, padding:14, border:'none', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, boxShadow:'0 4px 20px rgba(0,0,0,0.10)' }}>
          {MONTHS.map((m, i) => (
            <div key={i} className={`pick-item${i === vm ? ' sel' : ''}`}
              onClick={() => { setVm(i); setPicker('none') }}
            >{m}</div>
          ))}
        </div>
      )}

      {/* ── 달력 */}
      <div style={{ margin:'12px 18px 0', background:'#EFFCFC', borderRadius:22, border:'none', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.10)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 10px' }}>
          <button className="nav-hover" onClick={() => chgMo(-1)}
            style={{ background:'none', border:'none', fontSize:22, color:'#1565A0', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>‹</button>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <button className="hdr-btn-hover" onClick={() => setPicker(picker==='year'?'none':'year')}
              style={{ background:'none', border:'none', cursor:'pointer', padding:'5px 10px', borderRadius:10, fontSize:15, fontWeight:700, color:'#00838F' }}>{vy}년</button>
            <span style={{ fontSize:13, color:'#1565A0' }}>•</span>
            <button className="hdr-btn-hover" onClick={() => setPicker(picker==='month'?'none':'month')}
              style={{ background:'none', border:'none', cursor:'pointer', padding:'5px 10px', borderRadius:10, fontSize:15, fontWeight:700, color:'#0D3349' }}>{MONTHS[vm]}</button>
          </div>
          <button className="nav-hover" onClick={() => chgMo(1)}
            style={{ background:'none', border:'none', fontSize:22, color:'#1565A0', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>›</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 10px' }}>
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:11, color:'#1565A0', fontWeight:600, padding:'4px 0 6px' }}>{d}</div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'0 10px 14px' }}>
          {renderCal()}
        </div>
      </div>

      {/* ── 하단 버튼 */}
      <div style={{ flex:1 }} />
      <div style={{ padding:'20px 18px 48px' }}>
        <button className="main-btn" onClick={handleComplete} disabled={!canNext}
          style={{
            width:'100%', padding:18, border:'none', borderRadius:50,
            fontSize:17, fontWeight: canNext ? 800 : 400, cursor: canNext ? 'pointer' : 'default',
            background: '#EFFCFC',
            color: '#0D3349',
          }}
        >
          {canNext ? '시작하기' : '출발일과 귀국일을 선택해주세요'}
        </button>
      </div>
    </div>
  )
}
