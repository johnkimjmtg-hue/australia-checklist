// ─────────────────────────────────────────────
// HomePage.tsx — 달력 중심 홈 (리팩토링)
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { TripInfo, AppState, getTripDays, setSchedule } from '../store/state'
import { ITEMS } from '../data/checklist'
import TripCalendar from '../components/TripCalendar'
import DaySheet from '../components/DaySheet'
import TermsPage from './TermsPage'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"
const GRAD = 'linear-gradient(180deg, #E0F7FA 0%, #80DEEA 35%, #4DD0E1 65%, #26C6DA 100%)'
const TODAY = new Date()

const CITIES = {
  sydney:    { label:'시드니',   tz:'Australia/Sydney',    lat:-33.8688, lon:151.2093 },
  melbourne: { label:'멜번',     tz:'Australia/Melbourne', lat:-37.8136, lon:144.9631 },
  brisbane:  { label:'브리즈번', tz:'Australia/Brisbane',  lat:-27.4698, lon:153.0251 },
} as const

type CityKey = keyof typeof CITIES
type CityData = {
  temp: number | null; feelsLike: number | null; humidity: number | null
  windSpeed: number | null; description: string; sunrise: string; sunset: string
  icon: string; time: string; hourly: { time: string; icon: string; temp: number }[]
}
const WEATHER_KEY = '0058a9de4f094a13ad10578442284d72'

function getWeatherIcon(code: string): string {
  const c = code.slice(0, 2)
  if (code === '01d') return '☀️'
  if (code === '01n') return '🌙'
  if (c === '02') return '⛅'
  if (c === '03' || c === '04') return '☁️'
  if (c === '09' || c === '10') return '🌧️'
  if (c === '11') return '⛈️'
  if (c === '13') return '❄️'
  if (c === '50') return '🌫️'
  return '☀️'
}

type Tab = 'bucketlist' | 'shopping' | 'services' | 'nearby' | 'bingo' | 'checklist'
type Props = {
  trip: TripInfo
  state: AppState
  setState: (s: AppState) => void
  onNavigate: (tab: Tab) => void
  onChangeDates: () => void
}

export default function HomePage({ trip, state, setState, onNavigate, onChangeDates }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [cityData, setCityData] = useState<Record<string, CityData>>({})
  const [weatherSheet, setWeatherSheet] = useState<CityKey | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [termsTab, setTermsTab] = useState<'terms'|'privacy'|null>(null)
  const timerRef = useRef<any>(null)

  const startDate = new Date(trip.startDate)
  const endDate = new Date(trip.endDate)
  const todayMidnight = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
  const diffDays = Math.ceil((startDate.getTime() - todayMidnight.getTime()) / (1000*60*60*24))
  const tripNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000*60*60*24))

  const bucketCount = Object.keys(state.selected).length
  const myShoppingCount = (() => {
    try { return JSON.parse(localStorage.getItem('my-shopping-list') ?? '[]').length } catch { return 0 }
  })()

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
            time: fmtTime(item.dt), icon: item.weather[0].icon, temp: Math.round(item.main.temp),
          }))
          return [key, {
            temp: Math.round(data.main.temp), feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity, windSpeed: Math.round(data.wind.speed * 3.6),
            description: data.weather[0].description,
            sunrise: fmtTime(data.sys.sunrise), sunset: fmtTime(data.sys.sunset),
            icon: data.weather[0].icon, time: getTime(c.tz), hourly,
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

  const getDots = (dayIdx: number) => {
    const hasBucket = [
      ...ITEMS.filter(i => state.selected[i.id]),
      ...state.customItems.filter(i => state.selected[i.id]),
    ].some(item => (state.schedules[item.id] ?? []).includes(dayIdx))
    return hasBucket ? [{ color: '#00838F' }] : []
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
    <div style={{ minHeight:'100dvh', background: GRAD, fontFamily: ff, maxWidth:430, margin:'0 auto', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        .menu-card-hover { transition: transform 0.12s; -webkit-tap-highlight-color: transparent; }
        .menu-card-hover:active { transform: scale(0.97); }
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        @keyframes cardIn { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      {/* 날씨 + 햄버거 */}
      <div style={{ padding:'26px 18px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', gap:6, flex:1 }}>
            {(Object.keys(CITIES) as CityKey[]).map(city => {
              const d = cityData[city]
              return (
                <div key={city} onClick={() => setWeatherSheet(city)} style={{
                  background:'#EFFCFC', borderRadius:12, padding:'6px 10px',
                  boxShadow:'0 4px 16px rgba(0,0,0,0.10)', flex:1, textAlign:'center',
                  cursor:'pointer', WebkitTapHighlightColor:'transparent',
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1565A0', marginBottom:1 }}>{CITIES[city].label}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
                    <span style={{ fontSize:14 }}>{d?.icon ? getWeatherIcon(d.icon) : '🌤️'}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#0D3349', whiteSpace:'nowrap' }}>{d?.time ?? '--:--'}</span>
                    {d?.temp != null && <span style={{ fontSize:11, color:'#CC3300', fontWeight:700 }}>{d.temp}°</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => setShowMenu(true)} style={{
            width:36, height:36, borderRadius:12, background:'#EFFCFC', border:'none',
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:4, boxShadow:'0 4px 16px rgba(0,0,0,0.10)',
            flexShrink:0, WebkitTapHighlightColor:'transparent',
          }}>
            {[0,1,2].map(i => <div key={i} style={{ width:14, height:1.5, background:'#0D3349', borderRadius:2 }} />)}
          </button>
        </div>
      </div>

      {/* 달력 */}
      <div style={{ padding:'0 18px 14px' }}>
        <TripCalendar
          trip={trip}
          state={state}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          getDots={getDots}
        />
      </div>

      {/* 스크롤 */}
      <div style={{ flex:1, padding:'0 18px 40px', overflowY:'auto' }}>
        {/* D-day */}
        <div style={{ background:'#EFFCFC', borderRadius:22, padding:'20px 22px', marginBottom:14, boxShadow:'0 4px 16px rgba(0,0,0,0.10)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
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

        <div style={{ fontSize:16, fontWeight:700, color:'#0D4F6E', margin:'8px 0 12px' }}>나의 호주 여행 리스트</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {MENUS.map((m, i) => (
            <div key={m.id} className="menu-card-hover" onClick={() => onNavigate(m.id)}
              style={{ background:'#EFFCFC', borderRadius:20, padding:'18px 16px', boxShadow:'0 4px 16px rgba(0,0,0,0.10)', cursor:'pointer', animation:`cardIn 0.3s ${i*0.06}s both` }}>
              <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:10 }}>{m.icon}</div>
              <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>{m.title}</div>
              <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>{m.sub}</div>
              {m.badge > 0 && <div style={{ display:'inline-block', background:'#00838F', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, marginTop:8 }}>{m.badge}개</div>}
            </div>
          ))}
          <div className="menu-card-hover" onClick={() => onNavigate('bingo')}
            style={{ gridColumn:'span 2', background:'#EFFCFC', borderRadius:20, padding:'18px 16px', boxShadow:'0 4px 16px rgba(0,0,0,0.10)', cursor:'pointer', display:'flex', alignItems:'center', gap:14, animation:`cardIn 0.3s ${MENUS.length*0.06}s both` }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(0,131,143,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>☕</div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:'#0D3349' }}>카페 빙고</div>
              <div style={{ fontSize:14, color:'#1565A0', marginTop:4 }}>시드니·멜번 카페 25곳 투어</div>
            </div>
          </div>
        </div>
      </div>

      {/* 날짜 탭 바텀시트 */}
      {selectedDay !== null && (
        <DaySheet
          dayIndex={selectedDay}
          trip={trip}
          state={state}
          setState={setState}
          onClose={() => setSelectedDay(null)}
          onOpenBucket={() => { setSelectedDay(null); onNavigate('bucketlist') }}
        />
      )}

      {/* 날씨 바텀시트 */}
      {weatherSheet && (
        <>
          <div onClick={() => setWeatherSheet(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
          <div style={{ position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 32px)', maxWidth:398, background:'#EFFCFC', borderRadius:20, maxHeight:'85vh', overflowY:'auto', zIndex:801, animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)' }}>
            <div style={{ width:36, height:4, borderRadius:999, background:'rgba(0,0,0,0.15)', margin:'12px auto 0' }} />
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setWeatherSheet(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:14, color:'#0D3349' }}>✕</span>
              </button>
            </div>
            <div style={{ padding:'0 20px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:52 }}>{cityData[weatherSheet]?.icon ? getWeatherIcon(cityData[weatherSheet].icon) : '🌤️'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#0D3349' }}>{CITIES[weatherSheet].label}</div>
                <div style={{ fontSize:13, color:'#1565A0' }}>현지 시간 {cityData[weatherSheet]?.time ?? '--:--'} · {cityData[weatherSheet]?.description}</div>
              </div>
              {cityData[weatherSheet]?.temp != null && <div style={{ fontSize:40, fontWeight:900, color:'#CC3300' }}>{cityData[weatherSheet].temp}°</div>}
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

      {/* 메뉴 바텀시트 */}
      {showMenu && (
        <>
          <div onClick={() => setShowMenu(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:800 }} />
          <div style={{ position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 32px)', maxWidth:398, background:'#EFFCFC', borderRadius:20, zIndex:801, animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)', padding:'12px 20px 40px' }}>
            <div style={{ width:36, height:4, borderRadius:999, background:'rgba(0,0,0,0.15)', margin:'0 auto 16px' }} />
            <div style={{ fontSize:15, color:'#0D3349', fontWeight:700, marginBottom:12, paddingBottom:12, borderBottom:'1px solid rgba(0,0,0,0.08)' }}>호주가자</div>
            {[
              { icon:'📄', label:'이용약관', tab:'terms' as const },
              { icon:'🔒', label:'개인정보처리방침', tab:'privacy' as const },
            ].map(item => (
              <button key={item.tab} onClick={() => { setShowMenu(false); setTimeout(() => setTermsTab(item.tab), 50) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 4px', background:'none', border:'none', borderBottom:'1px solid rgba(0,0,0,0.06)', cursor:'pointer', fontFamily:ff, textAlign:'left' }}>
                <span style={{ fontSize:20 }}>{item.icon}</span>
                <span style={{ fontSize:15, color:'#0D3349', fontWeight:500 }}>{item.label}</span>
                <span style={{ marginLeft:'auto', fontSize:16, color:'#1565A0' }}>›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* 약관 */}
      {termsTab && (
        <>
          <div onClick={() => setTermsTab(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000 }} />
          <div style={{ position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 32px)', maxWidth:398, background:'#EFFCFC', borderRadius:20, maxHeight:'85vh', overflowY:'auto', zIndex:1001, animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)' }}>
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setTermsTab(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:14, color:'#0D3349' }}>✕</span>
              </button>
            </div>
            <TermsPage initialTab={termsTab} onBack={() => setTermsTab(null)} />
          </div>
        </>
      )}
    </div>
  )
}
