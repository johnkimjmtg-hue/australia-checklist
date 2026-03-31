// ─────────────────────────────────────────────
// HomePage.tsx
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { TripInfo, loadState } from '../store/state'
import TermsPage from './TermsPage'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const TODAY = new Date()

const CITIES = {
  sydney:    { label:'시드니',   tz:'Australia/Sydney',    lat:-33.8688, lon:151.2093 },
  melbourne: { label:'멜번',     tz:'Australia/Melbourne', lat:-37.8136, lon:144.9631 },
  brisbane:  { label:'브리즈번', tz:'Australia/Brisbane',  lat:-27.4698, lon:153.0251 },
} as const

type CityKey = keyof typeof CITIES
type Tab = 'bucketlist' | 'shopping' | 'services' | 'nearby' | 'bingo' | 'checklist'
type Props = { trip: TripInfo; onNavigate: (tab: Tab) => void; onChangeDates: () => void }
type CityData = {
  temp: number | null
  feelsLike: number | null
  humidity: number | null
  windSpeed: number | null
  description: string
  sunrise: string
  sunset: string
  icon: string
  time: string
  hourly: { time: string; icon: string; temp: number }[]
}

const WEATHER_KEY = '0058a9de4f094a13ad10578442284d72'

function AnalogClock({ tz, size = 20 }: { tz: string; size?: number }) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const [h, m, s] = timeStr.split(':').map(Number)
  const hours = (h % 12) + m / 60
  const mins  = m + s / 60
  const hAngle = (hours / 12) * 360 - 90
  const mAngle = (mins  / 60) * 360 - 90
  const r = size / 2
  const toXY = (angle: number, len: number) => ({
    x: r + Math.cos((angle * Math.PI) / 180) * len,
    y: r + Math.sin((angle * Math.PI) / 180) * len,
  })
  const hEnd = toXY(hAngle, r * 0.55)
  const mEnd = toXY(mAngle, r * 0.78)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r - 1} fill="none" stroke="#0D3349" strokeWidth={1.2} />
      <line x1={r} y1={r} x2={hEnd.x} y2={hEnd.y} stroke="#0D3349" strokeWidth={1.8} strokeLinecap="round" />
      <line x1={r} y1={r} x2={mEnd.x} y2={mEnd.y} stroke="#0D3349" strokeWidth={1.2} strokeLinecap="round" />
      <circle cx={r} cy={r} r={1} fill="#0D3349" />
    </svg>
  )
}

function getWeatherIcon(code: string): string {
  const c = code.slice(0, 2)
  if (code === '01d') return '☀️'
  if (code === '01n') return '🌙'
  if (c === '02')     return '⛅'
  if (c === '03' || c === '04') return '☁️'
  if (c === '09' || c === '10') return '🌧️'
  if (c === '11')     return '⛈️'
  if (c === '13')     return '❄️'
  if (c === '50')     return '🌫️'
  return '☀️'
}

export default function HomePage({ trip, onNavigate, onChangeDates }: Props) {
  const [vy, setVy] = useState(TODAY.getFullYear())
  const [vm, setVm] = useState(TODAY.getMonth())
  const [cityData, setCityData] = useState<Record<string, CityData>>({})
  const [weatherSheet, setWeatherSheet] = useState<CityKey | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [termsTab, setTermsTab] = useState<'terms'|'privacy'|null>(null)
  const timerRef = useRef<any>(null)

  const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

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

  const getTime = (tz: string) => new Date().toLocaleTimeString('ko-KR', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  })

  const fetchAllCities = async () => {
    const entries = await Promise.all(
      (Object.entries(CITIES) as [CityKey, typeof CITIES[CityKey]][]).map(async ([key, c]) => {
        try {
          const [weatherRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${c.lat}&lon=${c.lon}&appid=${WEATHER_KEY}&units=metric&lang=kr`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${c.lat}&lon=${c.lon}&appid=${WEATHER_KEY}&units=metric&lang=kr&cnt=6`),
          ])
          const data = await weatherRes.json()
          const forecast = await forecastRes.json()
          const fmtTime = (unix: number) => new Date(unix * 1000).toLocaleTimeString('ko-KR', { timeZone: c.tz, hour: '2-digit', minute: '2-digit', hour12: false })
          const hourly = (forecast.list ?? []).slice(0, 5).map((item: any) => ({
            time: fmtTime(item.dt),
            icon: item.weather[0].icon,
            temp: Math.round(item.main.temp),
          }))
          return [key, {
            temp:        Math.round(data.main.temp),
            feelsLike:   Math.round(data.main.feels_like),
            humidity:    data.main.humidity,
            windSpeed:   Math.round(data.wind.speed * 3.6),
            description: data.weather[0].description,
            sunrise:     fmtTime(data.sys.sunrise),
            sunset:      fmtTime(data.sys.sunset),
            icon:        data.weather[0].icon,
            time:        getTime(c.tz),
            hourly,
          }] as [string, CityData]
        } catch {
          return [key, { temp: null, feelsLike: null, humidity: null, windSpeed: null, description: '', sunrise: '—', sunset: '—', icon: '', time: getTime(c.tz), hourly: [] }] as [string, CityData]
        }
      })
    )
    setCityData(Object.fromEntries(entries))
  }

  useEffect(() => {
    fetchAllCities()
    timerRef.current = setInterval(() => {
      setCityData(prev => {
        const next = { ...prev }
        Object.entries(CITIES).forEach(([key, c]) => {
          if (next[key]) next[key] = { ...next[key], time: getTime(c.tz) }
        })
        return next
      })
    }, 30000)
    return () => clearInterval(timerRef.current)
  }, [])

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
      let bg = 'transparent', color = isPast ? '#7BAAB5' : '#0D3349', radius = '50%', fw: number = 400
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
    { id:'checklist' as Tab, icon:'✅', title:'준비 체크리스트', sub:'여행 준비 할 것들', badge: 0 },
    { id:'bucketlist' as Tab, icon:'🗺️', title:'버킷리스트', sub:'꼭 해볼 것들', badge: bucketCount },
    { id:'shopping' as Tab, icon:'🛍️', title:'쇼핑리스트', sub:'꼭 살 것들', badge: myShoppingCount },
    { id:'services' as Tab, icon:'🏢', title:'업체정보', sub:'한인 업체·병원', badge: 0 },
    { id:'nearby' as Tab, icon:'📍', title:'내 주변', sub:'주변 업체 지도', badge: 0 },
  ]

  return (
    <div style={{
      minHeight:'100dvh',
      background:'linear-gradient(180deg, #E0F7FA 0%, #80DEEA 35%, #26C6DA 65%, #00E5CC 100%)',
      backgroundSize: '100% 200%',
      animation: 'bgMove 8s ease-in-out infinite',
      fontFamily: ff, maxWidth:430, margin:'0 auto', display:'flex', flexDirection:'column',
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .menu-card-hover { transition: transform 0.12s; -webkit-tap-highlight-color: transparent; }
        .menu-card-hover:active { transform: scale(0.97); }
        .cal-nav-btn:hover { background: rgba(0,131,143,0.15) !important; }
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes bgMove {
          0%   { background-position: 0% 0%; }
          50%  { background-position: 0% 60%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-anim { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* 도시 날씨 + 메뉴 버튼 */}
      <div style={{ padding:'26px 18px 12px' }}>
        <div style={{ display:'flex', gap:8 }}>
          {(Object.keys(CITIES) as CityKey[]).map(city => {
            const d = cityData[city]
            return (
              <div key={city} onClick={() => setWeatherSheet(city)} style={{
                background:'rgba(255,255,255,0.82)', borderRadius:20, padding:'6px 10px',
                boxShadow:'0 4px 20px rgba(0,0,0,0.10)', flex:1, textAlign:'center',
                cursor:'pointer', WebkitTapHighlightColor:'transparent',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, flexWrap:'nowrap' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0D3349', whiteSpace:'nowrap' }}>{CITIES[city].label}</span>
                  {d?.icon ? <span style={{ fontSize:16 }}>{getWeatherIcon(d.icon)}</span> : <span style={{ fontSize:16 }}>☀️</span>}
                  {d?.temp != null && <span style={{ fontSize:11, color: d.temp < 15 ? '#60A5FA' : d.temp <= 25 ? '#34D399' : '#F97316', fontWeight:700, whiteSpace:'nowrap' }}>{d.temp}°</span>}
                </div>
              </div>
            )
          })}
          {/* 점 세 개 메뉴 버튼 */}
          <div onClick={() => setShowMenu(true)} style={{
            background:'rgba(255,255,255,0.82)', borderRadius:'50%', width:36, height:36,
            boxShadow:'0 4px 20px rgba(0,0,0,0.10)', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', WebkitTapHighlightColor:'transparent', alignSelf:'center',
          }}>
            <span style={{ fontSize:18, color:'#0D3349', letterSpacing:1, lineHeight:1 }}>⋮</span>
          </div>
        </div>
      </div>

      {/* 달력 */}
      <div style={{ padding:'0 18px 14px' }}>
        <div style={{ background:'rgba(255,255,255,0.82)', borderRadius:22, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.10)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 8px' }}>
            <button className="cal-nav-btn" onClick={() => chgMo(-1)} style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>‹</button>
            <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>
              <span style={{ color:'#00838F' }}>{vy}년</span> · {MONTHS[vm]}
            </div>
            <button className="cal-nav-btn" onClick={() => chgMo(1)} style={{ background:'none', border:'none', fontSize:20, color:'#0D4F6E', cursor:'pointer', padding:'4px 8px', borderRadius:8 }}>›</button>
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

      {/* 스크롤 영역 */}
      <div style={{ flex:1, padding:'0 18px 40px', overflowY:'auto' }}>
        {/* D-day */}
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

        <div style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)', margin:'8px 0 12px' }}>나의 호주 여행 리스트</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {MENUS.map((m, i) => (
            <div key={m.id} className="menu-card-hover card-anim" onClick={() => onNavigate(m.id)}
              style={{ background:'rgba(255,255,255,0.82)', borderRadius:20, padding:'18px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.10)', cursor:'pointer', animationDelay:`${i * 0.08}s` }}>
              <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:10 }}>{m.icon}</div>
              <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>{m.title}</div>
              <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>{m.sub}</div>
              {m.badge > 0 && <div style={{ display:'inline-block', background:'#00838F', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, marginTop:8 }}>{m.badge}개</div>}
            </div>
          ))}
          <div className="menu-card-hover card-anim" onClick={() => onNavigate('bingo')}
            style={{ gridColumn:'span 2', background:'rgba(255,255,255,0.82)', borderRadius:20, padding:'18px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.10)', cursor:'pointer', display:'flex', alignItems:'center', gap:14, animationDelay:`${MENUS.length * 0.08}s` }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>☕</div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>카페 빙고</div>
              <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>시드니·멜번 카페 25곳 투어</div>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 바텀시트 */}
      {showMenu && (
        <>
          <div onClick={() => setShowMenu(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398,
            background:'#fff', borderRadius:20,
            zIndex:801, animation:'slideUpSheet 0.25s ease',
            boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
            padding:'12px 20px 40px',
          }}>
            {/* 헤더 (X버튼) */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <button onClick={() => setShowMenu(false)} style={{
                width:28, height:28, borderRadius:'50%',
                background:'rgba(0,0,0,0.08)', border:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', WebkitTapHighlightColor:'transparent',
              }}>
                <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
              </button>
            </div>
            <div style={{ fontSize:15, color:'#0D3349', marginBottom:12, paddingBottom:12, borderBottom:'1px solid rgba(0,0,0,0.08)' }}>호주가자</div>
            {[
              { icon:'📄', label:'이용약관', tab:'terms' as const },
              { icon:'🔒', label:'개인정보처리방침', tab:'privacy' as const },
            ].map(item => (
              <button key={item.tab} onClick={() => { setShowMenu(false); setTimeout(() => setTermsTab(item.tab), 50) }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:14,
                padding:'16px 4px',
                background:'none', border:'none', borderBottom:'1px solid rgba(0,0,0,0.06)',
                cursor:'pointer', fontFamily:ff, textAlign:'left',
              }}>
                <span style={{ fontSize:20 }}>{item.icon}</span>
                <span style={{ fontSize:15, color:'#0D3349', fontWeight:500 }}>{item.label}</span>
                <span style={{ marginLeft:'auto', fontSize:16, color:'#1565A0' }}>›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* 날씨 바텀시트 */}
      {weatherSheet && (
        <>
          <div onClick={() => setWeatherSheet(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398,
            background:'#fff', borderRadius:20,
            maxHeight:'85vh', overflowY:'auto', zIndex:801,
            animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
          }}>
            {/* 헤더 (X버튼) */}
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setWeatherSheet(null)} style={{
                width:28, height:28, borderRadius:'50%',
                background:'rgba(0,0,0,0.08)', border:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', WebkitTapHighlightColor:'transparent',
              }}>
                <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
              </button>
            </div>
            <div style={{ padding:'8px 20px 0', display:'flex', alignItems:'center', gap:10 }}>
              {cityData[weatherSheet]?.icon
                ? <span style={{ fontSize:52 }}>{getWeatherIcon(cityData[weatherSheet].icon)}</span>
                : <span style={{ fontSize:52 }}>☀️</span>
              }
              <div style={{ flex:1 }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#0D3349' }}>{CITIES[weatherSheet].label}</div>
                <div style={{ fontSize:13, color:'#1565A0' }}>현지 시간 {cityData[weatherSheet]?.time ?? '--:--'} · {cityData[weatherSheet]?.description || ''}</div>
              </div>
              {cityData[weatherSheet]?.temp != null && (
                <div style={{ fontSize:40, fontWeight:900, color:'#0D3349' }}>{cityData[weatherSheet].temp}°</div>
              )}
            </div>
            <div style={{ height:1, background:'rgba(0,0,0,0.08)', margin:'14px 20px' }} />
            <div style={{ padding:'0 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'🌅 일출', value: cityData[weatherSheet]?.sunrise ?? '—' },
                { label:'🌇 일몰', value: cityData[weatherSheet]?.sunset ?? '—' },
                { label:'💧 습도', value: cityData[weatherSheet]?.humidity != null ? `${cityData[weatherSheet].humidity}%` : '—' },
                { label:'🌬️ 바람', value: cityData[weatherSheet]?.windSpeed != null ? `${cityData[weatherSheet].windSpeed}km/h` : '—' },
                { label:'🌡️ 체감', value: cityData[weatherSheet]?.feelsLike != null ? `${cityData[weatherSheet].feelsLike}°` : '—' },
                { label:'☁️ 날씨', value: cityData[weatherSheet]?.description || '—' },
              ].map((item, i) => (
                <div key={i} style={{ background:'rgba(0,131,143,0.08)', borderRadius:12, padding:'12px 14px' }}>
                  <div style={{ fontSize:12, color:'#1565A0', marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#0D3349' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'14px 20px 32px' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#1565A0', marginBottom:10 }}>시간대별 예보</div>
              <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
                {(cityData[weatherSheet]?.hourly ?? []).map((h, i) => (
                  <div key={i} style={{ background:'rgba(0,131,143,0.08)', borderRadius:12, padding:'10px 14px', textAlign:'center', flexShrink:0, minWidth:70 }}>
                    <div style={{ fontSize:11, color:'#1565A0', marginBottom:4 }}>{h.time}</div>
                    <div style={{ fontSize:18 }}>{getWeatherIcon(h.icon)}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0D3349', marginTop:4 }}>{h.temp}°</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 약관 페이지 */}
      {termsTab && (
        <>
          <div onClick={() => setTermsTab(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398,
            background:'#fff', borderRadius:20,
            maxHeight:'85vh', overflowY:'auto', zIndex:1001,
            animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
          }}>
            {/* 헤더 (X버튼) */}
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setTermsTab(null)} style={{
                width:28, height:28, borderRadius:'50%',
                background:'rgba(0,0,0,0.08)', border:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', WebkitTapHighlightColor:'transparent',
              }}>
                <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
              </button>
            </div>
            <TermsPage initialTab={termsTab} onBack={() => setTermsTab(null)} />
          </div>
        </>
      )}
    </div>
  )
}
