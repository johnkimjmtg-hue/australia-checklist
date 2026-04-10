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
      if (isStart) { bg = '#00BCD4'; color = '#fff'; fw = 800; radius = '50% 0 0 50%' }
      else if (isEnd) { bg = '#00BCD4'; color = '#fff'; fw = 800; radius = '0 50% 50% 0' }
      else if (isRange) { bg = '#B2EBF2'; color = '#006064'; radius = '0' }

      cells.push(
        <div key={d} onClick={isPast ? undefined : () => pick(dt)}
          style={{
            aspectRatio: '1', display:'flex', alignItems:'center', justifyContent:'center',
            borderRadius: radius, background: bg,
            color: (isToday && !isStart && !isEnd) ? '#00BCD4' : color,
            fontWeight: (isToday && !isStart && !isEnd) ? 800 : fw,
            fontSize: 12,
            textDecoration: (isToday && !isStart && !isEnd) ? 'underline' : 'none',
            textDecorationColor: (isToday && !isStart && !isEnd) ? '#D4703A' : 'transparent',
            textUnderlineOffset: '3px',
            cursor: isPast ? 'default' : 'pointer',
            border: 'none',
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
      height: '100dvh',
      maxWidth: 430,
      margin: '0 auto',
      fontFamily: ff,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .pick-item { padding:10px 6px; text-align:center; border-radius:12px; font-size:13px; font-weight:600; color:#555; cursor:pointer; border:1.5px solid transparent; transition:all 0.12s; }
        .pick-item:hover { border-color:#00838F; color:#00838F; }
        .pick-item.sel { background:#00838F; color:#fff; border-color:#00838F; }
        .main-btn { transition: transform 0.12s, opacity 0.12s; }
        .main-btn:active { transform: scale(0.97); opacity: 0.9; }
        .nav-hover:active { opacity: 0.6; }
      `}</style>

      {/* ── 배경 이미지 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/sydney-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        zIndex: 0,
      }} />

      {/* ── 어두운 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 100%)',
        zIndex: 1,
      }} />

      {/* ── 상단 브랜드 */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '52px 24px 0',
        animation: 'fadeIn 0.8s ease both',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 2, marginBottom: 6 }}>
          ✈️ HOJUGAJA
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
          호주 여행,<br />언제 떠나세요?
        </div>
      </div>

      {/* ── 스페이서 */}
      <div style={{ flex: 1, zIndex: 2 }} />

      {/* ── 하단 흰색 카드 */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '20px 16px 36px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.5s 0.2s both',
      }}>

        {/* 날짜 칩 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          {[
            { label:'✈️ 출발일', val: sDate ? fmt(sDate) : null },
            { label:'🏠 귀국일', val: eDate ? fmt(eDate) : null },
          ].map((c, i) => (
            <div key={i} style={{
              background: c.val ? 'rgba(0,188,212,0.08)' : '#F8FAFC',
              borderRadius: 12, padding: '10px 14px',
              border: c.val ? '1.5px solid rgba(0,188,212,0.3)' : '1.5px solid #E2E8F0',
            }}>
              <div style={{ fontSize:11, color:'#94A3B8', marginBottom:3, fontWeight:600 }}>{c.label}</div>
              <div style={{ fontSize:14, fontWeight: c.val ? 700 : 400, color: c.val ? '#0D3349' : '#94A3B8' }}>
                {c.val ?? '날짜 선택'}
              </div>
            </div>
          ))}
        </div>

        {/* 피커 */}
        {picker === 'year' && (
          <div style={{ marginBottom:10, background:'#F8FAFC', borderRadius:14, padding:12, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {Array.from({ length: MAX_Y - MIN_Y + 1 }, (_, i) => MIN_Y + i).map(y => (
              <div key={y} className={`pick-item${y === vy ? ' sel' : ''}`}
                onClick={() => { setVy(y); setPicker('none') }}
              >{y}년</div>
            ))}
          </div>
        )}
        {picker === 'month' && (
          <div style={{ marginBottom:10, background:'#F8FAFC', borderRadius:14, padding:12, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
            {MONTHS.map((m, i) => (
              <div key={i} className={`pick-item${i === vm ? ' sel' : ''}`}
                onClick={() => { setVm(i); setPicker('none') }}
              >{m}</div>
            ))}
          </div>
        )}

        {/* 달력 */}
        <div style={{ marginBottom:14 }}>
          {/* 달력 헤더 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <button onClick={() => chgMo(-1)} style={{ background:'none', border:'none', fontSize:20, color:'#64748B', cursor:'pointer', padding:'4px 8px', borderRadius:8, WebkitTapHighlightColor:'transparent' }}>‹</button>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <button onClick={() => setPicker(picker==='year'?'none':'year')}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:8, fontSize:14, fontWeight:700, color:'#00838F', fontFamily:ff }}>
                {vy}년
              </button>
              <span style={{ fontSize:12, color:'#CBD5E1' }}>•</span>
              <button onClick={() => setPicker(picker==='month'?'none':'month')}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:8, fontSize:14, fontWeight:700, color:'#0D3349', fontFamily:ff }}>
                {MONTHS[vm]}
              </button>
            </div>
            <button onClick={() => chgMo(1)} style={{ background:'none', border:'none', fontSize:20, color:'#64748B', cursor:'pointer', padding:'4px 8px', borderRadius:8, WebkitTapHighlightColor:'transparent' }}>›</button>
          </div>

          {/* 요일 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
            {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:11, color:'#94A3B8', fontWeight:600, padding:'2px 0' }}>{d}</div>
            ))}
          </div>

          {/* 날짜 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {renderCal()}
          </div>
        </div>

        {/* 버튼 */}
        <button className="main-btn" onClick={handleComplete} disabled={!canNext}
          style={{
            width:'100%', padding:16, border:'none', borderRadius:14,
            fontSize:16, fontWeight: canNext ? 800 : 400,
            cursor: canNext ? 'pointer' : 'default',
            background: canNext ? '#00BCD4' : '#F1F5F9',
            color: canNext ? '#fff' : '#94A3B8',
            transition: 'all 0.2s',
          }}
        >
          {canNext ? '시작하기 →' : '출발일과 귀국일을 선택해주세요'}
        </button>
      </div>
    </div>
  )
}
