// ─────────────────────────────────────────────
// HomePage.tsx
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { TripInfo, loadState } from '../store/state'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const TODAY = new Date()

type Tab = 'bucketlist' | 'shopping' | 'services' | 'nearby' | 'bingo'
type Props = {
  trip: TripInfo
  onNavigate: (tab: Tab) => void
  onChangeDates: () => void
}

export default function HomePage({ trip, onNavigate, onChangeDates }: Props) {
  const [vy, setVy] = useState(TODAY.getFullYear())
  const [vm, setVm] = useState(TODAY.getMonth())
  const [selectedCity, setSelectedCity] = useState<'sydney'|'melbourne'|'brisbane'>('sydney')
  const [weather, setWeather] = useState<{temp:number; desc:string; icon:string}|null>(null)
  const [time, setTime] = useState('')

  const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

  const CITIES = {
    sydney:     { label:'시드니',   tz:'Australia/Sydney',    lat:-33.8688, lon:151.2093 },
    melbourne:  { label:'멜번',     tz:'Australia/Melbourne', lat:-37.8136, lon:144.9631 },
    brisbane:   { label:'브리즈번', tz:'Australia/Brisbane',  lat:-27.4698, lon:153.0251 },
  } as const

  const WEATHER_KEY = '0058a9de4f094a13ad10578442284d72'

  const fetchWeather = async (city: keyof typeof CITIES) => {
    try {
      const { lat, lon } = CITIES[city]
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric&lang=kr`
      )
      const data = await res.json()
      setWeather({
        temp: Math.round(data.main.temp),
        desc: data.weather[0].description,
        icon: data.weather[0].icon,
      })
    } catch { setWeather(null) }
  }

  const updateTime = (city: keyof typeof CITIES) => {
    const now = new Date()
    const t = now.toLocaleTimeString('ko-KR', {
      timeZone: CITIES[city].tz,
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    setTime(t)
  }

  const timerRef = useRef<any>(null)

  useEffect(() => {
    fetchWeather(selectedCity)
    updateTime(selectedCity)
    timerRef.current = setInterval(() => updateTime(selectedCity), 30000)
    return () => clearInterval(timerRef.current)
  }, [selectedCity])

  const state = loadState()
  const bucketCount = Object.keys(state.selected).length
  const myShoppingCount = (() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]').length } catch { return 0 }
  })()

  const startDate = new Date(trip.startDate)
  const endDate = new Date(trip.endDate)
  const todayMidnight = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
  const diffDays = Math.ceil((startDate.getTime() - todayMidnight.getTime()) / (1000*60*60*24))
  const tripNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000*60*60*24))

  const chgMo = (d: number) => {
    let ny = vy, nm = vm + d
    if (nm > 11) { nm = 0; ny++ }
    if (nm < 0) { nm = 11; ny-- }
    setVy(ny); setVm(nm)
  }

  const renderCal = () => {
    const first = new Date(vy, vm, 1).getDay()
    const days = new Date(vy, vm+1, 0).getDate()
    const cells = []

    for (let i = 0; i < first; i++) {
      cells.push(<div key={`e${i}`} style={{ aspectRatio:'1' }} />)
    }
    for (let d = 1; d <= days; d++) {
      const dt = new Date(vy, vm, d)
      const isPast = dt < todayMidnight
      const isStart = dt.toDateString() === startDate.toDateString()
      const isEnd = dt.toDateString() === endDate.toDateString()
      const isRange = dt > startDate && dt < endDate
      const isToday = dt.toDateString() === TODAY.toDateString()

      let bg = 'transparent'
      let color = isPast ? '#7BAAB5' : '#0D3349'
      let radius = '50%'
      let fw: number = 400

      if (isStart || isEnd) { bg = '#00838F'; color = '#fff'; fw = 800 }
      else if (isRange) { bg = '#B2EBF2'; color = '#006064'; radius = '0' }

      cells.push(
        <div key={d} style={{
          aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
          borderRadius: radius, background: bg, color, fontWeight: fw, fontSize: 13,
          border: isToday && !isStart && !isEnd ? '1.5px solid #00838F' : 'none',
        }}>{d}</div>
      )
    }
    return cells
  }

  const ddayText = diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? 'D-Day' : `D+${Math.abs(diffDays)}`
  const ddayLabel = diffDays > 0 ? '호주 출발까지' : diffDays === 0 ? '오늘 출발! 🎉' : '호주 여행 중! ✈️'
  const ddayColor = diffDays > 0 ? '#0D3349' : diffDays === 0 ? '#00838F' : '#00695C'

  const fmtDate = (d: Date) => `${d.getMonth()+1}월 ${d.getDate()}일`

  const MENUS = [
    { id:'bucketlist' as Tab, icon:'🗺️', title:'버킷리스트', sub:'꼭 해볼 것들', badge: bucketCount },
    { id:'shopping' as Tab, icon:'🛍️', title:'쇼핑리스트', sub:'꼭 살 것들', badge: myShoppingCount },
    { id:'services' as Tab, icon:'🏢', title:'업체정보', sub:'한인 업체·병원', badge: 0 },
    { id:'nearby' as Tab, icon:'📍', title:'내 주변', sub:'주변 업체 지도', badge: 0 },
  ]

  return (
    <div style={{
      minHeight:'100dvh',
      background:'linear-gradient(180deg, #E0F7FA 0%, #80DEEA 35%, #4DD0E1 65%, #26C6DA 100%)',
      fontFamily: ff, maxWidth:430, margin:'0 auto', display:'flex', flexDirection:'column',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .menu-card-hover { transition: transform 0.12s; -webkit-tap-highlight-color: transparent; }
        .menu-card-hover:active { transform: scale(0.97); }
        .cal-nav-btn:hover { background: rgba(0,131,143,0.15) !important; }
      `}</style>

      {/* ── 도시 날씨/시간 */}
      <div style={{ padding:'52px 18px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* 도시 버튼 */}
          <div style={{ display:'flex', gap:8 }}>
            {(Object.keys(CITIES) as (keyof typeof CITIES)[]).map(city => {
              const isActive = selectedCity === city
              return (
                <button key={city} onClick={() => setSelectedCity(city)} style={{
                  padding:'6px 14px', borderRadius:50, border:'none', cursor:'pointer',
                  background: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.35)',
                  color: isActive ? '#0D3349' : 'rgba(255,255,255,0.7)',
                  fontSize:13, fontWeight:700, fontFamily:ff,
                  transition:'all 0.15s', WebkitTapHighlightColor:'transparent',
                }}>{CITIES[city].label}</button>
              )
            })}
          </div>
          {/* 시간 풍선 */}
          {time && (
            <div style={{
              background:'rgba(255,255,255,0.92)', borderRadius:50,
              padding:'6px 14px', fontSize:15, fontWeight:700, color:'#0D3349',
              letterSpacing:1,
            }}>{time}</div>
          )}
        </div>
        {/* 날씨 */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10 }}>
          {weather && (
            <>
              <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`} width={36} height={36} style={{ filter:'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' }} />
              <span style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{weather.temp}°</span>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.85)' }}>{weather.desc}</span>
            </>
          )}
        </div>
      </div>

      {/* ── 달력 */}
      <div style={{ padding:'0 18px 14px' }}>
        <div style={{ background:'rgba(255,255,255,0.82)', borderRadius:22, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.10)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 8px' }}>
            <button className="cal-nav-btn" onClick={() => chgMo(-1)}
              style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>‹</button>
            <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>
              <span style={{ color:'#00838F' }}>{vy}년</span> · {MONTHS[vm]}
            </div>
            <button className="cal-nav-btn" onClick={() => chgMo(1)}
              style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>›</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 10px' }}>
            {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:11, color:'#1565A0', fontWeight:600, padding:'4px 0 6px' }}>{d}</div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'0 10px 12px' }}>
            {renderCal()}
          </div>
        </div>
      </div>

      {/* ── 스크롤 영역 */}
      <div style={{ flex:1, padding:'0 18px 40px', overflowY:'auto' }}>

        {/* D-day 카드 */}
        <div style={{ background:'rgba(255,255,255,0.82)', borderRadius:22, padding:'20px 22px', marginBottom:14, boxShadow:'0 4px 20px rgba(0,0,0,0.10)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:52, fontWeight:900, color: ddayColor, lineHeight:1 }}>{ddayText}</div>
            <div style={{ fontSize:15, color:'#1565A0', marginTop:6 }}>{ddayLabel}</div>
          </div>
          <div style={{ textAlign:'right', fontSize:13, color:'#1565A0', lineHeight:2 }}>
            <div>✈️ {fmtDate(startDate)} 출발</div>
            <div>🏠 {fmtDate(endDate)} 귀국</div>
            <div style={{ marginTop:6, fontSize:13, color:'#00838F', fontWeight:700 }}>{tripNights}박 {tripNights+1}일</div>
            <button onClick={onChangeDates} style={{ marginTop:6, background:'none', border:'none', fontSize:12, color:'#00838F', cursor:'pointer', textDecoration:'underline', fontFamily:ff }}>날짜 변경</button>
          </div>
        </div>

        {/* 섹션 라벨 */}
        <div style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)', margin:'8px 0 12px', letterSpacing:'0.02em' }}>나의 여행 리스트</div>

        {/* 메뉴 그리드 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {MENUS.map(m => (
            <div key={m.id} className="menu-card-hover"
              onClick={() => onNavigate(m.id)}
              style={{ background:'rgba(255,255,255,0.82)', borderRadius:20, padding:'18px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.10)', cursor:'pointer' }}>
              <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:10 }}>{m.icon}</div>
              <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>{m.title}</div>
              <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>{m.sub}</div>
              {m.badge > 0 && (
                <div style={{ display:'inline-block', background:'#00838F', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, marginTop:8 }}>{m.badge}개</div>
              )}
            </div>
          ))}

          {/* 카페빙고 - 전체 너비 */}
          <div className="menu-card-hover"
            onClick={() => onNavigate('bingo')}
            style={{ gridColumn:'span 2', background:'rgba(255,255,255,0.82)', borderRadius:20, padding:'18px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.10)', cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>☕</div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>카페 빙고</div>
              <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>시드니·멜번 카페 25곳 투어</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
