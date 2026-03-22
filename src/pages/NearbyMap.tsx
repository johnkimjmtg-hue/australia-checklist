import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { getBusinesses } from '../lib/businessService'
import type { Business } from '../lib/businessService'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY
const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

type MapTab = 'all' | 'cafe' | 'restaurant' | 'tour'
type RadiusOption = 5 | 20 | 30 | null  // null = 전체

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

// Haversine 거리 계산 (km)
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

  // 지도 초기화
  useEffect(() => {
    if (loading) return
    initMap()
  }, [loading])

  // 탭/거리/위치 변경 시 마커 갱신 (DB 호출 없음 — 프론트 필터)
  useEffect(() => {
    if (!mapObj.current) return
    updateMarkers()
  }, [tab, radius, myPos, allBiz])

  // 필터 적용된 업체 목록
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
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#1B6EF3',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
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
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 80px)', fontFamily: ff, background:'#e8e8e8' }}>

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
            position:'absolute', bottom: selBiz ? 220 : 16, right:12,
            width:40, height:40, borderRadius:20,
            background:'#fff', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
            WebkitTapHighlightColor:'transparent',
            transition:'bottom 0.3s',
          }}>
            <Icon icon="ph:crosshair" width={20} height={20} color="#1B6EF3" />
          </button>
        )}
      </div>

      {/* 선택된 업체 카드 */}
      {selBiz && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          background:'#fff', borderRadius:'20px 20px 0 0',
          padding:'20px 16px 32px',
          boxShadow:'0 -4px 20px rgba(0,0,0,0.12)',
          animation:'slideUp 0.25s ease',
          zIndex:10,
        }}>
          <style>{`@keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{selBiz.name}</div>
              <div style={{ fontSize:12, color:'#64748B', fontWeight:600 }}>
                📍 {selBiz.city}
                {myPos && (
                  <span style={{ marginLeft:8, color:'#94A3B8' }}>
                    {getDistanceKm(myPos.lat, myPos.lng, (selBiz as any).latitude, (selBiz as any).longitude).toFixed(1)}km
                  </span>
                )}
                {selBiz.is_featured && <span style={{ marginLeft:8, color:'#1B6EF3', fontWeight:700 }}>⭐ 추천</span>}
              </div>
            </div>
            <button onClick={() => setSelBiz(null)} style={{
              background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#94A3B8', padding:4,
            }}>✕</button>
          </div>

          {selBiz.description && (
            <div style={{ fontSize:12, color:'#475569', lineHeight:1.7, marginBottom:14,
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
            }}>{selBiz.description}</div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            {selBiz.phone && (
              <a href={`tel:${selBiz.phone}`} style={{
                flex:1, height:40, borderRadius:10,
                background:'#1B6EF3', color:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                textDecoration:'none', fontSize:13, fontWeight:700,
              }}>
                <Icon icon="ph:phone" width={15} height={15} color="#fff" />
                전화하기
              </a>
            )}
            {selBiz.kakao && (
              <a href={`https://open.kakao.com/o/${selBiz.kakao}`} target="_blank" rel="noreferrer" style={{
                flex:1, height:40, borderRadius:10,
                background:'#FEE500', color:'#3C1E1E',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                textDecoration:'none', fontSize:13, fontWeight:700,
              }}>
                💬 카카오
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
