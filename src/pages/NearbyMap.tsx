import { useState, useEffect, useRef, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { getBusinesses } from '../lib/businessService'
import type { Business } from '../lib/businessService'
import { CATEGORIES } from '../data/businesses'
import BusinessCard from '../components/BusinessCard'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY
const ff = '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif'

type RadiusOption = 5 | 20 | 30 | null

const RADIUS_OPTIONS: { label: string; value: RadiusOption }[] = [
  { label: '5km',  value: 5 },
  { label: '20km', value: 20 },
  { label: '30km', value: 30 },
  { label: '전체', value: null },
]

// 카테고리별 마커 색상
const CAT_COLORS: Record<string, string> = {
  cafe: '#A0522D', restaurant: '#E25822', travel: '#2E8B57',
  hotel: '#7C3AED', gp: '#DC2626', dental: '#0891B2',
  realestate: '#1B6EF3', beauty: '#EC4899', mart: '#16A34A',
  culture: '#D97706', default: '#64748B',
}
function getCatColor(catId: string): string {
  return CAT_COLORS[catId] ?? CAT_COLORS.default
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

const MY_LOCATION_SVG = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 100 100">' +
  '<ellipse cx="50" cy="90" rx="15" ry="5" fill="rgba(0,0,0,0.2)"/>' +
  '<path d="M 50 20 C 42 20, 38 25, 38 32 L 38 60 C 38 65, 42 68, 45 68 L 45 85 C 45 88, 55 88, 55 85 L 55 68 C 58 68, 62 65, 62 60 L 62 32 C 62 25, 58 20, 50 20 Z" fill="#FFD600" stroke="#333" stroke-width="3.5"/>' +
  '<circle cx="50" cy="15" r="8" fill="#FFD600" stroke="#333" stroke-width="3.5"/>' +
  '<line x1="38" y1="35" x2="28" y2="52" stroke="#333" stroke-width="8.5" stroke-linecap="round"/>' +
  '<line x1="38" y1="35" x2="28" y2="52" stroke="#FFD600" stroke-width="5" stroke-linecap="round"/>' +
  '<line x1="62" y1="35" x2="72" y2="52" stroke="#333" stroke-width="8.5" stroke-linecap="round"/>' +
  '<line x1="62" y1="35" x2="72" y2="52" stroke="#FFD600" stroke-width="5" stroke-linecap="round"/>' +
  '</svg>'
)

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
  const infoRef     = useRef<any>(null)
  const myMarkerRef = useRef<any>(null)

  const [category, setCategory] = useState<string>('cafe')
  const [radius, setRadius]     = useState<RadiusOption>(30)
  const [allBiz, setAllBiz]     = useState<Business[]>([])
  const [loading, setLoading]   = useState(true)
  const [locError, setLocError] = useState('')
  const [selBiz, setSelBiz]     = useState<Business | null>(null)
  const [myPos, setMyPos]       = useState<{ lat: number; lng: number } | null>(null)

  // InfoWindow 버튼 클릭 → 바텀시트 연결
  useEffect(() => {
    (window as any).__nearbySelectBiz = (bizId: string) => {
      const found = allBiz.find(b => b.id === bizId)
      if (found) {
        setSelBiz(found)
        if (infoRef.current) infoRef.current.close()
      }
    }
    return () => { delete (window as any).__nearbySelectBiz }
  }, [allBiz])

  // DB 최초 1회 로드
  useEffect(() => {
    getBusinesses().then(data => {
      setAllBiz(data.filter(b => (b as any).latitude && (b as any).longitude))
      setLoading(false)
    })
  }, [])

  // 카테고리별 업체 수 (Services.tsx 동일 로직)
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allBiz.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1
    })
    return counts
  }, [allBiz])

  // 업체 많은 순 정렬, 0개 카테고리 제외 (Services.tsx 동일 로직)
  const sortedCategories = useMemo(() => {
    return CATEGORIES
      .filter(c => c.id !== 'all' && (catCounts[c.id] || 0) > 0)
      .sort((a, b) => (catCounts[b.id] || 0) - (catCounts[a.id] || 0))
  }, [catCounts])

  useEffect(() => {
    if (loading) return
    initMap()
  }, [loading])

  useEffect(() => {
    if (!mapObj.current) return
    updateMarkers()
  }, [category, radius, myPos, allBiz])

  function getFiltered(): Business[] {
    let list = category === 'all'
      ? allBiz
      : allBiz.filter(b => b.category === category)
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
        minZoom: 10,
        maxZoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      })

      infoRef.current = new google.maps.InfoWindow()

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
                url: 'data:image/svg+xml;charset=UTF-8,' + MY_LOCATION_SVG,
                scaledSize: new google.maps.Size(48, 48),
                anchor: new google.maps.Point(24, 48),
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

    const list = getFiltered()
    const color = category === 'all' ? '#1B6EF3' : getCatColor(category)

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
        mapObj.current.panTo({ lat, lng })
        if (infoRef.current) {
          infoRef.current.close()
          infoRef.current.setContent(`
            <div style="font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;padding:4px 2px;min-width:140px">
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-bottom:8px">${biz.name}</div>
              <button
                onclick="window.__nearbySelectBiz('${biz.id}')"
                style="width:100%;padding:7px 0;background:#1B6EF3;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit"
              >자세히 보기 →</button>
            </div>
          `)
          infoRef.current.open({ map: mapObj.current, anchor: marker })
        }
      })

      markersRef.current.push(marker)
    })
  }

  const filtered = getFiltered()

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 80px)', fontFamily: ff, background:'#e8e8e8', position:'relative' }}>

      <style>{`
        @keyframes slideUpSheet { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
        .cat-scroll { overflow-x:auto; scrollbar-width:thin; scrollbar-color:#C8C8C8 #e8e8e8; }
        @media (max-width:768px) {
          .cat-scroll::-webkit-scrollbar { height:4px; }
          .cat-scroll::-webkit-scrollbar-track { background:#e8e8e8; border-radius:2px; }
          .cat-scroll::-webkit-scrollbar-thumb { background:#C8C8C8; border-radius:2px; }
        }
        @media (min-width:769px) {
          .cat-scroll::-webkit-scrollbar { height:4px; }
          .cat-scroll::-webkit-scrollbar-track { background:#e8e8e8; border-radius:2px; }
          .cat-scroll::-webkit-scrollbar-thumb { background:#C8C8C8; border-radius:2px; }
        }
        .svc-btn { transition: all .12s; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .svc-btn:active { box-shadow: inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff !important; transform: scale(0.97); }
      `}</style>

      {/* 카테고리 슬라이딩 + 거리 필터 — sticky 고정 */}
      <div style={{ position:'sticky', top:0, zIndex:24, background:'#e8e8e8' }}>
        <div className="cat-scroll" style={{ padding:'10px 10px 6px', display:'flex', gap:6 }}>
          {sortedCategories.map(cat => {
            const isActive = category === cat.id
            const count = catCounts[cat.id] || 0
            return (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className="svc-btn"
                style={{
                  height:36, borderRadius:8, border:'none',
                  background:'#e8e8e8', cursor:'pointer',
                  flexShrink:0, padding:'0 14px',
                  fontSize:12, fontWeight: isActive ? 700 : 500,
                  color: isActive ? getCatColor(cat.id) : '#64748B',
                  boxShadow: isActive
                    ? 'inset 3px 3px 6px #c5c5c5, inset -3px -3px 6px #ffffff'
                    : '3px 3px 6px #c5c5c5, -3px -3px 6px #ffffff',
                  whiteSpace:'nowrap',
                }}>
                {cat.label}
                <span style={{ marginLeft:4, fontSize:10, color: isActive ? getCatColor(cat.id) : '#94A3B8' }}>
                  {count}
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
      </div>

      {/* 지도 */}
      <div style={{ flex:1, position:'relative' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%' }} />

        {loading && (
          <div style={{
            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(232,232,232,0.8)',
          }}>
            <div style={{ fontSize:13, color:'#64748B', fontWeight:700 }}>지도 불러오는 중...</div>
          </div>
        )}

        {locError && (
          <div style={{
            position:'absolute', top:12, left:12, right:72,
            background:'#fff', borderRadius:10, padding:'10px 14px',
            fontSize:12, color:'#E25822', fontWeight:600,
            boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
          }}>⚠️ {locError}</div>
        )}

        <div style={{
          position:'absolute', top:12, right:12,
          background:'#fff', borderRadius:20, padding:'4px 12px',
          fontSize:11, color:'#64748B', fontWeight:700,
          boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
        }}>
          {filtered.length}개
        </div>

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

      {/* 업체 바텀시트 */}
      {selBiz && (
        <>
          <div
            onClick={() => setSelBiz(null)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:500 }}
          />
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
            <div style={{ width:40, height:4, borderRadius:2, background:'#C8C8C8', margin:'12px auto 16px' }} />
            {myPos && (
              <div style={{ textAlign:'center', fontSize:12, color:'#94A3B8', fontWeight:600, marginBottom:10 }}>
                📍 내 위치에서 {getDistanceKm(myPos.lat, myPos.lng, (selBiz as any).latitude, (selBiz as any).longitude).toFixed(1)}km
              </div>
            )}
            <div style={{ padding:'0 12px' }}>
              <BusinessCard business={selBiz} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
