import { useState } from 'react'
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

/* ── 원형 그래프 ── */
function CircleProgress({ pct }: { pct: number }) {
  const R = 40, C = 2 * Math.PI * R
  const offset = C - (pct / 100) * C
  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg width={88} height={88} viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={44} cy={44} r={R} fill="none" stroke="#E2E8F0" strokeWidth={9} />
        <circle cx={44} cy={44} r={R} fill="none" stroke="#003594" strokeWidth={9}
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#003594' }}>{pct}%</span>
      </div>
    </div>
  )
}

/* ── 삭제 확인 모달 ── */
function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', zIndex: 600, animation: 'hg-fade 0.2s ease' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'calc(100% - 48px)', maxWidth: 300,
        background: '#fff', borderRadius: 16, padding: '28px 20px 20px',
        zIndex: 601, textAlign: 'center',
        boxShadow: '0 10px 15px rgba(0,0,0,0.10)',
        animation: 'hg-scale 0.2s ease',
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

export default function BucketCheckView({ state, trip, setState, onEdit, onDelete, onServices }: Props) {
  const [filter, setFilter]         = useState<Filter>('all')
  const [showDelete, setShowDelete] = useState(false)

  const allItems     = [...ITEMS, ...state.customItems.map(c => ({ ...c, emoji: '📝' }))]
  const checkedItems = allItems.filter(i => state.selected[i.id])
  const tripDays     = getTripDays(trip)
  const total        = checkedItems.length

  // 날짜별 그룹핑
  const byDay = new Map<number, typeof checkedItems>()
  checkedItems.forEach(item => {
    ;(state.schedules[item.id] ?? []).forEach(d => {
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(item)
    })
  })
  const sortedDays  = Array.from(byDay.keys()).sort((a, b) => a - b)
  const unscheduled = checkedItems.filter(i => !(state.schedules[i.id]?.length))

  // 달성 상태
  const [achieved, setAchieved] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('bucket-achieved') ?? '{}') } catch { return {} }
  })
  const toggleAchieved = (id: string) => {
    const next = { ...achieved, [id]: !achieved[id] }
    if (!next[id]) delete next[id]
    setAchieved(next)
    try { localStorage.setItem('bucket-achieved', JSON.stringify(next)) } catch {}
  }

  const achievedCount = checkedItems.filter(i => achieved[i.id]).length
  const pct = total > 0 ? Math.round((achievedCount / total) * 100) : 0
  const filterFn = (item: { id: string }) => filter === 'done' ? !!achieved[item.id] : filter === 'todo' ? !achieved[item.id] : true

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' }, { key: 'todo', label: '미완료' }, { key: 'done', label: '완료' },
  ]

  /* ── 체크 행 ── */
  const CheckRow = ({ item, isLast }: { item: typeof checkedItems[0]; isLast: boolean }) => {
    const isAchieved = !!achieved[item.id]
    const cat = CATEGORIES.find(c => c.id === item.categoryId)
    return (
      <div onClick={() => toggleAchieved(item.id)} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
        borderBottom: isLast ? 'none' : '1px solid #E2E8F0',
        background: '#fff', minHeight: 54, cursor: 'pointer',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 4, flexShrink: 0,
          border: isAchieved ? 'none' : '1.5px solid #CBD5E1',
          background: isAchieved ? '#003594' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isAchieved && (
            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
              <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span style={{ fontSize: 20, flexShrink: 0, opacity: isAchieved ? 1 : 0.35 }}>{item.emoji}</span>
        <span style={{ flex: 1, fontSize: 16, lineHeight: 1.4, fontWeight: isAchieved ? 600 : 400, color: isAchieved ? '#1E293B' : '#64748B' }}>
          {item.label}
        </span>
        {cat && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#003594', background: 'rgba(0,53,148,0.07)', padding: '3px 8px', borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
            {cat.label}
          </span>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: '"Pretendard",-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes hg-fade  { from{opacity:0} to{opacity:1} }
        @keyframes hg-scale { from{opacity:0;transform:translate(-50%,-50%) scale(.94)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        .mi:hover { background: #F8FAFC !important; }
      `}</style>

      {/* ══ 헤더 + 탭 ══ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 30 }}>

        {/* 브랜드 행 — ChecklistPage 와 동일 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0' }}>
          <span style={{ fontSize: 13, color: '#003594', fontWeight: 800, letterSpacing: 2 }}>HOJUGAJA</span>
          <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{achievedCount}/{total}</span>
        </div>

        {/* 탭 행 — ChecklistPage 와 동일한 스타일 */}
        <div style={{ display: 'flex', padding: '8px 20px 0', gap: 4 }}>
          {/* 버킷리스트 — 활성 */}
          <div style={{
            flex: 1, height: 38, borderRadius: '6px 6px 0 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#003594',
            background: '#EEF4FF',
            borderBottom: '2px solid #003594',
            userSelect: 'none',
          }}>버킷리스트</div>
          {/* 업체/서비스 — 비활성 버튼 */}
          <button onClick={onServices} style={{
            flex: 1, height: 38, border: 'none', borderRadius: '6px 6px 0 0',
            background: 'transparent', borderBottom: '2px solid transparent',
            fontSize: 14, fontWeight: 500, color: '#94A3B8',
            cursor: 'pointer',
          }}>업체/서비스 찾기</button>
        </div>
      </div>

      {/* ══ 진행 카드 ══ */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          padding: '20px', display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <CircleProgress pct={pct} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
              {achievedCount}/{total}건 완료
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 1.5 }}>
              {pct === 100 ? '🎉 모든 버킷리스트 달성!' : pct >= 50 ? '절반 이상 달성! 화이팅 💪' : '호주에서 꼭 해야 할 것들을 만들어봐요'}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                {trip.startDate.slice(5).replace('-', '/')} ~ {trip.endDate.slice(5).replace('-', '/')}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#003594', background: 'rgba(0,53,148,0.07)', padding: '2px 8px', borderRadius: 4 }}>
                {tripDays.length}일
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 필터 ══ */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 8 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            height: 34, padding: '0 16px', borderRadius: 4, border: '1px solid',
            borderColor: filter === f.key ? '#003594' : '#E2E8F0',
            background: filter === f.key ? '#003594' : '#fff',
            color: filter === f.key ? '#fff' : '#64748B',
            fontSize: 13, fontWeight: filter === f.key ? 700 : 500, cursor: 'pointer',
            transition: 'all 0.12s',
          }}>{f.label}</button>
        ))}
      </div>

      {/* ══ 리스트 ══ */}
      <div style={{ padding: '12px 0 120px' }}>
        {sortedDays.map(dayIdx => {
          const dayItems = (byDay.get(dayIdx) ?? []).filter(filterFn)
          if (!dayItems.length) return null
          const date = tripDays[dayIdx]
          const dayLabel = date ? `${fmtMD(date)}(${dow(date)})` : ''
          const dayDone  = dayItems.filter(i => achieved[i.id]).length
          return (
            <div key={dayIdx} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{dayIdx + 1}일차</span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>{dayLabel}</span>
                </div>
                <span style={{ fontSize: 13, color: '#003594', fontWeight: 600 }}>{dayDone}/{dayItems.length}</span>
              </div>
              <div style={{ background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                {dayItems.map((item, idx) => <CheckRow key={item.id} item={item} isLast={idx === dayItems.length - 1} />)}
              </div>
            </div>
          )
        })}

        {(() => {
          const items = unscheduled.filter(filterFn)
          if (!items.length) return null
          const doneCount = items.filter(i => achieved[i.id]).length
          return (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 6px' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#94A3B8' }}>날짜 미지정</span>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{doneCount}/{items.length}</span>
              </div>
              <div style={{ background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                {items.map((item, idx) => <CheckRow key={item.id} item={item} isLast={idx === items.length - 1} />)}
              </div>
            </div>
          )
        })()}

        {sortedDays.length === 0 && unscheduled.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8', fontSize: 14 }}>아직 담긴 항목이 없어요</div>
        )}
      </div>

      {/* ══ 하단 고정바 ══ */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '10px 20px 24px',
        background: 'rgba(241,245,249,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid #E2E8F0', zIndex: 20, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>
          TOTAL: <span style={{ color: '#003594' }}>{achievedCount}/{total}건</span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onEdit} style={{ height: 44, padding: '0 18px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>수정하기</button>
          <button onClick={() => setShowDelete(true)} style={{ height: 44, padding: '0 18px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF5F5', fontSize: 13, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>삭제하기</button>
        </div>
      </div>

      {/* ══ 삭제 모달 (중앙) ══ */}
      {showDelete && (
        <DeleteModal
          onConfirm={() => { setShowDelete(false); onDelete() }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
