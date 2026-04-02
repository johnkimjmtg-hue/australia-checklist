// ─────────────────────────────────────────────
// AppHeader.tsx
// 모든 페이지 공통 상단 헤더
// 날씨 버튼 3개 + ⋮ 메뉴 버튼
// src/components/AppHeader.tsx
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import TermsPage from '../pages/TermsPage'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

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

type Props = {
  paddingTop?: number  // 기본 26px, 페이지마다 다를 수 있음
}

export default function AppHeader({ paddingTop = 26 }: Props) {
  const [cityData, setCityData] = useState<Record<string, CityData>>({})
  const [weatherSheet, setWeatherSheet] = useState<CityKey | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [termsTab, setTermsTab] = useState<'terms'|'privacy'|null>(null)
  const timerRef = useRef<any>(null)

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

  return (
    <>
      <style>{`
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
      `}</style>

      {/* 날씨 버튼 + 메뉴 버튼 */}
      <div style={{ padding:`${paddingTop}px 18px 12px` }}>
        <div style={{ display:'flex', gap:8 }}>
          {(Object.keys(CITIES) as CityKey[]).map(city => {
            const d = cityData[city]
            return (
              <div key={city} onClick={() => setWeatherSheet(city)} style={{
                background:'#EFFCFC', borderRadius:20, padding:'6px 10px',
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
          {/* ⋮ 메뉴 버튼 */}
          <div onClick={() => setShowMenu(true)} style={{
            background:'#EFFCFC', borderRadius:'50%', width:36, height:36,
            boxShadow:'0 4px 20px rgba(0,0,0,0.10)', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', WebkitTapHighlightColor:'transparent', alignSelf:'center',
          }}>
            <span style={{ fontSize:18, color:'#0D3349', letterSpacing:1, lineHeight:1 }}>⋮</span>
          </div>
        </div>
      </div>

      {/* 메뉴 바텀시트 */}
      {showMenu && (
        <>
          <div onClick={() => setShowMenu(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:800 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398,
            background:'#ffffff', borderRadius:20, zIndex:801,
            animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
            padding:'12px 20px 40px',
          }}>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <button onClick={() => setShowMenu(false)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
              </button>
            </div>
            <div style={{ fontSize:15, color:'#0D3349', fontWeight:700, marginBottom:12, paddingBottom:12, borderBottom:'1px solid rgba(0,0,0,0.08)' }}>호주가자</div>
            {[
              { icon:'📄', label:'이용약관', tab:'terms' as const },
              { icon:'🔒', label:'개인정보처리방침', tab:'privacy' as const },
            ].map(item => (
              <button key={item.tab} onClick={() => { setShowMenu(false); setTimeout(() => setTermsTab(item.tab), 50) }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px 4px',
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
          <div onClick={() => setWeatherSheet(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:800 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, background:'#ffffff', borderRadius:20,
            maxHeight:'85vh', overflowY:'auto', zIndex:801,
            animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setWeatherSheet(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
              </button>
            </div>
            <div style={{ padding:'8px 20px 0', display:'flex', alignItems:'center', gap:10 }}>
              {cityData[weatherSheet]?.icon
                ? <span style={{ fontSize:52 }}>{getWeatherIcon(cityData[weatherSheet].icon)}</span>
                : <span style={{ fontSize:52 }}>☀️</span>}
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

      {/* 약관 바텀시트 */}
      {termsTab && (
        <>
          <div onClick={() => setTermsTab(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:1000 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, background:'#ffffff', borderRadius:20,
            maxHeight:'85vh', overflowY:'auto', zIndex:1001,
            animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.20)',
          }}>
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 12px 0' }}>
              <button onClick={() => setTermsTab(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                <span style={{ fontSize:14, color:'#0D3349', lineHeight:1 }}>✕</span>
              </button>
            </div>
            <TermsPage initialTab={termsTab} onBack={() => setTermsTab(null)} />
          </div>
        </>
      )}
    </>
  )
}
