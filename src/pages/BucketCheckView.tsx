import { useState, useEffect, useRef } from 'react'
import { ITEMS, CATEGORIES } from '../data/checklist'
import { AppState, TripInfo, getTripDays, fmtMD, dow } from '../store/state'
import { Icon } from '@iconify/react'

type Filter = 'all' | 'done' | 'todo'

type Props = {
  state:      AppState
  trip:       TripInfo
  setState:   (s: AppState) => void
  onEdit:     () => void
  onDelete:   () => void
  onShare:    () => void
  onServices: () => void
}

/* ══ 아이템별 아이코니파이 단색 아이콘 매핑 ══ */
const ITEM_ICONS: Record<string, string> = {
  // 병원/뷰티
  h01: 'ph:tooth',
  h02: 'ph:tooth',
  h03: 'ph:sparkle',
  h04: 'ph:syringe',
  h05: 'ph:drop',
  h06: 'ph:eye',
  h07: 'ph:eyeglasses',
  h08: 'ph:heartbeat',
  h09: 'ph:shield-check',
  h10: 'ph:leaf',
  h11: 'ph:scissors',
  h12: 'ph:hand',
  h13: 'ph:eye',
  h14: 'ph:pencil-simple',
  h15: 'ph:person-simple',
  h16: 'ph:shopping-bag',
  h17: 'ph:flask',
  h18: 'ph:sun',
  h19: 'ph:mask-happy',
  h20: 'ph:drop-half',
  h21: 'ph:barbell',
  h22: 'ph:thermometer-hot',
  h23: 'ph:pill',
  h24: 'ph:eyeglasses',
  h25: 'ph:bone',
  h26: 'ph:flask',
  // 먹거리
  f01: 'ph:chicken',
  f02: 'ph:chicken',
  f03: 'ph:chicken',
  f04: 'ph:bowl-food',
  f05: 'ph:bowl-food',
  f06: 'ph:fork-knife',
  f07: 'ph:bowl-food',
  f08: 'ph:bowl-food',
  f09: 'ph:bowl-food',
  f10: 'ph:fish',
  f11: 'ph:fork-knife',
  f12: 'ph:flame',
  f13: 'ph:beer-stein',
  f14: 'ph:pepper',
  f15: 'ph:flame',
  f16: 'ph:bowl-food',
  f17: 'ph:fish',
  f18: 'ph:bowl-food',
  f19: 'ph:cake',
  f20: 'ph:ice-cream',
  f21: 'ph:flame',
  f22: 'ph:bowl-food',
  f23: 'ph:fork-knife',
  f24: 'ph:bowl-food',
  f25: 'ph:storefront',
  f26: 'ph:coffee',
  f27: 'ph:fork-knife',
  f28: 'ph:fork-knife',
  f29: 'ph:fork-knife',
  f30: 'ph:fork-knife',
  f31: 'ph:sushi',
  f32: 'ph:bowl-food',
  f33: 'ph:pepper',
  f34: 'ph:fork-knife',
  f35: 'ph:wine',
  // 쇼핑
  s01: 'ph:shopping-bag',
  s02: 'ph:airplane',
  s03: 'ph:leaf',
  s04: 'ph:storefront',
  s05: 'ph:sunglasses',
  s06: 'ph:t-shirt',
  s07: 'ph:diamond',
  s08: 'ph:eyeglasses',
  s09: 'ph:shopping-cart',
  s10: 'ph:pencil',
  s11: 'ph:pill',
  s12: 'ph:pill',
  s13: 'ph:bandaids',
  s14: 'ph:bandaids',
  s15: 'ph:moon',
  s16: 'ph:first-aid-kit',
  s17: 'ph:t-shirt',
  s18: 'ph:shopping-cart',
  s19: 'ph:cookie',
  s20: 'ph:package',
  s21: 'ph:leaf',
  s22: 'ph:leaf',
  s23: 'ph:plant',
  s24: 'ph:gift',
  s25: 'ph:books',
  // 행정
  a01: 'ph:identification-card',
  a02: 'ph:book-open',
  a03: 'ph:bank',
  a04: 'ph:bank',
  a05: 'ph:device-mobile',
  a06: 'ph:car',
  a07: 'ph:currency-krw',
  a08: 'ph:chart-bar',
  a09: 'ph:shield',
  a10: 'ph:files',
  a11: 'ph:heartbeat',
  a12: 'ph:chart-line-up',
  a13: 'ph:globe',
  a14: 'ph:seal',
  a15: 'ph:check-circle',
  // 사람
  p01: 'ph:house-line',
  p02: 'ph:users-three',
  p03: 'ph:users',
  p04: 'ph:house',
  p05: 'ph:graduation-cap',
  p06: 'ph:map-pin',
  p07: 'ph:hands-praying',
  p08: 'ph:fork-knife',
  p09: 'ph:camera',
  p10: 'ph:gift',
  // 육아
  k01: 'ph:syringe',
  k02: 'ph:stethoscope',
  k03: 'ph:tooth',
  k04: 'ph:lego',
  k05: 'ph:t-shirt',
  k06: 'ph:books',
  k07: 'ph:baby',
  k08: 'ph:smiley',
  k09: 'ph:ticket',
  k10: 'ph:camera',
  // 가볼 곳
  g01: 'ph:buildings',
  g02: 'ph:tree',
  g03: 'ph:broadcast-tower',
  g04: 'ph:waves',
  g05: 'ph:house',
  g06: 'ph:palette',
  g07: 'ph:music-note',
  g08: 'ph:building',
  g09: 'ph:books',
  g10: 'ph:binoculars',
  g11: 'ph:mountain',
  g12: 'ph:umbrella-simple',
  g13: 'ph:crown',
  g14: 'ph:house',
  g15: 'ph:tree-evergreen',
  g16: 'ph:microphone',
  g17: 'ph:monitor',
  g18: 'ph:thermometer-hot',
  g19: 'ph:lock-key',
  g20: 'ph:baseball',
  g21: 'ph:dress',
  g22: 'ph:flag',
}

/* 카테고리 기본 아이콘 (fallback) */
const CAT_ICONS: Record<string, string> = {
  hospital:  'ph:first-aid-kit',
  food:      'ph:fork-knife',
  shopping:  'ph:shopping-bag',
  admin:     'ph:files',
  people:    'ph:users',
  parenting: 'ph:baby',
  places:    'ph:map-pin',
  schedule:  'ph:calendar',
  custom:    'ph:star',
}

function ItemIcon({ itemId, categoryId, color }: { itemId: string; categoryId: string; color: string }) {
  const icon = ITEM_ICONS[itemId] ?? CAT_ICONS[categoryId] ?? 'ph:star'
  return <Icon icon={icon} width={20} height={20} color={color} />
}

/* ══ 꽃가루 ══ */
interface Particle { id: number; x: number; color: string; size: number; duration: number; delay: number }

function Confetti({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const prevTrigger = useRef(0)
  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return
    prevTrigger.current = trigger
    const colors = ['#FFCD00','#003594','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7']
    const ps: Particle[] = Array.from({ length: 32 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      duration: 1.2 + Math.random() * 0.8,
      delay: Math.random() * 0.3,
    }))
    setParticles(ps)
    setTimeout(() => setParticles([]), 2500)
  }, [trigger])
  if (!particles.length) return null
  return (
    <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:'absolute', top:'-10px', left:`${p.x}%`,
          width:p.size, height:p.size * 0.6, background:p.color, borderRadius:2,
          animation:`confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
    </div>
  )
}

/* ══ 원형 그래프 ══ */
function CircleProgress({ pct }: { pct: number }) {
  const R = 44, C = 2 * Math.PI * R
  const offset = C - (pct / 100) * C
  return (
    <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
      <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
        <circle cx={50} cy={50} r={R} fill="none" stroke="#F1F5F9" strokeWidth={10} />
        <circle cx={50} cy={50} r={R} fill="none" stroke="#FFCD00" strokeWidth={10}
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:15, fontWeight:800, color:'#003594' }}>{pct}%</span>
      </div>
    </div>
  )
}

/* ══ 삭제 확인 모달 ══ */
function DeleteModal({ onConfirm, onCancel }: { onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:600 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:'calc(100% - 48px)', maxWidth:300,
        background:'#fff', borderRadius:16, padding:'28px 20px 20px',
        zIndex:601, textAlign:'center', boxShadow:'0 20px 40px rgba(0,0,0,0.15)',
      }}>
        <p style={{ fontSize:17, fontWeight:700, color:'#1E293B', marginBottom:8 }}>버킷리스트를 삭제할까요?</p>
        <p style={{ fontSize:14, color:'#64748B', lineHeight:1.6, marginBottom:24 }}>모든 체크 내용과 일정이 삭제됩니다.</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{ flex:1, height:48, borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', color:'#64748B', fontSize:15, fontWeight:600, cursor:'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ flex:2, height:48, borderRadius:6, border:'none', background:'#DC2626', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>삭제하기</button>
        </div>
      </div>
    </>
  )
}

/* ══ 메인 ══ */
export default function BucketCheckView({ state, trip, setState, onEdit, onDelete, onShare, onServices }: Props) {
  const [filter, setFilter]               = useState<Filter>('all')
  const [showDelete, setShowDelete]       = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  const allItems     = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji:'📝', categoryId: c.categoryId ?? 'custom' }))]
  const checkedItems = allItems.filter(i => state.selected[i.id])
  const tripDays     = getTripDays(trip)
  const total        = checkedItems.length

  const byDay = new Map<number, typeof checkedItems>()
  checkedItems.forEach(item => {
    ;(state.schedules[item.id] ?? []).forEach(d => {
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(item)
    })
  })
  const sortedDays  = Array.from(byDay.keys()).sort((a, b) => a - b)

  const [achieved, setAchieved] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} }
  })

  /* 띠링 소리 */
  const playTing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(); osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  const toggleAchieved = (id: string) => {
    const wasAchieved = !!achieved[id]
    const next = { ...achieved, [id]: !wasAchieved }
    if (!next[id]) delete next[id]
    setAchieved(next)
    try { localStorage.setItem('bucket-achieved', JSON.stringify(next)) } catch {}
    if (!wasAchieved) { playTing(); setConfettiTrigger(t => t + 1) }
  }

  const achievedCount = checkedItems.filter(i => achieved[i.id]).length
  const pct = total > 0 ? Math.round((achievedCount / total) * 100) : 0
  const filterFn = (item: { id: string }) =>
    filter === 'done' ? !!achieved[item.id] : filter === 'todo' ? !achieved[item.id] : true

  const FILTERS: { key: Filter; label: string }[] = [
    { key:'all', label:'전체' }, { key:'todo', label:'미완료' }, { key:'done', label:'완료' },
  ]

  /* ══ 체크 행 ══ */
  const CheckRow = ({ item }: { item: typeof checkedItems[0] }) => {
    const isAchieved = !!achieved[item.id]
    return (
      <div onClick={() => toggleAchieved(item.id)} style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'12px 16px',
        margin:'0 16px',
        borderRadius:10,
        background: isAchieved ? '#F6E9C3' : '#fff',
        border: 'none',
        boxShadow: isAchieved
          ? '0 2px 8px rgba(180,130,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        minHeight:52, cursor:'pointer',
        transition:'all 0.15s ease',
      }}>
        {/* 체크박스 */}
        <div style={{
          width:22, height:22, borderRadius:4, flexShrink:0,
          border: isAchieved ? 'none' : '1.5px solid #CBD5E1',
          background: isAchieved ? '#1E293B' : '#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.15s',
        }}>
          {isAchieved && (
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        {/* 단색 아이코니파이 아이콘 (배경 없음) */}
        <ItemIcon
          itemId={item.id}
          categoryId={(item as any).categoryId ?? 'custom'}
          color={isAchieved ? '#1E293B' : '#94A3B8'}
        />
        {/* 라벨 */}
        <span style={{
          flex:1, fontSize:15, lineHeight:1.4,
          fontWeight: isAchieved ? 600 : 400,
          color: isAchieved ? '#1E293B' : '#1E293B',
        }}>{item.label}</span>
        {/* 완료 뱃지 */}
        {isAchieved && (
          <span style={{ fontSize:11, fontWeight:700, color:'#16A34A', background:'rgba(22,163,74,0.12)', padding:'3px 8px', borderRadius:4, flexShrink:0 }}>완료 ✓</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F1F5F9', fontFamily:'"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes hgFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes hgScaleIn { from{opacity:0;transform:translate(-50%,-50%) scale(.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes confettiFall {
          0%   { transform:translateY(0) rotate(0deg); opacity:1; }
          100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
        }
      `}</style>

      <Confetti trigger={confettiTrigger} />

      {/* ══ 헤더 + 탭 ══ */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', position:'sticky', top:0, zIndex:30 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 0' }}>
          <span style={{ fontSize:13, color:'#003594', fontWeight:800, letterSpacing:2 }}>HOJUGAJA</span>
          <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>{achievedCount}/{total}</span>
        </div>
        <div style={{ display:'flex', padding:'8px 20px 0', gap:4 }}>
          <div style={{
            flex:1, height:38, borderRadius:'6px 6px 0 0',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:700, color:'#fff',
            background:'#003594', borderBottom:'2px solid #003594',
            userSelect:'none',
          }}>버킷리스트</div>
          <button onClick={onServices} style={{
            flex:1, height:38, border:'none', borderRadius:'6px 6px 0 0',
            background:'transparent', borderBottom:'2px solid transparent',
            fontSize:14, fontWeight:500, color:'#94A3B8', cursor:'pointer',
          }}>업체/서비스 찾기</button>
        </div>
      </div>

      {/* ══ 진행 카드 ══ */}
      <div style={{ padding:'16px 16px 0' }}>
        <div style={{
          background:'#fff', borderRadius:12,
          boxShadow:'0 4px 20px rgba(0,53,148,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          padding:'20px', display:'flex', alignItems:'center', gap:20,
        }}>
          <CircleProgress pct={pct} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'#1E293B', marginBottom:6 }}>내 호주 버킷리스트</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
              <span style={{ fontSize:28, fontWeight:800, color:'#003594', lineHeight:1 }}>{achievedCount}</span>
              <span style={{ fontSize:17, fontWeight:600, color:'#64748B' }}>/{total}건 완료</span>
            </div>
            <div style={{ fontSize:13, color:'#94A3B8', lineHeight:1.5 }}>나만의 버킷리스트 꼭 완료하세요.</div>
          </div>
        </div>
      </div>

      {/* ══ 필터 ══ */}
      <div style={{ padding:'14px 16px 0', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12, color:'#94A3B8', fontWeight:600, flexShrink:0 }}>필터</span>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            height:30, padding:'0 14px', borderRadius:6,
            border:`1px solid ${filter===f.key ? '#003594' : '#E2E8F0'}`,
            background: filter===f.key ? '#003594' : 'transparent',
            color: filter===f.key ? '#fff' : '#64748B',
            fontSize:13, fontWeight: filter===f.key ? 700 : 500,
            cursor:'pointer', transition:'all 0.15s',
          }}>{f.label}</button>
        ))}
      </div>

      {/* ══ 리스트 ══ */}
      <div style={{ padding:'12px 0 120px', display:'flex', flexDirection:'column', gap:16 }}>
        {sortedDays.map(dayIdx => {
          const dayItems = (byDay.get(dayIdx) ?? []).filter(filterFn)
          if (!dayItems.length) return null
          const date     = tripDays[dayIdx]
          const dayLabel = date ? `${fmtMD(date)}(${dow(date)})` : ''
          const dayDone  = dayItems.filter(i => achieved[i.id]).length
          return (
            <div key={dayIdx}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px 8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'#1E293B' }}>{dayIdx+1}일차</span>
                  <span style={{ fontSize:12, color:'#64748B' }}>{dayLabel}</span>
                </div>
                <span style={{ fontSize:12, color:'#003594', fontWeight:600 }}>{dayDone}/{dayItems.length}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {dayItems.map(item => <CheckRow key={item.id} item={item} />)}
              </div>
            </div>
          )
        })}

        {/* 날짜 미지정 */}
        {(() => {
          const items = checkedItems.filter(i => !(state.schedules[i.id]?.length)).filter(filterFn)
          if (!items.length) return null
          const doneCount = items.filter(i => achieved[i.id]).length
          return (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px 8px' }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#94A3B8' }}>날짜 미지정</span>
                <span style={{ fontSize:12, color:'#64748B', fontWeight:600 }}>{doneCount}/{items.length}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {items.map(item => <CheckRow key={item.id} item={item} />)}
              </div>
            </div>
          )
        })()}

        {sortedDays.length === 0 && checkedItems.filter(i => !(state.schedules[i.id]?.length)).length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#94A3B8', fontSize:14 }}>아직 담긴 항목이 없어요</div>
        )}
      </div>

      {/* ══ 하단 버튼 3개 ══ */}
      <div style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:480, padding:'10px 16px 28px',
        background:'transparent', zIndex:20, boxSizing:'border-box',
        display:'flex', gap:8,
      }}>
        <button onClick={onEdit} style={{
          flex:1, height:54, borderRadius:8,
          border:'1px solid #E2E8F0', background:'rgba(255,255,255,0.95)',
          fontSize:14, fontWeight:600, color:'#64748B', cursor:'pointer',
          backdropFilter:'blur(8px)',
        }}>수정하기</button>
        <button onClick={onShare} style={{
          flex:1, height:54, borderRadius:8,
          border:'none', background:'#003594',
          fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer',
          boxShadow:'0 4px 12px rgba(0,53,148,0.30)',
        }}>공유하기</button>
        <button onClick={() => setShowDelete(true)} style={{
          flex:1, height:54, borderRadius:8,
          border:'1px solid #FCA5A5', background:'rgba(255,245,245,0.95)',
          fontSize:14, fontWeight:600, color:'#DC2626', cursor:'pointer',
          backdropFilter:'blur(8px)',
        }}>삭제하기</button>
      </div>

      {showDelete && (
        <DeleteModal
          onConfirm={() => { setShowDelete(false); onDelete() }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
