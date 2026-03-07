import { useState, useEffect, useRef } from 'react'
import { ITEMS, CATEGORIES } from '../data/checklist'
import { AppState, TripInfo, getTripDays, fmtMD, dow } from '../store/state'

type Filter = 'all' | 'done' | 'todo'

type Props = {
  state:      AppState
  trip:       TripInfo
  setState:   (s: AppState) => void
  onEdit:     () => void
  onDelete:   () => void
  onServices: () => void
}

/* ══ 꽃가루 파티클 ══ */
interface Particle { id: number; x: number; color: string; size: number; dx: number; duration: number; delay: number }

function Confetti({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const prevTrigger = useRef(0)

  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return
    prevTrigger.current = trigger
    const colors = ['#FFCD00','#003594','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7']
    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      dx: (Math.random() - 0.5) * 60,
      duration: 1.2 + Math.random() * 0.8,
      delay: Math.random() * 0.3,
    }))
    setParticles(newParticles)
    setTimeout(() => setParticles([]), 2500)
  }, [trigger])

  if (!particles.length) return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          top: '-10px',
          left: `${p.x}%`,
          width: p.size, height: p.size * 0.6,
          background: p.color,
          borderRadius: 2,
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
    </div>
  )
}

/* ══ 원형 그래프 ══ */
function CircleProgress({ pct, achieved, total }: { pct: number; achieved: number; total: number }) {
  const R = 44, C = 2 * Math.PI * R
  const offset = C - (pct / 100) * C
  return (
    <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
      <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={50} cy={50} r={R} fill="none" stroke="#F1F5F9" strokeWidth={10} />
        <circle cx={50} cy={50} r={R} fill="none" stroke="#FFCD00" strokeWidth={10}
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#003594', lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  )
}

/* ══ 삭제 확인 모달 ══ */
function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 600, animation: 'hgFadeIn 0.2s ease' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'calc(100% - 48px)', maxWidth: 300,
        background: '#fff', borderRadius: 16, padding: '28px 20px 20px',
        zIndex: 601, textAlign: 'center', boxShadow: '0 10px 15px rgba(0,0,0,0.10)',
        animation: 'hgScaleIn 0.2s ease',
      }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>버킷리스트를 삭제할까요?</p>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>모든 체크 내용과 일정이 삭제됩니다.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 48, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 2, height: 48, borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>삭제하기</button>
        </div>
      </div>
    </>
  )
}

/* ══ 메인 ══ */
export default function BucketCheckView({ state, trip, setState, onEdit, onDelete, onServices }: Props) {
  const [filter, setFilter]         = useState<Filter>('all')
  const [showDelete, setShowDelete] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  const allItems     = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji: '📝' }))]
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
  const unscheduled = checkedItems.filter(i => !(state.schedules[item.id]?.length))

  const [achieved, setAchieved] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} }
  })

  // 띠링 소리
  const playTing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
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
    if (!wasAchieved) {
      playTing()
      setConfettiTrigger(t => t + 1)
    }
  }

  const achievedCount = checkedItems.filter(i => achieved[i.id]).length
  const pct = total > 0 ? Math.round((achievedCount / total) * 100) : 0
  const filterFn = (item: { id: string }) =>
    filter === 'done' ? !!achieved[item.id] : filter === 'todo' ? !achieved[item.id] : true

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' }, { key: 'todo', label: '미완료' }, { key: 'done', label: '완료' },
  ]

  /* 체크 행 */
  const CheckRow = ({ item, isLast }: { item: typeof checkedItems[0]; isLast: boolean }) => {
    const isAchieved = !!achieved[item.id]
    const cat = CATEGORIES.find(c => c.id === item.categoryId)
    return (
      <div onClick={() => toggleAchieved(item.id)} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 16px',
        margin: '0 20px',
        marginBottom: isLast ? 0 : 6,
        borderRadius: 8,
        background: isAchieved ? 'rgba(0,53,148,0.06)' : '#fff',
        border: `1px solid ${isAchieved ? 'rgba(0,53,148,0.15)' : '#E2E8F0'}`,
        minHeight: 52, cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}>
        {/* 체크박스 */}
        <div style={{
          width: 24, height: 24, borderRadius: 4, flexShrink: 0,
          border: isAchieved ? 'none' : '1.5px solid #CBD5E1',
          background: isAchieved ? '#003594' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {isAchieved && (
            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
              <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        {/* 아이콘 — 단색 SVG */}
        <div style={{ width: 28, height: 28, borderRadius: 6, background: isAchieved ? 'rgba(0,53,148,0.10)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CategoryIcon categoryId={item.categoryId} color={isAchieved ? '#003594' : '#94A3B8'} />
        </div>
        {/* 라벨 */}
        <span style={{
          flex: 1, fontSize: 15, lineHeight: 1.4,
          fontWeight: isAchieved ? 600 : 400,
          color: isAchieved ? '#003594' : '#1E293B',
        }}>{item.label}</span>
        {/* 완료 표시 */}
        {isAchieved && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: 'rgba(22,163,74,0.10)', padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>완료 ✓</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes hgFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes hgScaleIn { from{opacity:0;transform:translate(-50%,-50%) scale(.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes confettiFall {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--dx, 30px)) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <Confetti trigger={confettiTrigger} />

      {/* ══ 헤더 + 탭 ══ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0' }}>
          <span style={{ fontSize: 13, color: '#003594', fontWeight: 800, letterSpacing: 2 }}>HOJUGAJA</span>
          <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{achievedCount}/{total}</span>
        </div>
        {/* 탭 — ChecklistPage 와 완전 동일 */}
        <div style={{ display: 'flex', padding: '8px 20px 0', gap: 4 }}>
          <div style={{
            flex: 1, height: 38, borderRadius: '6px 6px 0 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#003594',
            background: '#EEF4FF', borderBottom: '2px solid #003594',
            userSelect: 'none',
          }}>버킷리스트</div>
          <button onClick={onServices} style={{
            flex: 1, height: 38, border: 'none', borderRadius: '6px 6px 0 0',
            background: 'transparent', borderBottom: '2px solid transparent',
            fontSize: 14, fontWeight: 500, color: '#94A3B8', cursor: 'pointer',
          }}>업체/서비스 찾기</button>
        </div>
      </div>

      {/* ══ 진행 카드 ══ */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,53,148,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          padding: '20px',
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <CircleProgress pct={pct} achieved={achievedCount} total={total} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 6, letterSpacing: 0.3 }}>내 호주 버킷리스트</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#003594', lineHeight: 1 }}>{achievedCount}</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: '#64748B' }}>/{total}건 완료</span>
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
              나만의 버킷리스트 꼭 완료하세요.
            </div>
          </div>
        </div>
      </div>

      {/* ══ 필터 (말풍선 느낌) ══ */}
      <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, flexShrink: 0 }}>필터</span>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            height: 32, padding: '0 14px', borderRadius: 99,
            border: filter === f.key ? 'none' : '1px solid #E2E8F0',
            background: filter === f.key ? '#003594' : '#fff',
            color: filter === f.key ? '#fff' : '#64748B',
            fontSize: 13, fontWeight: filter === f.key ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: filter === f.key ? '0 2px 8px rgba(0,53,148,0.25)' : 'none',
          }}>{f.label}</button>
        ))}
      </div>

      {/* ══ 리스트 ══ */}
      <div style={{ padding: '12px 0 110px' }}>
        {sortedDays.map(dayIdx => {
          const dayItems = (byDay.get(dayIdx) ?? []).filter(filterFn)
          if (!dayItems.length) return null
          const date     = tripDays[dayIdx]
          const dayLabel = date ? `${fmtMD(date)}(${dow(date)})` : ''
          const dayDone  = dayItems.filter(i => achieved[i.id]).length
          return (
            <div key={dayIdx} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{dayIdx + 1}일차</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{dayLabel}</span>
                </div>
                <span style={{ fontSize: 12, color: '#003594', fontWeight: 600 }}>{dayDone}/{dayItems.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dayItems.map((item, idx) => <CheckRow key={item.id} item={item} isLast={idx === dayItems.length - 1} />)}
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
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 8px' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>날짜 미지정</span>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{doneCount}/{items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((item, idx) => <CheckRow key={item.id} item={item} isLast={idx === items.length - 1} />)}
              </div>
            </div>
          )
        })()}

        {sortedDays.length === 0 && checkedItems.filter(i => !(state.schedules[i.id]?.length)).length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8', fontSize: 14 }}>아직 담긴 항목이 없어요</div>
        )}
      </div>

      {/* ══ 하단 버튼 (투명 배경) ══ */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '12px 20px 28px',
        background: 'transparent',
        zIndex: 20, boxSizing: 'border-box',
        display: 'flex', gap: 10,
      }}>
        <button onClick={onEdit} style={{
          flex: 1, height: 50, borderRadius: 8,
          border: '1px solid #E2E8F0', background: 'rgba(255,255,255,0.92)',
          fontSize: 15, fontWeight: 600, color: '#64748B', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}>수정하기</button>
        <button onClick={() => setShowDelete(true)} style={{
          flex: 1, height: 50, borderRadius: 8,
          border: '1px solid #FCA5A5', background: 'rgba(255,245,245,0.92)',
          fontSize: 15, fontWeight: 600, color: '#DC2626', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
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

/* ══ 카테고리별 단색 SVG 아이콘 ══ */
function CategoryIcon({ categoryId, color }: { categoryId: string; color: string }) {
  const s = { stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  switch (categoryId) {
    case 'hospital': return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <path d="M12 2a7 7 0 1 0 0 14A7 7 0 0 0 12 2z"/>
        <path d="M12 8v4m-2-2h4"/>
        <path d="M8.5 19.5l-2-3M15.5 19.5l2-3"/>
      </svg>
    )
    case 'food': return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    )
    case 'shopping': return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    )
    case 'admin': return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="15" y2="17"/>
      </svg>
    )
    case 'people': return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
    case 'parenting': return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    )
    case 'places': return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    )
    case 'schedule': return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
    default: return (
      <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  }
}
