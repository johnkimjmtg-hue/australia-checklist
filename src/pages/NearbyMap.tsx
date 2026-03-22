import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { getBusinesses } from '../lib/businessService'
import type { Business } from '../lib/businessService'
import BusinessCard from '../components/BusinessCard'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY
const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

type MapTab = 'all' | 'cafe' | 'restaurant' | 'tour'
type RadiusOption = 5 | 20 | 30 | null

const MAP_TABS: { id: MapTab; label: string; icon: string; categories: string[] }[] = [
  { id: 'all',        label: '전체',   icon: 'ph:squares-four', categories: [] },
  { id: 'cafe',       label: '카페',   icon: 'ph:coffee',       categories: ['cafe'] },
  { id: 'restaurant', label: '식당',   icon: 'ph:fork-knife',   categories: ['restaurant', 'food'] },
  { id: 'tour',       label: '관광지', icon: 'ph:map-pin',      categories: ['tour', 'attraction', 'places'] },
]

const RADIUS_OPTIONS: { label: string; value: RadiusOption }[] = [
  { label: '5km',  value: 5 },
  { label: '20km', value: 20 },
  { label: '30km', value: 30 },
  { label: '전체', value: null },
]

const TAB_COLOR: Record<MapTab, string> = {
  all: '#1B6EF3', cafe: '#A0522D', restaurant: '#E25822', tour: '#2E8B57',
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2)
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

let _mapsPromise: Promise<void> | null = null
function loadGoogleMaps(): Promise<void> {
  if (_mapsPromise) return _mapsPromise
  _mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps) { resolve(); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&v=weekly`
    s.onload = () => setTimeout(() => resolve(), 100)
    s.onerror = () => reject(new Error('Google Maps load failed'))
    document.head.appendChild(s)
  })
  return _mapsPromise
}

type Props = { onBack: () => void }

export default function NearbyMap({ onBack }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapObj      = useRef<any>(null)
  const markersRef  = useRef<any[]>([])
  const myMarkerRef = useRef<any>(null)

  const [tab, setTab]       = useState<MapTab>('all')
  const [radius, setRadius] = useState<RadiusOption>(5)
  const [allBiz, setAllBiz] = useState<Business[]>([])
  const [loading, setLoading]   = useState(true)
  const [locError, setLocError] = useState('')
  const [selBiz, setSelBiz]     = useState<Business | null>(null)
  const [myPos, setMyPos]       = useState<{ lat: number; lng: number } | null>(null)

  // DB 최초 1회 로드
  useEffect(() => {
    getBusinesses().then(data => {
      setAllBiz(data.filter(b => (b as any).latitude && (b as any).longitude))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (loading) return
    initMap()
  }, [loading])

  useEffect(() => {
    if (!mapObj.current) return
    updateMarkers()
  }, [tab, radius, myPos, allBiz])

  function getFiltered(): Business[] {
    const tabInfo = MAP_TABS.find(t => t.id === tab)!
    let list = tab === 'all' ? allBiz : allBiz.filter(b => tabInfo.categories.includes(b.category))
    if (radius !== null && myPos) {
      list = list.filter(b => {
        const dist = getDistanceKm(myPos.lat, myPos.lng, (b as any).latitude, (b as any).longitude)
        return dist <= radius
      })
    }
    return list
  }

  async function initMap() {
    try {
      await loadGoogleMaps()
      const google = (window as any).google
      if (!mapRef.current) return

      mapObj.current = new google.maps.Map(mapRef.current, {
        center: { lat: -33.8688, lng: 151.2093 },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      })

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const myLat = pos.coords.latitude
            const myLng = pos.coords.longitude
            setMyPos({ lat: myLat, lng: myLng })
            mapObj.current?.panTo({ lat: myLat, lng: myLng })

            if (myMarkerRef.current) myMarkerRef.current.setMap(null)
            myMarkerRef.current = new google.maps.Marker({
              position: { lat: myLat, lng: myLng },
              map: mapObj.current,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                    <ellipse cx="18" cy="40" rx="8" ry="3" fill="rgba(0,0,0,0.15)"/>
                    <circle cx="18" cy="8" r="6" fill="#1B6EF3" stroke="#fff" stroke-width="2"/>
                    <path d="M8 28 Q8 18 18 18 Q28 18 28 28 L26 36 Q22 38 18 38 Q14 38 10 36 Z" fill="#1B6EF3" stroke="#fff" stroke-width="1.5"/>
                    <line x1="8" y1="22" x2="4" y2="30" stroke="#1B6EF3" stroke-width="3" stroke-linecap="round"/>
                    <line x1="28" y1="22" x2="32" y2="30" stroke="#1B6EF3" stroke-width="3" stroke-linecap="round"/>
                    <line x1="14" y1="36" x2="12" y2="44" stroke="#1B6EF3" stroke-width="3" stroke-linecap="round"/>
                    <line x1="22" y1="36" x2="24" y2="44" stroke="#1B6EF3" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(36, 44),
                anchor: new google.maps.Point(18, 44),
              },
              title: '내 위치',
              zIndex: 999,
            })
          },
          () => setLocError('위치 접근이 거부됐어요. 브라우저 설정을 확인해주세요.')
        )
      }

      updateMarkers()
    } catch {
      setLocError('지도를 불러오지 못했어요.')
    }
  }

  function updateMarkers() {
    const google = (window as any).google
    if (!google || !mapObj.current) return

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const color = TAB_COLOR[tab]
    const list = getFiltered()

    list.forEach(biz => {
      const lat = (biz as any).latitude
      const lng = (biz as any).longitude
      if (!lat || !lng) return

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapObj.current,
        title: biz.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      })

      marker.addListener('click', () => {
        setSelBiz(biz)
        mapObj.current.panTo({ lat, lng })
      })

      markersRef.current.push(marker)
    })
  }

  const filtered = getFiltered()

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 80px)', fontFamily: ff, background:'#e8e8e8', position:'relative' }}>

      <style>{`@keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }`}</style>

      {/* 카테고리 탭 */}
      <div style={{ padding:'10px 10px 6px', background:'#e8e8e8', display:'flex', gap:8 }}>
        {MAP_TABS.map(t => {
          const isActive = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, height:40, borderRadius:10, border:'none',
              background:'#e8e8e8', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
              boxShadow: isActive
                ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
              WebkitTapHighlightColor:'transparent',
            }}>
              <Icon icon={t.icon} width={14} height={14} color={isActive ? TAB_COLOR[t.id] : '#64748B'} />
              <span style={{ fontSize:9, fontWeight: isActive ? 700 : 500, color: isActive ? TAB_COLOR[t.id] : '#64748B' }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* 거리 필터 */}
      <div style={{ padding:'0 10px 8px', display:'flex', gap:6 }}>
        {RADIUS_OPTIONS.map(opt => {
          const isActive = radius === opt.value
          const disabled = opt.value !== null && !myPos
          return (
            <button
              key={String(opt.value)}
              onClick={() => { if (!disabled) setRadius(opt.value) }}
              style={{
                flex:1, height:28, borderRadius:8, border:'none',
                background:'#e8e8e8', cursor: disabled ? 'default' : 'pointer',
                fontSize:10, fontWeight: isActive ? 700 : 500,
                color: disabled ? '#C0C8D4' : isActive ? '#1B6EF3' : '#64748B',
                boxShadow: isActive
                  ? 'inset 2px 2px 5px #c5c5c5, inset -2px -2px 5px #ffffff'
                  : '2px 2px 5px #c5c5c5, -2px -2px 5px #ffffff',
                WebkitTapHighlightColor:'transparent',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* 지도 */}
      <div style={{ flex:1, position:'relative' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%' }} />

        {/* 로딩 */}
        {loading && (
          <div style={{
            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(232,232,232,0.8)',
          }}>
            <div style={{ fontSize:13, color:'#64748B', fontWeight:700 }}>지도 불러오는 중...</div>
          </div>
        )}

        {/* 위치 오류 */}
        {locError && (
          <div style={{
            position:'absolute', top:12, left:12, right:72,
            background:'#fff', borderRadius:10, padding:'10px 14px',
            fontSize:12, color:'#E25822', fontWeight:600,
            boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
          }}>⚠️ {locError}</div>
        )}

        {/* 업체 수 뱃지 */}
        <div style={{
          position:'absolute', top:12, right:12,
          background:'#fff', borderRadius:20, padding:'4px 12px',
          fontSize:11, color:'#64748B', fontWeight:700,
          boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
        }}>
          {filtered.length}개
        </div>

        {/* 내 위치로 이동 버튼 */}
        {myPos && (
          <button onClick={() => mapObj.current?.panTo(myPos)} style={{
            position:'absolute', bottom:16, right:12,
            width:40, height:40, borderRadius:20,
            background:'#fff', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
            WebkitTapHighlightColor:'transparent',
          }}>
            <Icon icon="ph:crosshair" width={20} height={20} color="#1B6EF3" />
          </button>
        )}
      </div>

      {/* 업체 바텀시트 — BusinessCard 사용 */}
      {selBiz && (
        <>
          {/* 딤 배경 */}
          <div
            onClick={() => setSelBiz(null)}
            style={{
              position:'fixed', inset:0,
              background:'rgba(0,0,0,0.35)',
              zIndex:500,
            }}
          />
          {/* 바텀시트 */}
          <div style={{
            position:'fixed', bottom:0,
            left:'50%', transform:'translateX(-50%)',
            width:'100%', maxWidth:390,
            background:'#e8e8e8',
            borderRadius:'20px 20px 0 0',
            zIndex:501,
            animation:'slideUpSheet 0.25s ease',
            maxHeight:'75vh',
            overflowY:'auto',
            boxSizing:'border-box',
            paddingBottom:32,
          }}>
            {/* 핸들 바 */}
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 16px' }} />

            {/* 거리 표시 */}
            {myPos && (
              <div style={{ textAlign:'center', fontSize:12, color:'#94A3B8', fontWeight:600, marginBottom:10 }}>
                📍 내 위치에서 {getDistanceKm(myPos.lat, myPos.lng, (selBiz as any).latitude, (selBiz as any).longitude).toFixed(1)}km
              </div>
            )}

            {/* BusinessCard */}
            <div style={{ padding:'0 12px' }}>
              <BusinessCard business={selBiz} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
