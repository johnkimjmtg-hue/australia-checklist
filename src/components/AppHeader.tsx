// ─────────────────────────────────────────────
// AppHeader.tsx
// 모든 페이지 공통 상단 헤더
// 날씨 버튼 3개 + ⋮ 메뉴 버튼
// src/components/AppHeader.tsx
// ─────────────────────────────────────────────
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import TermsPage from '../pages/TermsPage'

const ff = "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif"

const CITIES = {
  sydney:    { label:'시드니',   tz:'Australia/Sydney',    lat:-33.8688, lon:151.2093 },
  melbourne: { label:'멜번',     tz:'Australia/Melbourne', lat:-37.8136, lon:144.9631 },
  brisbane:  { label:'브리즈번', tz:'Australia/Brisbane',  lat:-27.4698, lon:153.0251 },
} as const

type CityKey = keyof typeof CITIES
type DailyForecast = {
  date: string; dayLabel: string; icon: string; tempMin: number; tempMax: number; description: string
}
type CityData = {
  temp: number | null; feelsLike: number | null; humidity: number | null
  windSpeed: number | null; description: string; sunrise: string; sunset: string
  icon: string; time: string; hourly: { time: string; icon: string; temp: number }[]
  daily: DailyForecast[]
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

const CITY_PREF_KEY = 'header-city'

export default function AppHeader({ paddingTop = 26 }: Props) {
  const [cityData, setCityData] = useState<Record<string, CityData>>({})
  const [weatherSheet, setWeatherSheet] = useState<CityKey | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [termsTab, setTermsTab] = useState<'terms'|'privacy'|null>(null)
  const [selectedCity, setSelectedCity] = useState<CityKey>(() => {
    try { return (localStorage.getItem(CITY_PREF_KEY) as CityKey) || 'sydney' } catch { return 'sydney' }
  })
  const [showCityPicker, setShowCityPicker] = useState(() => {
    try { return !localStorage.getItem(CITY_PREF_KEY) } catch { return true }
  })
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
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${c.lat}&lon=${c.lon}&appid=${WEATHER_KEY}&units=metric&lang=kr&cnt=40`),
          ])
          const data = await weatherRes.json()
          const forecast = await forecastRes.json()
          const fmtTime = (unix: number) => new Date(unix * 1000).toLocaleTimeString('ko-KR', { timeZone: c.tz, hour: '2-digit', minute: '2-digit', hour12: false })
          const hourly = (forecast.list ?? []).slice(0, 5).map((item: any) => ({
            time: fmtTime(item.dt), icon: item.weather[0].icon, temp: Math.round(item.main.temp),
          }))
          // 일별 예보: 3시간 간격 데이터를 날짜별로 그룹핑
          const DAY_LABELS = ['일','월','화','수','목','금','토']
          const dailyMap: Record<string, any[]> = {}
          ;(forecast.list ?? []).forEach((item: any) => {
            const d = new Date(item.dt * 1000).toLocaleDateString('ko-KR', { timeZone: c.tz })
            if (!dailyMap[d]) dailyMap[d] = []
            dailyMap[d].push(item)
          })
          const todayStr = new Date().toLocaleDateString('ko-KR', { timeZone: c.tz })
          const daily: DailyForecast[] = Object.entries(dailyMap).slice(0, 5).map(([dateStr, items]) => {
            const temps = (items as any[]).map((i: any) => i.main.temp)
            const midday = (items as any[]).find((i: any) => {
              const localH = parseInt(new Date(i.dt * 1000).toLocaleTimeString('ko-KR', { timeZone: c.tz, hour: '2-digit', hour12: false }))
              return localH >= 11 && localH <= 14
            }) ?? (items as any[])[Math.floor((items as any[]).length / 2)]
            const localDate = new Date(midday.dt * 1000).toLocaleDateString('ko-KR', { timeZone: c.tz, weekday: 'short' })
            const isToday = dateStr === todayStr
            return {
              date: dateStr,
              dayLabel: isToday ? '오늘' : localDate.replace('요일',''),
              icon: midday.weather[0].icon,
              tempMin: Math.round(Math.min(...(temps as number[]))),
              tempMax: Math.round(Math.max(...(temps as number[]))),
              description: midday.weather[0].description,
            }
          })
          return [key, {
            temp: Math.round(data.main.temp), feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity, windSpeed: Math.round(data.wind.speed * 3.6),
            description: data.weather[0].description,
            sunrise: fmtTime(data.sys.sunrise), sunset: fmtTime(data.sys.sunset),
            icon: data.weather[0].icon, time: getTime(c.tz), hourly, daily,
          }] as [string, CityData]
        } catch {
          return [key, { temp: null, feelsLike: null, humidity: null, windSpeed: null, description: '', sunrise: '—', sunset: '—', icon: '', time: getTime(c.tz), hourly: [], daily: [] }] as [string, CityData]
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
        @keyframes fadeIn { from{opacity:0; transform:translate(-50%,-50%) scale(0.95)} to{opacity:1; transform:translate(-50%,-50%) scale(1)} }
      `}</style>

      {/* 날씨 버튼 + 메뉴 버튼 */}
      <div style={{ padding:`${paddingTop}px 18px 12px` }}>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center' }}>
          {/* 날씨 버튼 - 선택 도시 1개 + 현지 시간 */}
          <div onClick={() => setWeatherSheet(selectedCity)} style={{
            background: (() => {
              const icon = cityData[selectedCity]?.icon ?? ''
              if (icon === '01d') return 'linear-gradient(135deg, #FF8C42, #FFD166)'
              if (icon === '01n') return 'linear-gradient(135deg, #1A1A4E, #4B2D8F)'
              if (icon.startsWith('02')) return 'linear-gradient(135deg, #5BA4CF, #A8C8E8)'
              if (icon.startsWith('03') || icon.startsWith('04')) return 'linear-gradient(135deg, #8E9EAB, #CFD9DF)'
              if (icon.startsWith('09') || icon.startsWith('10')) return 'linear-gradient(135deg, #4A6FA5, #6B8CBE)'
              if (icon.startsWith('11')) return 'linear-gradient(135deg, #2C3E50, #3D5A80)'
              if (icon.startsWith('13')) return 'linear-gradient(135deg, #B8D4E8, #E8F4F8)'
              if (icon.startsWith('50')) return 'linear-gradient(135deg, #9EACBA, #C8D6DF)'
              return '#EFFCFC'
            })(),
            borderRadius:20, padding:'6px 12px',
            boxShadow:'0 4px 20px rgba(0,0,0,0.10)',
            cursor:'pointer', WebkitTapHighlightColor:'transparent',
            display:'flex', alignItems:'center', gap:5,
          }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#fff', whiteSpace:'nowrap' }}>{CITIES[selectedCity].label}</span>
            <span style={{ fontSize:16 }}>{cityData[selectedCity]?.icon ? getWeatherIcon(cityData[selectedCity].icon) : '☀️'}</span>
            {cityData[selectedCity]?.temp != null && (
              <span style={{ fontSize:12, fontWeight:700, whiteSpace:'nowrap', lineHeight:1, color:'#fff' }}>{cityData[selectedCity].temp}°</span>
            )}
            {cityData[selectedCity]?.time && (
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', whiteSpace:'nowrap', lineHeight:1 }}>
                {cityData[selectedCity].time}
              </span>
            )}
          </div>
          {/* ⋮ 메뉴 버튼 */}
          <div onClick={() => setShowMenu(true)} style={{
            background:'#EFFCFC', borderRadius:'50%', width:36, height:36,
            boxShadow:'0 4px 20px rgba(0,0,0,0.10)', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', WebkitTapHighlightColor:'transparent',
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

      {/* 지역 선택 팝업 */}
      {showCityPicker && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:1200 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width:'calc(100% - 48px)', maxWidth:360,
            background:'#ffffff', borderRadius:20, zIndex:1201,
            animation:'none', boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
            padding:'24px 20px 32px', fontFamily:ff,
          }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🌤</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#0D3349', marginBottom:6 }}>어느 도시로 여행하세요?</div>
              <div style={{ fontSize:13, color:'#94A3B8', lineHeight:1.6 }}>선택한 도시의 날씨를 상단에 표시해드려요<br/>나중에 날씨 버튼을 탭하면 바꿀 수 있어요</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {(Object.entries(CITIES) as [CityKey, typeof CITIES[CityKey]][]).map(([key, city]) => (
                <button key={key} onClick={() => {
                  setSelectedCity(key)
                  try { localStorage.setItem(CITY_PREF_KEY, key) } catch {}
                  setShowCityPicker(false)
                }} style={{
                  width:'100%', height:56, borderRadius:14, border:'1.5px solid rgba(0,131,143,0.15)',
                  background: selectedCity === key ? 'rgba(0,131,143,0.08)' : '#F8FAFC',
                  cursor:'pointer', fontFamily:ff,
                  display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'#0D3349' }}>{city.label}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>
                        {key === 'sydney' ? 'New South Wales' : key === 'melbourne' ? 'Victoria' : 'Queensland'}
                      </div>
                    </div>
                  </div>
                  {cityData[key]?.temp != null && (
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ fontSize:18 }}>{getWeatherIcon(cityData[key].icon)}</span>
                      <span style={{ fontSize:16, fontWeight:700, color:'#0D3349' }}>{cityData[key].temp}°</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 날씨 바텀시트 */}
      {weatherSheet && (
        <>
          <div onClick={() => setWeatherSheet(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)', zIndex:800 }} />
          <div style={{
            position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
            width:'calc(100% - 32px)', maxWidth:398, borderRadius:20,
            maxHeight:'85vh', overflowY:'auto', zIndex:801,
            animation:'slideUpSheet 0.25s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
            background: (() => {
              const icon = cityData[weatherSheet]?.icon ?? ''
              if (icon === '01d') return 'linear-gradient(180deg, #FF8C42 0%, #FFD166 30%, #ffffff 70%)'
              if (icon === '01n') return 'linear-gradient(180deg, #1A1A4E 0%, #4B2D8F 30%, #ffffff 70%)'
              if (icon.startsWith('02')) return 'linear-gradient(180deg, #5BA4CF 0%, #A8C8E8 30%, #ffffff 70%)'
              if (icon.startsWith('03') || icon.startsWith('04')) return 'linear-gradient(180deg, #8E9EAB 0%, #CFD9DF 30%, #ffffff 70%)'
              if (icon.startsWith('09') || icon.startsWith('10')) return 'linear-gradient(180deg, #4A6FA5 0%, #6B8CBE 30%, #ffffff 70%)'
              if (icon.startsWith('11')) return 'linear-gradient(180deg, #2C3E50 0%, #3D5A80 30%, #ffffff 70%)'
              if (icon.startsWith('13')) return 'linear-gradient(180deg, #B8D4E8 0%, #E8F4F8 30%, #ffffff 70%)'
              if (icon.startsWith('50')) return 'linear-gradient(180deg, #9EACBA 0%, #C8D6DF 30%, #ffffff 70%)'
              return 'linear-gradient(180deg, #FF8C42 0%, #FFD166 30%, #ffffff 70%)'
            })(),
          }}>
            {/* 그라데이션 헤더 영역 */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px 0' }}>
                <button onClick={() => { setWeatherSheet(null); setShowCityPicker(true) }} style={{
                  height:28, padding:'0 10px', borderRadius:20, border:'1px solid rgba(255,255,255,0.4)',
                  background:'rgba(255,255,255,0.2)', cursor:'pointer', fontFamily:ff,
                  fontSize:11, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:4,
                }}>
                  <span>🌏</span> 도시 변경
                </button>
                <button onClick={() => setWeatherSheet(null)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.15)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                  <span style={{ fontSize:14, color:'#fff', lineHeight:1 }}>✕</span>
                </button>
              </div>
              <div style={{ padding:'8px 20px 20px', display:'flex', alignItems:'center', gap:10 }}>
                {cityData[weatherSheet]?.icon
                  ? <span style={{ fontSize:52 }}>{getWeatherIcon(cityData[weatherSheet].icon)}</span>
                  : <span style={{ fontSize:52 }}>☀️</span>}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{CITIES[weatherSheet].label}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>현지 시간 {cityData[weatherSheet]?.time ?? '--:--'} · {cityData[weatherSheet]?.description || ''}</div>
                </div>
                {cityData[weatherSheet]?.temp != null && (
                  <div style={{ fontSize:40, fontWeight:900, color:'#fff' }}>{cityData[weatherSheet].temp}°</div>
                )}
              </div>
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
            <div style={{ padding:'14px 20px 0' }}>
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

            {/* 5일 예보 */}
            {(cityData[weatherSheet]?.daily ?? []).length > 0 && (
              <div style={{ padding:'14px 20px 32px' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#1565A0', marginBottom:10 }}>5일 예보</div>
                <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
                  {(cityData[weatherSheet]?.daily ?? []).map((d, i) => (
                    <div key={i} style={{
                      background: i === 0 ? 'rgba(0,131,143,0.12)' : 'rgba(0,131,143,0.06)',
                      borderRadius:12, padding:'12px 14px', textAlign:'center', flexShrink:0, minWidth:80,
                      border: i === 0 ? '1px solid rgba(0,131,143,0.2)' : 'none',
                    }}>
                      <div style={{ fontSize:12, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? '#00838F' : '#0D3349', marginBottom:6 }}>{d.dayLabel}</div>
                      <div style={{ fontSize:22, marginBottom:6 }}>{getWeatherIcon(d.icon)}</div>
                      <div style={{ fontSize:12, color:'#1565A0', marginBottom:6, lineHeight:1.3 }}>{d.description}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#0D3349' }}>{d.tempMax}°</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>{d.tempMin}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
